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

  private async getAdAccountId(): Promise<string> {
    const accountId = this.requireAccountId()
    const res = await pipedreamProxy(
      accountId,
      "https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status"
    ) as { data: { id: string; name: string; account_status: number }[] }

    const active = res.data?.find((a) => a.account_status === 1) ?? res.data?.[0]
    if (!active) throw new Error("No Meta ad account found. Create one at business.facebook.com.")
    return active.id
  }

  private async getPageId(): Promise<string> {
    const accountId = this.requireAccountId()
    const res = await pipedreamProxy(
      accountId,
      "https://graph.facebook.com/v19.0/me/accounts?fields=id,name"
    ) as { data: { id: string; name: string }[] }

    if (!res.data?.length) throw new Error("No Facebook Page found. Create one at facebook.com/pages/create.")
    return res.data[0].id
  }

  private mapObjective(objective: string): string {
    const map: Record<string, string> = {
      awareness: "OUTCOME_AWARENESS",
      traffic: "OUTCOME_TRAFFIC",
      engagement: "OUTCOME_ENGAGEMENT",
      leads: "OUTCOME_LEADS",
      sales: "OUTCOME_SALES",
      conversions: "OUTCOME_SALES",
      app_promotion: "OUTCOME_APP_PROMOTION",
    }
    return map[objective.toLowerCase()] ?? "OUTCOME_TRAFFIC"
  }

  private mapCta(cta: string): string {
    const map: Record<string, string> = {
      "learn more": "LEARN_MORE",
      "shop now": "SHOP_NOW",
      "sign up": "SIGN_UP",
      "get offer": "GET_OFFER",
      "book now": "BOOK_NOW",
      "contact us": "CONTACT_US",
      "download": "DOWNLOAD",
      "subscribe": "SUBSCRIBE",
    }
    return map[cta.toLowerCase()] ?? "LEARN_MORE"
  }

  async createCampaign(config: CampaignConfig): Promise<PlatformCampaign> {
    const accountId = this.requireAccountId()
    const adAccountId = await this.getAdAccountId()
    const pageId = await this.getPageId()

    // 1. Create campaign
    const campaignRes = await pipedreamProxy(
      accountId,
      `https://graph.facebook.com/v19.0/${adAccountId}/campaigns`,
      {
        method: "POST",
        body: {
          name: config.name,
          objective: this.mapObjective(config.objective),
          status: "PAUSED",
          special_ad_categories: [],
        },
      }
    ) as { id: string }

    if (!campaignRes.id) throw new Error("Failed to create Meta campaign")
    const metaCampaignId = campaignRes.id

    // 2. Create ad set with targeting + budget
    const adSetRes = await pipedreamProxy(
      accountId,
      `https://graph.facebook.com/v19.0/${adAccountId}/adsets`,
      {
        method: "POST",
        body: {
          campaign_id: metaCampaignId,
          name: `${config.name} — Ad Set`,
          daily_budget: Math.round(config.budget * 100), // cents
          billing_event: "IMPRESSIONS",
          optimization_goal: "LINK_CLICKS",
          bid_strategy: "LOWEST_COST_WITHOUT_CAP",
          targeting: Object.keys(config.targeting).length > 0
            ? config.targeting
            : { geo_locations: { countries: ["US"] }, age_min: 18, age_max: 65 },
          status: "PAUSED",
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      }
    ) as { id: string }

    if (!adSetRes.id) throw new Error("Failed to create Meta ad set")

    // 3. Create ad creative + ad for the first creative
    const creative = config.creatives[0]
    if (creative) {
      const creativeRes = await pipedreamProxy(
        accountId,
        `https://graph.facebook.com/v19.0/${adAccountId}/adcreatives`,
        {
          method: "POST",
          body: {
            name: `${config.name} — Creative`,
            object_story_spec: {
              page_id: pageId,
              link_data: {
                message: creative.copy,
                name: creative.headline,
                call_to_action: { type: this.mapCta(creative.cta) },
                ...(creative.imageUrl ? { image_url: creative.imageUrl } : {}),
              },
            },
          },
        }
      ) as { id: string }

      if (creativeRes.id) {
        await pipedreamProxy(
          accountId,
          `https://graph.facebook.com/v19.0/${adAccountId}/ads`,
          {
            method: "POST",
            body: {
              adset_id: adSetRes.id,
              creative: { creative_id: creativeRes.id },
              name: `${config.name} — Ad`,
              status: "PAUSED",
            },
          }
        )
      }
    }

    return {
      id: metaCampaignId,
      name: config.name,
      status: "paused",
      budget: config.budget,
    }
  }

  async updateCampaign(id: string, changes: Partial<CampaignConfig>): Promise<void> {
    const accountId = this.requireAccountId()
    const updates: Record<string, unknown> = {}
    if (changes.name) updates.name = changes.name
    if (changes.objective) updates.objective = this.mapObjective(changes.objective)

    if (Object.keys(updates).length > 0) {
      await pipedreamProxy(accountId, `https://graph.facebook.com/v19.0/${id}`, {
        method: "POST",
        body: updates,
      })
    }
  }

  async pauseCampaign(id: string): Promise<void> {
    const accountId = this.requireAccountId()
    await pipedreamProxy(accountId, `https://graph.facebook.com/v19.0/${id}`, {
      method: "POST",
      body: { status: "PAUSED" },
    })
  }
}
