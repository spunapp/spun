// @ts-nocheck — Convex typechecks this file during deploy; skip Next.js checking
// to avoid circular type inference (api.d.ts ↔ ai.ts)
"use node"

import { action } from "./_generated/server"
import { v } from "convex/values"
import { api } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { buildSystemPrompt } from "../src/lib/ai/persona"
import { TOOL_DEFINITIONS } from "../src/lib/ai/tools"
import { firmographicScoreDetails, scoreToTier } from "../src/lib/types"

// Chat models for user-facing conversation turns. Claude Haiku 4.5 leads —
// consistently faster time-to-first-token and fewer 5xx retries than Gemini
// Flash through OpenRouter, with strong tool-calling. Gemini 2.5 Flash is
// the fallback; OpenRouter auto-falls-back on 5xx/rate limits.
const CHAT_MODELS = [
  "anthropic/claude-haiku-4-5",
  "google/gemini-2.5-flash",
]
// Reasoning models for heavy analytical work (strategy, creatives, tiering,
// sales strategies). Pro Preview is higher quality but slower; Claude Sonnet
// 4.6 is the fallback with comparable reasoning depth.
const REASONING_MODELS = [
  "google/gemini-3.1-pro-preview",
  "anthropic/claude-sonnet-4-6",
]

type OrMessage = {
  role: "system" | "user" | "assistant" | "tool"
  content: string | null
  tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>
  tool_call_id?: string
}

function toOrTools(tools: typeof TOOL_DEFINITIONS) {
  return tools.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.input_schema },
  }))
}

// During onboarding the AI only needs to gather info and optionally look up
// context. Everything else (generate_campaign, audit_gbp, connect_channel,
// setup guides, creatives) is post-onboarding. Sending the full 15-tool
// schema on every onboarding turn inflates input tokens by ~3K for no reason.
const ONBOARDING_TOOL_NAMES = new Set(["onboard_business", "search_web"])
// B2B sales tools that aren't part of the local-business flow. Still exist
// in case a past user comes back to a saved workflow, but we don't surface
// them to the model on normal turns.
const EXCLUDED_POST_ONBOARDING_TOOLS = new Set([
  "tier_prospects",
  "generate_sales_strategy",
])

function selectToolsFor(business: { onboardingComplete?: boolean } | null) {
  if (!business || !business.onboardingComplete) {
    return TOOL_DEFINITIONS.filter((t) => ONBOARDING_TOOL_NAMES.has(t.name))
  }
  return TOOL_DEFINITIONS.filter((t) => !EXCLUDED_POST_ONBOARDING_TOOLS.has(t.name))
}

// Retry transient failures with exponential backoff. 5xx responses and
// network errors get three attempts; 4xx failures (auth, bad request) fail
// fast because retrying won't change the outcome.
async function callOpenRouter(
  messages: OrMessage[],
  options: { tools?: ReturnType<typeof toOrTools>; maxTokens?: number; models?: string[] } = {}
) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set")

  const models = options.models ?? REASONING_MODELS
  const body = JSON.stringify({
    models,
    max_tokens: options.maxTokens ?? 4096,
    messages,
    ...(options.tools ? { tools: options.tools } : {}),
  })

  // Three attempts with ~500ms and ~1500ms backoff between them.
  const MAX_ATTEMPTS = 3
  const backoffs = [500, 1500]
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body,
      })
      if (res.ok) return res.json()

      // 4xx = our fault (auth, bad request). Don't retry. 5xx = upstream, retry.
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`OpenRouter error: ${res.status} ${await res.text()}`)
      }
      lastError = new Error(`OpenRouter error: ${res.status} ${await res.text()}`)
    } catch (err) {
      // Network errors (fetch TypeError) — retry. 4xx we threw above — re-throw.
      if (err instanceof Error && err.message.startsWith("OpenRouter error: 4")) throw err
      lastError = err instanceof Error ? err : new Error(String(err))
    }

    if (attempt < MAX_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, backoffs[attempt]))
    }
  }

  throw lastError ?? new Error("OpenRouter request failed after retries")
}

// Minimal ctx interface for the executeToolCall helper
interface ToolCtx {
  runMutation: (fn: unknown, args: unknown) => Promise<unknown>
  runQuery: (fn: unknown, args: unknown) => Promise<unknown>
  runAction: (fn: unknown, args: unknown) => Promise<unknown>
}

