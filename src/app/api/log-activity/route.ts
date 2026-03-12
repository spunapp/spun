import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ACTIVITY_POINTS, scoreToTier, type ActivityType } from '@/lib/types'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { prospectId, businessId, eventType, note } = await req.json() as {
      prospectId: string
      businessId: string
      eventType: ActivityType
      note?: string
    }

    // Verify ownership
    const { data: prospect } = await supabase
      .from('prospects')
      .select('id')
      .eq('id', prospectId)
      .eq('business_id', businessId)
      .single()

    if (!prospect) return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })

    const points = ACTIVITY_POINTS[eventType]

    // Insert the event
    await supabase.from('lead_score_events').insert({
      prospect_id: prospectId,
      business_id: businessId,
      event_type: eventType,
      points,
      note: note || null,
    })

    // Recalculate behavioural score from all events (excluding firmographic)
    const { data: events } = await supabase
      .from('lead_score_events')
      .select('points, event_type')
      .eq('prospect_id', prospectId)

    const { behaviouralScore, firmographicScoreVal } = (events || []).reduce(
      (acc, e) => {
        if (e.event_type === 'firmographic') acc.firmographicScoreVal += e.points
        else acc.behaviouralScore += e.points
        return acc
      },
      { behaviouralScore: 0, firmographicScoreVal: 0 },
    )

    const totalScore = behaviouralScore + firmographicScoreVal
    const tier = scoreToTier(totalScore)

    // Update prospect scores and tier
    const { data: updated } = await supabase
      .from('prospects')
      .update({
        lead_score: totalScore,
        behavioural_score: behaviouralScore,
        firmographic_score: firmographicScoreVal,
        tier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', prospectId)
      .select()
      .single()

    return NextResponse.json({
      prospect: updated,
      event: { event_type: eventType, points },
      score: { total: totalScore, behavioural: behaviouralScore, firmographic: firmographicScoreVal, tier },
    })
  } catch (err) {
    console.error('Log activity error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
