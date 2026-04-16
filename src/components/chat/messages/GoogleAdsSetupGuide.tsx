"use client"

import { useState, useCallback } from "react"
import { useMutation } from "convex/react"
import { useUser } from "@clerk/nextjs"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import {
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Link2,
  XCircle,
  Info,
} from "lucide-react"

type Step = {
  title: string
  body: string
  link?: { label: string; href: string }
  tip?: string
}

interface GoogleAdsSetupGuideProps {
  content: string
  metadata: Record<string, unknown>
}

// Default step content — rendered if the AI doesn't pass custom steps in metadata.
// Keeping these hard-coded means the guide stays consistent even if the model
// hallucinates or skips details.
const DEFAULT_STEPS: Step[] = [
  {
    title: "Make sure you have a Google account",
    body:
      "You need a Google account (Gmail or Google Workspace) to create a Google Ads account. If you already use Gmail, Google Analytics, or any Google product, you can use that same account. If not, create one first.",
    link: {
      label: "Create a Google account",
      href: "https://accounts.google.com/signup",
    },
  },
  {
    title: "Create your Google Ads account",
    body:
      'Go to ads.google.com and click Start Now. Google will try to push you into a "Smart Campaign" wizard — look for the link that says "Switch to Expert Mode" at the bottom. Click it. Then choose "Create an account without a campaign" so you get a clean, empty account you can configure properly.',
    link: {
      label: "Open Google Ads",
      href: "https://ads.google.com/home/",
    },
    tip: 'Don\'t create a Smart Campaign during sign-up. They\'re hard to control and even harder to turn off. Always switch to Expert Mode first.',
  },
  {
    title: "Set your billing country, time zone, and currency",
    body:
      "Google will ask for your billing country, time zone, and currency during setup. These cannot be changed after the account is created — if you pick the wrong ones, you'll need to start a new account. Set the time zone to where your primary audience is, and the currency to whatever you'll be invoiced in.",
    tip: "Triple-check the currency. GBP, USD, EUR — whatever matches your bank account. You cannot change it later.",
  },
  {
    title: "Enter your billing information",
    body:
      "Go to Billing & payments in the left sidebar (or the gear icon → Billing). Add a payment method — credit card, debit card, or bank account via direct debit. Google charges you after your ads run, either when you hit your payment threshold or at the end of each month, whichever comes first.",
    link: {
      label: "Google Ads Billing",
      href: "https://ads.google.com/aw/billing/summary",
    },
    tip: "Google may place a small temporary hold on your card to verify it. This drops off within a few days.",
  },
  {
    title: "Set up conversion tracking",
    body:
      "In your Google Ads account, go to Goals → Conversions → Summary → New conversion action. Choose 'Website' and enter your site URL. Google will give you a Global Site Tag (gtag.js) snippet to add to your website's <head>. If you use Google Tag Manager, you can install it there instead. This is essential — without conversion tracking, Google can't optimise your campaigns.",
    link: {
      label: "Conversion tracking setup",
      href: "https://ads.google.com/aw/conversions",
    },
    tip: "If you already have Google Analytics 4 on your site, you can import GA4 goals as conversions instead of setting up a separate tag. Go to Goals → Conversions → Import → Google Analytics 4.",
  },
  {
    title: "Link Google Analytics (recommended)",
    body:
      "If you have Google Analytics 4, link it to your Ads account for richer reporting. In Google Ads, go to Tools → Data Manager → Google Analytics (GA4) → Link. Select your GA4 property and confirm. This gives you audience insights, cross-channel attribution, and lets you import GA4 conversions directly.",
    link: {
      label: "Data Manager",
      href: "https://ads.google.com/aw/datamgr",
    },
  },
  {
    title: "Verify your advertiser identity",
    body:
      "Google requires advertiser verification for most accounts. You'll get a notification in your account when it's time — usually within a few days of creating the account. You'll need to confirm your business name, location, and provide a government-issued document or business registration. Ads can still run during verification, but Google may pause them if you don't complete it within 30 days.",
    link: {
      label: "Advertiser verification",
      href: "https://support.google.com/adspolicy/answer/9703665",
    },
  },
  {
    title: "Come back and connect Google Ads to Spun",
    body:
      "Once your account is set up with billing and conversion tracking in place, hit the button below. You'll sign in with your Google account, grant access to your Ads account, and I'll take it from there.",
  },
]