export const chat = action({
  args: {
    conversationId: v.id("conversations"),
    userMessage: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Save user message
    await ctx.runMutation(api.messages.send, {
      conversationId: args.conversationId,
      role: "user",
      content: args.userMessage,
      messageType: "text",
    })

    // Load context — parallelise independent queries
    const [conversation, allMessages] = await Promise.all([
      ctx.runQuery(api.conversations.get, { id: args.conversationId }),
      ctx.runQuery(api.conversations.getMessages, { conversationId: args.conversationId }),
    ])
    if (!conversation) throw new Error("Conversation not found")

    // Mutable across the tool loop: onboard_business creates a business
    // mid-turn, so the conversation pointer we fetched at the start can be
    // stale by the next tool call. Update it as we go.
    let activeBusinessId = conversation.businessId
    const business = activeBusinessId
      ? await ctx.runQuery(api.businesses.get, { id: activeBusinessId })
      : null

    // Check usage limits — parallelise usage + subscription queries
    if (business) {
      const [usage, subscription, credits] = await Promise.all([
        ctx.runQuery(api.usage.getCurrentUsage, { businessId: business._id }),
        ctx.runQuery(api.subscriptions.getByUser, { userId: args.userId }),
        ctx.runQuery(api.credits.getBalance, { businessId: business._id }),
      ])
      const tier = subscription?.tier ?? "standard"
      const { checkUsageLimit } = await import("../src/lib/billing/tiers")
      const limitCheck = checkUsageLimit(tier, usage)

      if (!limitCheck.allowed && limitCheck.limitType === "messages") {
        if (credits.messageCredits <= 0) {
          const limitMsg = `You've used all ${limitCheck.limit} AI responses this month on your ${tier === "standard" ? "Standard" : "Pro"} plan. Buy a credit pack (£9.99) for 100 more responses, or upgrade your plan.`
          await ctx.runMutation(api.messages.send, {
            conversationId: args.conversationId,
            role: "assistant",
            content: limitMsg,
            messageType: "text",
            metadata: { limitReached: true, limitType: "messages" },
          })
          return { content: limitMsg, messageType: "text", metadata: { limitReached: true, limitType: "messages" } }
        }
        await ctx.runMutation(api.credits.deductMessage, { businessId: business._id })
      }
    }

    // `hasHistory` tells the persona whether this is a fresh conversation
    // (greet the user) or an in-progress one (continue where left off).
    // > 1 because the user's current message has already been saved above.
    const hasHistory =
      (allMessages as Array<{ role: string }>).filter(
        (m) => m.role === "user" || m.role === "assistant"
      ).length > 1

    const systemPrompt = buildSystemPrompt(
      business as Parameters<typeof buildSystemPrompt>[0],
      hasHistory
    )
    let orTools = toOrTools(selectToolsFor(business as { onboardingComplete?: boolean } | null))

    const orMessages: OrMessage[] = [
      { role: "system", content: systemPrompt },
      ...(allMessages as Array<{ role: string; content: string; messageType?: string; metadata?: Record<string, unknown> }>)
        .filter((m) => (m.role === "user" || m.role === "assistant") && m.content)
        .slice(-50)
        .map((m) => {
          let content = m.content
          if (m.messageType === "strategy" && m.metadata?.campaignId) {
            content += `\n[Campaign ID: ${m.metadata.campaignId}]`
          }
          return { role: m.role as "user" | "assistant", content }
        }),
    ]

    let response: any
    try {
      response = await callOpenRouter(orMessages, { tools: orTools, maxTokens: 4096, models: CHAT_MODELS })
    } catch (err) {
      // Every provider in the fallback chain failed (or we got an auth/4xx
      // error). Save a retryable assistant message so the conversation isn't
      // left in an orphan state after refresh.
      console.error("Chat OpenRouter call failed after retries:", err)
      const fallbackContent =
        "I couldn't reach my AI backend — looks like multiple providers are having a wobble. Your message is saved; tap retry below and I'll pick up exactly where we left off."
      const messageId = await ctx.runMutation(api.messages.send, {
        conversationId: args.conversationId,
        role: "assistant",
        content: fallbackContent,
        messageType: "text",
        metadata: {
          errorKind: "llm_unreachable",
          retryable: true,
          failedUserMessage: args.userMessage,
        },
      })
      return {
        messageId,
        content: fallbackContent,
        messageType: "text" as const,
        metadata: { errorKind: "llm_unreachable", retryable: true, failedUserMessage: args.userMessage },
      }
    }
    const responseMessage = response.choices[0].message

    let responseText = responseMessage.content ?? ""
    let messageType:
      | "text"
      | "strategy"
      | "campaign_preview"
      | "analytics"
      | "creative_gallery"
      | "approval_request"
      | "status_update"
      | "onboarding"
      | "connect_prompt"
      | "meta_setup_guide"
      | "google_ads_setup_guide"
      | "ga4_setup_guide"
      | "gbp_audit" = "text"
    let metadata: Record<string, unknown> | undefined

    // Multi-round tool-calling loop: process tool calls, send results back,
    // and let the AI chain further calls (e.g. campaign → creatives in one turn).
    let currentMsg = responseMessage
    let accMessages: any[] = [...orMessages]
    let toolRounds = 0
    const MAX_TOOL_ROUNDS = 3

    const applyToolType = (toolName: string, toolResult: unknown) => {
      if (toolName === "generate_strategy" || toolName === "generate_campaign") {
        messageType = "strategy"
        metadata = toolResult as Record<string, unknown>
      } else if (toolName === "generate_creatives") {
        messageType = "creative_gallery"
        metadata = toolResult as Record<string, unknown>
      } else if (toolName === "analyze_performance" || toolName === "calculate_roi") {
        messageType = "analytics"
        metadata = toolResult as Record<string, unknown>
      } else if (toolName === "launch_campaign") {
        messageType = "approval_request"
        metadata = toolResult as Record<string, unknown>
      } else if (toolName === "onboard_business") {
        messageType = "onboarding"
        metadata = toolResult as Record<string, unknown>
      } else if (toolName === "connect_channel") {
        messageType = "connect_prompt"
        metadata = { ...(toolResult as Record<string, unknown>), businessId: activeBusinessId }
      } else if (toolName === "show_meta_setup_guide") {
        messageType = "meta_setup_guide"
        metadata = { ...(toolResult as Record<string, unknown>), businessId: activeBusinessId }
      } else if (toolName === "show_google_ads_setup_guide") {
        messageType = "google_ads_setup_guide"
        metadata = { ...(toolResult as Record<string, unknown>), businessId: activeBusinessId }
      } else if (toolName === "show_ga4_setup_guide") {
        messageType = "ga4_setup_guide"
        metadata = { ...(toolResult as Record<string, unknown>), businessId: activeBusinessId }
      } else if (toolName === "audit_gbp") {
        messageType = "gbp_audit"
        metadata = toolResult as Record<string, unknown>
      } else if (toolName === "publish_social_post") {
        // Render as a status_update card with a link to the live post.
        messageType = "status_update"
        metadata = toolResult as Record<string, unknown>
      }
    }

    while (currentMsg.tool_calls && toolRounds < MAX_TOOL_ROUNDS) {
      toolRounds++

      accMessages.push({
        role: "assistant",
        content: currentMsg.content ?? null,
        tool_calls: currentMsg.tool_calls,
      })

      for (const tc of currentMsg.tool_calls) {
        const toolName = tc.function.name
        let toolInput: Record<string, unknown>
        try {
          toolInput = JSON.parse(tc.function.arguments)
        } catch {
          accMessages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: "Invalid arguments" }) })
          continue
        }

        let toolResult: unknown
        try {
          toolResult = await executeToolCall(
            ctx as unknown as ToolCtx, toolName, toolInput,
            args.userId, activeBusinessId, args.conversationId
          )
        } catch (err) {
          accMessages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: String(err) }) })
          continue
        }

        // onboard_business just created and linked a business; adopt the new
        // id so any further tool calls in this turn see it.
        if (toolName === "onboard_business") {
          const newId = (toolResult as { businessId?: Id<"businesses"> })?.businessId
          if (newId) activeBusinessId = newId
        }

        applyToolType(toolName, toolResult)
        accMessages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(toolResult) })
      }

      // After generating a campaign, stop the loop so the AI can ask about
      // brand assets before generating creatives. Don't auto-chain.
      const toolsThisRound = currentMsg.tool_calls.map((tc: any) => tc.function.name)
      const shouldPause = toolsThisRound.includes("generate_campaign") || toolsThisRound.includes("generate_strategy")

      // Once onboard_business fires, the user is now onboarded — upgrade the
      // tool set so the follow-up call can run competitor search + GBP audit
      // in the same turn (per the post-onboarding Step 1 in the persona).
      if (toolsThisRound.includes("onboard_business")) {
        orTools = toOrTools(selectToolsFor({ onboardingComplete: true }))
      }

      try {
        const nextResponse = await callOpenRouter(accMessages, {
          tools: shouldPause ? undefined : orTools,
          maxTokens: 4096,
          models: CHAT_MODELS,
        })
        currentMsg = nextResponse.choices[0].message
        if (currentMsg.content) {
          responseText = currentMsg.content
        }
      } catch (err) {
        console.error("Tool follow-up call failed:", err)
        if (!responseText) {
          responseText = "Done. (I couldn't reach my AI backend to write this up properly — the action above ran successfully.)"
        }
        break
      }
    }

    // Narration detector: if the final AI message narrates an action without
    // calling a tool, nudge it once to actually invoke the tool.
    if (
      !currentMsg.tool_calls &&
      responseText &&
      /\bI('ll| will| am going to)\b.*(build|create|generate|set up|put together|search for|revise|update|regenerate|do that|get that done)\b/i.test(responseText)
    ) {
      console.warn("AI narrated an action without calling a tool — retrying with nudge")
      try {
        const nudgeMessages = [
          ...accMessages,
          ...(toolRounds === 0 ? [{ role: "assistant", content: responseText }] : []),
          { role: "user", content: "You said you would take an action but didn't call the tool. Please call the appropriate tool now." },
        ]
        const nudgeResponse = await callOpenRouter(nudgeMessages, { tools: orTools, maxTokens: 4096, models: CHAT_MODELS })
        const nudgeMsg = nudgeResponse.choices[0].message
        if (nudgeMsg.tool_calls) {
          for (const tc of nudgeMsg.tool_calls) {
            let toolInput: Record<string, unknown>
            try { toolInput = JSON.parse(tc.function.arguments) } catch { continue }
            let toolResult: unknown
            try {
              toolResult = await executeToolCall(
                ctx as unknown as ToolCtx, tc.function.name, toolInput,
                args.userId, activeBusinessId, args.conversationId
              )
            } catch { continue }
            if (tc.function.name === "onboard_business") {
              const newId = (toolResult as { businessId?: Id<"businesses"> })?.businessId
              if (newId) activeBusinessId = newId
            }
            applyToolType(tc.function.name, toolResult)

            try {
              const followUp = await callOpenRouter(
                [...nudgeMessages, { role: "assistant", content: nudgeMsg.content ?? null, tool_calls: nudgeMsg.tool_calls }, { role: "tool", tool_call_id: tc.id, content: JSON.stringify(toolResult) }],
                { maxTokens: 2048, models: CHAT_MODELS }
              )
              if (followUp.choices[0].message.content) {
                responseText = followUp.choices[0].message.content
              }
            } catch {
              // Tool ran but follow-up narration failed — keep original text
            }
          }
        }
      } catch {
        // Nudge retry failed — keep original response
      }
    }

    if (!responseText) {
      console.warn("Empty response from primary model, retrying with fallback model...")
      try {
        const retryResponse = await callOpenRouter(orMessages, {
          tools: orTools,
          maxTokens: 4096,
          models: ["anthropic/claude-haiku-4-5"],
        })
        responseText = retryResponse.choices[0].message.content ?? ""
      } catch {
        // Retry also failed — fall through to fallback
      }
    }

    if (!responseText) {
      responseText = "Sorry, I drew a blank on that one. Could you say that again or rephrase?"
    }

    // Strip internal markers the AI sometimes echoes back to the user
    responseText = responseText.replace(/\s*\[Campaign ID: [^\]]+\]/g, "")

    const messageId = await ctx.runMutation(api.messages.send, {
      conversationId: args.conversationId,
      role: "assistant",
      content: responseText,
      messageType,
      metadata,
    })

    // Track usage in the background — don't block the response
    if (business) {
      ctx.runMutation(api.usage.getOrCreateLedger, { businessId: business._id })
        .then((ledgerId) => ctx.runMutation(api.usage.incrementAiResponses, { ledgerId }))
        .catch((err) => console.error("Usage tracking failed:", err))
    }

    return { messageId, content: responseText, messageType, metadata }
  },
})

