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

interface GA4SetupGuideProps {
  content: string
  metadata: Record<string, unknown>
  onSend?: (message: string) => void
}

const DEFAULT_STEPS: Step[] = [
  {
    title: "Make sure you have a Google account",
    body:
      "You need a Google account (Gmail or Google Workspace) to create a Google Analytics property. If you already use Gmail or any Google product, you can use that same account.",
    link: {
      label: "Create a Google account",
      href: "https://accounts.google.com/signup",
    },
  },
  {
    title: "Create a Google Analytics 4 property",
    body:
      "Go to analytics.google.com and click Start Measuring (or Admin → Create Property if you already have an account). Enter your website name, select your industry category and time zone, then click Create.",
    link: {
      label: "Open Google Analytics",
      href: "https://analytics.google.com/",
    },
    tip: "Pick the time zone that matches your primary audience — your daily reports will be cut at midnight in that zone.",
  },
  {
    title: "Set up a web data stream",
    body:
      "In your new property, go to Data Streams → Add stream → Web. Enter your website URL and give the stream a name. GA4 will generate a Measurement ID (starts with G-). Copy it — you'll need it in the next step.",
    link: {
      label: "Data Streams settings",
      href: "https://analytics.google.com/analytics/web/#/a0p0/admin/streams/table",
    },
  },
  {
    title: "Install the tracking tag on your website",
    body:
      "Add the Google tag (gtag.js) snippet to your website's <head> on every page. If you use WordPress, Shopify, Squarespace, Wix, or similar, there's usually a built-in Google Analytics integration — just paste your Measurement ID. If you use Google Tag Manager, add the GA4 Configuration tag there instead.",
    link: {
      label: "Tag installation guide",
      href: "https://support.google.com/analytics/answer/9304153",
    },
    tip: "The tag must be on every page you want to track. If it's only on your homepage, you'll miss most of your visitor data.",
  },
  {
    title: "Verify data is flowing",
    body:
      "Visit your website in a browser, then go back to GA4 and open the Realtime report (Reports → Realtime). You should see at least one active user within a couple of minutes. If you don't, double-check the tag installation and clear your browser cache.",
    link: {
      label: "Realtime report",
      href: "https://analytics.google.com/analytics/web/#/realtime",
    },
  },
  {
    title: "Set up key events (conversions)",
    body:
      "Go to Admin → Events and mark the events that matter to your business as key events. At a minimum, mark form submissions, purchases, or sign-ups. These are what GA4 will count as conversions when reporting on your ad campaigns.",
    link: {
      label: "Events settings",
      href: "https://analytics.google.com/analytics/web/#/events",
    },
    tip: "If you're running an e-commerce site, enable Enhanced Measurement in your data stream settings — it auto-tracks purchases, add-to-carts, and checkouts.",
  },
  {
    title: "Come back and connect GA4 to Spun",
    body:
      "Once your property is live and receiving data, hit the button below. You'll sign in with your Google account, pick the GA4 property you just created, and I'll start tracking your campaign performance automatically.",
  },
]

export function GA4SetupGuide({ content, metadata, onSend }: GA4SetupGuideProps) {
  const { user } = useUser()
  const userId = user?.id
  const upsertChannel = useMutation(api.channels.upsert)

  const steps =
    (Array.isArray(metadata.steps) && (metadata.steps as Step[]).length > 0
      ? (metadata.steps as Step[])
      : DEFAULT_STEPS)

  const pipedreamApp = (metadata.pipedreamApp as string) ?? "google_analytics"
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
      if (next.has(i)) {
        next.delete(i)
      } else {
        next.add(i)
        if (i + 1 < steps.length) setOpenStep(i + 1)
      }
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
                  platform: "ga4",
                  oauthAccessToken: authProvisionId,
                })
              }
              setStatus("success")
              setTimeout(() => onSend?.("I've connected Google Analytics — what's next?"), 1500)
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
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#F9AB00] to-[#E37400] flex items-center justify-center text-[10px] font-bold text-white">
              A
            </div>
            <span className="text-sm font-medium text-white">
              Set up Google Analytics 4
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {completedCount}/{totalSteps}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-white/5 mb-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#F9AB00] to-[#E37400] transition-all"
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
                      <CheckCircle className="w-4 h-4 text-[#F9AB00]" />
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
                        className="inline-flex items-center gap-1.5 text-xs text-[#F9AB00] hover:text-[#ffc233] transition-colors"
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
              <span>Google Analytics connected successfully — I&apos;ll take it from here.</span>
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#E37400] hover:bg-[#F9AB00] disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
            >
              <Link2 size={16} />
              {status === "connecting"
                ? "Connecting..."
                : "I've set it up — connect GA4 to Spun"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
