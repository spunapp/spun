import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

    const { messages, businessId } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), { status: 400 })
    }

    // Load business context
    const { data: business } = await supabase
      .from('businesses')
      .select('name, description, industry, product_or_service, what_they_sell, target_audience, locations, competitors')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .single()

    // Load recent campaigns and prospects for richer context
    const [{ data: campaigns }, { data: prospects }] = await Promise.all([
      supabase.from('campaigns').select('theme, status, month').eq('business_id', businessId).limit(5),
      supabase.from('prospects').select('company_name, tier, lead_score, status').eq('business_id', businessId).limit(10),
    ])

    const systemPrompt = `You are Spun, an expert AI marketing and sales strategist. You are having a conversation with the founder/owner of the following business. Be concise, practical, and actionable. Use your knowledge of their business data to give tailored advice.

BUSINESS PROFILE:
- Name: ${business?.name ?? 'Unknown'}
- Description: ${business?.description ?? ''}
- Industry: ${business?.industry ?? ''}
- Type: ${business?.product_or_service ?? ''}
- What they sell: ${business?.what_they_sell ?? ''}
- Target audience: ${business?.target_audience ?? ''}
- Locations: ${business?.locations?.join(', ') ?? ''}
- Competitors: ${business?.competitors?.join(', ') ?? ''}

CURRENT DATA:
- Campaigns: ${campaigns?.length ?? 0} (${campaigns?.map(c => c.theme).filter(Boolean).join(', ') || 'none yet'})
- Prospects: ${prospects?.length ?? 0} total${prospects?.length ? ` (${prospects.filter(p => p.tier === 1).length} Tier 1, ${prospects.filter(p => p.tier === 2).length} Tier 2, ${prospects.filter(p => p.tier === 3).length} Tier 3)` : ''}

You can help with: marketing strategy, campaign ideas, ad copy, sales outreach, prospect prioritisation, pricing, competitive positioning, ROI analysis, and general business growth questions. Keep responses focused and practical.`

    const stream = await client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    // Stream the response as Server-Sent Events
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              const data = JSON.stringify({ text: chunk.delta.text })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err) {
    console.error('Chat error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
