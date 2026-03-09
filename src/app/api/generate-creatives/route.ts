import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const client = new Anthropic()

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { campaignId, businessId, funnelStage } = await req.json()

    const [{ data: campaign }, { data: business }] = await Promise.all([
      supabase.from('campaigns').select('*').eq('id', campaignId).single(),
      supabase.from('businesses').select('*').eq('id', businessId).single(),
    ])

    if (!campaign || !business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const stageMap = { tof: 'Top of Funnel', mof: 'Middle of Funnel', bof: 'Bottom of Funnel' }
    const stageName = stageMap[funnelStage as keyof typeof stageMap]
    const stageData = campaign.funnel[funnelStage]

    const formats = {
      tof: ['Leaderboard Banner (728x90)', 'Social Square (1080x1080)', 'Story Format (1080x1920)'],
      mof: ['Display Banner (300x250)', 'Social Carousel Slide (1080x1080)', 'Video Thumbnail (1280x720)'],
      bof: ['Remarketing Banner (160x600)', 'Email Header (600x200)', 'Social Feed Ad (1200x628)'],
    }

    const creatives = []
    const brandColors = ['#6B21A8', '#7C3AED', '#EC4899']

    for (let variant = 1; variant <= 3; variant++) {
      const format = formats[funnelStage as keyof typeof formats][variant - 1]

      const prompt = `You are an expert ad creative designer and copywriter. Create an HTML/CSS ad creative for:

BUSINESS: ${business.name}
INDUSTRY: ${business.industry}
CAMPAIGN THEME: ${campaign.theme}
FUNNEL STAGE: ${stageName} (Variant ${variant})
FORMAT: ${format}
OBJECTIVE: ${stageData?.objective}
MESSAGING: ${stageData?.messaging}
CREATIVE IDEA: ${stageData?.creative_ideas?.[variant - 1] || stageData?.creative_ideas?.[0]}
BRAND: ${business.product_or_service} business, target: ${business.target_audience}

Generate a complete, self-contained HTML ad creative. Return a JSON object with this structure:
{
  "headline": "Compelling ad headline (max 8 words)",
  "copy": "Ad body copy (max 20 words, punchy)",
  "cta": "Call to action button text (max 4 words)",
  "format": "${format}",
  "html_content": "COMPLETE self-contained HTML with embedded CSS that renders a professional ad creative. Use inline styles. Include the business name, headline, copy, and CTA button. Make it visually striking with gradient backgrounds, bold typography, and professional layout. Use colors: primary #7C3AED (purple), accent #EC4899 (pink). The HTML must be a single div/section element ready to embed. Make it look like a real professional advertisement."
}

The HTML should:
- Be completely self-contained (no external resources)
- Use only inline styles or a single <style> tag
- Have realistic dimensions appropriate for the format
- Include a compelling CTA button
- Use the business name prominently
- Feature the campaign theme visually
- Look production-ready and professional

Return ONLY valid JSON, no other text.`

      const stream = client.messages.stream({
        model: 'claude-opus-4-6',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      })

      const message = await stream.finalMessage()
      const textBlock = message.content.find(b => b.type === 'text')
      if (!textBlock || textBlock.type !== 'text') continue

      let creativeData
      try {
        const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/)
        creativeData = JSON.parse(jsonMatch?.[0] || textBlock.text)
      } catch {
        continue
      }

      const { data: creative, error } = await supabase
        .from('ad_creatives')
        .insert({
          campaign_id: campaignId,
          business_id: businessId,
          funnel_stage: funnelStage,
          variant,
          format,
          headline: creativeData.headline,
          copy: creativeData.copy,
          cta: creativeData.cta,
          html_content: creativeData.html_content,
        })
        .select()
        .single()

      if (!error && creative) creatives.push(creative)
    }

    return NextResponse.json({ creatives })
  } catch (err) {
    console.error('Creative generation error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
