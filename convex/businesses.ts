import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()
  },
})

export const getForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    return await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .first()
  },
})

export const get = query({
  args: { id: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("businesses", {
      ...args,
      trustMode: "draft",
      onboardingComplete: true,
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("businesses"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    targetAudience: v.optional(v.string()),
    demographics: v.optional(
      v.object({
        gender: v.optional(v.string()),
        ageRange: v.optional(v.string()),
        incomeRange: v.optional(v.string()),
        locationType: v.optional(v.string()),
      })
    ),
    locations: v.optional(v.array(v.string())),
    competitors: v.optional(v.array(v.string())),
    logoUrl: v.optional(v.string()),
    imageryUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    )
    await ctx.db.patch(id, filtered)
  },
})

export const updateSettings = mutation({
  args: {
    id: v.id("businesses"),
    defaultCampaignBudget: v.optional(v.number()),
    currency: v.optional(v.string()),
    notifications: v.optional(v.object({
      campaignApprovals: v.boolean(),
      usageWarnings: v.boolean(),
      integrationExpiry: v.boolean(),
      weeklySummary: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    )
    await ctx.db.patch(id, filtered)
  },
})

export const updateTrustMode = mutation({
  args: {
    id: v.id("businesses"),
    trustMode: v.union(
      v.literal("draft"),
      v.literal("approve"),
      v.literal("auto")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { trustMode: args.trustMode })
  },
})

// Link a business to an organisation (account).
// Finds or creates the organisation by the business name the user provides,
// then stores the organisationId on the business record.
export const linkOrganisation = mutation({
  args: {
    businessId: v.id("businesses"),
    organisationName: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    let org = await ctx.db
      .query("organisations")
      .withIndex("by_name", (q) => q.eq("name", args.organisationName))
      .first()

    if (!org) {
      const all = await ctx.db.query("organisations").collect()
      const accountId = String(all.length + 1).padStart(5, "0")
      const orgId = await ctx.db.insert("organisations", {
        name: args.organisationName,
        accountId,
        createdByUserId: args.userId,
        createdAt: Date.now(),
      })
      org = await ctx.db.get(orgId)
    }

    await ctx.db.patch(args.businessId, { organisationId: org!._id })

    return org
  },
})

// Deletes a user's business, organisation, and all associated data.
export const deleteAccount = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()
    if (!business) return

    const businessId = business._id

    // Delete all business-linked records
    const tables = [
      "campaigns",
      "adCreatives",
      "prospects",
      "leadScoreEvents",
      "salesStrategies",
      "customers",
      "roiRecords",
      "approvalQueue",
      "usageLedger",
      "connectedChannels",
      "conversations",
    ] as const

    for (const table of tables) {
      const rows = await ctx.db
        .query(table as any)
        .withIndex("by_business" as any, (q: any) => q.eq("businessId", businessId))
        .collect()
      for (const row of rows) await ctx.db.delete(row._id)
    }

    // Delete messages for any conversations
    const convos = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()
    for (const convo of convos) {
      const msgs = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", convo._id))
        .collect()
      for (const msg of msgs) await ctx.db.delete(msg._id)
      await ctx.db.delete(convo._id)
    }

    // Delete the organisation
    if (business.organisationId) {
      await ctx.db.delete(business.organisationId)
    }

    // Delete the business
    await ctx.db.delete(businessId)
  },
})

// Ensures a business has an organisation. If not, creates one using the business name.
// Safe to call multiple times — no-ops if the org already exists.
export const ensureOrganisation = mutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId)
    if (!business) return null

    // Already linked — return existing org
    if (business.organisationId) {
      return await ctx.db.get(business.organisationId)
    }

    // Check if an org with this business name exists
    let org = await ctx.db
      .query("organisations")
      .withIndex("by_name", (q) => q.eq("name", business.name))
      .first()

    if (!org) {
      const all = await ctx.db.query("organisations").collect()
      const accountId = String(all.length + 1).padStart(5, "0")
      const orgId = await ctx.db.insert("organisations", {
        name: business.name,
        accountId,
        createdByUserId: args.userId,
        createdAt: Date.now(),
      })
      org = await ctx.db.get(orgId)
    }

    await ctx.db.patch(args.businessId, { organisationId: org!._id })
    return org
  },
})

// Returns the business along with its linked organisation (account), if any.
export const getWithOrganisation = query({
  args: { id: v.id("businesses") },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.id)
    if (!business) return null
    const organisation = business.organisationId
      ? await ctx.db.get(business.organisationId)
      : null
    return { ...business, organisation }
  },
})
