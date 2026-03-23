// Pipedream Connect proxy helper.
// After a user connects their account via the Pipedream Connect popup, we store
// the resulting Pipedream account ID. API calls are then proxied through
// Pipedream so we never handle raw OAuth tokens for Meta/Google/etc.

export async function pipedreamProxy(
  pipedreamAccountId: string,
  url: string,
  options: { method?: string; body?: unknown } = {}
): Promise<unknown> {
  const projectId = process.env.PIPEDREAM_PROJECT_ID
  const clientId = process.env.PIPEDREAM_CLIENT_ID
  const clientSecret = process.env.PIPEDREAM_CLIENT_SECRET

  if (!projectId || !clientId || !clientSecret) {
    throw new Error("Pipedream credentials not configured")
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const response = await fetch(
    `https://api.pipedream.com/v1/connect/${projectId}/proxy`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "X-PD-Account-Id": pipedreamAccountId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        method: options.method ?? "GET",
        ...(options.body !== undefined && { body: options.body }),
      }),
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Pipedream proxy error ${response.status}: ${text}`)
  }

  return response.json()
}
