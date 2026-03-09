'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Megaphone, Users, TrendingUp, ArrowRight, CheckCircle2,
  Circle, Zap, Building2
} from 'lucide-react'
import type { Business, Campaign, Prospect, Customer } from '@/lib/types'

export default function DashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: biz } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!biz) { router.push('/onboarding'); return }
      setBusiness(biz)

      const [{ data: camps }, { data: pros }, { data: custs }] = await Promise.all([
        supabase.from('campaigns').select('*').eq('business_id', biz.id),
        supabase.from('prospects').select('*').eq('business_id', biz.id),
        supabase.from('customers').select('*').eq('business_id', biz.id),
      ])

      setCampaigns(camps || [])
      setProspects(pros || [])
      setCustomers(custs || [])
      setLoading(false)
    }
    load()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const hasCampaign = campaigns.some(c => c.month === 1)
  const hasProspects = prospects.length > 0
  const hasCustomers = customers.length > 0

  const PHASES = [
    {
      month: 1,
      title: 'Month 1 — Marketing Campaigns',
      description: 'Generate a full campaign plan, audience breakdown, ad budget and 9 HTML/CSS ad creatives across your marketing funnel.',
      icon: Megaphone,
      href: '/dashboard/month-1',
      done: hasCampaign,
      color: 'from-purple-600 to-violet-600',
      statLabel: 'Campaigns',
      stat: campaigns.filter(c => c.month === 1).length,
    },
    {
      month: 2,
      title: 'Month 2 — Sales Strategy',
      description: 'Upload your prospects, let AI tier them by priority, and get personalised outreach strategies for each tier.',
      icon: Users,
      href: '/dashboard/month-2',
      done: hasProspects,
      color: 'from-blue-600 to-cyan-600',
      statLabel: 'Prospects',
      stat: prospects.length,
    },
    {
      month: 3,
      title: 'Month 3 — ROI Dashboard',
      description: 'Track customer conversions, measure ROI against ad spend, and get an ongoing sales strategy to grow revenue.',
      icon: TrendingUp,
      href: '/dashboard/month-3',
      done: hasCustomers,
      color: 'from-emerald-600 to-teal-600',
      statLabel: 'Customers',
      stat: customers.length,
    },
  ]

  const totalRevenue = customers.reduce((sum, c) => sum + (c.contract_value || 0), 0)

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          {business?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logo_url} alt="Logo" className="w-12 h-12 object-contain rounded-xl border border-white/10" />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{business?.name}</h1>
            <p className="text-slate-400 text-sm">{business?.industry} · {business?.product_or_service}</p>
          </div>
        </div>
        <p className="text-slate-400 mt-3">Welcome to your AI marketing command centre. Work through each phase below.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Campaigns', value: campaigns.length, icon: Megaphone },
          { label: 'Prospects', value: prospects.length, icon: Users },
          { label: 'Customers', value: customers.length, icon: CheckCircle2 },
          { label: 'Revenue', value: `£${totalRevenue.toLocaleString()}`, icon: TrendingUp },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <stat.icon className="w-5 h-5 text-slate-400 mb-2" />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Phases */}
      <div className="space-y-4">
        {PHASES.map(phase => (
          <Link
            key={phase.month}
            href={phase.href}
            className="block p-6 bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${phase.color} flex items-center justify-center flex-shrink-0`}>
                <phase.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg">{phase.title}</h3>
                  {phase.done ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                      <Circle className="w-3 h-3" /> Not started
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-3">{phase.description}</p>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500">
                    <span className="text-white font-medium">{phase.stat}</span> {phase.statLabel}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-purple-400 group-hover:text-purple-300 transition-colors">
                    {phase.done ? 'View & manage' : 'Get started'} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Powered by */}
      <div className="mt-8 flex items-center gap-2 text-xs text-slate-600">
        <Zap className="w-3 h-3" />
        <span>Powered by Claude Opus AI</span>
      </div>
    </div>
  )
}