function currencyForLocations(locations: string[] | undefined): { symbol: string; code: string } {
  const loc = (locations ?? []).join(" ").toLowerCase()
  if (/\b(us|usa|united states|america|new york|california|texas|florida|chicago|los angeles)\b/.test(loc)) return { symbol: "$", code: "USD" }
  if (/\b(eu|europe|germany|france|spain|italy|netherlands|belgium|austria|ireland|portugal|finland|greece)\b/.test(loc)) return { symbol: "€", code: "EUR" }
  if (/\b(australia|sydney|melbourne)\b/.test(loc)) return { symbol: "A$", code: "AUD" }
  if (/\b(canada|toronto|vancouver)\b/.test(loc)) return { symbol: "C$", code: "CAD" }
  return { symbol: "£", code: "GBP" }
}

export const generateCampaign = action({
  args: {
    businessId: v.id("businesses"),
    phase: v.optional(v.number()),
    channels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const business = await ctx.runQuery(api.businesses.get, { id: args.businessId })
    if (!business) throw new Error("Business not found")

    const connectedChannels = await ctx.runQuery(api.channels.listByBusiness, { businessId: args.businessId })
    const connectedPlatforms = (connectedChannels as Array<{ platform: string }>)
      .map((c) => c.platform)

    const platformLabels: Record<string, string> = {
      meta: "Meta Ads (Instagram & Facebook)",
      google: "Google Search Ads",
      ga4: "Google Analytics 4",
      klaviyo: "Klaviyo",
      tiktok: "TikTok Ads",
      linkedin: "LinkedIn Ads",
      shopify: "Shopify",
      buffer: "Buffer",
    }

    // Use explicitly specified channels if provided, otherwise fall back to connected channels
    const activePlatforms = args.channels?.length ? args.channels : connectedPlatforms
    const activeLabels = activePlatforms.map((p) => platformLabels[p] ?? p)

    const channelsNote = activePlatforms.length > 0
      ? `ALLOWED CHANNELS (use ONLY these, no others): ${activeLabels.join(", ")}.
STRICT RULE: The suggested_channels array and budget_breakdown.channel_split array MUST only contain channels from the list above. Do NOT add LinkedIn, Google, TikTok, or any other platform that is not listed. If only one channel is allowed, put 100% of the budget on that single channel.`
      : "No ad platforms are connected yet. Suggest which platform(s) would work best and why."

    const currency = currencyForLocations(business.locations)

    const prompt = `You are an expert marketing strategist. Create a comprehensive marketing campaign plan for this business.

All monetary values MUST be in ${currency.code} (${currency.symbol}). Do not use any other currency symbol or code.

BUSINESS PROFILE:
- Name: ${business.name}
- Description: ${business.description}
- Industry: ${business.industry}
- Type: ${business.productOrService}
- What they sell: ${business.whatTheySell}
- Target audience: ${business.targetAudience}
- Demographics: ${JSON.stringify(business.demographics)}
- Locations: ${business.locations?.join(", ")}
- Competitors: ${business.competitors?.join(", ")}

CONNECTED CHANNELS: ${channelsNote}

Return ONLY valid JSON, keep values concise:
{
  "theme": "Campaign theme (max 10 words)",
  "audience_breakdown": {
    "total_addressable_market": "Estimated TAM",
    "serviceable_market": "Reachable market",
    "target_segment": "First segment to target",
    "key_characteristics": ["trait 1", "trait 2", "trait 3"]
  },
  "suggested_channels": [
    { "channel": "Channel name", "reason": "Why (1 sentence)", "estimated_reach": "Reach" }
  ],
  "budget_breakdown": {
    "monthly_total": "${currency.symbol}X,XXX",
    "daily_budget": "${currency.symbol}XX",
    "channel_split": [
      {"channel": "Channel name", "percentage": 100, "amount": "${currency.symbol}X,XXX"}
    ]
  },
  "funnel": {
    "tof": { "objective": "", "messaging": "", "creative_ideas": ["", "", ""] },
    "mof": { "objective": "", "messaging": "", "creative_ideas": ["", "", ""] },
    "bof": { "objective": "", "messaging": "", "creative_ideas": ["", "", ""] }
  }
}`

    const campaignResp = await callOpenRouter([{ role: "user", content: prompt }], { maxTokens: 2500, models: CHAT_MODELS })
    const campaignText = campaignResp.choices[0].message.content ?? ""

    const jsonMatch = campaignText.match(/\{[\s\S]*\}/)
    let campaignData: Record<string, unknown>
    try {
      campaignData = JSON.parse(jsonMatch?.[0] || campaignText)
    } catch {
      throw new Error("Failed to parse campaign data from AI response. Please try again.")
    }

    // Programmatically enforce channel restrictions — the AI often ignores
    // the prompt-level constraint and adds platforms the user didn't ask for.
    if (activePlatforms.length > 0) {
      const platformKeywords: Record<string, string[]> = {
        meta: ["meta", "facebook", "instagram"],
        google: ["google"],
        ga4: ["analytics", "ga4"],
        linkedin: ["linkedin"],
        tiktok: ["tiktok"],
        klaviyo: ["klaviyo"],
        shopify: ["shopify"],
        buffer: ["buffer"],
      }
      const allowedKeywords = activePlatforms.flatMap((p) => platformKeywords[p] ?? [p])
      const matchesAllowed = (name: string) => {
        const lower = name.toLowerCase()
        return allowedKeywords.some((kw) => lower.includes(kw))
      }

      const channels = campaignData.suggested_channels as Array<{ channel: string; reason: string }> | undefined
      if (Array.isArray(channels)) {
        const filtered = channels.filter((ch) => matchesAllowed(ch.channel))
        campaignData.suggested_channels = filtered.length > 0 ? filtered : activeLabels.map((l) => ({ channel: l, reason: "Selected platform" }))
      }

      const budget = campaignData.budget_breakdown as { monthly_total: unknown; channel_split?: Array<{ channel: string; percentage: number; amount: unknown }> } | undefined
      if (budget?.channel_split) {
        const filtered = budget.channel_split.filter((s) => matchesAllowed(s.channel))
        const finalChannels = filtered.length > 0 ? filtered : activeLabels.map((l) => ({ channel: l, percentage: 0, amount: "" as unknown }))
        const totalNum = parseFloat(String(budget.monthly_total).replace(/[^0-9.]/g, "")) || 0
        const perChannelPct = Math.round(100 / finalChannels.length)
        budget.channel_split = finalChannels.map((ch, idx) => ({
          channel: filtered.length > 0 ? ch.channel : activeLabels[idx] ?? ch.channel,
          percentage: idx === finalChannels.length - 1 ? 100 - perChannelPct * (finalChannels.length - 1) : perChannelPct,
          amount: `${currency.symbol}${Math.round((totalNum * (idx === finalChannels.length - 1 ? 100 - perChannelPct * (finalChannels.length - 1) : perChannelPct)) / 100).toLocaleString()}`,
        }))
      }
    }

    const campaignId = await ctx.runMutation(api.campaigns.create, {
      businessId: args.businessId,
      phase: args.phase ?? 1,
      theme: campaignData.theme,
      audienceBreakdown: campaignData.audience_breakdown,
      suggestedChannels: campaignData.suggested_channels,
      budgetBreakdown: campaignData.budget_breakdown,
      funnel: campaignData.funnel,
      rawContent: campaignText,
      status: "draft",
    })

    return { campaignId, ...campaignData }
  },
})

