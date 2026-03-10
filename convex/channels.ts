import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const listByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("connectedChannels")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .collect()
  },
})

export const connect = mutation({
  args: {
    businessId: v.id("businesses"),
    platform: v.string(),
    oauthAccessToken: v.string(),
    oauthRefreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    platformAccountId: v.optional(v.string()),
    platformAccountName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("connectedChannels", {
      ...args,
      status: "active",
    })
  },
})

export const disconnect = mutation({
  args: { id: v.id("connectedChannels") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})

export const updateStatus = mutation({
  args: {
    id: v.id("connectedChannels"),
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("error")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status })
  },
})

export const updateTokens = mutation({
  args: {
    id: v.id("connectedChannels"),
    oauthAccessToken: v.string(),
    oauthRefreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...tokens } = args
    await ctx.db.patch(id, { ...tokens, status: "active" })
  },
})
