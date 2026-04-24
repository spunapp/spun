import { BASE_CURRENCY } from "@/lib/currency/currencies"

export type SubscriptionTier = "standard" | "pro"

export interface TierConfig {
  name: string
  // Stripe price IDs keyed by ISO 4217 currency code. GBP must always be
  // present as the fallback. Additional currencies require corresponding
  // multi-currency Prices in the Stripe dashboard — create a Price per
  // currency for each Product and paste the ID here.
  priceIds: Record<string, string>
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
    priceIds: {
      GBP: "price_1TIy8N86WuAcuQwgw5p0rlzw",
      // Add the Standard monthly Price ID from the Stripe dashboard for each
      // currency you want to sell in. Missing currencies fall back to GBP.
    },
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
    priceIds: {
      GBP: "price_1TIy8l86WuAcuQwgpEXD3TsO",
    },
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
  priceIds: {
    GBP: "price_1TKgcJ86WuAcuQwgsr9PDiNs",
  } as Record<string, string>,
  price: 999, // pence, base currency (GBP)
  messageCredits: 100,
  creativeCredits: 10,
  channelCredits: 1,
} as const

export function getTierByPriceId(priceId: string): SubscriptionTier | null {
  for (const [tier, config] of Object.entries(TIERS)) {
    if (Object.values(config.priceIds).includes(priceId)) {
      return tier as SubscriptionTier
    }
  }
  return null
}

export function getTierPriceId(tier: SubscriptionTier, currency: string): string {
  const config = TIERS[tier]
  return config.priceIds[currency] ?? config.priceIds[BASE_CURRENCY]
}

export function getCreditPackPriceId(currency: string): string {
  return CREDIT_PACK.priceIds[currency] ?? CREDIT_PACK.priceIds[BASE_CURRENCY]
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
