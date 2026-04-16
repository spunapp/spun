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

interface MetaSetupGuideProps {
  content: string
  metadata: Record<string, unknown>
  onSend?: (message: string) => void
}

// Default step content — rendered if the AI doesn't pass custom steps in metadata.
// Keeping these hard-coded means the guide stays consistent even if the model
// hallucinates or skips details.
const DEFAULT_STEPS: Step[] = [
  {
    title: "Make sure you have a personal Facebook account",
    body:
      "Meta requires a real personal Facebook account to own any Business Portfolio. It's only used to log in — customers never see it. If you don't have one, create it first.",
    link: {
      label: "Create a Facebook account",
      href: "https://www.facebook.com/r.php",
    },
  },
  {
    title: "Create a Meta Business Portfolio",
    body:
      "Go to business.facebook.com and click Create Account. Enter your business name (match it to how you trade publicly), your full name, and a business email address Meta can reach you on.",
    link: {
      label: "Open Meta Business Suite",
      href: "https://business.facebook.com/overview",
    },
    tip: "Meta lets each person own at most two Business Portfolios, so pick the name carefully.",
  },
  {
    title: "Add (or create) your Facebook Page",
    body:
      "In Business Settings, open Accounts → Pages → Add. Link an existing Page if you have one, or create a new one for your business. The Page is what your ads will appear to come from.",
    link: {
      label: "Business Settings → Pages",
      href: "https://business.facebook.com/settings/pages",
    },
  },
  {
    title: "Connect your Instagram account (optional but recommended)",
    body:
      "Under Accounts → Instagram accounts, click Add and log in. Connecting Instagram lets Spun run Reels and Stories placements alongside Facebook, usually at a lower CPM.",
    link: {
      label: "Business Settings → Instagram",
      href: "https://business.facebook.com/settings/instagram-accounts",
    },
  },
  {
    title: "Create your ad account",
    body:
      "Still in Business Settings, open Accounts → Ad accounts → Add → Create a new ad account. Give it a name, pick your time zone and currency (these can't be changed later), and set the ad account to be used for your own business.",
    link: {
      label: "Business Settings → Ad accounts",
      href: "https://business.facebook.com/settings/ad-accounts",
    },
    tip: "Double-check the currency — if you pick the wrong one you'll have to create a fresh ad account from scratch.",
  },
  {
    title: "Assign yourself to the ad account",
    body:
      "Open the new ad account, click Add People, tick your own name, and give yourself Admin access. Without this you won't be able to launch or edit campaigns.",
  },
  {
    title: "Verify your identity and business",
    body:
      "Meta now blocks new ad accounts from adding a payment method until you've verified who you are. Go to Security Center → Business verification and upload a government-issued ID (passport or driving licence) plus a business document (Companies House extract, utility bill, or VAT certificate). Expect Meta to take anywhere from a few minutes to a couple of days to review.",
    link: {
      label: "Security Center",
      href: "https://business.facebook.com/settings/security",
    },
    tip: "Do this BEFORE trying to add a card. If you skip it, Meta will throw an error when you try to add billing and you'll end up back here anyway.",
  },
  {
    title: "Add a payment method",
    body:
      "Once verification clears, go to Billing → Payment methods → Add payment method. Most small businesses start with a debit/credit card or direct debit. If you're expecting to spend heavily, apply for monthly invoicing in the Credit Lines section — it can take a few days to approve.",
    link: {
      label: "Payment methods",
      href: "https://business.facebook.com/billing_hub/payment_settings",
    },
    tip: "From March 2026 Meta is moving high-spend accounts off cards, so expect direct debit or invoicing once you scale.",
  },
  {
    title: "Come back and connect Meta to Spun",
    body:
      "Once your ad account is live and billing is set, hit the button below. You'll sign in with Facebook, pick the Business Portfolio and ad account you just created, and I'll take it from there.",
  },
]

export function MetaSetupGuide({ content, metadata, onSend }: MetaSetupGuideProps) {
  const { user } = useUser()
  const userId = user?.id
  const upsertChannel = useMutation(api.channels.upsert)

  const steps =
    (Array.isArray(metadata.steps) && (metadata.steps as Step[]).length > 0
      ? (metadata.steps as Step[])
      : DEFAULT_STEPS)

  const pipedreamApp = (metadata.pipedreamApp as string) ?? "facebook_pages"
  const oauthAppId = (metadata.oauthAppId as string | undefined) ?? "oa_K1i8YD"
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
                  platform: "meta",
                  oauthAccessToken: authProvisionId,
                })
              }
              setStatus("success")
              onSend?.("I've connected Meta — what's next?")
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
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#0866ff] to-[#7c3aed] flex items-center justify-center text-[10px] font-bold text-white">
              M
            </div>
            <span className="text-sm font-medium text-white">
              Set up your Meta ad account
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {completedCount}/{totalSteps}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-white/5 mb-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-purple-400 transition-all"
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
                      <CheckCircle className="w-4 h-4 text-teal-400" />
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
                        className="inline-flex items-center gap-1.5 text-xs text-teal-300 hover:text-teal-200 transition-colors"
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
              <span>Meta connected successfully — I&apos;ll take it from here.</span>
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
            >
              <Link2 size={16} />
              {status === "connecting"
                ? "Connecting..."
                : "I've set it up — connect Meta to Spun"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
