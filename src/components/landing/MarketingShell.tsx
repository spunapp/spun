import type { ReactNode } from "react"
import { Nav } from "@/components/landing/Nav"
import { Footer } from "@/components/landing/Footer"

type MarketingShellProps = {
  children: ReactNode
  withRulers?: boolean
}

export function MarketingShell({ children, withRulers = true }: MarketingShellProps) {
  return (
    <div className="landing-root font-sans antialiased text-gray-900">
      {withRulers && (
        <div
          className="fixed inset-0 z-[60] pointer-events-none"
          aria-hidden="true"
        >
          <div className="h-full mx-4 md:mx-16 lg:mx-20 relative">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-ruler" />
            <div className="absolute right-0 top-0 bottom-0 w-px bg-ruler" />
          </div>
        </div>
      )}
      <div className="bg-surface-alt min-h-screen">
        <Nav />
        <div className="pt-14">{children}</div>
        <Footer />
      </div>
    </div>
  )
}
