"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useQuery, useMutation } from "convex/react"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { api } from "../../../convex/_generated/api"
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Unlink, Eye, EyeOff, Link2 } from "lucide-react"
import type { Id, Doc } from "../../../convex/_generated/dataModel"
import type { PipedreamClient as FrontendClient } from "@pipedream/sdk/browser"
import { TIERS, CREDIT_PACK } from "@/lib/billing/tiers"

const PLATFORMS = [
  { id: "meta", label: "Meta (Facebook & Instagram)", pipedreamApp: "facebook_pages", oauthAppId: "oa_K1i8YD" },
  { id: "google", label: "Google Ads", pipedreamApp: null, oauthAppId: undefined },
  { id: "ga4", label: "Google Analytics 4", pipedreamApp: "google_analytics", oauthAppId: undefined },
  { id: "klaviyo", label: "Klaviyo", pipedreamApp: null, oauthAppId: undefined },
  { id: "tiktok", label: "TikTok Ads", pipedreamApp: null, oauthAppId: undefined },
  { id: "x", label: "X (Twitter) Ads", pipedreamApp: null, oauthAppId: undefined },
  { id: "linkedin", label: "LinkedIn Ads", pipedreamApp: null, oauthAppId: undefined },
  { id: "shopify", label: "Shopify", pipedreamApp: null, oauthAppId: undefined },
  { id: "buffer", label: "Buffer", pipedreamApp: null, oauthAppId: undefined },
]

