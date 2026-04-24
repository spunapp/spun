"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const CONSENT_KEY = "spun_cookie_consent"
const CONSENT_VERSION = 1

type ConsentValue = "accepted" | "rejected"

type StoredConsent = {
  v: number
  value: ConsentValue
  t: number // timestamp
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    openCookieSettings?: () => void
  }
}

function readConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredConsent
    if (parsed.v !== CONSENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function writeConsent(value: ConsentValue) {
  if (typeof window === "undefined") return
  const payload: StoredConsent = { v: CONSENT_VERSION, value, t: Date.now() }
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

/**
 * Load Google Analytics 4 via gtag.js. Only called after the user accepts.
 * We also send the GDPR-required default consent state first (all denied)
 * and then update to granted, so GA never tracks before consent.
 */
function loadGoogleAnalytics() {
  if (!GA_ID) return
  if (typeof window === "undefined") return
  if (document.getElementById("ga-gtag-script")) {
    // Already loaded — just flip consent to granted.
    window.gtag?.("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "granted",
    })
    return
  }

  window.dataLayer = window.dataLayer || []
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  window.gtag = gtag as typeof window.gtag

  // Default: everything denied. This is the Google-required baseline.
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  })

  // Update: user accepted analytics (but not ads).
  gtag("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "granted",
  })

  const script = document.createElement("script")
  script.id = "ga-gtag-script"
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  gtag("js", new Date())
  gtag("config", GA_ID, {
    anonymize_ip: true,
    send_page_view: true,
  })
}

/**
 * Delete GA cookies for the current host when consent is withdrawn.
 * Covers _ga, _gid, _gat, and _ga_* (GA4 property-specific) cookies.
 */
function clearGoogleAnalyticsCookies() {
  if (typeof document === "undefined") return
  const host = window.location.hostname
  // Build candidate domains: exact host and parent (e.g. .spun.bot).
  const parts = host.split(".")
  const domains = new Set<string>([host])
  if (parts.length >= 2) {
    domains.add("." + parts.slice(-2).join("."))
  }
  const names = document.cookie
    .split(";")
    .map((c) => c.split("=")[0]?.trim())
    .filter(
      (name): name is string =>
        !!name && (name === "_ga" || name === "_gid" || name === "_gat" || name.startsWith("_ga_"))
    )
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`
    }
    document.cookie = `${name}=; Max-Age=0; path=/`
  }
}

type BannerState = "hidden" | "visible"

export default function CookieConsent() {
  // `null` means we haven't yet read localStorage (SSR + initial client render).
  // We defer this to an effect to avoid hydration mismatch, then resolve to
  // "visible" or "hidden" once.
  const [state, setState] = useState<BannerState | null>(null)

  useEffect(() => {
    const stored = readConsent()
    if (stored?.value === "accepted") {
      loadGoogleAnalytics()
    }
    // Single batched update — one setState per effect, so no cascading renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(stored ? "hidden" : "visible")

    // Expose a global so the "Cookie settings" footer link can reopen the banner.
    window.openCookieSettings = () => setState("visible")
    return () => {
      if (window.openCookieSettings) delete window.openCookieSettings
    }
  }, [])

  if (state !== "visible") return null

  const setVisible = (v: boolean) => setState(v ? "visible" : "hidden")

  const handleAccept = () => {
    writeConsent("accepted")
    loadGoogleAnalytics()
    setVisible(false)
  }

  const handleReject = () => {
    writeConsent("rejected")
    clearGoogleAnalyticsCookies()
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:bottom-6 sm:max-w-md z-50"
    >
      <div className="rounded-md p-5 shadow-xl bg-white border border-grid">
        <p className="text-sm font-semibold text-gray-900 mb-1">Cookies on Spun</p>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
          We use strictly necessary cookies to run spun.bot. With your permission,
          we&rsquo;d also like to use <strong>Google Analytics</strong> to understand
          how the site is used so we can improve it. You can change your choice at
          any time in our{" "}
          <Link href="/cookies" className="text-spun underline underline-offset-2">
            Cookie Policy
          </Link>
          .
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleReject}
            className="flex-1 text-sm font-medium text-gray-700 hover:text-gray-900 border border-grid hover:border-gray-300 transition-colors rounded-md px-4 py-2.5"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 text-sm font-semibold text-white bg-spun hover:bg-spun-dark transition-colors rounded-md px-4 py-2.5"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
