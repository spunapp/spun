import type {
  IntegrationPlugin,
  OAuthTokens,
  PlatformCampaign,
  PlatformAnalytics,
  PlatformAudience,
  CampaignConfig,
  DateRange,
} from "./types"
import { pipedreamProxy } from "./pipedream"

// Meta Marketing API integration via Pipedream Connect.
// The pipedreamAccountId is stored in connectedChannels.oauthAccessToken after
// the user connects through the Pipedream popup in Settings.
// Pipedream holds the actual OAuth tokens and proxies requests to Meta's API.

export class MetaIntegration implements IntegrationPlugin {
  platform = "meta" as const
  private pipedreamAccountId: string | null = null

  constructor(pipedreamAccountId?: string) {
    this.pipedreamAccountId = pipedreamAccountId ?? null
  }

  // OAuth is handled by Pipedream Connect popup — these methods are not used.
  getAuthUrl(_redirectUri: string): string {
    throw new Error("Meta OAuth is handled by Pipedream Connect. Use the Settings connect button.")
  }

  async handleCallback(_code: string): Promise<OAuthTokens> {
    throw new Error("Meta OAuth is handled by Pipedream Connect.")
  }

  async refreshToken(_refreshToken: string): Promise<OAuthTokens> {
    // Pipedream manages token refresh automatically.
    throw new Error("Meta token refresh is managed by Pipedream.")
  }

  private requireAccountId(): string {
    if (!this.pipedreamAccountId) {
      throw new Error("Meta account not connected. Connect via Settings first.")
    }
    return this.pipedreamAccountId
  }

  async getCampaigns(): Promise<PlatformCampaign[]> {
    const accountId = this.requireAccountId()

    // First fetch ad accounts for this user
    const adAccountsRes = await pipedreamProxy(accountId, "https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name") as {
      data: { id: string; name: string }[]
    }

    if (!adAccountsRes.data?.length) return []

    const adAccountId = adAccountsRes.data[0].id // use first ad account

    const campaignsRes = await pipedreamProxy(
      accountId,
      `https://graph.facebook.com/v19.0/${adAccountId}/campaigns?fields=id,name,status,daily_budget,lifetime_budget`
    ) as { data: { id: string; name: string; status: string; daily_budget?: string; lifetime_budget?: string }[] }

    return (campaignsRes.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status === "ACTIVE" ? "active" : c.status === "PAUSED" ? "paused" : "completed",
      budget: c.daily_budget ? parseInt(c.daily_budget) / 100 : undefined,
    }))
  }

  async getAnalytics(dateRange: DateRange): Promise<PlatformAnalytics> {
    const accountId = this.requireAccountId()

    const adAccountsRes = await pipedreamProxy(accountId, "https://graph.facebook.com/v19.0/me/adaccounts?fields=id") as {
      data: { id: string }[]
    }

    if (!adAccountsRes.data?.length) {
      return { impressions: 0, clicks: 0, spend: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, roas: 0 }
    }

    const adAccountId = adAccountsRes.data[0].id

    const insightsRes = await pipedreamProxy(
      accountId,
      `https://graph.facebook.com/v19.0/${adAccountId}/insights?fields=impressions,clicks,spend,actions,ctr,cpc&time_range={"since":"${dateRange.start}","until":"${dateRange.end}"}`
    ) as { data: { impressions?: string; clicks?: string; spend?: string; ctr?: string; cpc?: string; actions?: { action_type: string; value: string }[] }[] }

    const row = insightsRes.data?.[0]
    if (!row) {
      return { impressions: 0, clicks: 0, spend: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, roas: 0 }
    }

    const conversions = row.actions?.find((a) => a.action_type === "purchase")
    const spend = parseFloat(row.spend ?? "0")
    const conversionCount = conversions ? parseInt(conversions.value) : 0

    return {
      impressions: parseInt(row.impressions ?? "0"),
      clicks: parseInt(row.clicks ?? "0"),
      spend,
      conversions: conversionCount,
      ctr: parseFloat(row.ctr ?? "0"),
      cpc: parseFloat(row.cpc ?? "0"),
      cpa: conversionCount > 0 ? spend / conversionCount : 0,
      roas: 0, // requires revenue data not available from insights alone
    }
  }

  async getAudiences(): Promise<PlatformAudience[]> {
    const accountId = this.requireAccountId()

    const adAccountsRes = await pipedreamProxy(accountId, "https://graph.facebook.com/v19.0/me/adaccounts?fields=id") as {
      data: { id: string }[]
    }

    if (!adAccountsRes.data?.length) return []

    const adAccountId = adAccountsRes.data[0].id

    const audiencesRes = await pipedreamProxy(
      accountId,
      `https://graph.facebook.com/v19.0/${adAccountId}/customaudiences?fields=id,name,approximate_count,description`
    ) as { data: { id: string; name: string; approximate_count?: number; description?: string }[] }

    return (audiencesRes.data ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      size: a.approximate_count ?? 0,
      description: a.description,
    }))
  }

  async createCampaign(_config: CampaignConfig): Promise<PlatformCampaign> {
    // TODO: Implement Meta campaign creation via Pipedream proxy
    throw new Error("Meta campaign creation not yet implemented")
  }

  async updateCampaign(_id: string, _changes: Partial<CampaignConfig>): Promise<void> {
    // TODO: Implement Meta campaign update via Pipedream proxy
  }

  async pauseCampaign(_id: string): Promise<void> {
    // TODO: Implement Meta campaign pause via Pipedream proxy
  }
}