async function fetchStockImage(query: string, index: number = 0): Promise<Buffer | null> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=square`,
      { headers: { Authorization: apiKey } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const photo = data.photos?.[index % (data.photos?.length || 1)]
    const url = photo?.src?.large
    if (!url) return null

    const imgRes = await fetch(url)
    if (!imgRes.ok) return null
    return Buffer.from(await imgRes.arrayBuffer())
  } catch {
    return null
  }
}

async function overlayLogo(baseBuffer: Buffer, logoBuffer: Buffer): Promise<Buffer> {
  const Jimp = (await import("jimp")).default
  const base = await Jimp.read(baseBuffer)
  const logo = await Jimp.read(logoBuffer)

  const logoWidth = Math.round(base.getWidth() * 0.15)
  logo.resize(logoWidth, Jimp.AUTO)
  logo.opacity(0.85)

  const x = base.getWidth() - logo.getWidth() - 16
  const y = base.getHeight() - logo.getHeight() - 16
  base.composite(logo, x, y)

  return base.getBufferAsync(Jimp.MIME_PNG)
}

async function generateImage(prompt: string): Promise<Buffer | null> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    console.warn("GOOGLE_AI_API_KEY not set — skipping image generation")
    return null
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Generate a professional advertising image: ${prompt}` }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    }
  )

  if (!res.ok) {
    console.error(`Image generation error: ${res.status} ${await res.text()}`)
    return null
  }

  const data = await res.json()
  const parts = data.candidates?.[0]?.content?.parts
  if (!parts) return null
  const imagePart = parts.find((p: { inlineData?: { data: string } }) => p.inlineData?.data)
  if (!imagePart) return null

  return Buffer.from(imagePart.inlineData.data, "base64")
}

