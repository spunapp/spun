import type {
  IntegrationPlugin,
  OAuthTokens,
  PlatformCampaign,
  PlatformAnalytics,
  PlatformAudience,
  CampaignConfig,
  DateRange,
} from "./types"

// Google Analytics 4 Data API integration
// Read-only — GA4 doesn't support creating campaigns

export class GA4Integration implements IntegrationPlugin {
  platform = "ga4" as const

  getAuthUrl(redirectUri: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const scopes = encodeURIComponent(
      "https://www.googleapis.com/auth/analytics.readonly"
    )

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent`
  }

  async handleCallback(code: string): Promise<OAuthTokens> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI ?? "",
        grant_type: "authorization_code",
      }),
    })

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    }
  }

  async refreshToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        grant_type: "refresh_token",
      }),
    })

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    }
  }

  async getCampaigns(): Promise<PlatformCampaign[]> {
    // GA4 is read-only for analytics — no campaigns
    return []
  }

  async getAnalytics(_dateRange: DateRange): Promise<PlatformAnalytics> {
    // TODO: Implement GA4 Data API
    // POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport
    return { impressions: 0, clicks: 0, spend: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, roas: 0 }
  }

  async getAudiences(): Promise<PlatformAudience[]> {
    return []
  }

  async createCampaign(_config: CampaignConfig): Promise<PlatformCampaign> {
    throw new Error("GA4 is read-only — cannot create campaigns")
  }

  async updateCampaign(_id: string, _changes: Partial<CampaignConfig>): Promise<void> {
    throw new Error("GA4 is read-only")
  }

  async pauseCampaign(_id: string): Promise<void> {
    throw new Error("GA4 is read-only")
  }
}
