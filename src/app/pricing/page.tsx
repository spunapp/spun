"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import { Check } from "lucide-react"
import { LOGO_SRC } from "@/lib/logo"
import { TIERS, CREDIT_PACK } from "@/lib/billing/tiers"

const standardBenefits = [
  "Complete understanding of your business",
  "Builds a campaign theme",
  "Develops a Go To Market Strategy",
  "Develops a Competitor strategy",
  "Suggests most appropriate advertising channel based on information provided",
  "Creates image ads",
  "Connects to chosen ad platform and runs ad campaigns for you",
  "Full ad reporting",
]

const proBenefits = [
  "Writes blog articles",
  "Advertises on multiple ad platforms",
  "Multi platform and website traffic and blog article readership reporting",
  "ROI Calculations",
]

const enterpriseBenefits = [
  "Custom solutions for enterprise clients based on specific needs such as multi location or multiple brands under one umbrella organisation",
]

function BenefitItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <Check className="w-4 h-4 text-[#5B9BAA] mt-0.5 shrink-0" />
      <span className="text-slate-300 text-sm leading-snug">{text}</span>
    </li>
  )
}

function InheritedLabel({ from }: { from: string }) {
  return (
    <p className="text-xs font-semibold text-[#5B9BAA] uppercase tracking-wider mb-3">
      Everything in {from}, plus:
    </p>
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
      <div className="text-center mb-6 space-y-3">
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

      {/* Pricing columns */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

        {/* Standard */}
        <div className="bg-[var(--background)] border border-white/10 rounded-2xl p-8 flex flex-col">
          <div className="mb-6">
            <h2 className="text-white text-xl font-semibold mb-1">Standard</h2>
            <div className="flex items-end gap-1 mt-3">
              <span className="text-white text-4xl font-bold">£69.99</span>
              <span className="text-slate-400 text-sm mb-1">/month</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-white/5 text-slate-300 px-2 py-1 rounded-md">{TIERS.standard.messages} AI responses/mo</span>
              <span className="text-xs bg-white/5 text-slate-300 px-2 py-1 rounded-md">{TIERS.standard.creatives} creatives/mo</span>
              <span className="text-xs bg-white/5 text-slate-300 px-2 py-1 rounded-md">{TIERS.standard.channels} ad channel</span>
              <span className="text-xs bg-white/5 text-slate-300 px-2 py-1 rounded-md">{TIERS.standard.campaigns} campaign/mo</span>
            </div>
          </div>

          <button
            onClick={() => handleCheckout(TIERS.standard.priceId)}
            disabled={loading === TIERS.standard.priceId}
            className="w-full bg-[#5B9BAA] hover:bg-[#4d8a99] text-white font-semibold py-3 rounded-xl transition-colors mb-8 disabled:opacity-50"
          >
            {loading === TIERS.standard.priceId ? "Redirecting…" : "Start your 14 day free trial"}
          </button>

          <ul className="space-y-3">
            {standardBenefits.map((b) => (
              <BenefitItem key={b} text={b} />
            ))}
          </ul>
        </div>

        {/* Pro — highlighted */}
        <div className="bg-[var(--background)] border-2 border-[#5B9BAA] rounded-2xl p-8 flex flex-col shadow-[0_0_40px_rgba(91,155,170,0.15)] relative md:-mt-2">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-[#5B9BAA] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
              Most Popular
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-white text-xl font-semibold mb-1">Pro</h2>
            <div className="flex items-end gap-1 mt-3">
              <span className="text-white text-4xl font-bold">£119.99</span>
              <span className="text-slate-400 text-sm mb-1">/month</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-[#5B9BAA]/10 text-[#5B9BAA] px-2 py-1 rounded-md">{TIERS.pro.messages} AI responses/mo</span>
              <span className="text-xs bg-[#5B9BAA]/10 text-[#5B9BAA] px-2 py-1 rounded-md">{TIERS.pro.creatives} creatives/mo</span>
              <span className="text-xs bg-[#5B9BAA]/10 text-[#5B9BAA] px-2 py-1 rounded-md">{TIERS.pro.blogArticles} blog articles/mo</span>
              <span className="text-xs bg-[#5B9BAA]/10 text-[#5B9BAA] px-2 py-1 rounded-md">{TIERS.pro.channels} ad channels</span>
              <span className="text-xs bg-[#5B9BAA]/10 text-[#5B9BAA] px-2 py-1 rounded-md">{TIERS.pro.campaigns} campaigns/mo</span>
            </div>
          </div>

          <button
            onClick={() => handleCheckout(TIERS.pro.priceId)}
            disabled={loading === TIERS.pro.priceId}
            className="w-full bg-[#5B9BAA] hover:bg-[#4d8a99] text-white font-semibold py-3 rounded-xl transition-colors mb-8 disabled:opacity-50"
          >
            {loading === TIERS.pro.priceId ? "Redirecting…" : "Start your 14 day free trial"}
          </button>

          <InheritedLabel from="Standard" />
          <ul className="space-y-3">
            {proBenefits.map((b) => (
              <BenefitItem key={b} text={b} />
            ))}
          </ul>
        </div>

        {/* Enterprise */}
        <div className="bg-[var(--background)] border border-white/10 rounded-2xl p-8 flex flex-col">
          <div className="mb-6">
            <h2 className="text-white text-xl font-semibold mb-1">Enterprise</h2>
            <div className="flex items-end gap-1 mt-3">
              <span className="text-white text-4xl font-bold">POA</span>
            </div>
            <p className="text-slate-400 text-sm mt-1">Price on application</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs bg-white/5 text-slate-300 px-2 py-1 rounded-md">Unlimited responses</span>
              <span className="text-xs bg-white/5 text-slate-300 px-2 py-1 rounded-md">Unlimited creatives</span>
              <span className="text-xs bg-white/5 text-slate-300 px-2 py-1 rounded-md">Unlimited channels</span>
            </div>
          </div>

          <a
            href="mailto:contact@spun.bot"
            className="w-full border border-[#5B9BAA] text-[#5B9BAA] hover:bg-[#5B9BAA]/10 font-semibold py-3 rounded-xl transition-colors mb-8 text-center block"
          >
            Contact us
          </a>

          <InheritedLabel from="Pro" />
          <ul className="space-y-3">
            {enterpriseBenefits.map((b) => (
              <BenefitItem key={b} text={b} />
            ))}
          </ul>
        </div>
      </div>

      {/* Credit pack section */}
      <div className="w-full max-w-5xl mt-10">
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
