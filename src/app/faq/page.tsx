"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ArrowRight } from "lucide-react"
import { LOGO_SRC } from "@/lib/logo"

const FAQS = [
  {
    category: "Getting Started",
    items: [
      {
        q: "What is Spun?",
        a: "Your always-on AI marketing team. Spun handles strategy, campaigns, creatives, execution, and analytics from a single chat window — at a fraction of the cost of a single hire.",
      },
      {
        q: "Who is Spun for?",
        a: "Built for founders and small businesses who need serious marketing firepower without the overhead of hiring a team.",
      },
      {
        q: "Do I need any marketing experience to use Spun?",
        a: "No. Just describe your business and goals. Spun asks the right questions, builds the strategy, and executes — you stay in control.",
      },
      {
        q: "Is there a free trial?",
        a: "Yes. All plans include a 14-day free trial.",
      },
    ],
  },
  {
    category: "Features & How It Works",
    items: [
      {
        q: "What can Spun actually do?",
        a: "Strategy & positioning, campaign ideation & briefs, ad copy, social posts, email sequences, image ads, connecting to ad platforms and launching campaigns, and full performance reporting.",
      },
      {
        q: "What ad platforms does Spun connect to?",
        a: "Spun integrates with major advertising platforms. The full list is shown in your Settings → Connected Platforms once you're signed in.",
      },
      {
        q: 'What is "preview before executing" mode vs "auto execute" mode?',
        a: "In preview mode, Spun shows you every action before it runs — you approve each step. In auto execute mode, Spun runs campaigns directly without waiting for approval. You can switch between modes at any time in Settings.",
      },
      {
        q: "Will Spun actually launch and run ads for me?",
        a: "Yes. Spun doesn't just plan — it connects to your ad accounts, runs campaigns on your behalf, and then reports back on performance.",
      },
    ],
  },
  {
    category: "Pricing & Plans",
    items: [
      {
        q: "What plans are available?",
        a: "Standard (£69.99/mo) covers full strategy, campaigns, image ads, one ad platform, and full reporting. Pro (£119.99/mo) adds blog articles, video ads, podcast episodes, multi-platform advertising, and ROI calculations. Enterprise (price on application) provides custom solutions for multi-location or multi-brand organisations.",
      },
      {
        q: "Can I cancel anytime?",
        a: "Yes. All plans are month-to-month and can be cancelled at any time. No lock-in contracts.",
      },
      {
        q: "Is there a discount for annual billing?",
        a: "Reach out to hello@spun.bot to discuss annual pricing options.",
      },
    ],
  },
  {
    category: "Privacy & Data",
    items: [
      {
        q: "Is my business data safe?",
        a: "Yes. Your business information, brand assets, and campaign data are stored securely and used only to power your Spun experience. We don't share your data with third parties.",
      },
    ],
  },
]

function FaqItem({ q, a, id, openId, setOpenId }: {
  q: string
  a: string
  id: string
  openId: string | null
  setOpenId: (id: string | null) => void
}) {
  const isOpen = openId === id

  return (
    <div
      className={`bg-[var(--background-dark)] border rounded-2xl overflow-hidden transition-colors ${
        isOpen ? "border-[#5B9BAA]/30" : "border-white/5"
      }`}
    >
      <button
        onClick={() => setOpenId(isOpen ? null : id)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-sm font-semibold text-white">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-5">
          <p className="text-sm text-slate-300 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-[var(--background)] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/spun.gif" alt="" width={36} height={36} className="h-9 w-auto rounded-lg" />
            <img src={LOGO_SRC} alt="" height={34} className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign in →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-[#5B9BAA]/10 border border-[#5B9BAA]/20 rounded-full px-4 py-1.5 text-xs font-medium text-[#5B9BAA] mb-8">
          <span className="w-1.5 h-1.5 bg-[#5B9BAA] rounded-full" />
          Common questions
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-4">
          Frequently asked questions
        </h1>
        <p className="text-slate-400 text-lg leading-relaxed">
          Everything you need to know about Spun. Can&apos;t find your answer?{" "}
          <a href="mailto:hello@spun.bot" className="text-[#5B9BAA] hover:underline">
            Email us.
          </a>
        </p>
      </section>

      {/* FAQ sections */}
      <section className="max-w-3xl mx-auto px-6 pb-20 space-y-12">
        {FAQS.map((section) => (
          <div key={section.category}>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#5B9BAA] mb-4">
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
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="border-t border-white/5" />
      </div>

      {/* Bottom CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
        <p className="text-slate-400 mb-8">Your 14-day free trial is waiting.</p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 bg-[#5B9BAA] hover:bg-[#4d8a99] text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-sm"
        >
          See plans <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <p className="text-sm text-slate-500 font-medium text-center">
            No sick days, no holidays, no overtime paid, no national insurance paid, no pension
            contributions, no stress, no fuss:{" "}
            <span className="text-white font-semibold">All Marketing, All the Time.</span>
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            <Link href="/dpa" className="hover:text-white transition-colors">DPA</Link>
            <Link href="/subprocessors" className="hover:text-white transition-colors">Sub-processors</Link>
            <button
              type="button"
              onClick={() => window.openCookieSettings?.()}
              className="hover:text-white transition-colors"
            >
              Cookie settings
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-6 text-center">
            © {new Date().getFullYear()} Spun App Ltd. Registered in England and Wales,
            company no. 17136483. 53 Langley Crescent, Brighton, BN2 6NL, United Kingdom.
          </p>
        </div>
      </footer>
    </div>
  )
}
