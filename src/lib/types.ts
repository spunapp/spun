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


  companySize?: string,
  estimatedRevenue?: string
export function firmographicScoreDetails(companySize?: string, estimatedRevenue?: string): { score: number; breakdown: string[] } {
  let score = 0
  const breakdown: string[] = []
  if (companySize) {
    const nums = companySize
      .replace(/[^0-9]/g, " ")
      .trim()
      .split(/\s+/)
      .map(Number)
      .filter(Boolean)
    const maxSize = nums.length > 0 ? Math.max(...nums) : 0
    if (maxSize > 0 && maxSize <= 50) { score += 2; breakdown.push('0-50 employees (+2)') }
    else if (maxSize <= 500) { score += 4; breakdown.push('51-500 employees (+4)') }
    else if (maxSize > 0) { score += 6; breakdown.push('501-1000+ employees (+6)') }
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
    if (revNorm > 0 && revNorm <= 25000) { score += 2; breakdown.push('Revenue <£25k (+2)') }
    else if (revNorm <= 100000) { score += 4; breakdown.push('Revenue £25k-£100k (+4)') }
    else if (revNorm > 100000) { score += 6; breakdown.push('Revenue £100k+ (+6)') }
  }
  return { score, breakdown }
}

export function firmographicScore(companySize?: string, estimatedRevenue?: string): number {
  return firmographicScoreDetails(companySize, estimatedRevenue).score
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

export interface AdCreative {
  id: string
  campaign_id: string
  business_id: string
  funnel_stage: "tof" | "mof" | "bof"
  variant: number
  format: string
  headline: string
  copy: string
  cta: string
  html_content: string
  created_at: string
}

export interface LeadScoreEvent {
  id: string
  prospect_id: string
  business_id: string
  event_type: ActivityType
  points: number
  note?: string
  created_at: string
}

export interface Prospect {
  id: string
  business_id: string
  name: string
  company: string
  email: string
  phone?: string
  linkedin_url?: string
  tier?: 1 | 2 | 3
  tier_reasoning?: string
  company_size?: string
  estimated_revenue?: string
  years_in_business?: number
  company_news?: string
  lead_score: number
  behavioural_score: number
  firmographic_score: number
  status: "prospect" | "contacted" | "qualified" | "negotiating" | "customer" | "lost"
  touchpoints: Touchpoint[]
  source: string
  custom_fields: Record<string, string>
  created_at: string
}

export interface Touchpoint {
  date: string
  channel: "linkedin" | "email" | "phone" | "meeting"
  type: "outreach" | "follow_up" | "response"
  notes?: string
  outcome?: "positive" | "negative" | "no_response"
}

export interface SalesStrategy {
  id: string
  business_id: string
  prospect_id: string
  suggested_channel: string
  message_template: string
  follow_up_sequence: {
    day: number
    channel: string
    message: string
  }[]
  positive_response_strategy: string
  negative_response_strategy: string
}

export interface Customer {
  id: string
  business_id: string
  prospect_id?: string
  name: string
  company?: string
  email?: string
  contract_value: number
  close_date: string
  marketing_spend_attributed: number
}

export interface ROIRecord {
  id: string
  business_id: string
  month: number
  ad_spend: number
  revenue_generated: number
  new_customers: number
  roi_percentage: number
  cac: number
  ltv: number
  calculated_at: string
}
