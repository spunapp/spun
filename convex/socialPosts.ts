// @ts-nocheck — Convex typechecks this at deploy; skip Next.js checking
"use node"

import { action, mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { api } from "./_generated/api"
import type { Id } from "./_generated/dataModel"

// Organic social publishing queue. Posts are created as drafts when the user
// picks a creative to publish, then either run through publishNow immediately
// or scheduled via ctx.scheduler.runAt.

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    creativeId: v.optional(v.id("adCreatives")),
    platform: v.union(v.literal("facebook"), v.literal("instagram")),
    caption: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("socialPosts", {
      ...args,
      status: "draft",
    })
  },
})

export const schedule = mutation({
  args: {
    postId: v.id("socialPosts"),
    scheduledAt: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.scheduledAt <= Date.now()) {
      throw new Error("scheduledAt must be in the future")
    }
    const jobId = await ctx.scheduler.runAt(
      args.scheduledAt,
      api.socialPosts.publishNow,
      { postId: args.postId }
    )
    await ctx.db.patch(args.postId, {
      status: "scheduled",
      scheduledAt: args.scheduledAt,
      scheduledJobId: jobId,
    })
  },
})

export const cancel = mutation({
  args: { postId: v.id("socialPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId)
    if (!post) return
    if (post.scheduledJobId) {
      try {
        await ctx.scheduler.cancel(post.scheduledJobId)
      } catch {
        // scheduled job may have already run; ignore
      }
    }
    await ctx.db.patch(args.postId, {
      status: "draft",
      scheduledAt: undefined,
      scheduledJobId: undefined,
    })
  },
})

export const listByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("socialPosts")
      .withIndex("by_business", (q) => q.eq("businessId", args.businessId))
      .order("desc")
      .collect()
  },
})

export const get = query({
  args: { id: v.id("socialPosts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

// Patches used by publishNow — exposed as internal-looking mutations that
// the action calls via runMutation. Keep them tiny.

export const _markPublishing = mutation({
  args: { postId: v.id("socialPosts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, { status: "publishing" })
  },
})

export const _markPublished = mutation({
  args: {
    postId: v.id("socialPosts"),
    platformPostId: v.string(),
    permalink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, {
      status: "published",
      publishedAt: Date.now(),
      platformPostId: args.platformPostId,
      permalink: args.permalink,
      error: undefined,
    })
  },
})

export const _markFailed = mutation({
  args: { postId: v.id("socialPosts"), error: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.postId, {
      status: "failed",
      error: args.error,
    })
  },
})

// Entry point from chat UI / AI tool: create a draft post from an existing
// creative and either publish immediately (scheduleAt undefined) or schedule.
// Returns the post record id plus a best-effort result preview.
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

    const result = await ctx.runAction(api.socialPosts.publishNow, { postId })
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

// Persists the page/IG selections onto the business so we only ask once.
export const setDefaultTargets = mutation({
  args: {
    businessId: v.id("businesses"),
    facebookPageId: v.optional(v.string()),
    instagramUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, string> = {}
    if (args.facebookPageId) patch.defaultFacebookPageId = args.facebookPageId
    if (args.instagramUserId) patch.defaultInstagramUserId = args.instagramUserId
    if (Object.keys(patch).length === 0) return
    await ctx.db.patch(args.businessId, patch)
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
