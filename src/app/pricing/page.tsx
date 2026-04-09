"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { Check, X } from "lucide-react"
import { LOGO_SRC } from "@/lib/logo"
import { TIERS, CREDIT_PACK } from "@/lib/billing/tiers"

type FeatureRow =
  | { type: "limit"; label: string; standard: string; pro: string; enterprise: string }
  | { type: "feature"; label: string; standard: boolean; pro: boolean; enterprise: boolean }
  | { type: "divider" }

const features: FeatureRow[] = [
  // Limits
  { type: "limit", label: "AI responses", standard: `${TIERS.standard.messages}/mo`, pro: `${TIERS.pro.messages}/mo`, enterprise: "Custom" },
  { type: "limit", label: "Ad creatives", standard: `${TIERS.standard.creatives}/mo`, pro: `${TIERS.pro.creatives}/mo`, enterprise: "Custom" },
  { type: "limit", label: "Campaigns", standard: `${TIERS.standard.campaigns}/mo`, pro: `${TIERS.pro.campaigns}/mo`, enterprise: "Custom" },
  { type: "limit", label: "Ad channels", standard: `${TIERS.standard.channels}`, pro: `${TIERS.pro.channels}`, enterprise: "Custom" },
  { type: "limit", label: "Blog articles", standard: "—", pro: `${TIERS.pro.blogArticles}/mo`, enterprise: "Custom" },
  { type: "divider" },
  // Features
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

      {/* Pricing table */}
      <div className="w-full max-w-4xl">
        <div className="bg-[var(--background)] border border-white/10 rounded-2xl overflow-hidden">

          {/* Tier headers */}
          <div className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] border-b border-white/10">
            {/* Empty label cell */}
            <div className="p-6" />

            {/* Standard */}
            <div className="p-6 text-center border-l border-white/10">
              <h2 className="text-white text-lg font-semibold">Standard</h2>
              <div className="mt-2">
                <span className="text-white text-3xl font-bold">£69.99</span>
                <span className="text-slate-400 text-sm">/mo</span>
              </div>
              <button
                onClick={() => handleCheckout(TIERS.standard.priceId)}
                disabled={loading === TIERS.standard.priceId}
                className="mt-4 w-full bg-[#5B9BAA] hover:bg-[#4d8a99] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                {loading === TIERS.standard.priceId ? "Redirecting…" : "Start free trial"}
              </button>
            </div>

            {/* Pro */}
            <div className="p-6 text-center border-l border-[#5B9BAA]/30 bg-[#5B9BAA]/5 relative">
              <div className="absolute -top-0 left-1/2 -translate-x-1/2">
                <span className="bg-[#5B9BAA] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-b-lg">
                  Popular
                </span>
              </div>
              <h2 className="text-white text-lg font-semibold">Pro</h2>
              <div className="mt-2">
                <span className="text-white text-3xl font-bold">£119.99</span>
                <span className="text-slate-400 text-sm">/mo</span>
              </div>
              <button
                onClick={() => handleCheckout(TIERS.pro.priceId)}
                disabled={loading === TIERS.pro.priceId}
                className="mt-4 w-full bg-[#5B9BAA] hover:bg-[#4d8a99] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                {loading === TIERS.pro.priceId ? "Redirecting…" : "Start free trial"}
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-6 text-center border-l border-white/10">
              <h2 className="text-white text-lg font-semibold">Enterprise</h2>
              <div className="mt-2">
                <span className="text-white text-3xl font-bold">POA</span>
              </div>
              <a
                href="mailto:contact@spun.bot"
                className="mt-4 w-full border border-[#5B9BAA] text-[#5B9BAA] hover:bg-[#5B9BAA]/10 font-semibold py-2.5 rounded-xl transition-colors text-sm text-center block"
              >
                Contact us
              </a>
            </div>
          </div>

          {/* Feature rows */}
          {features.map((row, i) => {
            if (row.type === "divider") {
              return <div key={`div-${i}`} className="border-t border-white/10" />
            }

            return (
              <div
                key={row.label}
                className="grid grid-cols-[1fr_repeat(3,minmax(0,1fr))] border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors"
              >
                <div className="px-6 py-3 flex items-center">
                  <span className="text-slate-300 text-sm">{row.label}</span>
                </div>
                <div className="px-6 py-3 flex items-center justify-center border-l border-white/5">
                  <FeatureValue value={row.standard} />
                </div>
                <div className="px-6 py-3 flex items-center justify-center border-l border-[#5B9BAA]/10 bg-[#5B9BAA]/[0.02]">
                  <FeatureValue value={row.pro} />
                </div>
                <div className="px-6 py-3 flex items-center justify-center border-l border-white/5">
                  <FeatureValue value={row.enterprise} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Credit pack section */}
      <div className="w-full max-w-4xl mt-10">
        <div className="bg-[var(--background)] border border-white/10 rounded-2xl p-8 text-center">
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

      {/* Payment recommendation note */}
      <p className="text-slate-500 text-sm mt-12 text-center max-w-md">
        Secure payments powered by Stripe. Cancel anytime. All plans include a 14-day free trial.
      </p>
    </div>
  )
}
