import { mutation, query } from "./_generated/server"
import { v, ConvexError } from "convex/values"

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      return await ctx.storage.generateUploadUrl()
    } catch (e) {
      throw new ConvexError(
        `Storage error: ${e instanceof Error ? e.message : String(e)}`
      )
    }
  },
})

export const save = mutation({
  args: {
    businessId: v.id("businesses"),
    userId: v.string(),
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.union(
      v.literal("images"),
      v.literal("videos"),
      v.literal("documents"),
      v.literal("audio")
    ),
    size: v.number(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("brandAssets", {
      ...args,
      addedAt: Date.now(),
    })
  },
})

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("brandAssets")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect()

    return Promise.all(
      assets.map(async (asset) => ({
        ...asset,
        url: await ctx.storage.getUrl(asset.storageId),
      }))
    )
  },
})

export const listRaw = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("brandAssets")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect()
  },
})

export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId)
  },
})

export const remove = mutation({
  args: { id: v.id("brandAssets"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId)
    await ctx.db.delete(args.id)
  },
})
