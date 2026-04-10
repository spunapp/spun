import Link from "next/link"
import { LOGO_SRC } from "@/lib/logo"

type LegalLayoutProps = {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-white overflow-x-hidden">
      {/* Nav */}
      <nav
        className="px-6 py-4"
        style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/spun.gif" alt="" width={36} height={36} className="h-9 w-auto rounded-lg" />
            <img src={LOGO_SRC} alt="Spun" height={34} className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/faq" className="text-sm text-slate-400 hover:text-white transition-colors">
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
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-[#5B9BAA]/10 border border-[#5B9BAA]/20 rounded-full px-4 py-1.5 text-xs font-medium text-[#5B9BAA] mb-6">
          <span className="w-1.5 h-1.5 bg-[#5B9BAA] rounded-full" />
          Legal
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-3">{title}</h1>
        <p className="text-sm text-slate-500">Last updated: {lastUpdated}</p>
      </section>

      {/* Content */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div
          className="bg-[var(--background-dark)] rounded-3xl p-8 sm:p-12 legal-prose"
          style={{ border: "1px solid rgba(255, 255, 255, 0.05)" }}
        >
          {children}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#5B9BAA] mb-3">Product</p>
              <ul className="space-y-2">
                <li><Link href="/pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/faq" className="text-slate-400 hover:text-white transition-colors">FAQs</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#5B9BAA] mb-3">Legal</p>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="text-slate-400 hover:text-white transition-colors">Cookie Policy</Link></li>
                <li><Link href="/dpa" className="text-slate-400 hover:text-white transition-colors">DPA</Link></li>
                <li><Link href="/subprocessors" className="text-slate-400 hover:text-white transition-colors">Sub-processors</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#5B9BAA] mb-3">Contact</p>
              <ul className="space-y-2">
                <li><a href="mailto:hello@spun.bot" className="text-slate-400 hover:text-white transition-colors">hello@spun.bot</a></li>
                <li><a href="mailto:privacy@spun.bot" className="text-slate-400 hover:text-white transition-colors">privacy@spun.bot</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#5B9BAA] mb-3">Company</p>
              <p className="text-slate-400 leading-relaxed">
                Spun App Ltd<br />
                Company no. 17136483<br />
                53 Langley Crescent<br />
                Brighton, BN2 6NL<br />
                United Kingdom
              </p>
            </div>
          </div>
          <div
            className="pt-6 text-center"
            style={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}
          >
            <p className="text-xs text-slate-600">© {new Date().getFullYear()} Spun App Ltd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
