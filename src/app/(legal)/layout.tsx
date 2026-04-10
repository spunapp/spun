import Link from "next/link"
import { LOGO_SRC } from "@/lib/logo"

export default function LegalLayout({ children }: { children: React.ReactNode }) {
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
            <Link href="/faq" className="text-sm text-slate-400 hover:text-white transition-colors">
              FAQ
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign in &rarr;
            </Link>
          </div>
        </div>
      </nav>

      {children}

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-5 text-xs text-slate-500">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            <a href="mailto:hello@spun.bot" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} Spun. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
