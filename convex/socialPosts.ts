import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { api } from "./_generated/api"

// Organic social publishing queue — V8-runtime side (mutations and queries).
// The actions that actually call the Meta API live in socialPostsActions.ts
// because they need the Node runtime for Buffer / imported integrations.

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
      api.socialPostsActions.publishNow,
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

// Patches used by the publish action — small mutations it calls via runMutation.

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
