"use client"

import { SignIn } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import Link from "next/link"
import { LOGO_SRC } from "@/lib/logo"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-8 text-center">
        <div>
          <Link href="/">
            <img
              src="/spun.gif"
              alt=""
              width={80}
              height={80}
              className="mx-auto mb-4 rounded-2xl cursor-pointer"
            />
          </Link>
          <img
            src={LOGO_SRC}
            alt=""
            height={56}
            className="mx-auto"
          />
          <p className="text-slate-300 mt-3">
            Your marketing department in a chat window.
          </p>
        </div>

        <SignIn
          routing="path"
          path="/login"
          fallbackRedirectUrl="/chat"
          appearance={{
            baseTheme: dark,
            elements: {
              cardBox: {
                background: "transparent",
              },
              footer: {
                background: "#1e3a47",
              },
              footerItem: {
                color: "#cbd5e1",
              },
              footerAction: {
                background: "#1e3a47",
              },
            },
          }}
        />

        <div className="text-sm text-slate-400 space-y-1">
          <p>One chat. Full funnel.</p>
          <p>Strategy. Campaigns. Creatives. Execution. Analytics.</p>
        </div>
      </div>
    </div>
  )
}
