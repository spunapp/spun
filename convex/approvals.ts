import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const listPending = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("approvalQueue")
      .withIndex("by_business_pending", (q) =>
        q.eq("businessId", args.businessId).eq("status", "pending")
      )
      .order("desc")
      .collect()
  },
})

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    conversationId: v.id("conversations"),
    messageId: v.id("messages"),
    actionType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("approvalQueue", {
      ...args,
      status: "pending",
    })
  },
})

export const approve = mutation({
  args: { id: v.id("approvalQueue") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "approved",
      resolvedAt: Date.now(),
    })
    return await ctx.db.get(args.id)
  },
})

export const reject = mutation({
  args: { id: v.id("approvalQueue") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "rejected",
      resolvedAt: Date.now(),
    })
  },
})
