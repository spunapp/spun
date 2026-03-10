"use node"

import { action } from "./_generated/server"
import { v } from "convex/values"
import { api } from "./_generated/api"
import Anthropic from "@anthropic-ai/sdk"
import { buildSystemPrompt } from "../src/lib/ai/persona"
import { TOOL_DEFINITIONS } from "../src/lib/ai/tools"

const anthropic = new Anthropic()

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

    const messages = await ctx.runQuery(api.conversations.getMessages, {
      conversationId: args.conversationId,
    })

    // Build message history for Claude (last 50 messages for context)
    const recentMessages = messages.slice(-50)
    const claudeMessages: Anthropic.MessageParam[] = recentMessages.map(
      (m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      })
    )

    // Build system prompt with business context
    const systemPrompt = buildSystemPrompt(business)

    // Call Claude with tool_use
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20241022",
      max_tokens: 4096,
      system: systemPrompt,
      tools: TOOL_DEFINITIONS,
      messages: claudeMessages,
    })

    // Process response — handle tool calls and text
    let responseText = ""
    let messageType: "text" | "strategy" | "campaign_preview" | "analytics" | "creative_gallery" | "approval_request" | "status_update" | "onboarding" = "text"
    let metadata: Record<string, unknown> | undefined

    for (const block of response.content) {
      if (block.type === "text") {
        responseText += block.text
      } else if (block.type === "tool_use") {
        // Execute tool and get result
        const toolResult = await executeToolCall(
          ctx,
          block.name,
          block.input as Record<string, unknown>,
          args.userId,
          conversation.businessId ?? undefined
        )

        // Determine rich message type based on tool
        if (block.name === "generate_strategy" || block.name === "generate_campaign") {
          messageType = "strategy"
          metadata = toolResult as Record<string, unknown>
        } else if (block.name === "generate_creatives") {
          messageType = "creative_gallery"
          metadata = toolResult as Record<string, unknown>
        } else if (block.name === "analyze_performance" || block.name === "calculate_roi") {
          messageType = "analytics"
          metadata = toolResult as Record<string, unknown>
        } else if (block.name === "launch_campaign") {
          messageType = "approval_request"
          metadata = toolResult as Record<string, unknown>
        } else if (block.name === "onboard_business") {
          messageType = "onboarding"
          metadata = toolResult as Record<string, unknown>
        }

        // Make follow-up call with tool result to get natural response
        const followUp = await anthropic.messages.create({
          model: "claude-sonnet-4-5-20241022",
          max_tokens: 2048,
          system: systemPrompt,
          messages: [
            ...claudeMessages,
            { role: "assistant", content: response.content },
            {
              role: "user",
              content: [
                {
                  type: "tool_result",
                  tool_use_id: block.id,
                  content: JSON.stringify(toolResult),
                },
              ],
            },
          ],
        })

        for (const followUpBlock of followUp.content) {
          if (followUpBlock.type === "text") {
            responseText += followUpBlock.text
          }
        }
      }
    }

    // Save assistant message
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
    const business = await ctx.runQuery(api.businesses.get, {
      id: args.businessId,
    })
    if (!business) throw new Error("Business not found")

    const prompt = `You are an expert marketing strategist. Create a comprehensive marketing campaign plan for the following business.

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

Generate a detailed marketing campaign plan as valid JSON with this exact structure:
{
  "theme": "A compelling campaign theme/concept",
  "audience_breakdown": {
    "total_addressable_market": "Estimated TAM with numbers",
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
}

Return ONLY valid JSON.`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20241022",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    })

    const textBlock = response.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text")
      throw new Error("No text response")

    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
    const campaignData = JSON.parse(jsonMatch?.[0] || textBlock.text)

    const campaignId = await ctx.runMutation(api.campaigns.create, {
      businessId: args.businessId,
      phase: args.phase ?? 1,
      theme: campaignData.theme,
      audienceBreakdown: campaignData.audience_breakdown,
      suggestedChannels: campaignData.suggested_channels,
      budgetBreakdown: campaignData.budget_breakdown,
      funnel: campaignData.funnel,
      rawContent: textBlock.text,
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
    const stageName = stageMap[args.funnelStage]
    const stageData = campaign.funnel?.[args.funnelStage]
    const formats: Record<string, string[]> = {
      tof: ["Leaderboard Banner (728x90)", "Social Square (1080x1080)", "Story Format (1080x1920)"],
      mof: ["Display Banner (300x250)", "Social Carousel Slide (1080x1080)", "Video Thumbnail (1280x720)"],
      bof: ["Remarketing Banner (160x600)", "Email Header (600x200)", "Social Feed Ad (1200x628)"],
    }

    const creatives = []

    for (let variant = 1; variant <= 3; variant++) {
      const format = formats[args.funnelStage]?.[variant - 1] ?? "Social Square"

      const prompt = `You are an expert ad creative designer. Create an HTML/CSS ad creative for:

BUSINESS: ${business.name}
INDUSTRY: ${business.industry}
CAMPAIGN THEME: ${campaign.theme}
FUNNEL STAGE: ${stageName} (Variant ${variant})
FORMAT: ${format}
OBJECTIVE: ${stageData?.objective}
MESSAGING: ${stageData?.messaging}
CREATIVE IDEA: ${stageData?.creative_ideas?.[variant - 1] || ""}

Generate a JSON object:
{
  "headline": "Compelling headline (max 8 words)",
  "copy": "Body copy (max 20 words)",
  "cta": "CTA button text (max 4 words)",
  "format": "${format}",
  "html_content": "Complete self-contained HTML with inline CSS. Professional ad with gradient backgrounds, bold typography. Colors: primary #7C3AED, accent #EC4899."
}

Return ONLY valid JSON.`

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20241022",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      })

      const textBlock = response.content.find((b) => b.type === "text")
      if (!textBlock || textBlock.type !== "text") continue

      try {
        const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
        const creativeData = JSON.parse(jsonMatch?.[0] || textBlock.text)

        creatives.push({
          campaignId: args.campaignId,
          businessId: args.businessId,
          funnelStage: args.funnelStage as "tof" | "mof" | "bof",
          variant,
          format,
          headline: creativeData.headline,
          copy: creativeData.copy,
          cta: creativeData.cta,
          htmlContent: creativeData.html_content,
        })
      } catch {
        continue
      }
    }

    return { creatives }
  },
})

