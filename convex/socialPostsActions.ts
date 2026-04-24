// @ts-nocheck — Convex typechecks this at deploy; skip Next.js checking
"use node"

import { action } from "./_generated/server"
import { v } from "convex/values"
import { api } from "./_generated/api"
import type { Id } from "./_generated/dataModel"

// Node-runtime actions that actually call the Meta Graph API. The mutations
// and queries live in socialPosts.ts (V8 runtime) — they can't coexist here.

// Entry point from chat UI / AI tool: create a draft post from an existing
// creative and either publish immediately (scheduleAt undefined) or schedule.
export const startFromCreative = action({
  args: {
    businessId: v.id("businesses"),
    creativeId: v.id("adCreatives"),
    platform: v.union(v.literal("facebook"), v.literal("instagram")),
    caption: v.optional(v.string()),
    scheduleAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const creative = await ctx.runQuery(api.adCreatives.get, {
      id: args.creativeId,
    })
    if (!creative) throw new Error("Creative not found")

    const postId = await ctx.runMutation(api.socialPosts.create, {
      businessId: args.businessId,
      creativeId: args.creativeId,
      platform: args.platform,
      caption: args.caption ?? creative.copy,
      imageStorageId: creative.imageStorageId,
    })

    if (args.scheduleAt && args.scheduleAt > Date.now()) {
      await ctx.runMutation(api.socialPosts.schedule, {
        postId,
        scheduledAt: args.scheduleAt,
      })
      return {
        postId,
        status: "scheduled" as const,
        scheduledAt: args.scheduleAt,
      }
    }

    const result = await ctx.runAction(api.socialPostsActions.publishNow, { postId })
    return { postId, ...result }
  },
})

// The actual publish path — resolves image URL, calls MetaIntegration, and
// patches the row with the outcome. Safe to call from scheduler.runAt.
export const publishNow = action({
  args: { postId: v.id("socialPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.runQuery(api.socialPosts.get, { id: args.postId })
    if (!post) throw new Error("Post not found")
    if (post.status === "published") {
      return { status: "published" as const, platformPostId: post.platformPostId, permalink: post.permalink }
    }

    await ctx.runMutation(api.socialPosts._markPublishing, { postId: args.postId })

    try {
      const business = await ctx.runQuery(api.businesses.get, {
        id: post.businessId as Id<"businesses">,
      })
      if (!business) throw new Error("Business not found")

      const targetId =
        post.platform === "facebook"
          ? business.defaultFacebookPageId
          : business.defaultInstagramUserId
      if (!targetId) {
        throw new Error(
          post.platform === "facebook"
            ? "No default Facebook Page selected — ask the user to pick one in chat."
            : "No default Instagram account selected — ask the user to pick one in chat."
        )
      }

      if (!post.imageStorageId) throw new Error("Post has no image attached")
      const imageUrl = await ctx.storage.getUrl(post.imageStorageId)
      if (!imageUrl) throw new Error("Could not resolve image URL from storage")

      const channels = await ctx.runQuery(api.channels.listByBusiness, {
        businessId: post.businessId as Id<"businesses">,
      })
      const meta = channels.find((c: { platform: string; status: string }) =>
        c.platform === "meta" && c.status === "active"
      )
      if (!meta) throw new Error("Meta isn't connected — connect it in Settings.")

      const { MetaIntegration } = await import("../src/lib/integrations/meta")
      const integration = new MetaIntegration(meta.oauthAccessToken)

      const result =
        post.platform === "facebook"
          ? await integration.publishFacebookPhoto(targetId, imageUrl, post.caption)
          : await integration.publishInstagramPhoto(targetId, imageUrl, post.caption)

      await ctx.runMutation(api.socialPosts._markPublished, {
        postId: args.postId,
        platformPostId: result.postId,
        permalink: result.permalink,
      })
      return { status: "published" as const, platformPostId: result.postId, permalink: result.permalink }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await ctx.runMutation(api.socialPosts._markFailed, {
        postId: args.postId,
        error: message,
      })
      return { status: "failed" as const, error: message }
    }
  },
})

// Lookup helper used by the AI when neither default is set yet — returns the
// list of Pages and their linked IG Business accounts so the user can pick.
export const listMetaTargets = action({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const channels = await ctx.runQuery(api.channels.listByBusiness, {
      businessId: args.businessId,
    })
    const meta = channels.find((c: { platform: string; status: string }) =>
      c.platform === "meta" && c.status === "active"
    )
    if (!meta) return { error: "Meta isn't connected yet." }

    const { MetaIntegration } = await import("../src/lib/integrations/meta")
    const integration = new MetaIntegration(meta.oauthAccessToken)
    try {
      const targets = await integration.listPagesAndIgAccounts()
      return { targets }
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) }
    }
  },
})
