import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { PipedreamClient } from "@pipedream/sdk/server"

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

  // Include the requesting origin so Pipedream's iframe can post messages
  // back to this page correctly.
  const origin = request.headers.get("origin") ?? ""

  try {
    // PipedreamClient handles the OAuth client-credentials exchange
    // (POST /v1/oauth/token → Bearer token) before calling the tokens API.
    const pd = new PipedreamClient({ projectId, clientId, clientSecret })
    const result = await pd.tokens.create({
      externalUserId: userId,
      ...(origin ? { allowedOrigins: [origin] } : {}),
    })

    return NextResponse.json({ token: result.token, expiresAt: result.expiresAt })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Pipedream token creation failed:", msg)
    return NextResponse.json({ error: `Pipedream error: ${msg}` }, { status: 502 })
  }
}
