"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ArrowRight } from "lucide-react"
import { MarketingShell } from "@/components/landing/MarketingShell"
import { useCurrency } from "@/lib/currency/context"

// Pricing-answer base prices in GBP; rendered in the viewer's local currency
// via useCurrency below.
const FAQ_PRICES_GBP = {
  starter: 69.99,
  growth: 119.99,
}

function buildFaqs(starter: string, growth: string) {
  return [
  {
    category: "Getting Started",
    items: [
      {
        q: "What is Spun?",
        a: "Spun is an AI agent that automates marketing for local businesses. It manages your Google listing, runs your ads, collects reviews, posts on social, and follows up with leads — all while chatting with you via WhatsApp.",
      },
      {
        q: "Who is Spun for?",
        a: "Local service businesses — plumbers, dentists, salons, gyms, electricians, restaurants, chiropractors, mechanics, cleaning services. If you know you should be marketing but don't have the time or don't know where to start, Spun is for you.",
      },
      {
        q: "Do I need any marketing experience to use Spun?",
        a: "No. Just tell Spun about your business in a WhatsApp conversation. Spun asks the right questions, audits your online presence, builds the plan, and executes — you stay in control with Approve or Auto modes.",
      },
      {
        q: "Is there a free trial?",
        a: "Yes — every new account includes a 5-day free trial. Cancel anytime before it ends.",
      },
    ],
  },
  {
    category: "Features & How It Works",
    items: [
      {
        q: "What can Spun actually do?",
        a: "Google Business Profile management, Google Ads campaigns, review collection and responses, Facebook/Instagram posting, lead follow-ups, and a plain-English weekly report sent to your WhatsApp every Monday.",
      },
      {
        q: "What platforms does Spun connect to?",
        a: "Google Business Profile, Google Ads, Meta (Facebook & Instagram), Twilio for SMS, and WhatsApp Business. Full list is shown in Settings once you sign in.",
      },
      {
        q: "What are Draft, Approve, and Auto modes?",
        a: "Draft: Spun shows what it would do; you trigger each action manually. Approve: Spun queues actions; you reply YES or NO via WhatsApp. Auto: Spun executes within guardrails (budget caps, content guidelines) and reports after. You can change modes at any time.",
      },
      {
        q: "Will Spun actually launch and run ads for me?",
        a: "Yes. Spun connects to your Google Ads and Meta Ads accounts, launches campaigns on your behalf within the budget you set, and reports back on performance every week.",
      },
    ],
  },
  {
    category: "Pricing & Plans",
    items: [
      {
        q: "What plans are available?",
        a: `Starter (${starter}/mo) covers Google listing management, review collection, and weekly reports. Growth (${growth}/mo) adds Google Ads management, social posting, and lead follow-ups. Ad spend is separate — passed through to Google/Meta at cost.`,
      },
      {
        q: "Can I cancel anytime?",
        a: "Yes. All plans are month-to-month. No lock-in contracts.",
      },
      {
        q: "Does ad spend come out of my subscription?",
        a: "No. Your Spun subscription covers the AI agent and the actions it takes. Ad spend on Google/Meta is separate and billed directly by those platforms on your connected account.",
      },
    ],
  },
  {
    category: "Privacy & Data",
    items: [
      {
        q: "Is my business data safe?",
        a: "Yes. Your business information, WhatsApp conversations, and campaign data are stored securely and used only to power your Spun experience. We don't share your data with third parties.",
      },
    ],
  },
]
}

function FaqItem({
  q,
  a,
  id,
  openId,
  setOpenId,
}: {
  q: string
  a: string
  id: string
  openId: string | null
  setOpenId: (id: string | null) => void
}) {
  const isOpen = openId === id

  return (
    <div
      className={`bg-white border rounded-md overflow-hidden transition-colors ${
        isOpen ? "border-spun/30" : "border-grid"
      }`}
    >
      <button
        onClick={() => setOpenId(isOpen ? null : id)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-[14px] font-semibold text-gray-900">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-5">
          <p className="text-[13px] text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const [openId, setOpenId] = useState<string | null>(null)
  const { formatFromGBP } = useCurrency()
  const FAQS = buildFaqs(
    formatFromGBP(FAQ_PRICES_GBP.starter),
    formatFromGBP(FAQ_PRICES_GBP.growth)
  )

  return (
    <MarketingShell>
      <section className="bg-surface">
        <div className="mx-4 md:mx-16 lg:mx-20">
          <div className="px-4 md:px-14 lg:px-20 pt-20 pb-12">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] mb-3 font-mono">
                FAQ
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-[44px] font-bold tracking-tight text-gray-900 leading-[1.1]">
                Frequently asked questions
              </h1>
              <p className="mt-5 text-gray-500 text-[15px] leading-relaxed">
                Everything you need to know about Spun. Can&apos;t find your answer?{" "}
                <a href="mailto:hello@spun.bot" className="text-spun hover:text-spun-dark underline underline-offset-2">
                  Email us.
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-4 md:mx-16 lg:mx-20">
          <div className="h-px bg-ruler" />
          <div className="px-4 md:px-14 lg:px-20 py-16">
            <div className="max-w-3xl mx-auto space-y-12">
              {FAQS.map((section) => (
                <div key={section.category}>
                  <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] mb-4 font-mono">
                    {section.category}
                  </p>
                  <div className="space-y-2">
                    {section.items.map((item, i) => {
                      const id = `${section.category}-${i}`
                      return (
                        <FaqItem
                          key={id}
                          id={id}
                          q={item.q}
                          a={item.a}
                          openId={openId}
                          setOpenId={setOpenId}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-4 md:mx-16 lg:mx-20">
          <div className="h-px bg-ruler" />
          <div className="px-4 md:px-14 lg:px-20 py-20">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-3">
                Ready to get started?
              </h2>
              <p className="text-gray-500 text-[15px] mb-8">
                Set up in one conversation. First report in 7 days.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 bg-spun hover:bg-spun-dark text-white font-medium px-7 py-3 rounded-md text-sm transition"
              >
                See plans <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
