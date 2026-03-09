import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { businessId, prospects } = await req.json()

    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single()

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const prompt = `You are an expert B2B sales strategist. Analyse and tier the following prospects for ${business.name} (${business.industry} company selling ${business.what_they_sell}).

TARGET CUSTOMER PROFILE: ${business.target_audience}

PROSPECTS TO TIER:
${JSON.stringify(prospects, null, 2)}

Tier each prospect based on:
- Company size and growth potential
- Revenue and ability to pay
- Years in business (stability)
- Any company news (mergers, new products, expansion = buying signals)
- Fit with the seller's target customer profile

TIER DEFINITIONS:
- Tier 1: Highest priority — strong fit, high revenue potential, clear buying signals
- Tier 2: Good opportunity — solid fit, worth pursuing after Tier 1
- Tier 3: Lower priority — possible future opportunity, keep on radar

For each prospect, also suggest the best initial outreach approach.

Return a JSON array where each element contains:
{
  "id": "prospect id from input",
  "tier": 1, 2, or 3,
  "tier_reasoning": "2-3 sentence explanation of why this tier",
  "company_size": "estimated or stated company size",
  "estimated_revenue": "estimated annual revenue",
  "years_in_business": estimated number or null,
  "company_news": "any relevant recent news or signals",
  "suggested_channel": "linkedin|email|phone",
  "outreach_message": "A personalised opening message for this prospect (2-3 sentences)"
}

Return ONLY a valid JSON array, no other text.`

    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 6000,
      thinking: { type: 'adaptive' },
      messages: [{ role: 'user', content: prompt }]
    })

    const message = await stream.finalMessage()
    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') throw new Error('No text response')

    let tieredData: Array<{
      id: string
      tier: 1 | 2 | 3
      tier_reasoning: string
      company_size: string
      estimated_revenue: string
      years_in_business: number | null
      company_news: string
      suggested_channel: string
      outreach_message: string
    }>

    try {
      const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/)
      tieredData = JSON.parse(jsonMatch?.[0] || textBlock.text)
    } catch {
      throw new Error('Invalid JSON from Claude')
    }

    // Update each prospect in the database
    const updates = await Promise.all(
      tieredData.map(async (tiered) => {
        const prospect = prospects.find((p: { id: string }) => p.id === tiered.id)
        if (!prospect) return null

        const { data, error } = await supabase
          .from('prospects')
          .update({
            tier: tiered.tier,
            tier_reasoning: tiered.tier_reasoning,
            company_size: tiered.company_size,
            estimated_revenue: tiered.estimated_revenue,
            years_in_business: tiered.years_in_business,
            company_news: tiered.company_news,
          })
          .eq('id', tiered.id)
          .select()
          .single()

        // Also create a sales strategy
        if (!error && data) {
          await supabase.from('sales_strategies').insert({
            business_id: businessId,
            prospect_id: tiered.id,
            suggested_channel: tiered.suggested_channel,
            message_template: tiered.outreach_message,
            follow_up_sequence: [],
          })
        }

        return data
      })
    )

    return NextResponse.json({ prospects: updates.filter(Boolean) })
  } catch (err) {
    console.error('Tiering error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