export const generateCreatives = action({
  args: {
    campaignId: v.id("campaigns"),
    businessId: v.id("businesses"),
    funnelStage: v.string(),
    customInstructions: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [campaign, business] = await Promise.all([
      ctx.runQuery(api.campaigns.get, { id: args.campaignId }),
      ctx.runQuery(api.businesses.get, { id: args.businessId }),
    ])
    if (!campaign || !business) throw new Error("Not found")

    // Find logo from brand assets
    const brandAssets = await ctx.runQuery(api.brandAssets.listRaw, { businessId: args.businessId }) as Array<{ storageId: Id<"_storage">; name: string; type: string }>
    const logoAsset = brandAssets.find((a) =>
      a.type === "images" && /logo/i.test(a.name)
    )
    let logoBuffer: Buffer | null = null
    if (logoAsset) {
      try {
        const logoUrl = await ctx.runQuery(api.brandAssets.getStorageUrl, { storageId: logoAsset.storageId })
        if (logoUrl) {
          const res = await fetch(logoUrl)
          if (res.ok) logoBuffer = Buffer.from(await res.arrayBuffer())
        }
      } catch {
        // Logo fetch failed — proceed without it
      }
    }

    const stageMap: Record<string, string> = {
      tof: "Top of Funnel",
      mof: "Middle of Funnel",
      bof: "Bottom of Funnel",
    }
    const stageData = (
      campaign.funnel as Record<
        string,
        { objective?: string; messaging?: string; creative_ideas?: string[] }
      >
    )?.[args.funnelStage]
    const formats: Record<string, string[]> = {
      tof: ["Leaderboard Banner (728x90)", "Social Square (1080x1080)", "Story Format (1080x1920)"],
      mof: ["Display Banner (300x250)", "Social Carousel Slide (1080x1080)", "Video Thumbnail (1280x720)"],
      bof: ["Remarketing Banner (160x600)", "Email Header (600x200)", "Social Feed Ad (1200x628)"],
    }

    const savedCreatives: Array<{
      headline: string
      copy: string
      cta: string
      format: string
      variant: number
      funnelStage: string
      imageStorageId?: string
    }> = []

    const allFormats = [1, 2, 3].map((v) => formats[args.funnelStage]?.[v - 1] ?? "Social Square")
    const customNote = args.customInstructions ? `\nADDITIONAL INSTRUCTIONS: ${args.customInstructions}` : ""

    // Single AI call generates all 3 variants — faster and ensures distinct copy/imagery
    const batchPrompt = `You are an expert ad copywriter. Write 3 distinct ad variants for:

BUSINESS: ${business.name}
INDUSTRY: ${business.industry}
CAMPAIGN THEME: ${campaign.theme}
FUNNEL STAGE: ${stageMap[args.funnelStage]}
OBJECTIVE: ${stageData?.objective ?? ""}
MESSAGING: ${stageData?.messaging ?? ""}
CREATIVE IDEAS: ${(stageData?.creative_ideas ?? []).join("; ")}${customNote}

Formats: Variant 1 = ${allFormats[0]}, Variant 2 = ${allFormats[1]}, Variant 3 = ${allFormats[2]}

IMPORTANT: Each variant must have a DIFFERENT angle and DIFFERENT stock_search_query. Do NOT reuse the same visual concept — vary the subject matter (e.g. one person working, one team meeting, one data dashboard). The stock queries must each find a DIFFERENT type of image.

Return ONLY valid JSON:
{
  "variants": [
    {
      "headline": "Max 8 words",
      "copy": "Max 20 words",
      "cta": "Max 4 words",
      "stock_search_query": "2-4 word Pexels search query for a UNIQUE image for this variant"
    },
    { "headline": "", "copy": "", "cta": "", "stock_search_query": "" },
    { "headline": "", "copy": "", "cta": "", "stock_search_query": "" }
  ]
}`

    let variantsData: Array<{ headline: string; copy: string; cta: string; stock_search_query?: string }> = []
    try {
      const copyResp = await callOpenRouter([{ role: "user", content: batchPrompt }], { maxTokens: 1500, models: CHAT_MODELS })
      const copyText = copyResp.choices[0].message.content ?? ""
      const jsonMatch = copyText.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(jsonMatch?.[0] || copyText)
      variantsData = parsed.variants ?? []
    } catch {
      // If batch fails, bail out
      return { count: 0, campaignId: args.campaignId, funnelStage: args.funnelStage, creatives: [] }
    }

    // Fetch images and save all variants in parallel
    const imagePromises = variantsData.map(async (vd, idx) => {
      const variant = idx + 1
      const format = allFormats[idx]
      try {
        let imageBuffer: Buffer | null = null
        const stockQuery = vd.stock_search_query
        if (stockQuery) {
          imageBuffer = await fetchStockImage(stockQuery, idx)
        }
        if (!imageBuffer) {
          imageBuffer = await generateImage(`Professional ad image for ${business.name}: ${vd.headline}`)
        }

        if (imageBuffer && logoBuffer) {
          try {
            imageBuffer = await overlayLogo(imageBuffer, logoBuffer)
          } catch (err) {
            console.warn("Logo overlay failed:", err)
          }
        }

        let imageStorageId: Id<"_storage"> | undefined
        if (imageBuffer) {
          const blob = new Blob([imageBuffer], { type: "image/png" })
          imageStorageId = await ctx.storage.store(blob)
        }

        const creativeId = await ctx.runMutation(api.adCreatives.create, {
          campaignId: args.campaignId,
          businessId: args.businessId,
          funnelStage: args.funnelStage as "tof" | "mof" | "bof",
          variant,
          format,
          headline: vd.headline ?? "",
          copy: vd.copy ?? "",
          cta: vd.cta ?? "",
          ...(imageStorageId ? { imageStorageId } : {}),
        })
        return {
          creativeId: creativeId as string,
          headline: vd.headline ?? "", copy: vd.copy ?? "", cta: vd.cta ?? "",
          format, variant, funnelStage: args.funnelStage,
          ...(imageStorageId ? { imageStorageId: imageStorageId as string } : {}),
        }
      } catch {
        return null
      }
    })

    const results = await Promise.all(imagePromises)
    for (const r of results) {
      if (r) savedCreatives.push(r)
    }

    if (savedCreatives.length > 0) {
      const ledgerId = await ctx.runMutation(api.usage.getOrCreateLedger, { businessId: args.businessId })
      await ctx.runMutation(api.usage.incrementCreatives, { ledgerId, count: savedCreatives.length })
    }

    return { count: savedCreatives.length, campaignId: args.campaignId, funnelStage: args.funnelStage, creatives: savedCreatives }
  },
})

