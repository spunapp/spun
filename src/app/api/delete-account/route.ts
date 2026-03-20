import { auth, clerkClient } from "@clerk/nextjs/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "../../../../convex/_generated/api"
import { NextResponse } from "next/server"

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Delete all Convex data for this user (best-effort — may not be deployed yet)
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (convexUrl) {
    try {
      const convex = new ConvexHttpClient(convexUrl)
      await convex.mutation(api.businesses.deleteAccount, { userId })
    } catch {
      // Non-fatal: proceed with Clerk deletion even if Convex cleanup fails
    }
  }

  // Delete the user from Clerk (also clears their account ID metadata)
  const client = await clerkClient()
  await client.users.deleteUser(userId)

  return NextResponse.json({ success: true })
}
