"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { api } from "../../../convex/_generated/api"
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Unlink } from "lucide-react"
import type { Id, Doc } from "../../../convex/_generated/dataModel"

const PLATFORMS = [
  { id: "meta", label: "Meta (Facebook & Instagram)" },
  { id: "google", label: "Google Ads" },
  { id: "ga4", label: "Google Analytics 4" },
  { id: "klaviyo", label: "Klaviyo" },
  { id: "tiktok", label: "TikTok Ads" },
  { id: "linkedin", label: "LinkedIn Ads" },
  { id: "shopify", label: "Shopify" },
  { id: "buffer", label: "Buffer" },
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

  const business = useQuery(api.businesses.getByUser, userId ? { userId } : "skip")
  const channels = useQuery(
    api.channels.listByBusiness,
    business?._id ? { businessId: business._id } : "skip"
  )
  const usage = useQuery(
    api.usage.getCurrentUsage,
    business?._id ? { businessId: business._id } : "skip"
  )

  const disconnectChannel = useMutation(api.channels.disconnect)
  const updateSettings = useMutation(api.businesses.updateSettings)

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
                    ) : (
                      <span className="text-xs text-slate-600">Not connected</span>
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
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-medium text-white">Growth plan</p>
                <p className="text-xs text-slate-400 mt-0.5">Resets on the 1st of each month</p>
              </div>
              <a
                href="/pricing"
                className="text-xs text-[#5B9BAA] hover:underline"
              >
                Upgrade
              </a>
            </div>
            <div className="space-y-4">
              {[
                { label: "Campaigns", value: usage?.campaignsLaunched ?? 0, limit: 50 },
                { label: "Creatives", value: usage?.creativesGenerated ?? 0, limit: 150 },
                { label: "Channels", value: usage?.channelsConnected ?? 0, limit: 5 },
              ].map(({ label, value, limit }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">{label}</span>
                    <span className="text-slate-400">{value} / {limit}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#5B9BAA] rounded-full transition-all"
                      style={{ width: `${Math.min((value / limit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
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
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  await signOut()
                  router.push("/login")
                }}
                className="text-sm text-red-400 hover:text-red-300 transition-colors text-left"
              >
                Sign out
              </button>
              <a
                href={`mailto:hello@spun.ai?subject=Delete%20My%20Account&body=Hi%2C%0A%0APlease%20delete%20my%20account%20associated%20with%20this%20email%20address.%0A%0AThank%20you.`}
                className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
              >
                Delete account
              </a>
            </div>
          </Card>
        </section>

      </div>
    </div>
  )
}
