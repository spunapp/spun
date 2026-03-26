"use client"

import { SignIn } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import Image from "next/image"
import Link from "next/link"
import { useEffect } from "react"

function DimDevModeBanner() {
  useEffect(() => {
function scan() {
      document.querySelectorAll("*").forEach((el) => {
        if (el.childElementCount === 0 && el.textContent?.trim() === "Development mode") {
          const html = el as HTMLElement
          html.style.setProperty("color", "#4b5563", "important")
          html.style.setProperty("opacity", "0.7", "important")
        }
      })
    }

    scan()
    const observer = new MutationObserver(scan)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <DimDevModeBanner />
      <div className="max-w-sm w-full space-y-8 text-center">
        <div>
          <Link href="/">
            <Image
              src="/spun.gif"
              alt=""
              width={80}
              height={80}
              className="mx-auto mb-4 rounded-2xl cursor-pointer"
              unoptimized
              priority
            />
          </Link>
          <Image
            src="/logo.png"
            alt=""
            width={200}
            height={56}
            className="mx-auto"
            priority
          />
          <p className="text-slate-300 mt-3">
            Your marketing department in a chat window.
          </p>
        </div>

        <SignIn
          routing="path"
          path="/login"
          forceRedirectUrl="/chat"
          appearance={{
            baseTheme: dark,
            variables: {
              colorBackground: "#1F333B",
              colorPrimary: "#5B9BAA",
              colorText: "#f8fafc",
              colorTextSecondary: "#cbd5e1",
              colorInputBackground: "#273E47",
              colorInputText: "#f8fafc",
              colorNeutral: "#cbd5e1",
              borderRadius: "0.75rem",
            },
            elements: {
              card: {
                style: {
                  boxShadow: "none",
                  border: "1px solid rgba(255,255,255,0.12)",
                },
              },
              headerTitle: {
                style: { color: "#ffffff", fontSize: "1.125rem" },
              },
              headerSubtitle: {
                style: { color: "#cbd5e1" },
              },
              socialButtonsBlockButton: {
                style: {
                  backgroundColor: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.35)",
                  color: "#ffffff",
                },
              },
              socialButtonsBlockButtonText: {
                style: { color: "#ffffff", fontWeight: 500 },
              },
              dividerLine: {
                style: { backgroundColor: "rgba(255,255,255,0.12)" },
              },
              dividerText: {
                style: { color: "#94a3b8" },
              },
              formFieldLabel: {
                style: { color: "#e2e8f0", fontWeight: 500 },
              },
              formFieldInput: {
                style: {
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#ffffff",
                },
              },
              formButtonPrimary: {
                style: { backgroundColor: "#5B9BAA", color: "#ffffff" },
              },
              footerActionLink: {
                style: { color: "#5B9BAA" },
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
