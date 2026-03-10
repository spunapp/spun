import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const listByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("prospects")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect()
  },
})

export const get = query({
  args: { id: v.id("prospects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    name: v.string(),
    company: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    source: v.string(),
    customFields: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("prospects", {
      ...args,
      leadScore: 0,
      behaviouralScore: 0,
      firmographicScore: 0,
      status: "prospect",
    })
  },
})

export const updateTier = mutation({
  args: {
    id: v.id("prospects"),
    tier: v.union(v.literal(1), v.literal(2), v.literal(3)),
    tierReasoning: v.optional(v.string()),
    companySize: v.optional(v.string()),
    estimatedRevenue: v.optional(v.string()),
    yearsInBusiness: v.optional(v.number()),
    companyNews: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    await ctx.db.patch(id, updates)
  },
})

export const updateStatus = mutation({
  args: {
    id: v.id("prospects"),
    status: v.union(
      v.literal("prospect"),
      v.literal("contacted"),
      v.literal("qualified"),
      v.literal("negotiating"),
      v.literal("customer"),
      v.literal("lost")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status })
  },
})

export const updateScores = mutation({
  args: {
    id: v.id("prospects"),
    leadScore: v.number(),
    behaviouralScore: v.number(),
    firmographicScore: v.number(),
    tier: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))),
  },
  handler: async (ctx, args) => {
    const { id, ...scores } = args
    const updates: Record<string, unknown> = { ...scores }
    if (scores.tier !== undefined) {
      updates.tier = scores.tier
    }
    await ctx.db.patch(id, updates)
  },
})

export const logScoreEvent = mutation({
  args: {
    prospectId: v.id("prospects"),
    businessId: v.id("businesses"),
    eventType: v.string(),
    points: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("leadScoreEvents", args)
  },
})

export const getScoreEvents = query({
  args: { prospectId: v.id("prospects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leadScoreEvents")
      .withIndex("by_prospect", (q) => q.eq("prospectId", args.prospectId))
      .collect()
  },
})
