export type PlatformType =
  | "meta"
  | "google"
  | "klaviyo"
  | "ga4"
  | "tiktok"
  | "linkedin"
  | "shopify"
  | "buffer"

export interface OAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

export interface DateRange {
  start: string
  end: string
}

export interface PlatformCampaign {
  id: string
  name: string
  status: "active" | "paused" | "completed"
  budget?: number
  spend?: number
  impressions?: number
  clicks?: number
  conversions?: number
}

export interface PlatformAnalytics {
  impressions: number
  clicks: number
  spend: number
  conversions: number
  ctr: number
  cpc: number
  cpa: number
  roas: number
}

export interface PlatformAudience {
  id: string
  name: string
  size: number
  description?: string
}

export interface CampaignConfig {
  name: string
  objective: string
  budget: number
  targeting: Record<string, unknown>
  creatives: {
    headline: string
    copy: string
    cta: string
    imageUrl?: string
  }[]
}

export interface IntegrationPlugin {
  platform: PlatformType

  // OAuth
  getAuthUrl(redirectUri: string): string
  handleCallback(code: string): Promise<OAuthTokens>
  refreshToken(refreshToken: string): Promise<OAuthTokens>

  // Read
  getCampaigns(): Promise<PlatformCampaign[]>
  getAnalytics(dateRange: DateRange): Promise<PlatformAnalytics>
  getAudiences(): Promise<PlatformAudience[]>

  // Write
  createCampaign(config: CampaignConfig): Promise<PlatformCampaign>
  updateCampaign(
    id: string,
    changes: Partial<CampaignConfig>
  ): Promise<void>
  pauseCampaign(id: string): Promise<void>
}
