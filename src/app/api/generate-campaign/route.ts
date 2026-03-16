import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MODEL = 'anthropic/claude-opus-4'

async function callOpenRouter(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.choices[0].message.content ?? ''
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { businessId } = await req.json()

    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single()

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const prompt = `You are an expert marketing strategist. Create a comprehensive Month 1 marketing campaign plan for the following business.

BUSINESS PROFILE:
- Name: ${business.name}
- Description: ${business.description}
- Industry: ${business.industry}
- Type: ${business.product_or_service}
- What they sell: ${business.what_they_sell}
- Target audience: ${business.target_audience}
- Demographics: ${JSON.stringify(business.demographics)}
- Locations: ${business.locations?.join(', ')}
- Competitors: ${business.competitors?.join(', ')}

Generate a detailed marketing campaign plan as valid JSON with this exact structure:
{
  "theme": "A compelling campaign theme/concept (be creative and specific to their business)",
  "audience_breakdown": {
    "total_addressable_market": "Estimated TAM with numbers",
    "serviceable_market": "Realistic reachable market with numbers",
    "target_segment": "Specific segment to target first",
    "key_characteristics": ["trait 1", "trait 2", "trait 3", "trait 4", "trait 5"]
  },
  "suggested_channels": [
    {
      "channel": "Primary channel name",
      "reason": "Why this channel for this business",
      "estimated_reach": "Potential reach"
    },
    {
      "channel": "Secondary channel",
      "reason": "Why this supports primary",
      "estimated_reach": "Potential reach"
    }
  ],
  "budget_breakdown": {
    "monthly_total": 2000,
    "daily_budget": 66,
    "channel_split": [
      {"channel": "Channel name", "percentage": 60, "amount": 1200},
      {"channel": "Channel name", "percentage": 40, "amount": 800}
    ]
  },
  "funnel": {
    "tof": {
      "objective": "Awareness objective",
      "audience": "Broad audience description",
      "messaging": "Key message for awareness stage",
      "creative_ideas": ["idea 1", "idea 2", "idea 3"],
      "kpis": ["KPI 1", "KPI 2", "KPI 3"]
    },
    "mof": {
      "objective": "Consideration objective",
      "audience": "Retargeted/warmer audience",
      "messaging": "Consideration messaging",
      "creative_ideas": ["idea 1", "idea 2", "idea 3"],
      "kpis": ["KPI 1", "KPI 2", "KPI 3"]
    },
    "bof": {
      "objective": "Conversion objective",
      "audience": "Hot leads/ready to buy",
      "messaging": "Conversion messaging",
      "creative_ideas": ["idea 1", "idea 2", "idea 3"],
      "kpis": ["KPI 1", "KPI 2", "KPI 3"]
    }
  }
}

Return ONLY valid JSON, no other text.`

    const text = await callOpenRouter(prompt, 4000)

    let campaignData
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      campaignData = JSON.parse(jsonMatch?.[0] || text)
    } catch {
      throw new Error('Invalid JSON response from OpenRouter')
    }

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        business_id: businessId,
        month: 1,
        theme: campaignData.theme,
        audience_breakdown: campaignData.audience_breakdown,
        suggested_channels: campaignData.suggested_channels,
        budget_breakdown: campaignData.budget_breakdown,
        funnel: campaignData.funnel,
        raw_content: text,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ campaign })
  } catch (err) {
    console.error('Campaign generation error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
