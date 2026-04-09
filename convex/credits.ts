import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const getBalance = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const balance = await ctx.db
      .query("creditBalances")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first()

    if (!balance) {
      return { messageCredits: 0, creativeCredits: 0, channelCredits: 0 }
    }

    return {
      messageCredits: balance.messageCredits,
      creativeCredits: balance.creativeCredits,
      channelCredits: balance.channelCredits,
    }
  },
})

export const deductMessage = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const balance = await ctx.db
      .query("creditBalances")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first()

    if (!balance || balance.messageCredits <= 0) return false

    await ctx.db.patch(balance._id, {
      messageCredits: balance.messageCredits - 1,
    })
    return true
  },
})

export const deductCreatives = mutation({
  args: { businessId: v.id("businesses"), count: v.number() },
  handler: async (ctx, args) => {
    const balance = await ctx.db
      .query("creditBalances")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first()

    if (!balance || balance.creativeCredits < args.count) return false

    await ctx.db.patch(balance._id, {
      creativeCredits: balance.creativeCredits - args.count,
    })
    return true
  },
})

export const addCredits = mutation({
  args: {
    businessId: v.id("businesses"),
    messageCredits: v.number(),
    creativeCredits: v.number(),
    channelCredits: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("creditBalances")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        messageCredits: existing.messageCredits + args.messageCredits,
        creativeCredits: existing.creativeCredits + args.creativeCredits,
        channelCredits: existing.channelCredits + args.channelCredits,
      })
    } else {
      await ctx.db.insert("creditBalances", {
        businessId: args.businessId,
        messageCredits: args.messageCredits,
        creativeCredits: args.creativeCredits,
        channelCredits: args.channelCredits,
      })
    }
  },
})
