import { MarketingShell } from "@/components/landing/MarketingShell"

type LegalLayoutProps = {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <MarketingShell>
      <section className="bg-surface">
        <div className="mx-4 md:mx-16 lg:mx-20">
          <div className="px-4 md:px-14 lg:px-20 pt-20 pb-10">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] mb-3 font-mono">
                Legal
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-[44px] font-bold tracking-tight text-gray-900 leading-[1.1]">
                {title}
              </h1>
              <p className="mt-4 text-sm text-gray-400">
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-4 md:mx-16 lg:mx-20">
          <div className="h-px bg-ruler" />
          <div className="px-4 md:px-14 lg:px-20 py-16">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white border border-grid rounded-md p-8 sm:p-12 legal-prose">
                {children}
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
