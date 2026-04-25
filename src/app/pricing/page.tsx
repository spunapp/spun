"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Check, X, ArrowRight } from "lucide-react"
import { MarketingShell } from "@/components/landing/MarketingShell"
import { TIERS, CREDIT_PACK } from "@/lib/billing/tiers"
import { useCurrency } from "@/lib/currency/context"

// Base prices in GBP. Displayed values are converted to the viewer's local
// currency via the currency context.
const PRICES_GBP = {
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
    "Everything in Growth, plus:",
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
    return <span className="text-gray-900 text-sm font-medium">{value}</span>
  }
  if (value) {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-spun-50">
        <Check className="w-3.5 h-3.5 text-spun" />
      </span>
    )
  }
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-grid">
      <X className="w-3.5 h-3.5 text-gray-400" />
    </span>
  )
}

export default function PricingPage() {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const { format, formatFromGBP, convertFromGBP } = useCurrency()
  const [loading, setLoading] = useState<string | null>(null)
  const [billing, setBilling] = useState<"annual" | "monthly">("annual")
  const [compareTab, setCompareTab] = useState<"agency" | "inhouse">("agency")
  // Agency spend slider is in the viewer's own currency. Convert the GBP
  // range (3,000–15,000) into their currency so the slider stays in a
  // locally-meaningful range.
  const agencyMinLocal = Math.round(convertFromGBP(3000))
  const agencyMaxLocal = Math.round(convertFromGBP(15000))
  const agencyStepLocal = Math.max(1, Math.round(convertFromGBP(500)))
  const [agencySpend, setAgencySpend] = useState(agencyMinLocal)
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

  const standardPriceGBP = PRICES_GBP.standard[billing]
  const proPriceGBP = PRICES_GBP.pro[billing]

  // Salaries are GBP-denominated benchmarks; we convert for display only.
  const ROLE_SALARIES_GBP: Record<string, number> = {
    "Social Media Manager": 32000,
    "Paid Media Manager": 38000,
    "SEO Manager": 35000,
    "Content Creator": 28000,
  }

  const spunAnnualCostLocal = convertFromGBP(PRICES_GBP.pro.annual * 12)
  const agencyAnnualCostLocal = agencySpend * 12
  const inhouseCostLocal = Object.entries(selectedRoles)
    .filter(([, selected]) => selected)
    .reduce((sum, [role]) => sum + convertFromGBP(ROLE_SALARIES_GBP[role]), 0)
  const currentCostLocal = compareTab === "agency" ? agencyAnnualCostLocal : inhouseCostLocal
  const savingsLocal = currentCostLocal - spunAnnualCostLocal
  const savingsPercent = currentCostLocal > 0 ? Math.round((savingsLocal / currentCostLocal) * 100) : 0

  return (
    <MarketingShell>
      {/* Hero */}
      <section className="bg-surface">
        <div className="mx-4 md:mx-16 lg:mx-20">
          <div className="px-4 md:px-14 lg:px-20 pt-20 pb-10">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] mb-3 font-mono">
                Pricing
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-[44px] font-bold tracking-tight text-gray-900 leading-[1.1]">
                Start your 5-day free trial
              </h1>
              <p className="mt-5 text-gray-500 text-[15px] leading-relaxed">
                Cancel anytime before the 5 days are up. Credit card details
                required.
              </p>
            </div>

            {/* Billing toggle */}
            <div className="mt-10 flex items-center justify-center gap-3">
              <div className="inline-flex rounded-full p-1 border border-grid bg-white">
                <button
                  onClick={() => setBilling("monthly")}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                    billing === "monthly"
                      ? "bg-spun text-white"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling("annual")}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                    billing === "annual"
                      ? "bg-spun text-white"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Annual
                </button>
              </div>
              {billing === "annual" && (
                <span className="text-spun text-xs font-semibold">Save 20%</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="bg-surface">
        <div className="mx-4 md:mx-16 lg:mx-20">
          <div className="h-px bg-ruler" />
          <div className="px-4 md:px-14 lg:px-20 py-16">
            <div className="grid md:grid-cols-3 gap-px bg-grid border border-grid">
              {/* Standard */}
              <div className="p-8 flex flex-col bg-white">
                <h2 className="text-lg font-bold text-gray-900">Starter</h2>
                <p className="text-[13px] text-gray-500 mt-1">For getting started</p>
                <div className="mt-6 mb-1">
                  <span className="text-3xl font-bold text-gray-900">{formatFromGBP(standardPriceGBP)}</span>
                  <span className="text-[13px] text-gray-400 ml-1">/mo</span>
                </div>
                {billing === "annual" && (
                  <p className="text-gray-400 text-xs mb-6">Billed annually</p>
                )}
                {billing === "monthly" && (
                  <p className="text-spun text-xs mb-6">
                    {formatFromGBP(PRICES_GBP.standard.annual)}/mo billed annually
                  </p>
                )}
                <button
                  onClick={() => handleCheckout(TIERS.standard.priceId)}
                  disabled={loading === TIERS.standard.priceId}
                  className="w-full border border-grid hover:border-gray-300 bg-white text-gray-700 font-medium py-2.5 rounded-md text-[13px] transition disabled:opacity-50 mb-6"
                >
                  {loading === TIERS.standard.priceId ? "Redirecting…" : "Start free trial"}
                </button>
                <ul className="space-y-3 flex-1">
                  {CARD_FEATURES.standard.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px]">
                      <Check className="mt-0.5 shrink-0 w-3.5 h-3.5 text-gray-300" strokeWidth={2} />
                      <span className="text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pro */}
              <div className="p-8 flex flex-col bg-spun-50/50 relative">
                <p className="text-[10px] font-semibold text-spun uppercase tracking-[0.15em] mb-4">
                  Most popular
                </p>
                <h2 className="text-lg font-bold text-gray-900">Growth</h2>
                <p className="text-[13px] text-gray-500 mt-1">Full marketing on autopilot</p>
                <div className="mt-6 mb-1">
                  <span className="text-3xl font-bold text-gray-900">{formatFromGBP(proPriceGBP)}</span>
                  <span className="text-[13px] text-gray-400 ml-1">/mo</span>
                </div>
                {billing === "annual" && (
                  <p className="text-gray-400 text-xs mb-6">Billed annually</p>
                )}
                {billing === "monthly" && (
                  <p className="text-spun text-xs mb-6">
                    {formatFromGBP(PRICES_GBP.pro.annual)}/mo billed annually
                  </p>
                )}
                <button
                  onClick={() => handleCheckout(TIERS.pro.priceId)}
                  disabled={loading === TIERS.pro.priceId}
                  className="w-full bg-spun hover:bg-spun-dark text-white font-medium py-2.5 rounded-md text-[13px] transition disabled:opacity-50 mb-6"
                >
                  {loading === TIERS.pro.priceId ? "Redirecting…" : "Start free trial"}
                </button>
                <ul className="space-y-3 flex-1">
                  {CARD_FEATURES.pro.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px]">
                      <Check className="mt-0.5 shrink-0 w-3.5 h-3.5 text-spun" strokeWidth={2} />
                      <span className="text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Enterprise */}
              <div className="p-8 flex flex-col bg-white">
                <h2 className="text-lg font-bold text-gray-900">Enterprise</h2>
                <p className="text-[13px] text-gray-500 mt-1">Custom solutions</p>
                <div className="mt-6 mb-1">
                  <span className="text-3xl font-bold text-gray-900">POA</span>
                </div>
                <p className="text-gray-400 text-xs mb-6">Custom pricing</p>
                <a
                  href="mailto:contact@spun.bot"
                  className="w-full text-center border border-grid hover:border-gray-300 bg-white text-gray-700 font-medium py-2.5 rounded-md text-[13px] transition block mb-6"
                >
                  Contact us
                </a>
                <ul className="space-y-3 flex-1">
                  {CARD_FEATURES.enterprise.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13px]">
                      <Check className="mt-0.5 shrink-0 w-3.5 h-3.5 text-gray-300" strokeWidth={2} />
                      <span className="text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="bg-surface">
        <div className="mx-4 md:mx-16 lg:mx-20">
          <div className="h-px bg-ruler" />
          <div className="px-4 md:px-14 lg:px-20 py-16">
            <div className="max-w-4xl mx-auto">
              <div className="mb-10 text-center">
                <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] mb-3 font-mono">
                  ROI Calculator
                </p>
                <h2 className="text-2xl md:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight">
                  Calculate your savings
                </h2>
                <p className="mt-3 text-gray-500 text-[15px]">
                  See how much you could save by switching to Spun compared to
                  your current setup.
                </p>
              </div>

              <div className="bg-white border border-grid rounded-md p-8">
                {/* Tabs */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <button
                    onClick={() => setCompareTab("agency")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition border ${
                      compareTab === "agency"
                        ? "border-spun bg-spun-50/50 text-gray-900"
                        : "border-grid bg-white text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    Compare to agency
                  </button>
                  <button
                    onClick={() => setCompareTab("inhouse")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition border ${
                      compareTab === "inhouse"
                        ? "border-spun bg-spun-50/50 text-gray-900"
                        : "border-grid bg-white text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Compare to in-house team
                  </button>
                </div>

                {/* Content */}
                <div className="rounded-md p-6 mb-6 border border-grid bg-surface-alt">
                  {compareTab === "agency" ? (
                    <div>
                      <p className="text-gray-900 text-sm font-medium mb-5">
                        What does your agency charge per month?
                      </p>
                      <input
                        type="range"
                        min={agencyMinLocal}
                        max={agencyMaxLocal}
                        step={agencyStepLocal}
                        value={agencySpend}
                        onChange={(e) => setAgencySpend(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #075E54 ${((agencySpend - agencyMinLocal) / Math.max(1, agencyMaxLocal - agencyMinLocal)) * 100}%, #ECEEF0 ${((agencySpend - agencyMinLocal) / Math.max(1, agencyMaxLocal - agencyMinLocal)) * 100}%)`,
                          accentColor: "#075E54",
                        }}
                      />
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-gray-400 text-xs">{format(agencyMinLocal, { whole: true })}/mo</span>
                        <span className="text-gray-900 text-xl font-bold">{format(agencySpend, { whole: true })}/mo</span>
                        <span className="text-gray-400 text-xs">{format(agencyMaxLocal, { whole: true })}/mo</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-900 text-sm font-medium mb-5">
                        Which roles would you hire in-house? (Select all that apply)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(ROLE_SALARIES_GBP).map(([role, salary]) => (
                          <button
                            key={role}
                            onClick={() => setSelectedRoles((prev) => ({ ...prev, [role]: !prev[role] }))}
                            className={`flex items-center gap-3 px-4 py-3 rounded-md text-left transition border ${
                              selectedRoles[role]
                                ? "border-spun bg-spun-50/50"
                                : "border-grid bg-white"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                                selectedRoles[role]
                                  ? "bg-spun"
                                  : "border border-grid bg-white"
                              }`}
                            >
                              {selectedRoles[role] && <Check className="w-3 h-3 text-white" />}
                            </span>
                            <span className="text-gray-900 text-sm font-medium flex-1">{role}</span>
                            <span className="text-gray-500 text-sm">{formatFromGBP(salary, { whole: true })}/yr</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Results */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <div className="rounded-md p-5 border border-red-200 bg-red-50">
                    <p className="text-gray-500 text-xs mb-2 flex items-center gap-1.5">
                      {compareTab === "agency" ? "Agency cost" : "In-house cost"}
                    </p>
                    <p className="text-red-600 text-2xl font-bold">{format(currentCostLocal, { whole: true })}</p>
                    <p className="text-gray-400 text-xs mt-1">per year</p>
                  </div>
                  <div className="rounded-md p-5 border border-grid bg-surface-alt">
                    <p className="text-gray-500 text-xs mb-2">Spun Growth plan</p>
                    <p className="text-gray-900 text-2xl font-bold">{format(spunAnnualCostLocal, { whole: true })}</p>
                    <p className="text-gray-400 text-xs mt-1">per year</p>
                  </div>
                  <div className="rounded-md p-5 bg-spun">
                    <p className="text-white/80 text-xs mb-2">Your annual savings</p>
                    <p className="text-white text-2xl font-bold">{format(Math.max(0, savingsLocal), { whole: true })}</p>
                    {savingsLocal > 0 && (
                      <p className="text-white/80 text-xs mt-1">That&apos;s {savingsPercent}% less</p>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => handleCheckout(TIERS.pro.priceId)}
                    className="inline-flex items-center gap-2 bg-spun hover:bg-spun-dark text-white font-medium py-3 px-7 rounded-md text-sm transition"
                  >
                    Start saving today
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-gray-400 text-xs mt-3">5-day free trial. Cancel anytime.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compare plans */}
      <section className="bg-surface">
        <div className="mx-4 md:mx-16 lg:mx-20">
          <div className="h-px bg-ruler" />
          <div className="px-4 md:px-14 lg:px-20 py-16">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] mb-3 font-mono">
                  Compare plans
                </p>
                <h2 className="text-2xl md:text-3xl lg:text-[36px] font-bold text-gray-900 tracking-tight">
                  Every feature, side by side
                </h2>
              </div>

              <div className="bg-white border border-grid rounded-md overflow-x-auto">
                <div className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] min-w-[640px] border-b border-grid">
                  <div className="p-6" />
                  <div className="p-6 text-center border-l border-grid">
                    <h3 className="text-gray-900 text-base font-semibold">Starter</h3>
                  </div>
                  <div className="p-6 text-center border-l border-grid bg-spun-50/40">
                    <h3 className="text-gray-900 text-base font-semibold">Growth</h3>
                  </div>
                  <div className="p-6 text-center border-l border-grid">
                    <h3 className="text-gray-900 text-base font-semibold">Enterprise</h3>
                  </div>
                </div>

                {features.map((row, i) => {
                  if (row.type === "divider") {
                    return <div key={`div-${i}`} className="min-w-[640px] border-t border-grid" />
                  }

                  return (
                    <div
                      key={row.label}
                      className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] min-w-[640px] hover:bg-surface-alt transition-colors border-b border-grid"
                    >
                      <div className="px-6 py-3 flex items-center">
                        <span className="text-gray-700 text-sm">{row.label}</span>
                      </div>
                      <div className="px-6 py-3 flex items-center justify-center border-l border-grid">
                        <FeatureValue value={row.standard} />
                      </div>
                      <div className="px-6 py-3 flex items-center justify-center bg-spun-50/20 border-l border-grid">
                        <FeatureValue value={row.pro} />
                      </div>
                      <div className="px-6 py-3 flex items-center justify-center border-l border-grid">
                        <FeatureValue value={row.enterprise} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credit pack */}
      <section className="bg-surface">
        <div className="mx-4 md:mx-16 lg:mx-20">
          <div className="h-px bg-ruler" />
          <div className="px-4 md:px-14 lg:px-20 py-16">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white border border-grid rounded-md p-8 text-center">
                <h3 className="text-gray-900 text-lg font-bold mb-2">Need more?</h3>
                <p className="text-gray-500 text-[14px] mb-6">
                  Top up anytime with a credit pack. Credits never expire and
                  stack with your monthly allowance.
                </p>
                <div className="flex justify-center gap-8 mb-6">
                  <div className="text-center">
                    <span className="text-gray-900 text-2xl font-bold">+{CREDIT_PACK.messageCredits}</span>
                    <p className="text-gray-400 text-xs mt-1">AI responses</p>
                  </div>
                  <div className="text-center">
                    <span className="text-gray-900 text-2xl font-bold">+{CREDIT_PACK.creativeCredits}</span>
                    <p className="text-gray-400 text-xs mt-1">creatives</p>
                  </div>
                  <div className="text-center">
                    <span className="text-gray-900 text-2xl font-bold">+{CREDIT_PACK.channelCredits}</span>
                    <p className="text-gray-400 text-xs mt-1">ad channel</p>
                  </div>
                </div>
                <p className="text-spun text-xl font-bold">
                  {formatFromGBP(CREDIT_PACK.price / 100)}{" "}
                  <span className="text-gray-400 text-sm font-normal">one-time</span>
                </p>
              </div>

              <p className="text-gray-400 text-sm mt-8 text-center max-w-md mx-auto">
                Secure payments powered by Stripe. Cancel anytime. All plans
                include a 5-day free trial.
              </p>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