export function GoogleAdsSetupGuide({ content, metadata }: GoogleAdsSetupGuideProps) {
  const { user } = useUser()
  const userId = user?.id
  const upsertChannel = useMutation(api.channels.upsert)

  const steps =
    (Array.isArray(metadata.steps) && (metadata.steps as Step[]).length > 0
      ? (metadata.steps as Step[])
      : DEFAULT_STEPS)

  const pipedreamApp = (metadata.pipedreamApp as string) ?? "google_ads"
  const oauthAppId = (metadata.oauthAppId as string | undefined) ?? undefined
  const businessId = metadata.businessId as string | undefined

  const [openStep, setOpenStep] = useState<number | null>(0)
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set())
  const [status, setStatus] = useState<"idle" | "connecting" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const toggleStep = (i: number) => setOpenStep(openStep === i ? null : i)
  const toggleChecked = (i: number) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const fetchToken = useCallback(async () => {
    const res = await fetch("/api/integrations/connect-token", { method: "POST" })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to get connect token")
    return {
      token: data.token as string,
      expiresAt: new Date(data.expiresAt),
      connectLinkUrl: (data.connectLinkUrl as string) ?? "",
    }
  }, [])

  async function handleConnect() {
    if (!userId || status === "connecting") return
    setStatus("connecting")
    setErrorMsg(null)

    try {
      const { createFrontendClient } = await import("@pipedream/sdk/browser")
      const client = createFrontendClient({
        externalUserId: userId,
        tokenCallback: () => fetchToken(),
      })

      await new Promise<void>((resolve, reject) => {
        client.connectAccount({
          app: pipedreamApp,
          ...(oauthAppId ? { oauthAppId } : {}),
          onSuccess: async (result) => {
            try {
              const authProvisionId = result?.id
              if (!authProvisionId) throw new Error("No account ID returned")
              if (businessId) {
                await upsertChannel({
                  businessId: businessId as Id<"businesses">,
                  platform: "google",
                  oauthAccessToken: authProvisionId,
                })
              }
              setStatus("success")
              resolve()
            } catch (err) {
              reject(err)
            }
          },
          onError: (err) => reject(err),
          onClose: ({ successful, completed }) => {
            if (!successful && !completed) reject(new Error("cancelled"))
          },
        })
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg === "cancelled" || msg.includes("closed")) {
        setStatus("idle")
        return
      }
      setStatus("error")
      setErrorMsg(msg)
    }
  }

  const completedCount = checkedSteps.size
  const totalSteps = steps.length

  return (
    <div className="space-y-3">
      {content && (
        <div className="text-sm text-slate-200 leading-relaxed">
          {content.split("\n").map((line, i) => (
            <p key={i} className={line ? "" : "h-3"}>
              {line}
            </p>
          ))}
        </div>
      )}

      <div
        className="rounded-xl bg-white/5 p-3"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#4285F4] via-[#34A853] to-[#FBBC05] flex items-center justify-center text-[10px] font-bold text-white">
              G
            </div>
            <span className="text-sm font-medium text-white">
              Set up your Google Ads account
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {completedCount}/{totalSteps}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-white/5 mb-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#4285F4] to-[#34A853] transition-all"
            style={{ width: `${(completedCount / totalSteps) * 100}%` }}
          />
        </div>

        <ol className="space-y-1">
          {steps.map((step, i) => {
            const isOpen = openStep === i
            const isChecked = checkedSteps.has(i)
            return (
              <li
                key={i}
                className="rounded-lg"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-start gap-2 p-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleChecked(i)
                    }}
                    className="flex-shrink-0 mt-0.5"
                    aria-label={isChecked ? "Mark step incomplete" : "Mark step complete"}
                  >
                    {isChecked ? (
                      <CheckCircle className="w-4 h-4 text-[#34A853]" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                    )}
                  </button>

                  <button
                    onClick={() => toggleStep(i)}
                    className="flex-1 text-left flex items-start justify-between gap-2 group"
                  >
                    <div className="flex-1">
                      <div
                        className={`text-sm font-medium transition-colors ${
                          isChecked ? "text-slate-400 line-through" : "text-slate-100"
                        }`}
                      >
                        <span className="text-slate-500 mr-1.5">{i + 1}.</span>
                        {step.title}
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 mt-0.5 flex-shrink-0 transition-colors" />
                    )}
                  </button>
                </div>

                {isOpen && (
                  <div className="px-3 pb-3 pl-9 space-y-2">
                    <p className="text-xs text-slate-300 leading-relaxed">{step.body}</p>

                    {step.tip && (
                      <div
                        className="flex items-start gap-2 p-2 rounded-md bg-amber-500/5"
                        style={{ border: "1px solid rgba(245,158,11,0.2)" }}
                      >
                        <Info className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-amber-200/90 leading-relaxed">
                          {step.tip}
                        </p>
                      </div>
                    )}

                    {step.link && (
                      <a
                        href={step.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#4285F4] hover:text-[#6ba3f7] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {step.link.label}
                      </a>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>

        {/* Connect CTA */}
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {status === "success" ? (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle size={16} />
              <span>Google Ads connected successfully — I&apos;ll take it from here.</span>
            </div>
          ) : status === "error" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <XCircle size={16} />
                <span>Connection failed{errorMsg ? `: ${errorMsg}` : ""}</span>
              </div>
              <button
                onClick={handleConnect}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.15)" }}
              >
                Try again
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={status === "connecting"}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#4285F4] hover:bg-[#5a95f5] disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
            >
              <Link2 size={16} />
              {status === "connecting"
                ? "Connecting..."
                : "I've set it up — connect Google Ads to Spun"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
