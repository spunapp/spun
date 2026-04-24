import { Nav } from "@/components/landing/Nav"
import { Hero } from "@/components/landing/Hero"
import { BusinessTypes } from "@/components/landing/BusinessTypes"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { Features } from "@/components/landing/Features"
import { WeeklyReport } from "@/components/landing/WeeklyReport"
import { Pricing } from "@/components/landing/Pricing"
import { CTA } from "@/components/landing/CTA"
import { Footer } from "@/components/landing/Footer"

export default function HomePage() {
  return (
    <div className="landing-root font-sans antialiased text-gray-900">
      <div
        className="fixed inset-0 z-[60] pointer-events-none"
        aria-hidden="true"
      >
        <div className="h-full mx-4 md:mx-16 lg:mx-20 relative">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-ruler" />
          <div className="absolute right-0 top-0 bottom-0 w-px bg-ruler" />
        </div>
      </div>

      <main className="bg-surface-alt min-h-screen">
        <Nav />
        <Hero />
        <BusinessTypes />
        <HowItWorks />
        <Features />
        <WeeklyReport />
        <Pricing />
        <CTA />
        <Footer />
      </main>
    </div>
  )
}
