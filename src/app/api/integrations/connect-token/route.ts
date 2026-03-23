import { auth } from "@clerk/nextjs/server"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { PipedreamClient } from "@pipedream/sdk/server"

// Creates a short-lived Pipedream Connect token for the current user.
// The frontend passes this token to @pipedream/sdk/browser to open the Connect
// popup, so users can link their ad accounts via Pipedream's own OAuth apps.
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
    const pd = new PipedreamClient({ projectId, projectEnvironment, clientId, clientSecret })

    // Derive the request origin so Pipedream allows the Connect iframe to load
    // from this host. Without allowedOrigins the iframe is rejected.
    const hdrs = await headers()
    const origin = hdrs.get("origin") ?? hdrs.get("referer")
    const allowedOrigins: string[] = []
    if (origin) {
      try {
        const url = new URL(origin)
        allowedOrigins.push(url.origin)
      } catch { /* ignore malformed */ }
    }

    // Parse any extra origins from the environment (JSON array or comma-separated)
    const envOrigins = process.env.PIPEDREAM_ALLOWED_ORIGINS
    if (envOrigins) {
      try {
        const parsed = JSON.parse(envOrigins)
        if (Array.isArray(parsed)) allowedOrigins.push(...parsed)
      } catch {
        allowedOrigins.push(...envOrigins.split(",").map((s: string) => s.trim()))
      }
    }

    const result = await pd.tokens.create({
      externalUserId: userId,
      ...(allowedOrigins.length > 0 && { allowedOrigins }),
    })

    return NextResponse.json({
      token: result.token,
      expiresAt: result.expiresAt,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Pipedream connect-token error:", msg)
    return NextResponse.json({ error: `Pipedream error: ${msg}` }, { status: 502 })
  }
}
