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

    // Build the list of allowed origins for the Connect iframe.
    // Pipedream REQUIRES allowedOrigins for browser-based token usage — without
    // it the iframe shows "session expired".
    const allowedOrigins = new Set<string>()

    // 1. Try Origin / Referer headers from the request
    const hdrs = await headers()
    for (const headerName of ["origin", "referer"]) {
      const val = hdrs.get(headerName)
      if (val) {
        try { allowedOrigins.add(new URL(val).origin) } catch { /* ignore */ }
      }
    }

    // 2. Reconstruct origin from Host / X-Forwarded-Host (works on Vercel)
    const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host")
    const proto = hdrs.get("x-forwarded-proto") ?? "https"
    if (host) {
      allowedOrigins.add(`${proto}://${host}`)
    }

    // 3. Vercel auto-sets VERCEL_URL (e.g. "my-app-abc123.vercel.app")
    if (process.env.VERCEL_URL) {
      allowedOrigins.add(`https://${process.env.VERCEL_URL}`)
    }
    // Vercel also sets VERCEL_PROJECT_PRODUCTION_URL for the production domain
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      allowedOrigins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
    }

    // 4. Parse any extra origins from the environment (JSON array or comma-separated)
    const envOrigins = process.env.PIPEDREAM_ALLOWED_ORIGINS
    if (envOrigins) {
      try {
        const parsed = JSON.parse(envOrigins)
        if (Array.isArray(parsed)) parsed.forEach((o: string) => allowedOrigins.add(o))
      } catch {
        envOrigins.split(",").forEach((s) => allowedOrigins.add(s.trim()))
      }
    }

    const originsArray = [...allowedOrigins].filter(Boolean)

    console.log("[Pipedream] Creating token:", {
      projectId,
      projectEnvironment,
      externalUserId: userId,
      allowedOrigins: originsArray,
      clientIdPrefix: clientId.slice(0, 6) + "...",
    })

    const result = await pd.tokens.create({
      externalUserId: userId,
      ...(originsArray.length > 0 && { allowedOrigins: originsArray }),
    })

    console.log("[Pipedream] Token created successfully:", {
      tokenPrefix: result.token.slice(0, 10) + "...",
      expiresAt: result.expiresAt,
      connectLinkUrl: result.connectLinkUrl,
    })

    return NextResponse.json({
      token: result.token,
      expiresAt: result.expiresAt,
      connectLinkUrl: result.connectLinkUrl,
      // Include debug info so we can diagnose in browser console
      _debug: {
        environment: projectEnvironment,
        allowedOrigins: originsArray,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("Pipedream connect-token error:", msg)
    return NextResponse.json({ error: `Pipedream error: ${msg}` }, { status: 502 })
  }
}
