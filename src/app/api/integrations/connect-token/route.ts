import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { PipedreamClient } from "@pipedream/sdk/server"

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
  const projectEnvironment =
    (process.env.PIPEDREAM_PROJECT_ENVIRONMENT as "development" | "production" | undefined) ?? "production"

  if (!projectId || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Pipedream credentials not configured. Set PIPEDREAM_PROJECT_ID, PIPEDREAM_CLIENT_ID, PIPEDREAM_CLIENT_SECRET." },
      { status: 500 }
    )
  }

  try {
    // Use the official SDK client — it handles the OAuth client-credentials
    // exchange (POST /v1/oauth/token → Bearer token) automatically.
    const pd = new PipedreamClient({ projectId, projectEnvironment, clientId, clientSecret })
    const result = await pd.tokens.create({ externalUserId: userId })
    console.log("Pipedream token created:", { token: result.token, connectLinkUrl: result.connectLinkUrl })
    return NextResponse.json({ token: result.token, expiresAt: result.expiresAt, connectLinkUrl: result.connectLinkUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Pipedream connect-token error:", msg)
    return NextResponse.json({ error: `Pipedream error: ${msg}` }, { status: 502 })
  }
}
