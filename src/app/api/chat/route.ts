import { createClient } from '@/lib/supabase/server'

const MODEL = 'anthropic/claude-opus-4'

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

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not set')

    const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role,
            content: m.content,
          })),
        ],
      }),
    })

    if (!orResponse.ok || !orResponse.body) {
      const err = await orResponse.text()
      throw new Error(`OpenRouter error: ${orResponse.status} ${err}`)
    }

    // Re-stream OpenRouter SSE → frontend SSE format
    const encoder = new TextEncoder()
    const reader = orResponse.body.getReader()
    const decoder = new TextDecoder()

    const readable = new ReadableStream({
      async start(controller) {
        let buffer = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data:')) continue
              const payload = trimmed.slice(5).trim()
              if (payload === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                continue
              }
              try {
                const parsed = JSON.parse(payload)
                const text = parsed.choices?.[0]?.delta?.content
                if (text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
                }
              } catch {
                // ignore malformed chunks
              }
            }
          }
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
