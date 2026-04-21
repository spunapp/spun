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
  ],
  pro: [
    `${TIERS.pro.messages} AI responses/mo`,
    `${TIERS.pro.creatives} ad creatives/mo`,
    `${TIERS.pro.campaigns} campaigns`,
    `${TIERS.pro.channels} ad channels`,
    "Blog article writing",
    "Cross-platform analytics",
    "A/B testing suggestions",
  ],
  enterprise: [
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
  const [adSpend, setAdSpend] = useState(1000)
  const [roiPlan, setRoiPlan] = useState<"standard" | "pro">("standard")

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

  const planCost = roiPlan === "standard" ? PRICES.standard.annual : PRICES.pro.annual
  const leads = Math.round(adSpend * 0.03)
  const revenue = leads * 150
  const totalCost = adSpend + planCost
  const roi = totalCost > 0 ? Math.round(((revenue - totalCost) / totalCost) * 100) : 0

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
            {CARD_FEATURES.enterprise.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#5B9BAA]/15 mt-0.5 shrink-0">
                  <Check className="w-3 h-3 text-[#5B9BAA]" />
                </span>
                <span className="text-slate-300 text-sm">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ROI Calculator */}
      <div className="w-full max-w-5xl mb-16">
        <div className="text-center mb-8">
          <h2 className="text-white text-2xl font-semibold">Calculate Your ROI</h2>
          <p className="text-slate-400 text-sm mt-2">See what Spun could deliver for your business</p>
        </div>
        <div
          className="rounded-2xl p-8 bg-[var(--background)]"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-slate-300 text-sm font-medium">Monthly ad spend</label>
                  <span className="text-white text-lg font-bold">£{adSpend.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={10000}
                  step={500}
                  value={adSpend}
                  onChange={(e) => setAdSpend(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #5B9BAA ${((adSpend - 500) / 9500) * 100}%, rgba(255,255,255,0.1) ${((adSpend - 500) / 9500) * 100}%)`,
                    accentColor: "#5B9BAA",
                  }}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500 text-xs">£500</span>
                  <span className="text-slate-500 text-xs">£10,000</span>
                </div>
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-3">Your plan</label>
                <div className="inline-flex rounded-full p-1" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
                  <button
                    onClick={() => setRoiPlan("standard")}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      roiPlan === "standard"
                        ? "bg-[#5B9BAA] text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setRoiPlan("pro")}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      roiPlan === "pro"
                        ? "bg-[#5B9BAA] text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Pro
                  </button>
                </div>
              </div>
            </div>

            {/* Outputs */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl p-4 text-center" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                <p className="text-slate-400 text-xs mb-2">Est. leads/mo</p>
                <p className="text-white text-2xl font-bold">{leads}</p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
                <p className="text-slate-400 text-xs mb-2">Est. revenue/mo</p>
                <p className="text-white text-2xl font-bold">£{revenue.toLocaleString()}</p>
              </div>
              <div className="rounded-xl p-4 text-center" style={{ border: "1px solid rgba(91,155,170,0.2)", background: "rgba(91,155,170,0.08)" }}>
                <p className="text-slate-400 text-xs mb-2">Est. ROI</p>
                <p className="text-[#5B9BAA] text-2xl font-bold">{roi}%</p>
              </div>
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-6 text-center">
            Based on average conversion rates across SMB advertisers. Your results may vary.
          </p>
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
