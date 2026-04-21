"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { Check, X } from "lucide-react"
import { LOGO_SRC } from "@/lib/logo"
import { TIERS, CREDIT_PACK } from "@/lib/billing/tiers"

const PRICES = {
  standard: { annual: 69.99, monthly: 87.99 },
  pro: { annual: 119.99, monthly: 149.99 },
}

const CARD_FEATURES: Record<string, string[]> = {
  standard: [
    `${TIERS.standard.messages} AI responses/mo`,
    `${TIERS.standard.creatives} ad creatives/mo`,
    `${TIERS.standard.campaigns} campaign`,
    `${TIERS.standard.channels} ad channel`,
    "Strategy & competitor analysis",
    "AI image ad creation",
    "Email support",
  ],
  pro: [
    `${TIERS.pro.messages} AI responses/mo`,
    `${TIERS.pro.creatives} ad creatives/mo`,
    `${TIERS.pro.campaigns} campaigns`,
    `${TIERS.pro.channels} ad channels`,
    "Blog article writing",
    "Cross-platform analytics",
    "A/B testing suggestions",
    "Email & phone support",
    "Onboarding call",
  ],
  enterprise: [
    "Everything in Pro, plus:",
    "Custom limits",
    "Multi-location support",
    "Multiple brands",
    "Custom integrations",
    "Dedicated support",
  ],
}

type FeatureRow =
  | { type: "limit"; label: string; standard: string; pro: string; enterprise: string }
  | { type: "feature"; label: string; standard: boolean; pro: boolean; enterprise: boolean }
  | { type: "divider" }

const features: FeatureRow[] = [
  { type: "limit", label: "AI responses", standard: `${TIERS.standard.messages}/mo`, pro: `${TIERS.pro.messages}/mo`, enterprise: "Custom" },
  { type: "limit", label: "Ad creatives", standard: `${TIERS.standard.creatives}/mo`, pro: `${TIERS.pro.creatives}/mo`, enterprise: "Custom" },
  { type: "limit", label: "Campaigns", standard: `${TIERS.standard.campaigns}/mo`, pro: `${TIERS.pro.campaigns}/mo`, enterprise: "Custom" },
  { type: "limit", label: "Ad channels", standard: `${TIERS.standard.channels}`, pro: `${TIERS.pro.channels}`, enterprise: "Custom" },
  { type: "limit", label: "Blog articles", standard: "—", pro: `${TIERS.pro.blogArticles}/mo`, enterprise: "Custom" },
  { type: "divider" },
  { type: "feature", label: "Business understanding & strategy", standard: true, pro: true, enterprise: true },
  { type: "feature", label: "Campaign themes & go-to-market plans", standard: true, pro: true, enterprise: true },
  { type: "feature", label: "Competitor strategy", standard: true, pro: true, enterprise: true },
  { type: "feature", label: "AI image ad creation", standard: true, pro: true, enterprise: true },
  { type: "feature", label: "Connects & runs ads on your platform", standard: true, pro: true, enterprise: true },
  { type: "feature", label: "Ad reporting", standard: true, pro: true, enterprise: true },
  { type: "divider" },
  { type: "feature", label: "Multiple ad platforms", standard: false, pro: true, enterprise: true },
  { type: "feature", label: "Blog article writing", standard: false, pro: true, enterprise: true },
  { type: "feature", label: "Cross-platform analytics", standard: false, pro: true, enterprise: true },
  { type: "feature", label: "ROI calculations", standard: false, pro: true, enterprise: true },
  { type: "feature", label: "A/B testing suggestions", standard: false, pro: true, enterprise: true },
  { type: "divider" },
  { type: "feature", label: "Multi-location support", standard: false, pro: false, enterprise: true },
  { type: "feature", label: "Multiple brands", standard: false, pro: false, enterprise: true },
  { type: "feature", label: "Custom integrations", standard: false, pro: false, enterprise: true },
]

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-white text-sm font-medium">{value}</span>
  }
  if (value) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#5B9BAA]/15">
        <Check className="w-3.5 h-3.5 text-[#5B9BAA]" />
      </span>
    )
  }
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/5">
      <X className="w-3.5 h-3.5 text-slate-600" />
    </span>
  )
}

