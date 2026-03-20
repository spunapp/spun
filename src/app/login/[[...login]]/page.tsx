"use client"

import { SignIn } from "@clerk/nextjs"
import Image from "next/image"
import { useEffect } from "react"

function DimDevModeBanner() {
  useEffect(() => {
    function dim(el: Element) {
      const html = (el as HTMLElement)
      html.style.setProperty("background", "#1f2937", "important")
      html.style.setProperty("background-color", "#1f2937", "important")
      html.style.setProperty("color", "#4b5563", "important")
      html.style.setProperty("border-color", "transparent", "important")
      html.style.setProperty("box-shadow", "none", "important")
      html.style.setProperty("opacity", "0.55", "important")
      html.querySelectorAll("*").forEach((child) => {
        const c = child as HTMLElement
        c.style.setProperty("color", "#4b5563", "important")
        c.style.setProperty("fill", "#4b5563", "important")
        c.style.setProperty("background", "transparent", "important")
        c.style.setProperty("background-color", "transparent", "important")
      })
    }

    function scan() {
      // Walk every element and check for orange background or "Development mode" text
      document.querySelectorAll("*").forEach((el) => {
        const text = el.textContent?.trim()
        if (text === "Development mode" || text === "Development Mode") {
          // Style this element and its parent(s) up 3 levels
          dim(el)
          let p: Element | null = el
          for (let i = 0; i < 4; i++) {
            p = p?.parentElement ?? null
            if (p) dim(p)
          }
        }
        // Also catch by computed orange/amber background
        const bg = getComputedStyle(el).backgroundColor
        if (bg && (bg.includes("247, 107") || bg.includes("251, 146") || bg.includes("245, 158"))) {
          dim(el)
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
          <Image
            src="/spun.gif"
            alt="Spun"
            width={80}
            height={80}
            className="mx-auto mb-4 rounded-2xl"
            unoptimized
          />
          <Image
            src="/logo.png"
            alt="Spun"
            width={200}
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
          appearance={{
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
              badge: {
                style: {
                  backgroundColor: "#1f2937",
                  color: "#4b5563",
                  border: "none",
                  opacity: 0.55,
                },
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
