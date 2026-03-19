import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  businesses: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.string(),
    productOrService: v.union(
      v.literal("product"),
      v.literal("service"),
      v.literal("both")
    ),
    whatTheySell: v.string(),
    industry: v.string(),
    targetAudience: v.string(),
    demographics: v.object({
      gender: v.optional(v.string()),
      ageRange: v.optional(v.string()),
      incomeRange: v.optional(v.string()),
      locationType: v.optional(v.string()),
    }),
    locations: v.array(v.string()),
    competitors: v.array(v.string()),
    logoUrl: v.optional(v.string()),
    imageryUrls: v.array(v.string()),
    trustMode: v.union(
      v.literal("draft"),
      v.literal("approve"),
      v.literal("auto")
    ),
    onboardingComplete: v.boolean(),
    defaultCampaignBudget: v.optional(v.number()),
    currency: v.optional(v.string()),
    notifications: v.optional(v.object({
      campaignApprovals: v.boolean(),
      usageWarnings: v.boolean(),
      integrationExpiry: v.boolean(),
      weeklySummary: v.boolean(),
    })),
  }).index("by_user", ["userId"]),

  conversations: defineTable({
    userId: v.string(),
    businessId: v.optional(v.id("businesses")),
    title: v.optional(v.string()),
    contextSummary: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_business", ["businessId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    messageType: v.union(
      v.literal("text"),
      v.literal("strategy"),
      v.literal("campaign_preview"),
      v.literal("analytics"),
      v.literal("creative_gallery"),
      v.literal("approval_request"),
      v.literal("status_update"),
      v.literal("onboarding")
    ),
    metadata: v.optional(v.any()),
    linkedActionId: v.optional(v.string()),
  }).index("by_conversation", ["conversationId"]),

  campaigns: defineTable({
    businessId: v.id("businesses"),
    phase: v.number(),
    theme: v.string(),
    audienceBreakdown: v.any(),
    suggestedChannels: v.any(),
    budgetBreakdown: v.any(),
    funnel: v.any(),
    rawContent: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("completed")
    ),
  }).index("by_business", ["businessId"]),

  adCreatives: defineTable({
    campaignId: v.id("campaigns"),
    businessId: v.id("businesses"),
    funnelStage: v.union(
      v.literal("tof"),
      v.literal("mof"),
      v.literal("bof")
    ),
    variant: v.number(),
    format: v.string(),
    headline: v.string(),
    copy: v.string(),
    cta: v.string(),
    htmlContent: v.string(),
  }).index("by_campaign", ["campaignId"]),

  prospects: defineTable({
    businessId: v.id("businesses"),
    name: v.string(),
    company: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    tier: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))),
    tierReasoning: v.optional(v.string()),
    companySize: v.optional(v.string()),
    estimatedRevenue: v.optional(v.string()),
    yearsInBusiness: v.optional(v.number()),
    companyNews: v.optional(v.string()),
    leadScore: v.number(),
    behaviouralScore: v.number(),
    firmographicScore: v.number(),
    status: v.union(
      v.literal("prospect"),
      v.literal("contacted"),
      v.literal("qualified"),
      v.literal("negotiating"),
      v.literal("customer"),
      v.literal("lost")
    ),
    source: v.string(),
    customFields: v.optional(v.any()),
  }).index("by_business", ["businessId"]),

  leadScoreEvents: defineTable({
    prospectId: v.id("prospects"),
    businessId: v.id("businesses"),
    eventType: v.string(),
    points: v.number(),
    note: v.optional(v.string()),
  }).index("by_prospect", ["prospectId"]),

  salesStrategies: defineTable({
    businessId: v.id("businesses"),
    prospectId: v.id("prospects"),
    suggestedChannel: v.string(),
    messageTemplate: v.string(),
    followUpSequence: v.array(
      v.object({
        day: v.number(),
        channel: v.string(),
        message: v.string(),
      })
    ),
    positiveResponseStrategy: v.string(),
    negativeResponseStrategy: v.string(),
  }).index("by_prospect", ["prospectId"]),

  customers: defineTable({
    businessId: v.id("businesses"),
    prospectId: v.optional(v.id("prospects")),
    name: v.string(),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    contractValue: v.number(),
    closeDate: v.string(),
    marketingSpendAttributed: v.number(),
  }).index("by_business", ["businessId"]),

  roiRecords: defineTable({
    businessId: v.id("businesses"),
    month: v.number(),
    adSpend: v.number(),
    revenueGenerated: v.number(),
    newCustomers: v.number(),
    roiPercentage: v.number(),
    cac: v.number(),
    ltv: v.number(),
  }).index("by_business", ["businessId"]),

  approvalQueue: defineTable({
    businessId: v.id("businesses"),
    conversationId: v.id("conversations"),
    messageId: v.id("messages"),
    actionType: v.string(),
    payload: v.any(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    resolvedAt: v.optional(v.number()),
  }).index("by_business_pending", ["businessId", "status"]),

  usageLedger: defineTable({
    businessId: v.id("businesses"),
    billingCycleStart: v.string(),
    campaignsLaunched: v.number(),
    creativesGenerated: v.number(),
    channelsConnected: v.number(),
  }).index("by_business", ["businessId"]),

  connectedChannels: defineTable({
    businessId: v.id("businesses"),
    platform: v.string(),
    oauthAccessToken: v.string(),
    oauthRefreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("error")
    ),
    platformAccountId: v.optional(v.string()),
    platformAccountName: v.optional(v.string()),
  }).index("by_business", ["businessId"]),
})
