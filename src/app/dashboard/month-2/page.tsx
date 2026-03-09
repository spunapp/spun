'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users, Upload, Loader2, Zap, ChevronDown, ChevronUp,
  Linkedin, Mail, Phone, Star, MessageSquare, RefreshCw,
  MousePointerClick, Eye, ExternalLink, Globe, FileText, Building2
} from 'lucide-react'
import type { Business, Prospect, SalesStrategy, LeadScoreEvent, ActivityType } from '@/lib/types'
import { ACTIVITY_LABELS, ACTIVITY_POINTS } from '@/lib/types'

const TIER_CONFIG = {
  1: { label: 'Tier 1', color: 'from-emerald-600 to-teal-600', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', desc: 'Highest Priority', minScore: 30 },
  2: { label: 'Tier 2', color: 'from-blue-600 to-cyan-600', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', desc: 'Good Opportunity', minScore: 15 },
  3: { label: 'Tier 3', color: 'from-slate-600 to-slate-700', badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30', desc: 'Back Burner', minScore: 10 },
}

const CHANNEL_ICONS = { linkedin: Linkedin, email: Mail, phone: Phone }

// Behavioural activities the user can log manually
const ACTIVITIES: { type: ActivityType; label: string; points: number; icon: React.ElementType; color: string }[] = [
  { type: 'ad_click',       label: 'Clicked Ad',          points: 5,  icon: MousePointerClick, color: 'text-violet-400' },
  { type: 'email_open',     label: 'Opened Email',         points: 5,  icon: Eye,               color: 'text-blue-400'   },
  { type: 'email_click',    label: 'Clicked Email Link',   points: 10, icon: ExternalLink,      color: 'text-cyan-400'   },
  { type: 'website_visit',  label: 'Visited Website',      points: 10, icon: Globe,             color: 'text-teal-400'   },
  { type: 'website_revisit',label: 'Revisited Website',    points: 10, icon: Globe,             color: 'text-green-400'  },
  { type: 'contact_form',   label: 'Filled Contact Form',  points: 20, icon: FileText,          color: 'text-emerald-400'},
]

function ScoreBadge({ score }: { score: number }) {
  const tier = score >= 30 ? 1 : score >= 15 ? 2 : score >= 10 ? 3 : null
  const bg = !tier ? 'bg-slate-700 text-slate-300'
    : tier === 1 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    : tier === 2 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${bg}`}>
      <Star className="w-2.5 h-2.5" />
      {score} pts
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  const t1 = Math.min(score, 30)
  const pct = (t1 / 30) * 100
  const color = score >= 30 ? 'from-emerald-500 to-teal-500'
    : score >= 15 ? 'from-blue-500 to-cyan-500'
    : 'from-slate-500 to-slate-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-14 text-right">{score}/30+ pts</span>
    </div>
  )
}

export default function Month2Page() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [strategies, setStrategies] = useState<Record<string, SalesStrategy>>({})
  const [events, setEvents] = useState<Record<string, LeadScoreEvent[]>>({})
  const [loading, setLoading] = useState(true)
  const [tiering, setTiering] = useState(false)
  const [expandedProspect, setExpandedProspect] = useState<string | null>(null)
  const [generatingStrategy, setGeneratingStrategy] = useState<string | null>(null)
  const [loggingActivity, setLoggingActivity] = useState<string | null>(null) // prospectId:eventType
  const [filterTier, setFilterTier] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase.from('businesses').select('*').eq('user_id', user.id).single()
    if (!biz) return
    setBusiness(biz)

    const { data: pros } = await supabase
      .from('prospects')
      .select('*')
      .eq('business_id', biz.id)
      .order('lead_score', { ascending: false })
      .order('created_at', { ascending: false })

    setProspects(pros || [])

    if (pros && pros.length > 0) {
      const [{ data: strats }, { data: evts }] = await Promise.all([
        supabase.from('sales_strategies').select('*').eq('business_id', biz.id),
        supabase.from('lead_score_events').select('*').eq('business_id', biz.id).order('created_at', { ascending: false }),
      ])
      const stratMap: Record<string, SalesStrategy> = {}
      strats?.forEach(s => { stratMap[s.prospect_id] = s })
      setStrategies(stratMap)

      const evtMap: Record<string, LeadScoreEvent[]> = {}
      evts?.forEach(e => {
        if (!evtMap[e.prospect_id]) evtMap[e.prospect_id] = []
        evtMap[e.prospect_id].push(e)
      })
      setEvents(evtMap)
    }

    setLoading(false)
  }

  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !business) return

    const text = await file.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))

    const parsed = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = values[i] || '' })
      return row
    }).filter(row => row.name || row.company)

    const { data: saved } = await supabase.from('prospects').insert(
      parsed.map(row => ({
        business_id: business.id,
        name: row.name || row['full name'] || '',
        company: row.company || row['company name'] || '',
        email: row.email || row['email address'] || '',
        phone: row.phone || row['phone number'] || '',
        linkedin_url: row.linkedin || row['linkedin url'] || row['linkedin profile'] || '',
        lead_score: 0, behavioural_score: 0, firmographic_score: 0,
        custom_fields: row,
      }))
    ).select()

    if (saved) {
      setProspects(prev => [...prev, ...saved])
      await tierProspects([...prospects, ...saved])
    }
  }

  async function tierProspects(prospectsToTier?: Prospect[]) {
    if (!business) return
    const list = (prospectsToTier || prospects)
    if (list.length === 0) return

    setTiering(true)
    try {
      await fetch('/api/tier-prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          prospects: list.map(p => ({ id: p.id, name: p.name, company: p.company, email: p.email, linkedin_url: p.linkedin_url })),
        }),
      })
      await load()
    } finally {
      setTiering(false)
    }
  }

  async function logActivity(prospectId: string, eventType: ActivityType) {
    if (!business) return
    const key = `${prospectId}:${eventType}`
    setLoggingActivity(key)
    try {
      const res = await fetch('/api/log-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId, businessId: business.id, eventType }),
      })
      const { prospect: updated, event } = await res.json()
      if (updated) {
        setProspects(prev => prev.map(p => p.id === prospectId ? updated : p))
        setEvents(prev => ({
          ...prev,
          [prospectId]: [{ ...event, id: Date.now().toString(), prospect_id: prospectId, business_id: business.id, created_at: new Date().toISOString() }, ...(prev[prospectId] || [])],
        }))
      }
    } finally {
      setLoggingActivity(null)
    }
  }

  async function generateStrategy(prospectId: string) {
    if (!business) return
    setGeneratingStrategy(prospectId)
    try {
      const res = await fetch('/api/generate-sales-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business.id, prospectId }),
      })
      const { strategy } = await res.json()
      setStrategies(prev => ({ ...prev, [prospectId]: strategy }))
    } finally {
      setGeneratingStrategy(null)
    }
  }

  async function updateStatus(prospectId: string, status: string) {
    await supabase.from('prospects').update({ status }).eq('id', prospectId)
    setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, status: status as Prospect['status'] } : p))
  }

  const filteredProspects = prospects.filter(p => {
    if (filterTier && p.tier !== filterTier) return false
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    return true
  })

  const tierCounts = { 1: 0, 2: 0, 3: 0 }
  prospects.forEach(p => { if (p.tier === 1) tierCounts[1]++; else if (p.tier === 2) tierCounts[2]++; else if (p.tier === 3) tierCounts[3]++ })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          Month 2 — Sales Strategy
        </h1>
        <p className="text-slate-400 mt-2">Upload prospects, track engagement with lead scoring, then tier and strategise with AI.</p>
      </div>

      {/* Scoring legend */}
      <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Lead Scoring System</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 text-xs text-slate-400 mb-3">
          {ACTIVITIES.map(a => (
            <div key={a.type} className="flex items-center justify-between">
              <span className={a.color}>{a.label}</span>
              <span className="font-semibold text-white">+{a.points} pts</span>
            </div>
          ))}
        </div>
        <div className="border-t border-white/5 pt-3 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 text-xs text-slate-400 mb-3">
          <div className="flex items-center justify-between"><span className="text-slate-500">0–50 employees</span><span className="font-semibold text-white">+2 pts</span></div>
          <div className="flex items-center justify-between"><span className="text-slate-500">51–500 employees</span><span className="font-semibold text-white">+4 pts</span></div>
          <div className="flex items-center justify-between"><span className="text-slate-500">501–1000+ employees</span><span className="font-semibold text-white">+6 pts</span></div>
          <div className="flex items-center justify-between"><span className="text-slate-500">Revenue under £25k</span><span className="font-semibold text-white">+2 pts</span></div>
          <div className="flex items-center justify-between"><span className="text-slate-500">Revenue £25k–£100k</span><span className="font-semibold text-white">+4 pts</span></div>
          <div className="flex items-center justify-between"><span className="text-slate-500">Revenue £100k+</span><span className="font-semibold text-white">+6 pts</span></div>
        </div>
        <div className="border-t border-white/5 pt-3 flex flex-wrap gap-4 text-xs">
          <span className="text-emerald-400 font-semibold">≥30 pts → Tier 1</span>
          <span className="text-blue-400 font-semibold">≥15 pts → Tier 2</span>
          <span className="text-slate-400 font-semibold">≥10 pts → Tier 3</span>
        </div>
      </div>

      {/* Upload & Tier stats */}
      <div className="grid md:grid-cols-5 gap-4 mb-8">
        <div className="md:col-span-2 border-2 border-dashed border-white/10 hover:border-purple-500/40 rounded-xl p-6 transition-all cursor-pointer" onClick={() => fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          <Upload className="w-8 h-8 text-slate-500 mb-3" />
          <h3 className="font-semibold mb-1">Upload Prospects CSV</h3>
          <p className="text-sm text-slate-500">Columns: name, company, email, phone, linkedin</p>
          <div className="mt-4 text-xs text-slate-600 font-mono bg-slate-900 rounded-lg p-2">
            name,company,email,linkedin<br />John Smith,Acme Ltd,...
          </div>
        </div>

        <div className="md:col-span-3 grid grid-cols-2 gap-3">
          {([1, 2, 3] as const).map(tier => (
            <button
              key={tier}
              onClick={() => setFilterTier(filterTier === tier ? null : tier)}
              className={`p-4 rounded-xl border transition-all text-left ${filterTier === tier ? 'border-purple-500/40 bg-purple-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${TIER_CONFIG[tier].color} flex items-center justify-center mb-2`}>
                <Star className="w-4 h-4 text-white" fill={tier === 1 ? 'white' : 'none'} />
              </div>
              <p className="text-2xl font-bold">{tierCounts[tier]}</p>
              <p className="text-xs text-slate-400">{TIER_CONFIG[tier].label} · {TIER_CONFIG[tier].desc}</p>
              <p className="text-xs text-slate-600 mt-0.5">≥{TIER_CONFIG[tier].minScore} pts</p>
            </button>
          ))}
          <div className="p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-2xl font-bold">{prospects.length}</p>
            <p className="text-xs text-slate-400">Total Prospects</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      {prospects.length > 0 && (
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button
            onClick={() => tierProspects()}
            disabled={tiering}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-all"
          >
            {tiering ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scoring & Tiering...</> : <><Zap className="w-3.5 h-3.5" /> Run AI Score + Tier</>}
          </button>
          <div className="flex gap-2 flex-wrap">
            {['all', 'prospect', 'contacted', 'qualified', 'customer'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${filterStatus === s ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prospects */}
      {filteredProspects.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-2xl">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No prospects yet</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">Upload a CSV to get started. The AI will score firmographic data and you can log behavioural interactions to move prospects into tiers automatically.</p>
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all">
            <Upload className="w-4 h-4" /> Upload CSV
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProspects.map(prospect => {
            const tierConfig = prospect.tier ? TIER_CONFIG[prospect.tier as keyof typeof TIER_CONFIG] : null
            const strategy = strategies[prospect.id]
            const prospectEvents = events[prospect.id] || []
            const isExpanded = expandedProspect === prospect.id
            const ChannelIcon = strategy?.suggested_channel ? CHANNEL_ICONS[strategy.suggested_channel as keyof typeof CHANNEL_ICONS] || Mail : Mail
            const score = prospect.lead_score || 0

            return (
              <div key={prospect.id} className="border border-white/10 rounded-xl overflow-hidden">
                {/* Row header */}
                <button
                  onClick={() => setExpandedProspect(isExpanded ? null : prospect.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tierConfig?.color || 'from-slate-600 to-slate-700'} flex items-center justify-center flex-shrink-0 text-sm font-bold`}>
                    {prospect.tier || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-semibold">{prospect.name || 'Unknown'}</p>
                      {tierConfig && <span className={`text-xs px-2 py-0.5 rounded-full border ${tierConfig.badge}`}>{tierConfig.label}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        prospect.status === 'customer' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        prospect.status === 'contacted' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-white/5 text-slate-400 border border-white/10'
                      }`}>{prospect.status}</span>
                    </div>
                    <p className="text-sm text-slate-400">{prospect.company}{prospect.email ? ` · ${prospect.email}` : ''}</p>
                    <div className="mt-1.5">
                      <ScoreBar score={score} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <ScoreBadge score={score} />
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/5 p-5 space-y-5">

                    {/* Score breakdown */}
                    <div className="p-4 bg-white/5 rounded-xl">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Lead Score Breakdown</p>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-white">{score}</p>
                          <p className="text-xs text-slate-400">Total Score</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-400">{prospect.behavioural_score || 0}</p>
                          <p className="text-xs text-slate-400">Behavioural</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-400">{prospect.firmographic_score || 0}</p>
                          <p className="text-xs text-slate-400">Firmographic</p>
                        </div>
                      </div>
                      {/* Threshold guide */}
                      <div className="flex gap-3 text-xs">
                        {([30, 15, 10] as const).map(thresh => {
                          const reached = score >= thresh
                          const t = thresh === 30 ? 1 : thresh === 15 ? 2 : 3
                          return (
                            <div key={thresh} className={`flex-1 py-1.5 rounded-lg text-center ${reached ? `bg-gradient-to-r ${TIER_CONFIG[t].color} text-white` : 'bg-white/5 text-slate-500'}`}>
                              {reached ? '✓' : ''} Tier {t} ({thresh}+ pts)
                            </div>
                          )
                        })}
                      </div>

                      {/* Event history */}
                      {prospectEvents.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs text-slate-500 mb-1.5">Score history</p>
                          {prospectEvents.slice(0, 5).map((evt, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">{ACTIVITY_LABELS[evt.event_type as ActivityType] || evt.event_type}{evt.note ? ` · ${evt.note}` : ''}</span>
                              <span className="text-emerald-400 font-semibold">+{evt.points} pts</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Log activity */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Log Interaction <span className="normal-case text-slate-600">(updates score & tier automatically)</span></p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {ACTIVITIES.map(act => {
                          const key = `${prospect.id}:${act.type}`
                          const isLogging = loggingActivity === key
                          return (
                            <button
                              key={act.type}
                              onClick={() => logActivity(prospect.id, act.type)}
                              disabled={isLogging}
                              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-xs transition-all disabled:opacity-50 text-left"
                            >
                              {isLogging
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 flex-shrink-0" />
                                : <act.icon className={`w-3.5 h-3.5 flex-shrink-0 ${act.color}`} />
                              }
                              <span className="text-slate-300">{act.label}</span>
                              <span className="ml-auto text-emerald-400 font-semibold flex-shrink-0">+{act.points}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Firmographic data */}
                    {(prospect.company_size || prospect.estimated_revenue || prospect.company_news) && (
                      <div className="p-4 bg-white/5 rounded-xl">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" /> Firmographic Data
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm mb-2">
                          {prospect.company_size && <span className="text-slate-300">👥 {prospect.company_size}</span>}
                          {prospect.estimated_revenue && <span className="text-slate-300">💰 {prospect.estimated_revenue}</span>}
                          {prospect.years_in_business && <span className="text-slate-300">🏢 {prospect.years_in_business}y in business</span>}
                        </div>
                        {prospect.tier_reasoning && <p className="text-xs text-slate-400">{prospect.tier_reasoning}</p>}
                        {prospect.company_news && (
                          <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                            <p className="text-xs text-amber-400">📰 {prospect.company_news}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Update Status</p>
                      <div className="flex flex-wrap gap-2">
                        {['prospect', 'contacted', 'qualified', 'negotiating', 'customer', 'lost'].map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(prospect.id, s)}
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all ${prospect.status === s ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sales Strategy */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-400" /> Sales Strategy
                        </p>
                        <button
                          onClick={() => generateStrategy(prospect.id)}
                          disabled={generatingStrategy === prospect.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 rounded-lg transition-all disabled:opacity-50"
                        >
                          {generatingStrategy === prospect.id
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                            : <><RefreshCw className="w-3 h-3" /> {strategy ? 'Regenerate' : 'Generate Strategy'}</>}
                        </button>
                      </div>

                      {strategy ? (
                        <div className="space-y-3">
                          <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <ChannelIcon className="w-4 h-4 text-blue-400" />
                              <p className="text-xs font-medium text-blue-400 uppercase">Initial Outreach via {strategy.suggested_channel}</p>
                            </div>
                            <p className="text-sm text-slate-300 italic">"{strategy.message_template}"</p>
                          </div>

                          {strategy.follow_up_sequence?.length > 0 && (
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Follow-up Sequence</p>
                              <div className="space-y-2">
                                {strategy.follow_up_sequence.map((fu, i) => {
                                  const FuIcon = CHANNEL_ICONS[fu.channel as keyof typeof CHANNEL_ICONS] || Mail
                                  return (
                                    <div key={i} className="flex gap-3 p-3 bg-white/5 rounded-lg">
                                      <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-shrink-0 w-16">
                                        <FuIcon className="w-3 h-3" /> Day {fu.day}
                                      </div>
                                      <p className="text-xs text-slate-300">{fu.message}</p>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="p-3 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                              <p className="text-xs font-medium text-emerald-400 mb-1">✓ If they respond positively</p>
                              <p className="text-xs text-slate-300">{strategy.positive_response_strategy}</p>
                            </div>
                            <div className="p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
                              <p className="text-xs font-medium text-red-400 mb-1">✗ If they push back</p>
                              <p className="text-xs text-slate-300">{strategy.negative_response_strategy}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-dashed border-white/10 rounded-xl text-xs text-slate-500">
                          Generate a personalised strategy for {prospect.name || 'this prospect'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
