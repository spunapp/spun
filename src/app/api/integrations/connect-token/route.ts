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

  try {
    // Step 1: Exchange client credentials for a short-lived OAuth access token.
    // Pipedream's Connect tokens API requires Bearer auth — not Basic auth —
    // so we must do the client_credentials grant first.
    const basicCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    const oauthRes = await fetch("https://api.pipedream.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicCredentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ grant_type: "client_credentials" }),
    })
    if (!oauthRes.ok) {
      const err = await oauthRes.text()
      throw new Error(`OAuth exchange failed ${oauthRes.status}: ${err}`)
    }
    const { access_token } = await oauthRes.json()

    // Step 2: Create the short-lived Connect token for this user.
    // Intentionally omit x-pd-environment so Pipedream uses the project's
    // own environment setting (avoids "session expired" mismatches).
    const origin = request.headers.get("origin") ?? ""
    const tokenBody: Record<string, unknown> = { external_user_id: userId }
    if (origin) tokenBody.allowed_origins = [origin]

    const tokenRes = await fetch(
      `https://api.pipedream.com/v1/connect/${projectId}/tokens`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tokenBody),
      }
    )
    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      throw new Error(`Token creation failed ${tokenRes.status}: ${err}`)
    }

    const data = await tokenRes.json()
    return NextResponse.json({ token: data.token, expiresAt: data.expires_at })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Pipedream connect-token error:", msg)
    return NextResponse.json({ error: `Pipedream error: ${msg}` }, { status: 502 })
  }
}
