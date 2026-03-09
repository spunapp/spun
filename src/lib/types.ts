export interface Business {
  id: string
  user_id: string
  name: string
  description: string
  product_or_service: 'product' | 'service' | 'both'
  what_they_sell: string
  industry: string
  target_audience: string
  demographics: {
    gender?: string
    age_range?: string
    income_range?: string
    location_type?: string
  }
  locations: string[]
  competitors: string[]
  logo_url?: string
  imagery_urls: string[]
  analytics_connected: boolean
  crm_connected: boolean
  onboarding_complete: boolean
  created_at: string
}

export interface Campaign {
  id: string
  business_id: string
  month: number
  theme: string
  audience_breakdown: {
    total_addressable_market?: string
    serviceable_market?: string
    target_segment?: string
    key_characteristics?: string[]
  }
  suggested_channels: {
    channel: string
    reason: string
    estimated_reach?: string
  }[]
  budget_breakdown: {
    monthly_total: number
    daily_budget: number
    channel_split: { channel: string; percentage: number; amount: number }[]
  }
  funnel: {
    tof: FunnelStage
    mof: FunnelStage
    bof: FunnelStage
  }
  raw_content: string
  status: 'draft' | 'active' | 'completed'
  created_at: string
}

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
  funnel_stage: 'tof' | 'mof' | 'bof'
  variant: number
  format: string
  headline: string
  copy: string
  cta: string
  html_content: string
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
  status: 'prospect' | 'contacted' | 'qualified' | 'negotiating' | 'customer' | 'lost'
  touchpoints: Touchpoint[]
  source: string
  custom_fields: Record<string, string>
  created_at: string
}

export interface Touchpoint {
  date: string
  channel: 'linkedin' | 'email' | 'phone' | 'meeting'
  type: 'outreach' | 'follow_up' | 'response'
  notes?: string
  outcome?: 'positive' | 'negative' | 'no_response'
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
