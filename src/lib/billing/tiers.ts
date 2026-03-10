export type SubscriptionTier = "spark" | "growth" | "scale"

export interface TierConfig {
  name: string
  price: number // cents per month
  channels: number
  campaigns: number
  creatives: number
  brands: number
  abTesting: false | "suggested" | "auto"
  autoMode: boolean
  crossChannelAnalytics: boolean
  attribution: boolean
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  spark: {
    name: "Spark",
    price: 4900,
    channels: 2,
    campaigns: 10,
    creatives: 30,
    brands: 1,
    abTesting: false,
    autoMode: false,
    crossChannelAnalytics: false,
    attribution: false,
  },
  growth: {
    name: "Growth",
    price: 9900,
    channels: 5,
    campaigns: 50,
    creatives: 150,
    brands: 1,
    abTesting: "suggested",
    autoMode: false,
    crossChannelAnalytics: true,
    attribution: false,
  },
  scale: {
    name: "Scale",
    price: 19900,
    channels: Infinity,
    campaigns: Infinity,
    creatives: Infinity,
    brands: 3,
    abTesting: "auto",
    autoMode: true,
    crossChannelAnalytics: true,
    attribution: true,
  },
} as const

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
      upgradeTier: tier === "spark" ? "growth" : tier === "growth" ? "scale" : undefined,
    }
  }

  if (usage.campaignsLaunched >= config.campaigns) {
    return {
      allowed: false,
      limitType: "campaigns",
      current: usage.campaignsLaunched,
      limit: config.campaigns,
      upgradeTier: tier === "spark" ? "growth" : tier === "growth" ? "scale" : undefined,
    }
  }

  if (usage.creativesGenerated >= config.creatives) {
    return {
      allowed: false,
      limitType: "creatives",
      current: usage.creativesGenerated,
      limit: config.creatives,
      upgradeTier: tier === "spark" ? "growth" : tier === "growth" ? "scale" : undefined,
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
