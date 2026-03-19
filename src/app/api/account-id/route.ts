import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const client = await clerkClient()
  const user = await client.users.getUser(userId)

  // Return existing account ID if already assigned
  if (user.publicMetadata?.accountId) {
    return NextResponse.json({ accountId: user.publicMetadata.accountId })
  }

  // Assign the next sequential account ID based on how many users already have one
  const { data: allUsers } = await client.users.getUserList({ limit: 500 })
  const assigned = allUsers.filter((u) => u.publicMetadata?.accountId).length
  const accountId = String(assigned + 1).padStart(5, "0")

  await client.users.updateUserMetadata(userId, {
    publicMetadata: { ...user.publicMetadata, accountId },
  })

  return NextResponse.json({ accountId })
}