// Tool call executor
async function executeToolCall(
  ctx: {
    runMutation: typeof import("./_generated/server")["action"]["prototype"]["runMutation"]
    runQuery: typeof import("./_generated/server")["action"]["prototype"]["runQuery"]
    runAction: typeof import("./_generated/server")["action"]["prototype"]["runAction"]
  },
  toolName: string,
  input: Record<string, unknown>,
  userId: string,
  businessId?: string
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
        demographics: (input.demographics as { gender?: string; ageRange?: string; incomeRange?: string; locationType?: string }) ?? {},
        locations: (input.locations as string[]) ?? [],
        competitors: (input.competitors as string[]) ?? [],
        imageryUrls: [],
      })
      return { success: true, businessId: id }
    }

    case "generate_campaign": {
      if (!businessId) return { error: "No business context" }
      const result = await ctx.runAction(api.ai.generateCampaign, {
        businessId: businessId as never,
        phase: input.phase as number | undefined,
      })
      return result
    }

    case "generate_creatives": {
      if (!businessId) return { error: "No business context" }
      const result = await ctx.runAction(api.ai.generateCreatives, {
        campaignId: input.campaignId as never,
        businessId: businessId as never,
        funnelStage: input.funnelStage as string,
      })
      return result
    }

    case "check_usage": {
      if (!businessId) return { error: "No business context" }
      const usage = await ctx.runQuery(api.usage.getCurrentUsage, {
        businessId: businessId as never,
      })
      return usage
    }

    case "connect_channel": {
      return {
        action: "redirect",
        message: `To connect ${input.platform}, I need to redirect you to authorize access. Ready?`,
        platform: input.platform,
      }
    }

    case "analyze_performance": {
      if (!businessId) return { error: "No business context" }
      const campaigns = await ctx.runQuery(api.campaigns.listByBusiness, {
        businessId: businessId as never,
      })
      return {
        campaigns: campaigns.map((c) => ({
          theme: c.theme,
          status: c.status,
          budget: c.budgetBreakdown,
        })),
      }
    }

    default:
      return { error: `Unknown tool: ${toolName}` }
  }
}