const CURRENCIES = [
  { code: "GBP", label: "GBP — British Pound" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "AUD", label: "AUD — Australian Dollar" },
  { code: "CAD", label: "CAD — Canadian Dollar" },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
      {children}
    </h2>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[var(--background-dark)] border border-white/5 rounded-xl p-5">
      {children}
    </div>
  )
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? "bg-[#5B9BAA]" : "bg-white/10"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const userId = user?.id ?? null

  const [accountIdVisible, setAccountIdVisible] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState("")
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await fetch("/api/delete-account", { method: "DELETE" })
      await signOut({ redirectUrl: "/login" })
    } catch {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (!userId) return
    fetch("/api/account-id")
      .then((r) => r.json())
      .then((data) => { if (data.accountId) setAccountId(data.accountId) })
      .catch(() => {})
  }, [userId])

  const business = useQuery(api.businesses.getByUser, userId ? { userId } : "skip")
  const channels = useQuery(
    api.channels.listByBusiness,
    business?._id ? { businessId: business._id } : "skip"
  )
  const usage = useQuery(
    api.usage.getCurrentUsage,
    business?._id ? { businessId: business._id } : "skip"
  )
  const subscription = useQuery(
    api.subscriptions.getByUser,
    userId ? { userId } : "skip"
  )
  const creditBalance = useQuery(
    api.credits.getBalance,
    business?._id ? { businessId: business._id } : "skip"
  )

  const disconnectChannel = useMutation(api.channels.disconnect)
  const upsertChannel = useMutation(api.channels.upsert)
  const updateSettings = useMutation(api.businesses.updateSettings)

  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null)
  const [connectFeedback, setConnectFeedback] = useState<{ platform: string; success: boolean } | null>(null)
  const [connectError, setConnectError] = useState<string | null>(null)

  // Fetch a fresh connect token from our backend
  const fetchToken = useCallback(async () => {
    const res = await fetch("/api/integrations/connect-token", { method: "POST" })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Failed to get connect token")
    console.log("[Pipedream] Token response _debug:", data._debug)
    return {
      token: data.token as string,
      expiresAt: new Date(data.expiresAt),
      connectLinkUrl: (data.connectLinkUrl as string) ?? "",
    }
  }, [])

  // Create a NEW client for each connect attempt to avoid stale token issues.
  // Tokens are single-use so we must not cache the client across attempts.
  const createPdClient = useCallback(async () => {
    if (!userId) throw new Error("Not signed in")
    const { createFrontendClient } = await import("@pipedream/sdk/browser")
    return createFrontendClient({
      externalUserId: userId,
      tokenCallback: () => fetchToken(),
    })
  }, [userId, fetchToken])

  async function handleConnect(platformId: string, pipedreamApp: string, oauthAppId?: string) {
    if (!business?._id || connectingPlatform || !userId) return
    setConnectingPlatform(platformId)
    setConnectError(null)
    try {
      // Create a fresh client each time to ensure a fresh token
      const client = await createPdClient()

      await new Promise<void>((resolve, reject) => {
        client.connectAccount({
          app: pipedreamApp,
          ...(oauthAppId ? { oauthAppId } : {}),
          onSuccess: async (result) => {
            try {
              const authProvisionId = result?.id
              console.log("[Pipedream] onSuccess result:", JSON.stringify(result))
              if (!authProvisionId) {
                throw new Error("No account ID returned from Pipedream")
              }
              await upsertChannel({
                businessId: business._id as Id<"businesses">,
                platform: platformId,
                oauthAccessToken: authProvisionId,
              })
              setConnectFeedback({ platform: platformId, success: true })
              resolve()
            } catch (err) {
              reject(err)
            }
          },
          onError: (err) => {
            console.error("[Pipedream] onError:", err)
            reject(err)
          },
          onClose: ({ successful, completed }) => {
            if (!successful && !completed) {
              reject(new Error("cancelled"))
            }
          },
        })
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg === "cancelled" || msg.includes("closed")) return
      console.error("Connect error:", msg)
      setConnectFeedback({ platform: platformId, success: false })
      setConnectError(msg)
    } finally {
      setConnectingPlatform(null)
      setTimeout(() => { setConnectFeedback(null); setConnectError(null) }, 8000)
    }
  }

  // Local state for campaign defaults
  const [budget, setBudget] = useState<string>("")
  const [currency, setCurrency] = useState<string>("")
  const [budgetSaved, setBudgetSaved] = useState(false)

  // Sync local state from business once loaded
  const [initialised, setInitialised] = useState(false)
  if (business && !initialised) {
    setBudget(business.defaultCampaignBudget?.toString() ?? "")
    setCurrency(business.currency ?? "GBP")
    setInitialised(true)
  }

  // Notification toggles
  const defaultNotifs = {
    campaignApprovals: true,
    usageWarnings: true,
    integrationExpiry: true,
    weeklySummary: false,
  }
  const notifs = business?.notifications ?? defaultNotifs

  async function handleNotifToggle(key: keyof typeof defaultNotifs) {
    if (!business?._id) return
    await updateSettings({
      id: business._id as Id<"businesses">,
      notifications: { ...notifs, [key]: !notifs[key] },
    })
  }

  async function handleBudgetSave() {
    if (!business?._id) return
    const parsed = parseFloat(budget)
    await updateSettings({
      id: business._id as Id<"businesses">,
      defaultCampaignBudget: isNaN(parsed) ? undefined : parsed,
      currency: currency || "GBP",
    })
    setBudgetSaved(true)
    setTimeout(() => setBudgetSaved(false), 2000)
  }

  async function handleCurrencyChange(val: string) {
    setCurrency(val)
    if (!business?._id) return
    await updateSettings({
      id: business._id as Id<"businesses">,
      currency: val,
    })
  }

  const connectedMap = new Map<string, Doc<"connectedChannels">>(
    (channels ?? []).map((c: Doc<"connectedChannels">) => [c.platform, c])
  )

  function statusIcon(status: string) {
    if (status === "active") return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
    if (status === "expired") return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
    return <XCircle className="w-3.5 h-3.5 text-red-400" />
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[var(--background)]/80 backdrop-blur border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/chat")}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <span className="text-sm font-medium">Settings</span>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">

        {/* Connected Platforms */}
        <section>
          <SectionHeading>Connected Platforms</SectionHeading>
          {connectError && (
            <div className="mb-3 rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3">
              <p className="text-xs text-red-400 font-medium mb-0.5">Connection failed</p>
              <p className="text-xs text-red-300/70 break-all">{connectError}</p>
            </div>
          )}
          <Card>
            <ul className="divide-y divide-white/5">
              {PLATFORMS.map((platform) => {
                const channel = connectedMap.get(platform.id)
                return (
                  <li key={platform.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      {channel ? statusIcon(channel.status) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-white/20" />
                      )}
                      <div>
                        <p className="text-sm text-white">{platform.label}</p>
                        {channel?.platformAccountName && (
                          <p className="text-xs text-slate-500 mt-0.5">{channel.platformAccountName}</p>
                        )}
                      </div>
                    </div>
                    {channel ? (
                      <button
                        onClick={() => disconnectChannel({ id: channel._id as Id<"connectedChannels"> })}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-400/5"
                      >
                        <Unlink className="w-3 h-3" />
                        Disconnect
                      </button>
                    ) : platform.pipedreamApp ? (
                      <button
                        onClick={() => handleConnect(platform.id, platform.pipedreamApp!, platform.oauthAppId)}
                        disabled={connectingPlatform === platform.id}
                        className="flex items-center gap-1.5 text-xs text-[#5B9BAA] hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-[#5B9BAA]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Link2 className="w-3 h-3" />
                        {connectingPlatform === platform.id ? "Connecting…" : connectFeedback?.platform === platform.id && !connectFeedback.success ? "Failed — retry" : "Connect"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-600">Coming soon</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
        </section>

        {/* Plan & Usage */}
        <section>
          <SectionHeading>Plan &amp; Usage</SectionHeading>
          <Card>
            {(() => {
              const tier = (subscription?.tier ?? "standard") as "standard" | "pro"
              const config = TIERS[tier]
              return (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-sm font-medium text-white">{config.name} plan</p>
                      <p className="text-xs text-slate-400 mt-0.5">Resets on the 1st of each month</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {subscription?.stripeCustomerId && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch("/api/stripe/customer-portal", { method: "POST" })
                              const data = await res.json()
                              if (data.url) window.location.href = data.url
                            } catch {}
                          }}
                          className="text-xs text-slate-400 hover:text-white hover:underline"
                        >
                          Manage billing
                        </button>
                      )}
                      <a
                        href="/pricing"
                        className="text-xs text-[#5B9BAA] hover:underline"
                      >
                        {tier === "standard" ? "Upgrade" : "Change plan"}
                      </a>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "AI Responses", value: usage?.aiResponsesSent ?? 0, limit: config.messages },
                      { label: "Campaigns", value: usage?.campaignsLaunched ?? 0, limit: config.campaigns },
                      { label: "Creatives", value: usage?.creativesGenerated ?? 0, limit: config.creatives },
                      { label: "Channels", value: usage?.channelsConnected ?? 0, limit: config.channels },
                    ].map(({ label, value, limit }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-300">{label}</span>
                          <span className="text-slate-400">{value} / {limit}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min((value / limit) * 100, 100)}%`,
                              backgroundColor: value >= limit ? "#ef4444" : "#5B9BAA",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Credit balance */}
                  {creditBalance && (creditBalance.messageCredits > 0 || creditBalance.creativeCredits > 0 || creditBalance.channelCredits > 0) && (
                    <div className="mt-5 pt-4 border-t border-white/10">
                      <p className="text-xs font-medium text-slate-300 mb-2">Credit Balance</p>
                      <div className="flex gap-4 text-xs text-slate-400">
                        {creditBalance.messageCredits > 0 && (
                          <span>{creditBalance.messageCredits} responses</span>
                        )}
                        {creditBalance.creativeCredits > 0 && (
                          <span>{creditBalance.creativeCredits} creatives</span>
                        )}
                        {creditBalance.channelCredits > 0 && (
                          <span>+{creditBalance.channelCredits} channel{creditBalance.channelCredits > 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Buy credits button */}
                  <button
                    onClick={async () => {
                      if (!business?._id) return
                      try {
                        const res = await fetch("/api/stripe/credit-checkout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ businessId: business._id }),
                        })
                        const data = await res.json()
                        if (data.url) window.location.href = data.url
                      } catch {}
                    }}
                    className="mt-4 w-full text-xs text-[#5B9BAA] border border-[#5B9BAA]/30 hover:bg-[#5B9BAA]/10 py-2 rounded-lg transition-colors"
                  >
                    Buy credit pack — £{(CREDIT_PACK.price / 100).toFixed(2)}
                  </button>
                </>
              )
            })()}
          </Card>
        </section>

        {/* Campaign Defaults */}
        <section>
          <SectionHeading>Campaign Defaults</SectionHeading>
          <Card>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Default budget</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    onBlur={handleBudgetSave}
                    placeholder="e.g. 1000"
                    className="w-full bg-[var(--background)] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#5B9BAA]/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full bg-[var(--background)] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5B9BAA]/50"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {budgetSaved && (
              <p className="text-xs text-emerald-400 mt-3">Saved</p>
            )}
          </Card>
        </section>

        {/* Email Notifications */}
        <section>
          <SectionHeading>Email Notifications</SectionHeading>
          <Card>
            <ul className="divide-y divide-white/5">
              {[
                { key: "campaignApprovals" as const, label: "Campaign approvals", description: "When an action is queued for your review" },
                { key: "usageWarnings" as const, label: "Usage warnings", description: "When you're approaching a plan limit" },
                { key: "integrationExpiry" as const, label: "Integration expiry", description: "When a connected platform token is about to expire" },
                { key: "weeklySummary" as const, label: "Weekly summary", description: "A digest of campaign activity and performance" },
              ].map(({ key, label, description }) => (
                <li key={key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm text-white">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                  </div>
                  <Toggle
                    checked={notifs[key]}
                    onChange={() => handleNotifToggle(key)}
                  />
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* Account */}
        <section>
          <SectionHeading>Account</SectionHeading>
          <Card>
            <div className="space-y-3 mb-5">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Name</p>
                <p className="text-sm text-white">{user?.fullName ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Email</p>
                <p className="text-sm text-white">{user?.primaryEmailAddress?.emailAddress ?? "—"}</p>
              </div>
              {accountId && (
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Account ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white font-mono">
                      {accountIdVisible ? accountId : "•".repeat(accountId.length)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setAccountIdVisible((v) => !v)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {accountIdVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  await signOut({ redirectUrl: "/login" })
                }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors text-left"
              >
                Sign out
              </button>
              <button
                type="button"
                onClick={() => { setDeleteModalOpen(true); setDeleteInput("") }}
                className="text-sm text-slate-500 hover:text-slate-400 transition-colors text-left"
              >
                Delete account
              </button>
            </div>
          </Card>
        </section>

      </div>

      {/* Delete account modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--background-dark)] border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 space-y-5">
            {deleting ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <svg className="animate-spin w-7 h-7 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <p className="text-sm text-slate-400">Deleting your account…</p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-base font-semibold text-red-400">Are you sure?</p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    This will permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Enter your Account ID to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="e.g. 00001"
                    className="w-full bg-[var(--background)] border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-red-400/50"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    className="flex-1 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg py-2 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleteInput !== accountId}
                    onClick={handleDeleteAccount}
                    className={`flex-1 text-sm rounded-lg py-2 transition-colors ${
                      deleteInput === accountId
                        ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                        : "bg-red-500/20 text-red-400/40 cursor-not-allowed"
                    }`}
                  >
                    Delete account
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
