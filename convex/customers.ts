import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const listByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect()
  },
})

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    prospectId: v.optional(v.id("prospects")),
    name: v.string(),
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    contractValue: v.number(),
    closeDate: v.string(),
    marketingSpendAttributed: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("customers", args)
  },
})
