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

// Chat models for user-facing conversation turns. Gemini 2.5 Flash is stable
// and handles tool calling in multi-turn conversations reliably (the 3.1 Flash
// Lite preview had known issues with empty responses). Claude Haiku 4.5 is
// the fallback — OpenRouter auto-falls-back on 5xx/rate limits.
const CHAT_MODELS = [
  "google/gemini-2.5-flash",
  "anthropic/claude-haiku-4-5",
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

    // Load context
    const conversation = await ctx.runQuery(api.conversations.get, {
      id: args.conversationId,
    })
    if (!conversation) throw new Error("Conversation not found")

    const business = conversation.businessId
      ? await ctx.runQuery(api.businesses.get, { id: conversation.businessId })
      : null

    // Check usage limits before calling AI
    if (business) {
      const usage = await ctx.runQuery(api.usage.getCurrentUsage, { businessId: business._id })
      const subscription = await ctx.runQuery(api.subscriptions.getByUser, { userId: args.userId })
      const tier = subscription?.tier ?? "standard"
      const { checkUsageLimit } = await import("../src/lib/billing/tiers")
      const limitCheck = checkUsageLimit(tier, usage)

      if (!limitCheck.allowed && limitCheck.limitType === "messages") {
        // Check if user has message credits
        const credits = await ctx.runQuery(api.credits.getBalance, { businessId: business._id })
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
        // Deduct from credits
        await ctx.runMutation(api.credits.deductMessage, { businessId: business._id })
      }
    }

    const allMessages = await ctx.runQuery(api.conversations.getMessages, {
      conversationId: args.conversationId,
    })

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
    const orTools = toOrTools(TOOL_DEFINITIONS)

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
      | "google_ads_setup_guide" = "text"
    let metadata: Record<string, unknown> | undefined

    if (responseMessage.tool_calls) {
      for (const tc of responseMessage.tool_calls) {
        const toolName = tc.function.name
        let toolInput: Record<string, unknown>
        try {
          toolInput = JSON.parse(tc.function.arguments)
        } catch {
          responseText += `\n\nSorry, I had trouble processing the ${toolName} action. Please try again.`
          continue
        }

        let toolResult: unknown
        try {
          toolResult = await executeToolCall(
            ctx as unknown as ToolCtx,
            toolName,
            toolInput,
            args.userId,
            conversation.businessId,
            args.conversationId
          )
        } catch (err) {
          responseText += `\n\nSomething went wrong while running ${toolName}. Please try again.`
          continue
        }

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
          metadata = { ...(toolResult as Record<string, unknown>), businessId: conversation.businessId }
        } else if (toolName === "show_meta_setup_guide") {
          messageType = "meta_setup_guide"
          metadata = { ...(toolResult as Record<string, unknown>), businessId: conversation.businessId }
        } else if (toolName === "show_google_ads_setup_guide") {
          messageType = "google_ads_setup_guide"
          metadata = { ...(toolResult as Record<string, unknown>), businessId: conversation.businessId }
        }

        try {
          const followUp = await callOpenRouter(
            [
              ...orMessages,
              { role: "assistant", content: responseMessage.content ?? null, tool_calls: responseMessage.tool_calls },
              { role: "tool", tool_call_id: tc.id, content: JSON.stringify(toolResult) },
            ],
            { maxTokens: 2048, models: CHAT_MODELS }
          )
          const followUpText = followUp.choices[0].message.content ?? ""
          if (followUpText) {
            responseText = responseText ? `${responseText}\n\n${followUpText}` : followUpText
          }
        } catch (err) {
          // Tool ran successfully but the narration call failed. The tool
          // result is already persisted in messageType/metadata, so we can
          // fall back to a short synthesised acknowledgement rather than
          // throwing away the whole turn.
          console.error("Follow-up OpenRouter call failed:", err)
          if (!responseText) {
            responseText =
              "Done. (I couldn't reach my AI backend to write this up properly — the action above ran successfully.)"
          }
        }
      }
    }

    if (!responseText) {
      // Gemini Flash Lite sometimes returns empty content for short or
      // contextual messages. Retry with Claude Haiku directly — don't hit
      // the same model that just failed.
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

    const messageId = await ctx.runMutation(api.messages.send, {
      conversationId: args.conversationId,
      role: "assistant",
      content: responseText,
      messageType,
      metadata,
    })

    // Track this AI response (1 per user turn, regardless of tool calls)
    if (business) {
      const ledgerId = await ctx.runMutation(api.usage.getOrCreateLedger, { businessId: business._id })
      await ctx.runMutation(api.usage.incrementAiResponses, { ledgerId })
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
    const connectedLabels = connectedPlatforms.map((p) => platformLabels[p] ?? p)

    const channelsNote = connectedPlatforms.length > 0
      ? `CONNECTED CHANNELS (use ONLY these): ${connectedLabels.join(", ")}.
STRICT RULE: The suggested_channels array and budget_breakdown.channel_split array MUST only contain channels from the list above. Do NOT add LinkedIn, Google, TikTok, or any other platform that is not listed. If only one channel is connected, put 100% of the budget on that single channel.`
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

Return ONLY valid JSON:
{
  "theme": "A compelling campaign theme/concept",
  "audience_breakdown": {
    "total_addressable_market": "Estimated TAM",
    "serviceable_market": "Realistic reachable market",
    "target_segment": "Specific segment to target first",
    "key_characteristics": ["trait 1", "trait 2", "trait 3", "trait 4", "trait 5"]
  },
  "suggested_channels": [
    { "channel": "Channel name", "reason": "Why this channel", "estimated_reach": "Potential reach" }
  ],
  "budget_breakdown": {
    "monthly_total": "${currency.symbol}X,XXX",
    "daily_budget": "${currency.symbol}XX",
    "channel_split": [
      {"channel": "Channel name", "percentage": 100, "amount": "${currency.symbol}X,XXX"}
    ]
  },
  "funnel": {
    "tof": { "objective": "", "audience": "", "messaging": "", "creative_ideas": ["", "", ""], "kpis": ["", "", ""] },
    "mof": { "objective": "", "audience": "", "messaging": "", "creative_ideas": ["", "", ""], "kpis": ["", "", ""] },
    "bof": { "objective": "", "audience": "", "messaging": "", "creative_ideas": ["", "", ""], "kpis": ["", "", ""] }
  }
}`

    const campaignResp = await callOpenRouter([{ role: "user", content: prompt }], { maxTokens: 4000 })
    const campaignText = campaignResp.choices[0].message.content ?? ""

    const jsonMatch = campaignText.match(/\{[\s\S]*\}/)
    let campaignData: Record<string, unknown>
    try {
      campaignData = JSON.parse(jsonMatch?.[0] || campaignText)
    } catch {
      throw new Error("Failed to parse campaign data from AI response. Please try again.")
    }

    // The AI sometimes ignores the channel restriction and adds platforms
    // the user hasn't connected. Programmatically enforce the constraint.
    if (connectedPlatforms.length > 0) {
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
      const allowedKeywords = connectedPlatforms.flatMap((p) => platformKeywords[p] ?? [p])
      const matchesConnected = (name: string) => {
        const lower = name.toLowerCase()
        return allowedKeywords.some((kw) => lower.includes(kw))
      }

      const channels = campaignData.suggested_channels as Array<{ channel: string; reason: string }> | undefined
      if (Array.isArray(channels)) {
        const filtered = channels.filter((ch) => matchesConnected(ch.channel))
        campaignData.suggested_channels = filtered.length > 0 ? filtered : connectedLabels.map((l) => ({ channel: l, reason: "Connected platform" }))
      }

      const budget = campaignData.budget_breakdown as { monthly_total: unknown; channel_split?: Array<{ channel: string; percentage: number; amount: unknown }> } | undefined
      if (budget?.channel_split) {
        const filtered = budget.channel_split.filter((s) => matchesConnected(s.channel))
        const finalChannels = filtered.length > 0 ? filtered : connectedLabels.map((l) => ({ channel: l, percentage: 0, amount: "" as unknown }))
        const totalNum = parseFloat(String(budget.monthly_total).replace(/[^0-9.]/g, "")) || 0
        const perChannelPct = Math.round(100 / finalChannels.length)
        budget.channel_split = finalChannels.map((ch, idx) => ({
          channel: filtered.length > 0 ? ch.channel : connectedLabels[idx] ?? ch.channel,
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

    for (let variant = 1; variant <= 3; variant++) {
      const format = formats[args.funnelStage]?.[variant - 1] ?? "Social Square"

      const customNote = args.customInstructions ? `\nADDITIONAL INSTRUCTIONS: ${args.customInstructions}` : ""

      const copyPrompt = `You are an expert ad copywriter. Write ad copy for:

BUSINESS: ${business.name}
INDUSTRY: ${business.industry}
CAMPAIGN THEME: ${campaign.theme}
FUNNEL STAGE: ${stageMap[args.funnelStage]} (Variant ${variant})
FORMAT: ${format}
OBJECTIVE: ${stageData?.objective ?? ""}
MESSAGING: ${stageData?.messaging ?? ""}
CREATIVE IDEA: ${stageData?.creative_ideas?.[variant - 1] ?? ""}${customNote}

Return ONLY valid JSON:
{
  "headline": "Compelling headline (max 8 words)",
  "copy": "Body copy (max 20 words)",
  "cta": "CTA button text (max 4 words)",
  "image_prompt": "A detailed prompt for generating an ad image. Describe the visual style, composition, colours, and mood. Do NOT include any text in the image — text will be overlaid separately. Make it professional, on-brand, and suitable for ${format}."
}`

      let creativeText: string
      try {
        const creativeResp = await callOpenRouter([{ role: "user", content: copyPrompt }], { maxTokens: 1500 })
        creativeText = creativeResp.choices[0].message.content ?? ""
      } catch {
        continue
      }

      try {
        const jsonMatch = creativeText.match(/\{[\s\S]*\}/)
        const creativeData = JSON.parse(jsonMatch?.[0] || creativeText)

        let imageStorageId: Id<"_storage"> | undefined
        const imagePrompt = creativeData.image_prompt as string | undefined
        if (imagePrompt) {
          const imageBuffer = await generateImage(imagePrompt)
          if (imageBuffer) {
            const blob = new Blob([imageBuffer], { type: "image/png" })
            imageStorageId = await ctx.storage.store(blob)
          }
        }

        const headline = creativeData.headline ?? ""
        const copy = creativeData.copy ?? ""
        const cta = creativeData.cta ?? ""

        await ctx.runMutation(api.adCreatives.create, {
          campaignId: args.campaignId,
          businessId: args.businessId,
          funnelStage: args.funnelStage as "tof" | "mof" | "bof",
          variant,
          format,
          headline,
          copy,
          cta,
          ...(imageStorageId ? { imageStorageId } : {}),
        })
        savedCreatives.push({
          headline,
          copy,
          cta,
          format,
          variant,
          funnelStage: args.funnelStage,
          ...(imageStorageId ? { imageStorageId: imageStorageId as string } : {}),
        })
      } catch {
        continue
      }
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
        imageryUrls: [],
      })
      return { success: true, businessId: id }
    }

    case "generate_campaign": {
      if (!businessId) return { error: "No business context" }
      return await ctx.runAction(api.ai.generateCampaign, {
        businessId,
        phase: input.phase as number | undefined,
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
      // The GoogleAdsSetupGuide component holds the step content, so the
      // tool just returns the Pipedream connect config the final CTA uses.
      return {
        action: "show_google_ads_setup_guide",
        platform: "google",
        pipedreamApp: "google_ads",
      }
    }

    default:
      return { error: `Unknown tool: ${toolName}` }
  }
}
