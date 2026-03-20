import { auth } from "@clerk/nextjs/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 })
    }
    if (userId !== "user_3B7vr8q1wMtbFp1Gec4APgtUQFZ") {
      return NextResponse.json({ error: "Not authorised" }, { status: 403 })
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) {
      return NextResponse.json({ error: "Convex not configured" }, { status: 500 })
    }

    const convex = new ConvexHttpClient(convexUrl)

    // Create organisation with account ID 00001
    let organisationId: string | undefined
    try {
      organisationId = await convex.mutation(api.organisations.create, {
        name: "Spun",
        userId,
      })
    } catch {
      // Org may already exist — continue without it
    }

    // Create the business
    const businessId = await convex.mutation(api.businesses.create, {
      userId,
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
    })

    return NextResponse.json({ status: "created", businessId, organisationId })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
