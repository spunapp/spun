'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Megaphone, Zap, Loader2, ChevronDown, ChevronUp, Eye,
  RefreshCw, Target, DollarSign, Users, Layers, Palette
} from 'lucide-react'
import type { Business, Campaign, AdCreative } from '@/lib/types'

const FUNNEL_STAGES = [
  { key: 'tof', label: 'Top of Funnel', color: 'from-blue-600 to-violet-600', desc: 'Awareness' },
  { key: 'mof', label: 'Middle of Funnel', color: 'from-violet-600 to-pink-600', desc: 'Consideration' },
  { key: 'bof', label: 'Bottom of Funnel', color: 'from-pink-600 to-red-600', desc: 'Conversion' },
]

export default function Month1Page() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [creatives, setCreatives] = useState<AdCreative[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingCreatives, setGeneratingCreatives] = useState<string | null>(null)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [previewCreative, setPreviewCreative] = useState<AdCreative | null>(null)
  const supabase = createClient()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase.from('businesses').select('*').eq('user_id', user.id).single()
    if (!biz) return
    setBusiness(biz)

    const { data: camp } = await supabase
      .from('campaigns')
      .select('*')
      .eq('business_id', biz.id)
      .eq('month', 1)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (camp) {
      setCampaign(camp)
      const { data: creat } = await supabase
        .from('ad_creatives')
        .select('*')
        .eq('campaign_id', camp.id)
        .order('funnel_stage')
        .order('variant')
      setCreatives(creat || [])
    }
    setLoading(false)
  }

  async function generateCampaign() {
    if (!business) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id }),
      })
      const { campaign: camp } = await res.json()
      setCampaign(camp)
    } finally {
      setGenerating(false)
    }
  }

  async function generateCreativesForStage(stage: string) {
    if (!campaign || !business) return
    setGeneratingCreatives(stage)
    try {
      const res = await fetch('/api/generate-creatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          businessId: business.id,
          funnelStage: stage,
        }),
      })
      const { creatives: newCreatives } = await res.json()
      setCreatives(prev => [
        ...prev.filter(c => c.funnel_stage !== stage),
        ...newCreatives,
      ])
    } finally {
      setGeneratingCreatives(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          Month 1 — Marketing Campaign
        </h1>
        <p className="text-slate-400 mt-2">Generate your campaign plan, funnel strategy and ad creatives powered by Claude AI.</p>
      </div>

      {!campaign ? (
        /* Empty state */
        <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-2xl">
          <Zap className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Ready to launch your first campaign?</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            Claude will analyse your business, audience and competitors to create a complete marketing campaign plan.
          </p>
          <button
            onClick={generateCampaign}
            disabled={generating}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl disabled:opacity-50 transition-all"
          >
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Campaign...</> : <><Zap className="w-4 h-4" /> Generate Campaign Plan</>}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Campaign header */}
          <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-purple-400 font-medium mb-1">Campaign Theme</p>
                <h2 className="text-2xl font-bold mb-3">{campaign.theme}</h2>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-slate-300">
                    {campaign.suggested_channels?.[0]?.channel}
                  </span>
                  <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-slate-300">
                    £{campaign.budget_breakdown?.monthly_total?.toLocaleString()}/month
                  </span>
                </div>
              </div>
              <button
                onClick={generateCampaign}
                disabled={generating}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <Target className="w-5 h-5 text-purple-400 mb-2" />
              <p className="text-sm text-slate-400">Target Segment</p>
              <p className="font-semibold text-sm mt-1 line-clamp-2">{campaign.audience_breakdown?.target_segment}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <Users className="w-5 h-5 text-blue-400 mb-2" />
              <p className="text-sm text-slate-400">Addressable Market</p>
              <p className="font-semibold text-sm mt-1">{campaign.audience_breakdown?.serviceable_market}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <DollarSign className="w-5 h-5 text-emerald-400 mb-2" />
              <p className="text-sm text-slate-400">Daily Budget</p>
              <p className="font-semibold text-lg mt-1">£{campaign.budget_breakdown?.daily_budget}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <Layers className="w-5 h-5 text-pink-400 mb-2" />
              <p className="text-sm text-slate-400">Primary Channel</p>
              <p className="font-semibold text-sm mt-1">{campaign.suggested_channels?.[0]?.channel}</p>
            </div>
          </div>

          {/* Audience breakdown */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> Audience Breakdown</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Total Addressable Market</p>
                  <p className="text-slate-200">{campaign.audience_breakdown?.total_addressable_market}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Serviceable Market</p>
                  <p className="text-slate-200">{campaign.audience_breakdown?.serviceable_market}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Primary Target</p>
                  <p className="text-slate-200">{campaign.audience_breakdown?.target_segment}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Key Characteristics</p>
                <ul className="space-y-1.5">
                  {campaign.audience_breakdown?.key_characteristics?.map((char, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                      {char}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Budget breakdown */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-400" /> Budget Breakdown</h3>
            <div className="space-y-3">
              {campaign.budget_breakdown?.channel_split?.map((split, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{split.channel}</span>
                    <span className="text-slate-400">£{split.amount} ({split.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                      style={{ width: `${split.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channels */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Suggested Channels</h3>
            <div className="space-y-3">
              {campaign.suggested_channels?.map((ch, i) => (
                <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-lg">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-purple-600' : 'bg-slate-700'}`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium">{ch.channel}</p>
                    <p className="text-sm text-slate-400">{ch.reason}</p>
                    {ch.estimated_reach && <p className="text-xs text-purple-400 mt-1">Reach: {ch.estimated_reach}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Full Funnel */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-pink-400" /> Full Marketing Funnel</h3>
            <div className="space-y-4">
              {FUNNEL_STAGES.map(stage => {
                const stageData = campaign.funnel?.[stage.key as keyof typeof campaign.funnel]
                const stageCreatives = creatives.filter(c => c.funnel_stage === stage.key)
                const isExpanded = expandedStage === stage.key

                return (
                  <div key={stage.key} className="border border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
                      className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stage.color} flex items-center justify-center text-xs font-bold`}>
                          {stage.key.toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{stage.label}</p>
                          <p className="text-sm text-slate-400">{stage.desc} · {stageCreatives.length}/3 creatives</p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {isExpanded && stageData && (
                      <div className="border-t border-white/5 p-5 space-y-5">
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 uppercase text-xs tracking-wide mb-1.5">Objective</p>
                            <p className="text-slate-200">{stageData.objective}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase text-xs tracking-wide mb-1.5">Audience</p>
                            <p className="text-slate-200">{stageData.audience}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase text-xs tracking-wide mb-1.5">Messaging</p>
                            <p className="text-slate-200">{stageData.messaging}</p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500 uppercase text-xs tracking-wide mb-1.5">Creative Ideas</p>
                            <ul className="space-y-1">
                              {stageData.creative_ideas?.map((idea, i) => (
                                <li key={i} className="flex items-start gap-2 text-slate-300">
                                  <span className="text-purple-400 font-mono">{i+1}.</span> {idea}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase text-xs tracking-wide mb-1.5">KPIs to Track</p>
                            <ul className="space-y-1">
                              {stageData.kpis?.map((kpi, i) => (
                                <li key={i} className="flex items-start gap-2 text-slate-300">
                                  <span className="text-pink-400">•</span> {kpi}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Ad Creatives Section */}
                        <div className="border-t border-white/5 pt-5">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Palette className="w-4 h-4 text-pink-400" />
                              Ad Creatives ({stageCreatives.length}/3)
                            </h4>
                            <button
                              onClick={() => generateCreativesForStage(stage.key)}
                              disabled={generatingCreatives === stage.key}
                              className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg transition-all disabled:opacity-50"
                            >
                              {generatingCreatives === stage.key
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                                : <><Zap className="w-3.5 h-3.5" /> {stageCreatives.length > 0 ? 'Regenerate' : 'Generate'} Creatives</>
                              }
                            </button>
                          </div>

                          {stageCreatives.length === 0 ? (
                            <div className="text-center py-8 border border-dashed border-white/10 rounded-xl text-slate-500 text-sm">
                              No creatives yet — generate them above
                            </div>
                          ) : (
                            <div className="grid md:grid-cols-3 gap-4">
                              {stageCreatives.map(creative => (
                                <div key={creative.id} className="border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all">
                                  <div className="p-3 bg-white/5">
                                    <p className="text-xs text-slate-500 mb-0.5">Variant {creative.variant} · {creative.format}</p>
                                    <p className="font-semibold text-sm">{creative.headline}</p>
                                    <p className="text-xs text-slate-400 mt-1">{creative.copy}</p>
                                    <span className="inline-block mt-2 px-2 py-0.5 bg-purple-600/30 text-purple-300 text-xs rounded-full">{creative.cta}</span>
                                  </div>
                                  <button
                                    onClick={() => setPreviewCreative(creative)}
                                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5"
                                  >
                                    <Eye className="w-3 h-3" /> Preview HTML Creative
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Creative Preview Modal */}
      {previewCreative && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewCreative(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div>
                <h3 className="font-semibold">{previewCreative.headline}</h3>
                <p className="text-sm text-slate-400">{previewCreative.format} · Variant {previewCreative.variant}</p>
              </div>
              <button onClick={() => setPreviewCreative(null)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="p-5">
              <div className="bg-white rounded-xl overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: previewCreative.html_content }} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">Headline</p>
                  <p className="text-white">{previewCreative.headline}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">Copy</p>
                  <p className="text-white">{previewCreative.copy}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-slate-500 text-xs mb-1">CTA</p>
                  <p className="text-white">{previewCreative.cta}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
