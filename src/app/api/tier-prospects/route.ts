import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { firmographicScore, scoreToTier } from '@/lib/types'

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

    // Ask Claude for firmographic data only — tier assignment is score-driven
    const prompt = `You are a B2B research analyst. Estimate firmographic data for each prospect to support lead scoring.

SELLER: ${business.name} (${business.industry}) selling: ${business.what_they_sell}
TARGET PROFILE: ${business.target_audience}

PROSPECTS:
${JSON.stringify(prospects.map((p: { id: string; name: string; company: string; email: string; linkedin_url?: string }) => ({
  id: p.id, name: p.name, company: p.company, email: p.email, linkedin_url: p.linkedin_url,
})), null, 2)}

Return a JSON array — one object per prospect:
[
  {
    "id": "prospect id",
    "company_size": "estimated headcount range e.g. '10-50' or '200-500'",
    "estimated_revenue": "estimated annual revenue e.g. '£50,000' or '£2,000,000'",
    "years_in_business": estimated years as integer or null,
    "company_news": "notable recent news or buying signals, or null",
    "tier_reasoning": "2-3 sentences on this prospect's fit and potential value"
  }
]

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

    let firmographicData: Array<{
      id: string
      company_size: string
      estimated_revenue: string
      years_in_business: number | null
      company_news: string | null
      tier_reasoning: string
    }>

    try {
      const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/)
      firmographicData = JSON.parse(jsonMatch?.[0] || textBlock.text)
    } catch {
      throw new Error('Invalid JSON from Claude')
    }

    const updates = await Promise.all(
      firmographicData.map(async (firm) => {
        const prospectInput = prospects.find((p: { id: string; name?: string; company?: string }) => p.id === firm.id)
        if (!prospectInput) return null

        // Load existing behavioural score events
        const { data: existingEvents } = await supabase
          .from('lead_score_events')
          .select('points, event_type')
          .eq('prospect_id', firm.id)

        const behaviouralScore = (existingEvents || [])
          .filter(e => e.event_type !== 'firmographic')
          .reduce((sum, e) => sum + e.points, 0)

        // Compute firmographic score from Claude's estimates
        const firmoScore = firmographicScore(firm.company_size, firm.estimated_revenue)

        // Build a breakdown note
        const breakdown: string[] = []
        const sizeNums = (firm.company_size || '').replace(/[^0-9]/g, ' ').trim().split(/\s+/).map(Number).filter(Boolean)
        const maxSize = sizeNums.length > 0 ? Math.max(...sizeNums) : 0
        if (maxSize > 0 && maxSize <= 50) breakdown.push('0-50 employees (+2)')
        else if (maxSize <= 500) breakdown.push('51-500 employees (+4)')
        else if (maxSize > 0) breakdown.push('501-1000+ employees (+6)')

        const revNums = (firm.estimated_revenue || '').replace(/[^0-9.]/g, ' ').trim().split(/\s+/).map(Number).filter(Boolean)
        const rev = revNums.length > 0 ? Math.max(...revNums) : 0
        const revNorm = rev > 0 && rev < 10000 ? rev * 1000 : rev
        if (revNorm > 0 && revNorm <= 25000) breakdown.push('Revenue <£25k (+2)')
        else if (revNorm <= 100000) breakdown.push('Revenue £25k-£100k (+4)')
        else if (revNorm > 100000) breakdown.push('Revenue £100k+ (+6)')

        // Replace any existing firmographic event
        await supabase.from('lead_score_events').delete()
          .eq('prospect_id', firm.id).eq('event_type', 'firmographic')

        if (firmoScore > 0) {
          await supabase.from('lead_score_events').insert({
            prospect_id: firm.id,
            business_id: businessId,
            event_type: 'firmographic',
            points: firmoScore,
            note: breakdown.join('; '),
          })
        }

        const totalScore = behaviouralScore + firmoScore
        const tier = scoreToTier(totalScore)
        const tierLabel = tier === 1 ? 'Tier 1 (≥30 pts)' : tier === 2 ? 'Tier 2 (≥15 pts)' : 'Tier 3 (<15 pts)'
        const fullReasoning = `${firm.tier_reasoning} Score: ${totalScore} pts (${behaviouralScore} behavioural + ${firmoScore} firmographic) → ${tierLabel}.`

        const { data } = await supabase
          .from('prospects')
          .update({
            tier,
            tier_reasoning: fullReasoning,
            company_size: firm.company_size,
            estimated_revenue: firm.estimated_revenue,
            years_in_business: firm.years_in_business,
            company_news: firm.company_news,
            lead_score: totalScore,
            behavioural_score: behaviouralScore,
            firmographic_score: firmoScore,
            updated_at: new Date().toISOString(),
          })
          .eq('id', firm.id)
          .select()
          .single()

        // Seed sales strategy if not already present
        if (data) {
          const channel = totalScore >= 30 ? 'linkedin' : 'email'
          await supabase.from('sales_strategies').upsert({
            business_id: businessId,
            prospect_id: firm.id,
            suggested_channel: channel,
            message_template: `Hi ${(prospectInput.name || '').split(' ')[0] || 'there'}, I came across ${prospectInput.company || 'your company'} and thought ${business.name} could add real value for you. Would you be open to a quick conversation?`,
            follow_up_sequence: [],
          }, { onConflict: 'business_id,prospect_id' })
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
