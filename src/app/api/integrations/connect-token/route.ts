import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Creates a short-lived Pipedream Connect token for the current user.
// The frontend passes this token to @pipedream/sdk to open the Connect popup,
// so users can link their ad accounts via Pipedream's own approved OAuth apps.
export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const projectId = process.env.PIPEDREAM_PROJECT_ID
  const clientId = process.env.PIPEDREAM_CLIENT_ID
  const clientSecret = process.env.PIPEDREAM_CLIENT_SECRET

  if (!projectId || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Pipedream credentials not configured" },
      { status: 500 }
    )
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch(
    `https://api.pipedream.com/v1/connect/${projectId}/tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ external_user_id: userId }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error("Pipedream token creation failed:", error)
    return NextResponse.json(
      { error: "Failed to create connect token" },
      { status: 502 }
    )
  }

  const data = await response.json()
  return NextResponse.json({ token: data.token, expiresAt: data.expires_at, connectLinkUrl: data.connect_link_url })
}