export default function PricingPage() {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [loading, setLoading] = useState<string | null>(null)
  const [billing, setBilling] = useState<"annual" | "monthly">("annual")
  const [compareTab, setCompareTab] = useState<"agency" | "inhouse">("agency")
  const [agencySpend, setAgencySpend] = useState(3000)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, boolean>>({
    "Social Media Manager": true,
    "Paid Media Manager": true,
    "SEO Manager": true,
    "Content Creator": false,
  })

  async function handleCheckout(priceId: string) {
    if (!isSignedIn) {
      router.replace("/login")
      return
    }
    setLoading(priceId)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(null)
    }
  }

  const standardPrice = PRICES.standard[billing]
  const proPrice = PRICES.pro[billing]

  const ROLE_SALARIES: Record<string, number> = {
    "Social Media Manager": 32000,
    "Paid Media Manager": 38000,
    "SEO Manager": 35000,
    "Content Creator": 28000,
  }

  const spunAnnualCost = PRICES.pro.annual * 12
  const agencyAnnualCost = agencySpend * 12
  const inhouseCost = Object.entries(selectedRoles)
    .filter(([, selected]) => selected)
    .reduce((sum, [role]) => sum + ROLE_SALARIES[role], 0)
  const currentCost = compareTab === "agency" ? agencyAnnualCost : inhouseCost
  const savings = currentCost - spunAnnualCost
  const savingsPercent = currentCost > 0 ? Math.round((savings / currentCost) * 100) : 0

  return (
    <div className="min-h-screen bg-[var(--background-dark)] flex flex-col items-center px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8 space-y-3">
        <Link href="/" className="inline-block">
          <img
            src="/spun.gif"
            alt=""
            width={56}
            height={56}
            className="mx-auto rounded-2xl"
          />
          <img
            src={LOGO_SRC}
            alt=""
            className="mx-auto mt-3"
            style={{ height: 80 }}
          />
        </Link>
        <h1 className="text-white text-2xl font-semibold">Start Your 14 Day Free Trial</h1>
        <p className="text-slate-300 text-base max-w-md mx-auto">
          Cancel anytime before the 14 days are up. Credit card details required.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center gap-3 mb-8">
        <div className="inline-flex rounded-full p-1" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
          <button
            onClick={() => setBilling("monthly")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              billing === "monthly"
                ? "bg-[#5B9BAA] text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              billing === "annual"
                ? "bg-[#5B9BAA] text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Annual
          </button>
        </div>
        {billing === "annual" && (
          <span className="text-emerald-400 text-xs font-semibold">Save 20%</span>
        )}
      </div>

      {/* Pricing cards */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 items-start">
        {/* Standard */}
        <div
          className="rounded-2xl p-6 flex flex-col bg-[var(--background)] md:mt-6"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <h2 className="text-white text-lg font-semibold">Standard</h2>
          <div className="mt-4 mb-1">
            <span className="text-white text-4xl font-bold">£{standardPrice.toFixed(2)}</span>
            <span className="text-slate-400 text-sm ml-1">/mo</span>
          </div>
          {billing === "annual" && (
            <p className="text-slate-500 text-xs mb-4">Billed annually</p>
          )}
          {billing === "monthly" && (
            <p className="text-emerald-400/70 text-xs mb-4">
              £{PRICES.standard.annual.toFixed(2)}/mo billed annually
            </p>
          )}
          <button
            onClick={() => handleCheckout(TIERS.standard.priceId)}
            disabled={loading === TIERS.standard.priceId}
            className="w-full border border-[#5B9BAA] text-[#5B9BAA] hover:bg-[#5B9BAA]/10 font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-50 mb-6"
          >
            {loading === TIERS.standard.priceId ? "Redirecting…" : "Start free trial"}
          </button>
          <ul className="space-y-3 flex-1">
            {CARD_FEATURES.standard.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#5B9BAA]/15 mt-0.5 shrink-0">
                  <Check className="w-3 h-3 text-[#5B9BAA]" />
                </span>
                <span className="text-slate-300 text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div
          className="rounded-2xl p-6 flex flex-col bg-[#5B9BAA]/5 relative"
          style={{ border: "2px solid #5B9BAA" }}
        >
          <div className="absolute -top-0 left-1/2 -translate-x-1/2">
            <span className="bg-[#5B9BAA] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-b-lg">
              Most Popular
            </span>
          </div>
          <h2 className="text-white text-lg font-semibold">Pro</h2>
          <div className="mt-4 mb-1">
            <span className="text-white text-4xl font-bold">£{proPrice.toFixed(2)}</span>
            <span className="text-slate-400 text-sm ml-1">/mo</span>
          </div>
          {billing === "annual" && (
            <p className="text-slate-500 text-xs mb-4">Billed annually</p>
          )}
          {billing === "monthly" && (
            <p className="text-emerald-400/70 text-xs mb-4">
              £{PRICES.pro.annual.toFixed(2)}/mo billed annually
            </p>
          )}
          <button
            onClick={() => handleCheckout(TIERS.pro.priceId)}
            disabled={loading === TIERS.pro.priceId}
            className="w-full bg-[#5B9BAA] hover:bg-[#4d8a99] text-white font-semibold py-3 rounded-xl transition-colors text-sm disabled:opacity-50 mb-6"
          >
            {loading === TIERS.pro.priceId ? "Redirecting…" : "Start free trial"}
          </button>
          <ul className="space-y-3 flex-1">
            {CARD_FEATURES.pro.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#5B9BAA]/15 mt-0.5 shrink-0">
                  <Check className="w-3 h-3 text-[#5B9BAA]" />
                </span>
                <span className="text-slate-300 text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Enterprise */}
        <div
          className="rounded-2xl p-6 flex flex-col bg-[var(--background)] md:mt-6"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <h2 className="text-white text-lg font-semibold">Enterprise</h2>
          <div className="mt-4 mb-1">
            <span className="text-white text-4xl font-bold">POA</span>
          </div>
          <p className="text-slate-500 text-xs mb-4">Custom pricing</p>
          <a
            href="mailto:contact@spun.bot"
            className="w-full text-center border border-[#5B9BAA] text-[#5B9BAA] hover:bg-[#5B9BAA]/10 font-semibold py-3 rounded-xl transition-colors text-sm block mb-6"
          >
            Contact us
          </a>
          <ul className="space-y-3 flex-1">
            {CARD_FEATURES.enterprise.map((f, i) =>
              i === 0 ? (
                <li key={f} className="mb-1">
                  <span className="text-slate-300 text-sm font-medium">{f}</span>
                </li>
              ) : (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#5B9BAA]/15 mt-0.5 shrink-0">
                    <Check className="w-3 h-3 text-[#5B9BAA]" />
                  </span>
                  <span className="text-slate-300 text-sm">{f}</span>
                </li>
              )
            )}
          </ul>
        </div>
      </div>

      {/* ROI Calculator */}
      <div className="w-full max-w-5xl mb-16">
        <div className="text-center mb-8">
          <span className="inline-block bg-[#5B9BAA]/15 text-[#5B9BAA] text-xs font-semibold px-3 py-1 rounded-full mb-3">ROI Calculator</span>
          <h2 className="text-white text-2xl font-semibold">Calculate Your Savings</h2>
          <p className="text-slate-400 text-sm mt-2">See how much you could save by switching to Spun compared to your current marketing setup.</p>
        </div>
        <div
          className="rounded-2xl p-8 bg-[var(--background)]"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setCompareTab("agency")}
              className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium transition-all ${
                compareTab === "agency"
                  ? "text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              style={{
                border: compareTab === "agency" ? "2px solid #5B9BAA" : "1px solid rgba(255,255,255,0.1)",
                background: compareTab === "agency" ? "rgba(91,155,170,0.08)" : "transparent",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              Compare to Agency
            </button>
            <button
              onClick={() => setCompareTab("inhouse")}
              className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-medium transition-all ${
                compareTab === "inhouse"
                  ? "text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              style={{
                border: compareTab === "inhouse" ? "2px solid #5B9BAA" : "1px solid rgba(255,255,255,0.1)",
                background: compareTab === "inhouse" ? "rgba(91,155,170,0.08)" : "transparent",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Compare to In-House Team
            </button>
          </div>

          {/* Content area */}
          <div className="rounded-xl p-6 mb-8" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            {compareTab === "agency" ? (
              <div>
                <p className="text-white text-sm font-medium mb-5">What does your agency charge per month?</p>
                <input
                  type="range"
                  min={3000}
                  max={15000}
                  step={500}
                  value={agencySpend}
                  onChange={(e) => setAgencySpend(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #5B9BAA ${((agencySpend - 3000) / 12000) * 100}%, rgba(255,255,255,0.1) ${((agencySpend - 3000) / 12000) * 100}%)`,
                    accentColor: "#5B9BAA",
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-slate-500 text-xs">£3,000/mo</span>
                  <span className="text-white text-xl font-bold">£{agencySpend.toLocaleString()}/mo</span>
                  <span className="text-slate-500 text-xs">£15,000/mo</span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-white text-sm font-medium mb-5">Which roles would you hire in-house? (Select all that apply)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(ROLE_SALARIES).map(([role, salary]) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRoles(prev => ({ ...prev, [role]: !prev[role] }))}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                      style={{
                        border: selectedRoles[role] ? "2px solid #5B9BAA" : "1px solid rgba(255,255,255,0.1)",
                        background: selectedRoles[role] ? "rgba(91,155,170,0.08)" : "transparent",
                      }}
                    >
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                          selectedRoles[role] ? "bg-[#5B9BAA]" : ""
                        }`}
                        style={selectedRoles[role] ? {} : { border: "1px solid rgba(255,255,255,0.2)" }}
                      >
                        {selectedRoles[role] && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span className="text-white text-sm font-medium flex-1">{role}</span>
                      <span className="text-slate-400 text-sm">£{salary.toLocaleString()}/yr</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl p-5" style={{ border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)" }}>
              <p className="text-slate-400 text-xs mb-2 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-red-500/15 flex items-center justify-center">
                  <span className="text-red-400 text-xs font-bold">£</span>
                </span>
                {compareTab === "agency" ? "Agency Cost" : "In-House Cost"}
              </p>
              <p className="text-red-400 text-2xl font-bold">£{currentCost.toLocaleString()}</p>
              <p className="text-slate-500 text-xs mt-1">per year</p>
            </div>
            <div className="rounded-xl p-5" style={{ border: "1px solid rgba(91,155,170,0.2)", background: "rgba(91,155,170,0.05)" }}>
              <p className="text-slate-400 text-xs mb-2 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-[#5B9BAA]/15 flex items-center justify-center">
                  <span className="text-[#5B9BAA] text-xs font-bold">~</span>
                </span>
                Spun Pro Plan
              </p>
              <p className="text-[#5B9BAA] text-2xl font-bold">£{spunAnnualCost.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</p>
              <p className="text-slate-500 text-xs mt-1">per year</p>
            </div>
            <div className="rounded-xl p-5 bg-[#5B9BAA]">
              <p className="text-white/80 text-xs mb-2 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">%</span>
                </span>
                Your Annual Savings
              </p>
              <p className="text-white text-2xl font-bold">£{Math.max(0, savings).toLocaleString()}</p>
              {savings > 0 && (
                <p className="text-white/80 text-xs mt-1">That&apos;s {savingsPercent}% less!</p>
              )}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => handleCheckout(TIERS.pro.priceId)}
              className="bg-[#5B9BAA] hover:bg-[#4d8a99] text-white font-semibold py-3 px-8 rounded-xl transition-colors text-sm inline-flex items-center gap-2"
            >
              Start Saving Today
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
            <p className="text-slate-500 text-xs mt-3">14-day free trial. Cancel anytime.</p>
          </div>
        </div>
      </div>

      {/* Compare Plans */}
      <div className="w-full max-w-5xl mb-16">
        <div className="text-center mb-8">
          <h2 className="text-white text-2xl font-semibold">Compare Plans</h2>
        </div>
        <div className="bg-[var(--background)] rounded-2xl overflow-x-auto" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          {/* Tier headers */}
          <div className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] min-w-[640px]" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="p-6" />
            <div className="p-6 text-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 className="text-white text-base font-semibold">Standard</h3>
            </div>
            <div className="p-6 text-center bg-[#5B9BAA]/5" style={{ borderLeft: "1px solid rgba(91,155,170,0.2)" }}>
              <h3 className="text-white text-base font-semibold">Pro</h3>
            </div>
            <div className="p-6 text-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 className="text-white text-base font-semibold">Enterprise</h3>
            </div>
          </div>

          {/* Feature rows */}
          {features.map((row, i) => {
            if (row.type === "divider") {
              return <div key={`div-${i}`} className="min-w-[640px]" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }} />
            }

            return (
              <div
                key={row.label}
                className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] min-w-[640px] hover:bg-white/[0.02] transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div className="px-6 py-3 flex items-center">
                  <span className="text-slate-300 text-sm">{row.label}</span>
                </div>
                <div className="px-6 py-3 flex items-center justify-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
                  <FeatureValue value={row.standard} />
                </div>
                <div className="px-6 py-3 flex items-center justify-center bg-[#5B9BAA]/[0.02]" style={{ borderLeft: "1px solid rgba(91,155,170,0.08)" }}>
                  <FeatureValue value={row.pro} />
                </div>
                <div className="px-6 py-3 flex items-center justify-center" style={{ borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
                  <FeatureValue value={row.enterprise} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Credit pack section */}
      <div className="w-full max-w-5xl mb-10">
        <div className="rounded-2xl p-8 text-center bg-[var(--background)]" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 className="text-white text-lg font-semibold mb-2">Need more?</h3>
          <p className="text-slate-300 text-sm mb-4">
            Top up anytime with a credit pack. Credits never expire and stack with your monthly allowance.
          </p>
          <div className="flex justify-center gap-6 mb-4">
            <div className="text-center">
              <span className="text-white text-2xl font-bold">+{CREDIT_PACK.messageCredits}</span>
              <p className="text-slate-400 text-xs mt-1">AI responses</p>
            </div>
            <div className="text-center">
              <span className="text-white text-2xl font-bold">+{CREDIT_PACK.creativeCredits}</span>
              <p className="text-slate-400 text-xs mt-1">creatives</p>
            </div>
            <div className="text-center">
              <span className="text-white text-2xl font-bold">+{CREDIT_PACK.channelCredits}</span>
              <p className="text-slate-400 text-xs mt-1">ad channel</p>
            </div>
          </div>
          <p className="text-[#5B9BAA] text-xl font-bold">
            £{(CREDIT_PACK.price / 100).toFixed(2)} <span className="text-slate-400 text-sm font-normal">one-time</span>
          </p>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-slate-500 text-sm mt-2 mb-6 text-center max-w-md">
        Secure payments powered by Stripe. Cancel anytime. All plans include a 14-day free trial.
      </p>
    </div>
  )
}
