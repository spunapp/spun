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

const MODEL = "anthropic/claude-opus-4"

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

async function callOpenRouter(
  messages: OrMessage[],
  options: { tools?: ReturnType<typeof toOrTools>; maxTokens?: number } = {}
) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set")
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: options.maxTokens ?? 4096,
      messages,
      ...(options.tools ? { tools: options.tools } : {}),
    }),
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status} ${await res.text()}`)
  return res.json()
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

    const allMessages = await ctx.runQuery(api.conversations.getMessages, {
      conversationId: args.conversationId,
    })

    const systemPrompt = buildSystemPrompt(
      business as Parameters<typeof buildSystemPrompt>[0]
    )
    const orTools = toOrTools(TOOL_DEFINITIONS)

    const orMessages: OrMessage[] = [
      { role: "system", content: systemPrompt },
      ...(allMessages as Array<{ role: string; content: string }>)
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-50)
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ]

    const response = await callOpenRouter(orMessages, { tools: orTools, maxTokens: 4096 })
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
      | "onboarding" = "text"
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
            conversation.businessId
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
        }

        const followUp = await callOpenRouter(
          [
            ...orMessages,
            { role: "assistant", content: responseMessage.content ?? null, tool_calls: responseMessage.tool_calls },
            { role: "tool", tool_call_id: tc.id, content: JSON.stringify(toolResult) },
          ],
          { maxTokens: 2048 }
        )
        responseText += followUp.choices[0].message.content ?? ""
      }
    }

    if (!responseText) responseText = "Something went wrong — please try again."

    const messageId = await ctx.runMutation(api.messages.send, {
      conversationId: args.conversationId,
      role: "assistant",
      content: responseText,
      messageType,
      metadata,
    })

    return { messageId, content: responseText, messageType, metadata }
  },
})

export const generateCampaign = action({
  args: {
    businessId: v.id("businesses"),
    phase: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const business = await ctx.runQuery(api.businesses.get, { id: args.businessId })
    if (!business) throw new Error("Business not found")

    const prompt = `You are an expert marketing strategist. Create a comprehensive marketing campaign plan for this business.

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
    { "channel": "Primary channel", "reason": "Why this channel", "estimated_reach": "Potential reach" },
    { "channel": "Secondary channel", "reason": "Why this supports primary", "estimated_reach": "Potential reach" }
  ],
  "budget_breakdown": {
    "monthly_total": 2000,
    "daily_budget": 66,
    "channel_split": [
      {"channel": "Channel name", "percentage": 60, "amount": 1200},
      {"channel": "Channel name", "percentage": 40, "amount": 800}
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

export const generateCreatives = action({
  args: {
    campaignId: v.id("campaigns"),
    businessId: v.id("businesses"),
    funnelStage: v.string(),
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

    const savedIds: string[] = []

    for (let variant = 1; variant <= 3; variant++) {
      const format = formats[args.funnelStage]?.[variant - 1] ?? "Social Square"

      const prompt = `You are an expert ad creative designer. Create an HTML/CSS ad creative for:

BUSINESS: ${business.name}
INDUSTRY: ${business.industry}
CAMPAIGN THEME: ${campaign.theme}
FUNNEL STAGE: ${stageMap[args.funnelStage]} (Variant ${variant})
FORMAT: ${format}
OBJECTIVE: ${stageData?.objective ?? ""}
MESSAGING: ${stageData?.messaging ?? ""}
CREATIVE IDEA: ${stageData?.creative_ideas?.[variant - 1] ?? ""}

Return ONLY valid JSON:
{
  "headline": "Compelling headline (max 8 words)",
  "copy": "Body copy (max 20 words)",
  "cta": "CTA button text (max 4 words)",
  "format": "${format}",
  "html_content": "Complete self-contained HTML with inline CSS. Professional ad with gradient backgrounds, bold typography. Colors: primary #7C3AED, accent #EC4899."
}`

      let creativeText: string
      try {
        const creativeResp = await callOpenRouter([{ role: "user", content: prompt }], { maxTokens: 3000 })
        creativeText = creativeResp.choices[0].message.content ?? ""
      } catch {
        continue
      }

      try {
        const jsonMatch = creativeText.match(/\{[\s\S]*\}/)
        const creativeData = JSON.parse(jsonMatch?.[0] || creativeText)

        const id = await ctx.runMutation(api.adCreatives.create, {
          campaignId: args.campaignId,
          businessId: args.businessId,
          funnelStage: args.funnelStage as "tof" | "mof" | "bof",
          variant,
          format,
          headline: creativeData.headline ?? "",
          copy: creativeData.copy ?? "",
          cta: creativeData.cta ?? "",
          htmlContent: creativeData.html_content ?? "",
        })
        savedIds.push(id as string)
      } catch {
        continue
      }
    }

    return { count: savedIds.length, campaignId: args.campaignId, funnelStage: args.funnelStage }
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
  businessId?: Id<"businesses">
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
      return {
        campaignId: input.campaignId,
        platform: input.platform,
        budget: input.budget,
        status: "queued_for_approval",
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
      const platformAppMap: Record<string, string> = {
        meta: "facebook_pages",
        google: "google_ads",
        ga4: "google_analytics",
        klaviyo: "klaviyo",
        tiktok: "tiktok_ads",
        linkedin: "linkedin_ads",
        shopify: "shopify",
        buffer: "buffer",
      }
      const pipedreamApp = platformAppMap[input.platform as string]
      if (!pipedreamApp) {
        return { error: `Platform "${input.platform}" is not yet supported for connection.` }
      }

      return {
        action: "connect",
        platform: input.platform,
        pipedreamApp,
      }
    }

    default:
      return { error: `Unknown tool: ${toolName}` }
  }
}
