import type {
  IntegrationPlugin,
  OAuthTokens,
  PlatformCampaign,
  PlatformAnalytics,
  PlatformAudience,
  CampaignConfig,
  DateRange,
} from "./types"

// Klaviyo email marketing API integration

export class KlaviyoIntegration implements IntegrationPlugin {
  platform = "klaviyo" as const

  getAuthUrl(redirectUri: string): string {
    const clientId = process.env.KLAVIYO_CLIENT_ID
    const scopes = encodeURIComponent("campaigns:read campaigns:write lists:read lists:write")

    return `https://www.klaviyo.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`
  }

  async handleCallback(code: string): Promise<OAuthTokens> {
    const response = await fetch("https://a.klaviyo.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.KLAVIYO_CLIENT_ID ?? "",
        client_secret: process.env.KLAVIYO_CLIENT_SECRET ?? "",
        redirect_uri: process.env.KLAVIYO_REDIRECT_URI ?? "",
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
    const response = await fetch("https://a.klaviyo.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.KLAVIYO_CLIENT_ID ?? "",
        client_secret: process.env.KLAVIYO_CLIENT_SECRET ?? "",
      }),
    })

    const data = await response.json()
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    }
  }

  async getCampaigns(): Promise<PlatformCampaign[]> {
    // TODO: GET /api/campaigns
    return []
  }

  async getAnalytics(_dateRange: DateRange): Promise<PlatformAnalytics> {
    // TODO: Klaviyo reporting API
    return { impressions: 0, clicks: 0, spend: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, roas: 0 }
  }

  async getAudiences(): Promise<PlatformAudience[]> {
    // TODO: GET /api/lists
    return []
  }

  async createCampaign(_config: CampaignConfig): Promise<PlatformCampaign> {
    throw new Error("Klaviyo campaign creation not yet implemented")
  }

  async updateCampaign(_id: string, _changes: Partial<CampaignConfig>): Promise<void> {}
  async pauseCampaign(_id: string): Promise<void> {}
}
