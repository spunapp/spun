import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const getCurrentUsage = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const ledger = await ctx.db
      .query("usageLedger")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .first()

    if (!ledger) {
      return {
        campaignsLaunched: 0,
        creativesGenerated: 0,
        channelsConnected: 0,
        aiResponsesSent: 0,
      }
    }

    return {
      campaignsLaunched: ledger.campaignsLaunched,
      creativesGenerated: ledger.creativesGenerated,
      channelsConnected: ledger.channelsConnected,
      aiResponsesSent: ledger.aiResponsesSent,
    }
  },
})

export const getOrCreateLedger = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const now = new Date()
    const cycleStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`

    const existing = await ctx.db
      .query("usageLedger")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .first()

    if (existing && existing.billingCycleStart === cycleStart) {
      return existing._id
    }

    return await ctx.db.insert("usageLedger", {
      businessId: args.businessId,
      billingCycleStart: cycleStart,
      campaignsLaunched: 0,
      creativesGenerated: 0,
      channelsConnected: 0,
      aiResponsesSent: 0,
    })
  },
})

export const incrementCampaigns = mutation({
  args: { ledgerId: v.id("usageLedger") },
  handler: async (ctx, args) => {
    const ledger = await ctx.db.get(args.ledgerId)
    if (!ledger) return
    await ctx.db.patch(args.ledgerId, {
      campaignsLaunched: ledger.campaignsLaunched + 1,
    })
  },
})

export const incrementCreatives = mutation({
  args: { ledgerId: v.id("usageLedger"), count: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const ledger = await ctx.db.get(args.ledgerId)
    if (!ledger) return
    await ctx.db.patch(args.ledgerId, {
      creativesGenerated: ledger.creativesGenerated + (args.count ?? 1),
    })
  },
})

export const incrementChannels = mutation({
  args: { ledgerId: v.id("usageLedger") },
  handler: async (ctx, args) => {
    const ledger = await ctx.db.get(args.ledgerId)
    if (!ledger) return
    await ctx.db.patch(args.ledgerId, {
      channelsConnected: ledger.channelsConnected + 1,
    })
  },
})

export const incrementAiResponses = mutation({
  args: { ledgerId: v.id("usageLedger") },
  handler: async (ctx, args) => {
    const ledger = await ctx.db.get(args.ledgerId)
    if (!ledger) return
    await ctx.db.patch(args.ledgerId, {
      aiResponsesSent: ledger.aiResponsesSent + 1,
    })
  },
})