export const tierProspects = action({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const [business, prospects] = await Promise.all([
      ctx.runQuery(api.businesses.get, { id: args.businessId }),
      ctx.runQuery(api.prospects.listByBusiness, { businessId: args.businessId }),
    ])

    if (!business || !prospects || (prospects as unknown[]).length === 0) {
      return { tiered: 0, message: "No prospects to tier" }
    }

    const prospectList = prospects as Array<{
      _id: string
      name: string
      company: string
      email: string
      leadScore: number
    }>

    const prompt = `You are a B2B research analyst. Estimate firmographic data for each prospect.

SELLER: ${business.name} (${business.industry}) — ${business.whatTheySell}
TARGET PROFILE: ${business.targetAudience}

PROSPECTS:
${JSON.stringify(prospectList.map((p) => ({ id: p._id, name: p.name, company: p.company, email: p.email })), null, 2)}

Return a JSON array, one object per prospect:
[{ "id": "...", "company_size": "10-50", "estimated_revenue": "£50,000", "years_in_business": 5, "company_news": null, "tier_reasoning": "..." }]

Return ONLY a valid JSON array.`

    const tierResp = await callOpenRouter([{ role: "user", content: prompt }], { maxTokens: 4000 })
    const tierText = tierResp.choices[0].message.content ?? ""

    const jsonMatch = tierText.match(/\[[\s\S]*\]/)
    let firmographicData: Array<{
      id: string
      company_size: string
      estimated_revenue: string
      years_in_business: number | null
      company_news: string | null
      tier_reasoning: string
    }>
    try {
      firmographicData = JSON.parse(jsonMatch?.[0] || tierText)
    } catch {
      return { tiered: 0, message: "Failed to parse prospect data from AI response. Please try again." }
    }

    const results = await Promise.all(
      firmographicData.map(async (firm) => {
        const events = (await ctx.runQuery(api.prospects.getScoreEvents, {
          prospectId: firm.id as Id<"prospects">,
        })) as Array<{ eventType: string; points: number }>

        const behaviouralScore = events
          .filter((e) => e.eventType !== "firmographic")
          .reduce((sum, e) => sum + e.points, 0)

        const { score: firmoScore, breakdown } = firmographicScoreDetails(
          firm.company_size,
          firm.estimated_revenue
        )

        await ctx.runMutation(api.prospects.logScoreEvent, {
          prospectId: firm.id as Id<"prospects">,
          businessId: args.businessId,
          eventType: "firmographic",
          points: firmoScore,
          note: breakdown.join("; "),
        })

        const totalScore = behaviouralScore + firmoScore
        const tier = scoreToTier(totalScore)
        const tierLabel =
          tier === 1 ? "Tier 1 (≥30 pts)" : tier === 2 ? "Tier 2 (≥15 pts)" : "Tier 3 (<15 pts)"

        await Promise.all([
          ctx.runMutation(api.prospects.updateScores, {
            id: firm.id as Id<"prospects">,
            leadScore: totalScore,
            behaviouralScore,
            firmographicScore: firmoScore,
            tier,
          }),
          ctx.runMutation(api.prospects.updateTier, {
            id: firm.id as Id<"prospects">,
            tier,
            tierReasoning: `${firm.tier_reasoning} Score: ${totalScore} pts → ${tierLabel}.`,
            companySize: firm.company_size,
            estimatedRevenue: firm.estimated_revenue,
            yearsInBusiness: firm.years_in_business ?? undefined,
            companyNews: firm.company_news ?? undefined,
          }),
        ])

        return { id: firm.id, tier, score: totalScore }
      })
    )

    const counts = results.reduce(
      (acc, r) => { if (r) acc[r.tier] = (acc[r.tier] ?? 0) + 1; return acc },
      {} as Record<number, number>
    )

    return { tiered: results.length, tier1: counts[1] ?? 0, tier2: counts[2] ?? 0, tier3: counts[3] ?? 0 }
  },
})

