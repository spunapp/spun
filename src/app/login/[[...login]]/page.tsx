"use client"

import { SignIn } from "@clerk/nextjs"
import Link from "next/link"
import Image from "next/image"
import { MarketingShell } from "@/components/landing/MarketingShell"

export default function LoginPage() {
  return (
    <MarketingShell>
      <section className="bg-surface">
        <div className="mx-4 md:mx-16 lg:mx-20">
          <div className="px-4 md:px-14 lg:px-20 pt-16 pb-20">
            <div className="max-w-sm mx-auto text-center">
              <Link href="/" className="inline-flex items-center gap-2 mb-8">
                <Image src="/icon-192.png" alt="Spun" width={32} height={32} />
                <span className="font-mono font-medium text-lg text-gray-900 tracking-tight">
                  spun
                </span>
              </Link>

              <p className="text-[11px] text-gray-400 uppercase tracking-[0.15em] mb-3 font-mono">
                Welcome back
              </p>
              <h1 className="text-3xl md:text-[36px] font-bold tracking-tight text-gray-900 leading-[1.1] mb-3">
                Sign in to Spun
              </h1>
              <p className="text-gray-500 text-[14px] leading-relaxed mb-8">
                Your marketing AI agent — managing your listing, ads, reviews,
                and leads.
              </p>

              <SignIn
                routing="path"
                path="/login"
                fallbackRedirectUrl="/chat"
              />
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
