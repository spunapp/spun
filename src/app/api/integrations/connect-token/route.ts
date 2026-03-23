import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Creates a short-lived Pipedream Connect token for the current user.
// The frontend passes this token to @pipedream/sdk to open the Connect popup,
// so users can link their ad accounts via Pipedream's own approved OAuth apps.
export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const projectId = process.env.PIPEDREAM_PROJECT_ID
  const clientId = process.env.PIPEDREAM_CLIENT_ID
  const clientSecret = process.env.PIPEDREAM_CLIENT_SECRET

  if (!projectId || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Pipedream credentials not configured on server. Set PIPEDREAM_PROJECT_ID, PIPEDREAM_CLIENT_ID, PIPEDREAM_CLIENT_SECRET." },
      { status: 500 }
    )
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  // Include the requesting origin in allowed_origins so Pipedream's iframe
  // can post messages back to this page correctly.
  const origin = request.headers.get("origin") ?? ""
  const body: Record<string, unknown> = { external_user_id: userId }
  if (origin) body.allowed_origins = [origin]

  const response = await fetch(
    `https://api.pipedream.com/v1/connect/${projectId}/tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Pipedream token creation failed:", response.status, errorText)
    // Return the real error to the client so it can be shown in the UI
    return NextResponse.json(
      { error: `Pipedream error ${response.status}: ${errorText}` },
      { status: 502 }
    )
  }

  const data = await response.json()
  return NextResponse.json({ token: data.token, expiresAt: data.expires_at })
}
