import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const getByProspect = query({
  args: { prospectId: v.id("prospects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("salesStrategies")
      .withIndex("by_prospect", (q) => q.eq("prospectId", args.prospectId))
      .first()
  },
})

export const listByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("salesStrategies")
      .filter((q) => q.eq(q.field("businessId"), args.businessId))
      .collect()
  },
})

export const upsert = mutation({
  args: {
    businessId: v.id("businesses"),
    prospectId: v.id("prospects"),
    suggestedChannel: v.string(),
    messageTemplate: v.string(),
    followUpSequence: v.array(
      v.object({ day: v.number(), channel: v.string(), message: v.string() })
    ),
    positiveResponseStrategy: v.string(),
    negativeResponseStrategy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("salesStrategies")
      .withIndex("by_prospect", (q) => q.eq("prospectId", args.prospectId))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, args)
      return existing._id
    }
    return await ctx.db.insert("salesStrategies", args)
  },
})
