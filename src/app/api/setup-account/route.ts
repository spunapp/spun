import { auth } from "@clerk/nextjs/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import { NextResponse } from "next/server"

export async function GET() {
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
  const result = await convex.mutation(api.seed.createBusiness, { userId })
  return NextResponse.json(result)
}
