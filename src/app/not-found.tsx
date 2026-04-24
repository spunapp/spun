import Link from "next/link"
import { MarketingShell } from "@/components/landing/MarketingShell"

export default function NotFound() {
  return (
    <MarketingShell>
      <section className="bg-surface">
        <div className="mx-4 md:mx-16 lg:mx-20">
          <div className="px-4 md:px-14 lg:px-20 py-32">
            <div className="max-w-lg mx-auto text-center">
              <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] mb-3 font-mono">
                Error 404
              </p>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-[1.05]">
                Page not found
              </h1>
              <p className="mt-6 text-gray-500 text-[15px] leading-relaxed">
                The page you&apos;re looking for doesn&apos;t exist or has moved.
              </p>
              <div className="mt-10 flex items-center justify-center gap-3">
                <Link
                  href="/"
                  className="bg-spun hover:bg-spun-dark text-white font-medium px-7 py-3 rounded-md text-sm transition"
                >
                  Back home
                </Link>
                <Link
                  href="/chat"
                  className="text-gray-500 hover:text-gray-900 font-medium px-4 py-3 text-sm transition"
                >
                  Open chat →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
