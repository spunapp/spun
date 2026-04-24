import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const listByCampaign = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("adCreatives")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect()
  },
})

export const get = query({
  args: { id: v.id("adCreatives") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
    campaignId: v.id("campaigns"),
    businessId: v.id("businesses"),
    funnelStage: v.union(v.literal("tof"), v.literal("mof"), v.literal("bof")),
    variant: v.number(),
    format: v.string(),
    headline: v.string(),
    copy: v.string(),
    cta: v.string(),
    htmlContent: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("adCreatives", args)
  },
})

export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId)
  },
})
