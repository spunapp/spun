// Lead scoring types and utilities — used by the AI orchestrator

export type ActivityType =
  | "ad_click"
  | "email_open"
  | "email_click"
  | "website_visit"
  | "website_revisit"
  | "contact_form"
  | "firmographic"

export const ACTIVITY_POINTS: Record<ActivityType, number> = {
  ad_click: 5,
  email_open: 5,
  email_click: 10,
  website_visit: 10,
  website_revisit: 10,
  contact_form: 20,
  firmographic: 0, // variable, calculated per-prospect
}

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  ad_click: "Clicked Ad",
  email_open: "Opened Email",
  email_click: "Clicked Email Link",
  website_visit: "Visited Website",
  website_revisit: "Revisited Website",
  contact_form: "Filled Contact Form",
  firmographic: "Firmographic Data",
}

export function scoreToTier(score: number): 1 | 2 | 3 {
  if (score >= 30) return 1
  if (score >= 15) return 2
  return 3
}

export function firmographicScore(
  companySize?: string,
  estimatedRevenue?: string
): number {
  let score = 0
  if (companySize) {
    const nums = companySize
      .replace(/[^0-9]/g, " ")
      .trim()
      .split(/\s+/)
      .map(Number)
      .filter(Boolean)
    const maxSize = nums.length > 0 ? Math.max(...nums) : 0
    if (maxSize > 0 && maxSize <= 50) score += 2
    else if (maxSize <= 500) score += 4
    else if (maxSize <= 1000) score += 6
    else if (maxSize > 1000) score += 6
  }
  if (estimatedRevenue) {
    const nums = estimatedRevenue
      .replace(/[^0-9.]/g, " ")
      .trim()
      .split(/\s+/)
      .map(Number)
      .filter(Boolean)
    const rev = nums.length > 0 ? Math.max(...nums) : 0
    const revNorm = rev > 0 && rev < 10000 ? rev * 1000 : rev
    if (revNorm > 0 && revNorm <= 25000) score += 2
    else if (revNorm <= 100000) score += 4
    else if (revNorm > 100000) score += 6
  }
  return score
}

// Message types for the chat interface
export type MessageType =
  | "text"
  | "strategy"
  | "campaign_preview"
  | "analytics"
  | "creative_gallery"
  | "approval_request"
  | "status_update"
  | "onboarding"

export type TrustMode = "draft" | "approve" | "auto"

export type SubscriptionTier = "spark" | "growth" | "scale"

export type PlatformType =
  | "meta"
  | "google"
  | "klaviyo"
  | "ga4"
  | "tiktok"
  | "linkedin"
  | "shopify"
  | "buffer"

// Funnel stage type
export interface FunnelStage {
  objective: string
  audience: string
  messaging: string
  creative_ideas: string[]
  kpis: string[]
}
