import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

async function nextAccountId(ctx: any): Promise<string> {
  const all = await ctx.db.query("organisations").collect()
  const next = all.length + 1
  return String(next).padStart(5, "0")
}

export const get = query({
  args: { id: v.id("organisations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organisations")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first()
  },
})

export const getByBusiness = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.businessId)
    if (!business?.organisationId) return null
    return await ctx.db.get(business.organisationId)
  },
})

// Find or create an organisation by name, then link it to a business.
// Call this when a user tells us the name of their business.
export const linkOrCreateOrganisation = mutation({
  args: {
    businessId: v.id("businesses"),
    organisationName: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    let org = await ctx.db
      .query("organisations")
      .withIndex("by_name", (q) => q.eq("name", args.organisationName))
      .first()

    if (!org) {
      const accountId = await nextAccountId(ctx)
      const orgId = await ctx.db.insert("organisations", {
        name: args.organisationName,
        accountId,
        createdByUserId: args.userId,
        createdAt: Date.now(),
      })
      org = await ctx.db.get(orgId)
    }

    await ctx.db.patch(args.businessId, { organisationId: org!._id })

    return org
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("organisations")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first()

    if (existing) {
      return existing._id
    }

    const accountId = await nextAccountId(ctx)
    return await ctx.db.insert("organisations", {
      name: args.name,
      accountId,
      createdByUserId: args.userId,
      createdAt: Date.now(),
    })
  },
})
