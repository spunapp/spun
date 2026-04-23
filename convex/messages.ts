import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    messageType: v.union(
      v.literal("text"),
      v.literal("strategy"),
      v.literal("campaign_preview"),
      v.literal("analytics"),
      v.literal("creative_gallery"),
      v.literal("approval_request"),
      v.literal("status_update"),
      v.literal("onboarding"),
      v.literal("connect_prompt"),
      v.literal("meta_setup_guide"),
      v.literal("google_ads_setup_guide"),
      v.literal("ga4_setup_guide"),
      v.literal("gbp_audit")
    ),
    metadata: v.optional(v.any()),
    linkedActionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", args)
  },
})

export const updateMetadata = mutation({
  args: {
    id: v.id("messages"),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { metadata: args.metadata })
  },
})

export const getByConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect()
  },
})
