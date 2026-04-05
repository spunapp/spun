export type SubscriptionTier = "standard" | "pro"

export interface TierConfig {
  name: string
  priceId: string
  price: number // pence per month
  channels: number
  campaigns: number
  creatives: number
  brands: number
  abTesting: false | "suggested" | "auto"
  autoMode: boolean
  crossChannelAnalytics: boolean
  attribution: boolean
  videoAds: boolean
  blogArticles: boolean
  podcasts: boolean
  multiPlatform: boolean
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  standard: {
    name: "Standard",
    priceId: "price_1TIy8N86WuAcuQwgw5p0rlzw",
    price: 6999,
    channels: 1,
    campaigns: 10,
    creatives: 30,
    brands: 1,
    abTesting: false,
    autoMode: false,
    crossChannelAnalytics: false,
    attribution: false,
    videoAds: false,
    blogArticles: false,
    podcasts: false,
    multiPlatform: false,
  },
  pro: {
    name: "Pro",
    priceId: "price_1TIy8l86WuAcuQwgpEXD3TsO",
    price: 11999,
    channels: 5,
    campaigns: 50,
    creatives: 150,
    brands: 1,
    abTesting: "suggested",
    autoMode: false,
    crossChannelAnalytics: true,
    attribution: true,
    videoAds: true,
    blogArticles: true,
    podcasts: true,
    multiPlatform: true,
  },
} as const

export function getTierByPriceId(priceId: string): SubscriptionTier | null {
  for (const [tier, config] of Object.entries(TIERS)) {
    if (config.priceId === priceId) return tier as SubscriptionTier
  }
  return null
}

export function checkUsageLimit(
  tier: SubscriptionTier,
  usage: { campaignsLaunched: number; creativesGenerated: number; channelsConnected: number }
): { allowed: boolean; limitType?: string; current?: number; limit?: number; upgradeTier?: SubscriptionTier } {
  const config = TIERS[tier]

  if (usage.channelsConnected >= config.channels) {
    return {
      allowed: false,
      limitType: "channels",
      current: usage.channelsConnected,
      limit: config.channels,
      upgradeTier: tier === "standard" ? "pro" : undefined,
    }
  }

  if (usage.campaignsLaunched >= config.campaigns) {
    return {
      allowed: false,
      limitType: "campaigns",
      current: usage.campaignsLaunched,
      limit: config.campaigns,
      upgradeTier: tier === "standard" ? "pro" : undefined,
    }
  }

  if (usage.creativesGenerated >= config.creatives) {
    return {
      allowed: false,
      limitType: "creatives",
      current: usage.creativesGenerated,
      limit: config.creatives,
      upgradeTier: tier === "standard" ? "pro" : undefined,
    }
  }

  return { allowed: true }
}

export function formatUsageMessage(
  limitType: string,
  current: number,
  limit: number,
  upgradeTier?: SubscriptionTier
): string {
  const tierConfig = upgradeTier ? TIERS[upgradeTier] : null
  const upgradeLimit = tierConfig
    ? tierConfig[limitType as keyof TierConfig]
    : "unlimited"

  return `You've used all ${limit} ${limitType} this month on your current plan.${
    upgradeTier
      ? ` ${tierConfig?.name} gives you ${upgradeLimit === Infinity ? "unlimited" : upgradeLimit} — want me to upgrade you?`
      : ""
  }`
}
