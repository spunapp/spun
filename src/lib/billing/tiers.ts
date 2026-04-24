export type SubscriptionTier = "standard" | "pro"

export interface TierConfig {
  name: string
  // Single Stripe Price ID denominated in GBP. Stripe's Adaptive Pricing
  // feature (enabled in the dashboard) converts the price into the
  // customer's local currency at checkout time, so we don't need a
  // per-currency map here.
  priceId: string
  price: number // pence per month, base currency (GBP)
  messages: number // AI responses per month
  channels: number
  campaigns: number
  creatives: number
  blogArticles: number
  brands: number
  abTesting: false | "suggested" | "auto"
  autoMode: boolean
  crossChannelAnalytics: boolean
  attribution: boolean
  multiPlatform: boolean
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  standard: {
    name: "Standard",
    priceId: "price_1TIy8N86WuAcuQwgw5p0rlzw",
    price: 6999,
    messages: 100,
    channels: 1,
    campaigns: 1,
    creatives: 10,
    blogArticles: 0,
    brands: 1,
    abTesting: false,
    autoMode: false,
    crossChannelAnalytics: false,
    attribution: false,
    multiPlatform: false,
  },
  pro: {
    name: "Pro",
    priceId: "price_1TIy8l86WuAcuQwgpEXD3TsO",
    price: 11999,
    messages: 300,
    channels: 3,
    campaigns: 3,
    creatives: 30,
    blogArticles: 5,
    brands: 1,
    abTesting: "suggested",
    autoMode: false,
    crossChannelAnalytics: true,
    attribution: true,
    multiPlatform: true,
  },
} as const

export const CREDIT_PACK = {
  priceId: "price_1TKgcJ86WuAcuQwgsr9PDiNs",
  price: 999, // pence (GBP)
  messageCredits: 100,
  creativeCredits: 10,
  channelCredits: 1,
} as const

export function getTierByPriceId(priceId: string): SubscriptionTier | null {
  for (const [tier, config] of Object.entries(TIERS)) {
    if (config.priceId === priceId) return tier as SubscriptionTier
  }
  return null
}

export function checkUsageLimit(
  tier: SubscriptionTier,
  usage: { campaignsLaunched: number; creativesGenerated: number; channelsConnected: number; aiResponsesSent: number }
): { allowed: boolean; limitType?: string; current?: number; limit?: number; upgradeTier?: SubscriptionTier } {
  const config = TIERS[tier]

  if (usage.aiResponsesSent >= config.messages) {
    return {
      allowed: false,
      limitType: "messages",
      current: usage.aiResponsesSent,
      limit: config.messages,
      upgradeTier: tier === "standard" ? "pro" : undefined,
    }
  }

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