// Tool call executor
async function executeToolCall(
  ctx: ToolCtx,
  toolName: string,
  input: Record<string, unknown>,
  userId: string,
  businessId?: Id<"businesses">,
  conversationId?: Id<"conversations">
): Promise<unknown> {
  switch (toolName) {
    case "onboard_business": {
      const id = await ctx.runMutation(api.businesses.create, {
        userId,
        name: input.name as string,
        description: input.description as string,
        productOrService: input.productOrService as "product" | "service" | "both",
        whatTheySell: input.whatTheySell as string,
        industry: input.industry as string,
        targetAudience: input.targetAudience as string,
        demographics:
          (input.demographics as {
            gender?: string
            ageRange?: string
            incomeRange?: string
            locationType?: string
          }) ?? {},
        locations: (input.locations as string[]) ?? [],
        competitors: (input.competitors as string[]) ?? [],
        websiteUrl: (input.websiteUrl as string | undefined) ?? undefined,
        imageryUrls: [],
      })
      // Link the new business to this conversation so the next tools in the
      // same turn (find_local_competitors, audit_gbp) — and every turn that
      // follows — can fetch the business record without another onboarding.
      if (conversationId) {
        await ctx.runMutation(api.conversations.linkBusiness, {
          conversationId,
          businessId: id,
        })
      }
      return { success: true, businessId: id }
    }

    case "generate_campaign": {
      if (!businessId) return { error: "No business context" }
      return await ctx.runAction(api.ai.generateCampaign, {
        businessId,
        phase: input.phase as number | undefined,
        channels: (input.channels as string[]) ?? undefined,
      })
    }

    case "generate_creatives": {
      if (!businessId) return { error: "No business context" }
      return await ctx.runAction(api.ai.generateCreatives, {
        campaignId: input.campaignId as Id<"campaigns">,
        businessId,
        funnelStage: input.funnelStage as string,
        customInstructions: (input.customInstructions as string) ?? undefined,
      })
    }

    case "tier_prospects": {
      if (!businessId) return { error: "No business context" }
      return await ctx.runAction(api.ai.tierProspects, { businessId })
    }

    case "generate_sales_strategy": {
      if (!businessId) return { error: "No business context" }
      const [prospect, business] = (await Promise.all([
        ctx.runQuery(api.prospects.get, { id: input.prospectId as Id<"prospects"> }),
        ctx.runQuery(api.businesses.get, { id: businessId }),
      ])) as [
        { name: string; company: string; tier?: number; leadScore?: number; status: string } | null,
        { name: string; industry: string; whatTheySell: string } | null,
      ]
      if (!prospect || !business) return { error: "Prospect or business not found" }

      const prompt = `Generate a personalised B2B sales outreach strategy.

SELLER: ${business.name} (${business.industry}) — ${business.whatTheySell}
PROSPECT: ${prospect.name} at ${prospect.company}
TIER: ${prospect.tier ?? "untiered"} (score: ${prospect.leadScore ?? 0})

Return ONLY valid JSON:
{
  "suggested_channel": "linkedin|email|phone",
  "message_template": "personalised opening message (2-3 sentences)",
  "follow_up_sequence": [
    {"day": 3, "channel": "email", "message": "..."},
    {"day": 7, "channel": "linkedin", "message": "..."},
    {"day": 14, "channel": "email", "message": "..."},
    {"day": 21, "channel": "phone", "message": "..."}
  ],
  "positive_response_strategy": "What to do if they respond positively",
  "negative_response_strategy": "What to do if they push back"
}`

      const stratResp = await callOpenRouter([{ role: "user", content: prompt }], { maxTokens: 2000 })
      const stratText = stratResp.choices[0].message.content ?? ""

      const jsonMatch = stratText.match(/\{[\s\S]*\}/)
      let strategy: Record<string, unknown>
      try {
        strategy = JSON.parse(jsonMatch?.[0] || stratText)
      } catch {
        return { error: "Failed to parse sales strategy from AI response. Please try again." }
      }

      await ctx.runMutation(api.salesStrategies.upsert, {
        businessId,
        prospectId: input.prospectId as Id<"prospects">,
        suggestedChannel: strategy.suggested_channel ?? "email",
        messageTemplate: strategy.message_template ?? "",
        followUpSequence: strategy.follow_up_sequence ?? [],
        positiveResponseStrategy: strategy.positive_response_strategy ?? "",
        negativeResponseStrategy: strategy.negative_response_strategy ?? "",
      })
      return { ...strategy, prospectId: input.prospectId }
    }

    case "calculate_roi": {
      if (!businessId) return { error: "No business context" }
      const customers = (await ctx.runQuery(api.customers.listByBusiness, { businessId })) as Array<{
        contractValue: number
        marketingSpendAttributed: number
      }>
      const totalRevenue = customers.reduce((sum, c) => sum + c.contractValue, 0)
      const totalSpend =
        (input.adSpend as number) ??
        customers.reduce((sum, c) => sum + c.marketingSpendAttributed, 0)
      const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0
      const cac = customers.length > 0 ? totalSpend / customers.length : 0
      const ltv = customers.length > 0 ? totalRevenue / customers.length : 0
      return {
        customers: customers.length,
        totalRevenue,
        totalSpend,
        roi: Math.round(roi),
        cac: Math.round(cac),
        ltv: Math.round(ltv),
      }
    }

    case "launch_campaign": {
      if (!businessId || !conversationId) return { error: "No business or conversation context" }

      // Track campaign launch in usage
      const campaignLedgerId = await ctx.runMutation(api.usage.getOrCreateLedger, { businessId })
      await ctx.runMutation(api.usage.incrementCampaigns, { ledgerId: campaignLedgerId })

      // Create a placeholder message ID for the approval record.
      // The actual approval_request message is created after tool execution,
      // so we store a temporary one and the frontend uses the approvalId directly.
      const tempMessageId = await ctx.runMutation(api.messages.send, {
        conversationId,
        role: "system",
        content: "",
        messageType: "text",
      })

      const approvalId = await ctx.runMutation(api.approvals.create, {
        businessId,
        conversationId,
        messageId: tempMessageId as Id<"messages">,
        actionType: "launch_campaign",
        payload: {
          campaignId: input.campaignId,
          platform: input.platform,
          budget: input.budget,
        },
      })

      return {
        approvalId: approvalId as string,
        campaignId: input.campaignId,
        platform: input.platform,
        budget: input.budget,
        status: "pending",
        actionType: "launch_campaign",
        message: `Campaign queued for launch on ${input.platform}. Review and approve to go live.`,
      }
    }

    case "analyze_performance": {
      if (!businessId) return { error: "No business context" }
      const campaigns = (await ctx.runQuery(api.campaigns.listByBusiness, { businessId })) as Array<{
        theme: string
        status: string
        budgetBreakdown: unknown
      }>
      return { campaigns: campaigns.map((c) => ({ theme: c.theme, status: c.status, budget: c.budgetBreakdown })) }
    }

    case "check_usage": {
      if (!businessId) return { error: "No business context" }
      return await ctx.runQuery(api.usage.getCurrentUsage, { businessId })
    }

    case "connect_channel": {
      const platformAppMap: Record<string, { app: string; oauthAppId?: string }> = {
        meta: { app: "facebook_pages", oauthAppId: "oa_K1i8YD" },
        google: { app: "google_ads" },
        ga4: { app: "google_analytics" },
        klaviyo: { app: "klaviyo" },
        tiktok: { app: "tiktok_ads" },
        linkedin: { app: "linkedin_ads" },
        shopify: { app: "shopify" },
        buffer: { app: "buffer" },
      }
      const mapping = platformAppMap[input.platform as string]
      if (!mapping) {
        return { error: `Platform "${input.platform}" is not yet supported for connection.` }
      }

      return {
        action: "connect",
        platform: input.platform,
        pipedreamApp: mapping.app,
        ...(mapping.oauthAppId ? { oauthAppId: mapping.oauthAppId } : {}),
      }
    }

    case "show_meta_setup_guide": {
      // The MetaSetupGuide component holds the step content, so the tool
      // just returns the Pipedream connect config the final CTA uses.
      return {
        action: "show_meta_setup_guide",
        platform: "meta",
        pipedreamApp: "facebook_pages",
        oauthAppId: "oa_K1i8YD",
      }
    }

    case "show_google_ads_setup_guide": {
      return {
        action: "show_google_ads_setup_guide",
        platform: "google",
        pipedreamApp: "google_ads",
      }
    }

    case "show_ga4_setup_guide": {
      return {
        action: "show_ga4_setup_guide",
        platform: "ga4",
        pipedreamApp: "google_analytics",
      }
    }

    case "find_local_competitors": {
      const category = (input.category as string | undefined) ?? ""
      const area = (input.area as string | undefined) ?? ""
      if (!category || !area) return { error: "category and area are required" }

      // Belt-and-braces guard: refuse a bare city name so the tool can't
      // regress into returning results miles away. Looks for a UK postcode
      // or at least two words (implying neighbourhood + town).
      const looksLikePostcode = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i.test(area)
      const wordCount = area.trim().split(/\s+/).length
      if (!looksLikePostcode && wordCount < 2) {
        return {
          error: `area "${area}" is too broad — pass a postcode (e.g. 'BN2 6NL') or neighbourhood + town (e.g. 'Woodingdean Brighton'). A bare city name returns irrelevant results.`,
        }
      }

      let excludeName: string | undefined
      if (businessId) {
        const business = await ctx.runQuery(api.businesses.get, { id: businessId as Id<"businesses"> })
        excludeName = business?.name
      }

      const { findLocalCompetitors } = await import("../src/lib/integrations/gbp")
      return await findLocalCompetitors(category, area, excludeName)
    }

    case "publish_social_post": {
      if (!businessId) return { error: "No business context" }
      const creativeIdRaw = input.creativeId as string | undefined
      const platform = input.platform as "facebook" | "instagram" | undefined
      const caption = input.caption as string | undefined
      const scheduleAtIso = input.scheduleAt as string | undefined
      if (!creativeIdRaw || !platform || !caption) {
        return { error: "creativeId, platform and caption are required" }
      }

      // Check Meta is connected.
      const channels = (await ctx.runQuery(api.channels.listByBusiness, {
        businessId: businessId as Id<"businesses">,
      })) as Array<{ platform: string; status: string }>
      const metaConnected = channels.some((c) => c.platform === "meta" && c.status === "active")
      if (!metaConnected) {
        return { error: "Meta isn't connected. Ask the user to connect it via Settings → Meta (Facebook & Instagram) first." }
      }

      // If the business doesn't have a default target saved, ask the user to pick.
      const business = await ctx.runQuery(api.businesses.get, { id: businessId as Id<"businesses"> })
      if (!business) return { error: "Business not found" }
      const targetId =
        platform === "facebook"
          ? business.defaultFacebookPageId
          : business.defaultInstagramUserId
      if (!targetId) {
        const targetsRes = (await ctx.runAction(api.socialPostsActions.listMetaTargets, {
          businessId: businessId as Id<"businesses">,
        })) as { targets?: Array<{ pageId: string; pageName: string; igUserId?: string }>; error?: string }
        if (targetsRes.error) return { error: targetsRes.error }
        return {
          needsTargetSelection: true,
          platform,
          pendingPublish: { creativeId: creativeIdRaw, caption, scheduleAt: scheduleAtIso },
          targets: targetsRes.targets ?? [],
        }
      }

      let scheduleAt: number | undefined
      if (scheduleAtIso) {
        const parsed = Date.parse(scheduleAtIso)
        if (isNaN(parsed)) return { error: `scheduleAt "${scheduleAtIso}" is not a valid ISO-8601 timestamp` }
        if (parsed <= Date.now()) return { error: "scheduleAt must be in the future" }
        scheduleAt = parsed
      }

      return await ctx.runAction(api.socialPostsActions.startFromCreative, {
        businessId: businessId as Id<"businesses">,
        creativeId: creativeIdRaw as Id<"adCreatives">,
        platform,
        caption,
        scheduleAt,
      })
    }

    case "pick_social_target": {
      if (!businessId) return { error: "No business context" }
      const facebookPageId = input.facebookPageId as string | undefined
      const instagramUserId = input.instagramUserId as string | undefined
      if (!facebookPageId && !instagramUserId) {
        return { error: "Provide at least facebookPageId or instagramUserId" }
      }
      await ctx.runMutation(api.socialPosts.setDefaultTargets, {
        businessId: businessId as Id<"businesses">,
        facebookPageId,
        instagramUserId,
      })
      return { success: true, facebookPageId, instagramUserId }
    }

    case "audit_gbp": {
      let websiteUrl = input.websiteUrl as string | undefined
      let businessName = (input.businessName as string | undefined) ?? undefined
      let location: string | undefined

      // Fall back to the stored business profile for url/name/location.
      if ((!websiteUrl || !businessName) && businessId) {
        const business = await ctx.runQuery(api.businesses.get, { id: businessId as Id<"businesses"> })
        if (business) {
          if (!websiteUrl) websiteUrl = business.websiteUrl ?? undefined
          if (!businessName) businessName = business.name
          location = business.locations?.[0]
        }
      }

      if (!websiteUrl) return { error: "No website URL provided." }

      const apiKey = process.env.GOOGLE_PLACES_API_KEY
      if (!apiKey) {
        return { error: "Google Places API is not configured yet. Ask the user to add GOOGLE_PLACES_API_KEY." }
      }

      try {
        const { runGbpAudit } = await import("../src/lib/integrations/gbp")
        return await runGbpAudit(websiteUrl, businessName, location)
      } catch (err) {
        return { error: `GBP audit failed: ${err instanceof Error ? err.message : String(err)}` }
      }
    }

    case "search_web": {
      const query = input.query as string
      if (!query) return { error: "No search query provided" }

      const tavilyKey = process.env.TAVILY_API_KEY
      if (!tavilyKey) return { error: "Web search is not configured yet. Ask the user to add their Tavily API key." }

      try {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query,
            search_depth: (input.searchDepth as string) ?? "basic",
            max_results: 5,
            include_answer: true,
          }),
        })
        if (!res.ok) {
          const errText = await res.text()
          return { error: `Search failed: ${res.status} ${errText}` }
        }
        const data = await res.json()
        return {
          answer: data.answer ?? null,
          results: (data.results ?? []).map((r: any) => ({
            title: r.title,
            url: r.url,
            content: r.content,
          })),
        }
      } catch (err) {
        return { error: `Search failed: ${err instanceof Error ? err.message : String(err)}` }
      }
    }

    default:
      return { error: `Unknown tool: ${toolName}` }
  }
}
