"use client"

import Link from "next/link"
import { ArrowRight, Zap, Target, Megaphone, BarChart3, Lightbulb, Rocket } from "lucide-react"
import { LOGO_SRC } from "@/lib/logo"

const FEATURES = [
  {
    icon: Target,
    title: "Strategy",
    description: "Market positioning, audience targeting, and go-to-market plans built around your product.",
  },
  {
    icon: Lightbulb,
    title: "Campaigns",
    description: "Full campaign ideation and briefs — from concept to creative direction, instantly.",
  },
  {
    icon: Megaphone,
    title: "Creatives",
    description: "Ad copy, social posts, email sequences, and more. Written, refined, and ready to run.",
  },
  {
    icon: Zap,
    title: "Execution",
    description: "Spun doesn't just plan — it runs. Launch ads and campaigns directly from the chat.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track what's working, cut what isn't, and double down on what drives growth.",
  },
  {
    icon: Rocket,
    title: "Full funnel",
    description: "Awareness to conversion, covered end-to-end. One tool, every stage of growth.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/spun.gif" alt="" width={36} height={36} className="h-9 w-auto rounded-lg" />
            <img src={LOGO_SRC} alt="" height={34} className="h-9 w-auto" />
          </div>
          <div className="flex items-center gap-6">
            <Link href="/faq" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              FAQs
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
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-[#5B9BAA]/10 border border-[#5B9BAA]/20 rounded-full px-4 py-1.5 text-xs font-medium text-[#5B9BAA] mb-8">
          <span className="w-1.5 h-1.5 bg-[#5B9BAA] rounded-full" />
          Your marketing department in a chat window
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
          One chat.{" "}
          <span className="text-[#5B9BAA]">Full funnel.</span>
          <br />
          <span className="text-white/60 text-4xl sm:text-5xl md:text-6xl font-semibold mt-2 block">
            Strategy. Campaigns. Creatives.
            <br className="hidden sm:block" /> Execution. Analytics.
          </span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
          Founders have enough to worry about. Spun is your always-on AI marketing team — strategy,
          campaigns, creatives, and analytics — for a fraction of the cost of a single hire.
        </p>

        <div className="flex items-center justify-center mt-10">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-[#5B9BAA] hover:bg-[#4d8a99] text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-sm"
          >
            Start your free trial <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="border-t border-white/5" />
      </div>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold">Everything a marketing team does.</h2>
          <p className="text-slate-400 mt-3 text-base max-w-lg mx-auto">
            Without the salaries, the onboarding, or the waiting.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-[var(--background-dark)] border border-white/5 rounded-2xl p-6 hover:border-[#5B9BAA]/20 transition-colors"
            >
              <div className="w-10 h-10 bg-[#5B9BAA]/10 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[#5B9BAA]" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pitch section */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-[var(--background-dark)] border border-white/5 rounded-3xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left */}
            <div className="p-10 md:p-14 border-b md:border-b-0 md:border-r border-white/5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#5B9BAA] mb-4">
                Built for founders
              </p>
              <h3 className="text-2xl font-bold leading-snug mb-4">
                Marketing firepower,<br />without the overhead.
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                New employment legislation has made hiring more expensive and bureaucratic than ever.
                Spun sidesteps all of it — no contracts, no NI contributions, no sick days. Just
                a relentless marketing engine working for your business around the clock.
              </p>
            </div>
            {/* Right */}
            <div className="p-10 md:p-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#5B9BAA] mb-4">
                Have an idea?
              </p>
              <h3 className="text-2xl font-bold leading-snug mb-4">
                Bring the spark.<br />Spun does the rest.
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Already know what you want to say but don't have the bandwidth to build it out?
                Hand Spun an idea — it'll challenge it, sharpen it, and turn it into a full
                campaign ready to run. Your vision, fully executed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 bg-[#5B9BAA] hover:bg-[#4d8a99] text-white font-semibold px-8 py-4 rounded-xl transition-colors"
        >
          Start your free trial <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center space-y-4">
          <p className="text-sm text-slate-500 font-medium">
            No sick days, no holidays, no overtime paid, no national insurance paid, no pension
            contributions, no stress, no fuss:{" "}
            <span className="text-white font-semibold">All Marketing, All the Time.</span>
          </p>
          <div className="flex items-center justify-center gap-5 text-xs text-slate-500">
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} Spun. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
