'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  TrendingUp, Plus, Loader2, DollarSign, Users, Target,
  BarChart3, CheckCircle2, X
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import type { Business, Customer, Prospect, ROIRecord } from '@/lib/types'

export default function Month3Page() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [roiRecords, setRoiRecords] = useState<ROIRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [adSpend, setAdSpend] = useState('')
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    company: '',
    email: '',
    contractValue: '',
    closeDate: new Date().toISOString().split('T')[0],
    prospectId: '',
  })
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: biz } = await supabase.from('businesses').select('*').eq('user_id', user.id).single()
    if (!biz) return
    setBusiness(biz)

    const [{ data: custs }, { data: pros }, { data: roi }] = await Promise.all([
      supabase.from('customers').select('*').eq('business_id', biz.id).order('created_at'),
      supabase.from('prospects').select('*').eq('business_id', biz.id).neq('status', 'customer'),
      supabase.from('roi_records').select('*').eq('business_id', biz.id).order('calculated_at'),
    ])

    setCustomers(custs || [])
    setProspects(pros || [])
    setRoiRecords(roi || [])
    setLoading(false)
  }

  async function addCustomer() {
    if (!business || !newCustomer.name) return
    setSaving(true)
    try {
      const res = await fetch('/api/roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          month: 3,
          adSpend: parseFloat(adSpend) || 0,
          customerData: {
            name: newCustomer.name,
            company: newCustomer.company,
            email: newCustomer.email,
            contractValue: parseFloat(newCustomer.contractValue) || 0,
            closeDate: newCustomer.closeDate,
            prospectId: newCustomer.prospectId || null,
          },
        }),
      })
      await res.json()
      setShowAddModal(false)
      setNewCustomer({ name: '', company: '', email: '', contractValue: '', closeDate: new Date().toISOString().split('T')[0], prospectId: '' })
      await load()
    } finally {
      setSaving(false)
    }
  }

  // Metrics
  const totalRevenue = customers.reduce((sum, c) => sum + (c.contract_value || 0), 0)
  const latestROI = roiRecords[roiRecords.length - 1]
  const totalSpend = latestROI?.ad_spend || 0
  const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0
  const cac = customers.length > 0 ? totalSpend / customers.length : 0
  const avgDeal = customers.length > 0 ? totalRevenue / customers.length : 0

  // Chart data
  const chartData = customers.map((c, i) => ({
    name: c.company || c.name,
    revenue: c.contract_value,
    cumulative: customers.slice(0, i + 1).reduce((sum, cc) => sum + (cc.contract_value || 0), 0),
  }))

  const roiChartData = roiRecords.map((r, i) => ({
    period: `Period ${i + 1}`,
    roi: r.roi_percentage,
    revenue: r.revenue_generated,
    spend: r.ad_spend,
  }))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            Month 3 — ROI Dashboard
          </h1>
          <p className="text-slate-400 mt-2">Track customer conversions, measure ROI, and monitor your marketing performance.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/20 border border-emerald-500/20 rounded-xl p-5">
          <DollarSign className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-3xl font-bold">£{totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-slate-400 mt-1">Total Revenue</p>
        </div>
        <div className={`rounded-xl p-5 border ${roi >= 0 ? 'bg-gradient-to-br from-blue-900/40 to-cyan-900/20 border-blue-500/20' : 'bg-gradient-to-br from-red-900/40 to-orange-900/20 border-red-500/20'}`}>
          <BarChart3 className={`w-5 h-5 mb-2 ${roi >= 0 ? 'text-blue-400' : 'text-red-400'}`} />
          <p className="text-3xl font-bold">{roi.toFixed(0)}%</p>
          <p className="text-sm text-slate-400 mt-1">ROI</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <Target className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-3xl font-bold">£{cac.toFixed(0)}</p>
          <p className="text-sm text-slate-400 mt-1">Cost per Customer</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <Users className="w-5 h-5 text-pink-400 mb-2" />
          <p className="text-3xl font-bold">{customers.length}</p>
          <p className="text-sm text-slate-400 mt-1">Total Customers</p>
        </div>
      </div>

      {customers.length > 0 ? (
        <>
          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Revenue per customer */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-4 text-sm">Revenue by Customer</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `£${v.toLocaleString()}`} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(v) => [`£${Number(v).toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Cumulative revenue */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-4 text-sm">Cumulative Revenue Growth</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => `£${v.toLocaleString()}`} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    formatter={(v) => [`£${Number(v).toLocaleString()}`, 'Cumulative']}
                  />
                  <Line type="monotone" dataKey="cumulative" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ROI summary */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
            <h3 className="font-semibold mb-4">Financial Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-1">Ad Spend</p>
                <p className="text-white font-semibold">£{totalSpend.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Revenue Generated</p>
                <p className="text-emerald-400 font-semibold">£{totalRevenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Avg Deal Value</p>
                <p className="text-white font-semibold">£{avgDeal.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Est. LTV (3x)</p>
                <p className="text-purple-400 font-semibold">£{(avgDeal * 3).toFixed(0)}</p>
              </div>
            </div>
            <div className="mt-4 h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                style={{ width: `${Math.min((totalRevenue / Math.max(totalRevenue, totalSpend * 2)) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Revenue vs 2x spend benchmark</p>
          </div>

          {/* Customer list */}
          <div>
            <h3 className="font-semibold mb-4">Customer Ledger</h3>
            <div className="space-y-2">
              {customers.map(customer => (
                <div key={customer.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-slate-400">{customer.company} {customer.email && `· ${customer.email}`}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-semibold">£{(customer.contract_value || 0).toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{customer.close_date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-2xl">
          <TrendingUp className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No customers yet</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            When a prospect converts to a customer, add them here to start tracking your ROI and marketing performance.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" /> Add Your First Customer
          </button>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-semibold">Add New Customer</h3>
              <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Customer Name *</label>
                  <input
                    value={newCustomer.name}
                    onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Company</label>
                  <input
                    value={newCustomer.company}
                    onChange={e => setNewCustomer(p => ({ ...p, company: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Acme Ltd"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="john@acme.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Contract Value (£) *</label>
                  <input
                    type="number"
                    value={newCustomer.contractValue}
                    onChange={e => setNewCustomer(p => ({ ...p, contractValue: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Close Date</label>
                  <input
                    type="date"
                    value={newCustomer.closeDate}
                    onChange={e => setNewCustomer(p => ({ ...p, closeDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Total Ad Spend to Date (£)</label>
                <input
                  type="number"
                  value={adSpend}
                  onChange={e => setAdSpend(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="2000"
                />
              </div>
              {prospects.length > 0 && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Link to Prospect (optional)</label>
                  <select
                    value={newCustomer.prospectId}
                    onChange={e => {
                      const p = prospects.find(pr => pr.id === e.target.value)
                      setNewCustomer(prev => ({
                        ...prev,
                        prospectId: e.target.value,
                        name: p?.name || prev.name,
                        company: p?.company || prev.company,
                        email: p?.email || prev.email,
                      }))
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select prospect...</option>
                    {prospects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {p.company}</option>
                    ))}
                  </select>
                </div>
              )}
              <button
                onClick={addCustomer}
                disabled={saving || !newCustomer.name || !newCustomer.contractValue}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Add Customer & Update ROI</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
