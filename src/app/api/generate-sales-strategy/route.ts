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

    const { businessId, prospectId } = await req.json()

    const [{ data: business }, { data: prospect }] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', businessId).single(),
      supabase.from('prospects').select('*').eq('id', prospectId).single(),
    ])

    if (!business || !prospect) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const prompt = `You are an expert B2B sales strategist. Create a detailed, personalised sales strategy for this specific prospect.

SELLER: ${business.name} (${business.industry})
SELLING: ${business.what_they_sell}

PROSPECT:
- Name: ${prospect.name}
- Company: ${prospect.company}
- Email: ${prospect.email}
- LinkedIn: ${prospect.linkedin_url || 'Unknown'}
- Tier: ${prospect.tier} (1=highest priority)
- Tier Reasoning: ${prospect.tier_reasoning}
- Company Size: ${prospect.company_size}
- Estimated Revenue: ${prospect.estimated_revenue}
- Company News: ${prospect.company_news || 'None known'}

Generate a comprehensive sales strategy as JSON:
{
  "suggested_channel": "linkedin|email|phone",
  "reason_for_channel": "Why this channel is best for this prospect",
  "message_template": "Personalised opening message (3-4 sentences, reference their specific situation)",
  "follow_up_sequence": [
    {"day": 3, "channel": "email|linkedin|phone", "message": "Follow-up message referencing first touchpoint"},
    {"day": 7, "channel": "email|linkedin|phone", "message": "Second follow-up with value add"},
    {"day": 14, "channel": "email|phone", "message": "Third follow-up with social proof or case study angle"},
    {"day": 21, "channel": "email", "message": "Final follow-up with breakup email"}
  ],
  "positive_response_strategy": "Detailed strategy for when they respond positively — next steps, demo approach, objection handling",
  "negative_response_strategy": "Strategy for handling objections or negative responses — how to keep the door open"
}

Return ONLY valid JSON, no other text.`

    const text = await callOpenRouter(prompt, 2500)

    let strategyData
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      strategyData = JSON.parse(jsonMatch?.[0] || text)
    } catch {
      throw new Error('Invalid JSON from OpenRouter')
    }

    const { data: strategy, error } = await supabase
      .from('sales_strategies')
      .upsert({
        business_id: businessId,
        prospect_id: prospectId,
        suggested_channel: strategyData.suggested_channel,
        message_template: strategyData.message_template,
        follow_up_sequence: strategyData.follow_up_sequence,
        positive_response_strategy: strategyData.positive_response_strategy,
        negative_response_strategy: strategyData.negative_response_strategy,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ strategy })
  } catch (err) {
    console.error('Strategy generation error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
