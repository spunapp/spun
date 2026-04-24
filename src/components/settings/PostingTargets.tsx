"use client"

import { useEffect, useState } from "react"
import { useAction, useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

type Target = { pageId: string; pageName: string; igUserId?: string }

interface PostingTargetsProps {
  businessId: Id<"businesses"> | null
  metaConnected: boolean
  defaultFacebookPageId?: string
  defaultInstagramUserId?: string
}

// Lets the user pick which Facebook Page and Instagram Business account
// Spun posts to. Without this set, the first publish attempt fails and
// the user has to pick in chat — this surfaces it in Settings so they can
// do it up-front.
export function PostingTargets({
  businessId,
  metaConnected,
  defaultFacebookPageId,
  defaultInstagramUserId,
}: PostingTargetsProps) {
  const listMetaTargets = useAction(api.socialPostsActions.listMetaTargets)
  const setDefaultTargets = useMutation(api.socialPosts.setDefaultTargets)

  const [targets, setTargets] = useState<Target[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedPing, setSavedPing] = useState<"fb" | "ig" | null>(null)

  useEffect(() => {
    if (!metaConnected || !businessId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    listMetaTargets({ businessId })
      .then((res) => {
        if (cancelled) return
        if (res.error) {
          setError(res.error)
          setTargets(null)
        } else {
          setTargets(res.targets ?? [])
        }
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [metaConnected, businessId, listMetaTargets])

  if (!metaConnected) {
    return (
      <p className="text-xs text-slate-500">
        Connect Meta above to pick which Facebook Page and Instagram account
        Spun posts to.
      </p>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading your Pages…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-400">
        <AlertCircle className="w-3 h-3" />
        {error}
      </div>
    )
  }

  if (!targets || targets.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        No Facebook Pages found on your Meta account. Create one at
        facebook.com/pages/create, then reload this page.
      </p>
    )
  }

  const igTargets = targets.filter((t) => t.igUserId)

  async function saveFacebook(pageId: string) {
    if (!businessId) return
    await setDefaultTargets({ businessId, facebookPageId: pageId })
    setSavedPing("fb")
    setTimeout(() => setSavedPing(null), 1500)
  }

  async function saveInstagram(igUserId: string) {
    if (!businessId) return
    await setDefaultTargets({ businessId, instagramUserId: igUserId })
    setSavedPing("ig")
    setTimeout(() => setSavedPing(null), 1500)
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-slate-400">Facebook Page</label>
          {savedPing === "fb" && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
        <select
          value={defaultFacebookPageId ?? ""}
          onChange={(e) => {
            if (e.target.value) saveFacebook(e.target.value)
          }}
          className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5B9BAA]/50"
        >
          <option value="" disabled>
            Choose a Page
          </option>
          {targets.map((t) => (
            <option key={t.pageId} value={t.pageId}>
              {t.pageName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-slate-400">Instagram Business account</label>
          {savedPing === "ig" && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}
        </div>
        {igTargets.length > 0 ? (
          <select
            value={defaultInstagramUserId ?? ""}
            onChange={(e) => {
              if (e.target.value) saveInstagram(e.target.value)
            }}
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5B9BAA]/50"
          >
            <option value="" disabled>
              Choose an Instagram account
            </option>
            {igTargets.map((t) => (
              <option key={t.pageId} value={t.igUserId!}>
                {t.pageName} (linked)
              </option>
            ))}
          </select>
        ) : (
          <p className="text-xs text-slate-500">
            None of your Pages have a linked Instagram Business account. Link
            one at business.facebook.com → Settings → Accounts → Instagram,
            then reload.
          </p>
        )}
      </div>
    </div>
  )
}
