import { mutation } from "./_generated/server"
import { v } from "convex/values"

/**
 * One-time seed: creates a business + organisation for a given user.
 *
 * Usage:
 *   npx convex run seed:createBusiness '{"userId":"user_XXXX"}'
 *
 * Get your userId from: https://dashboard.clerk.com → Users → click your account
 */
export const createBusiness = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Check if business already exists
    const existing = await ctx.db
      .query("businesses")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first()
    if (existing) {
      return { status: "already_exists", businessId: existing._id }
    }

    // Create the organisation with accountId 00001
    let org = await ctx.db
      .query("organisations")
      .withIndex("by_name", (q) => q.eq("name", "Spun"))
      .first()

    if (!org) {
      const orgId = await ctx.db.insert("organisations", {
        name: "Spun",
        accountId: "00001",
        createdByUserId: args.userId,
        createdAt: Date.now(),
      })
      org = await ctx.db.get(orgId)
    }

    // Create the business
    const businessId = await ctx.db.insert("businesses", {
      userId: args.userId,
      organisationId: org!._id,
      name: "Spun",
      description: "AI marketing platform for founders",
      productOrService: "service",
      whatTheySell: "AI-powered marketing tools and automation",
      industry: "Technology / SaaS",
      targetAudience: "Startup founders and small business owners",
      demographics: {},
      locations: [],
      competitors: [],
      imageryUrls: [],
      trustMode: "draft",
      onboardingComplete: true,
    })

    return { status: "created", businessId, organisationId: org!._id }
  },
})
