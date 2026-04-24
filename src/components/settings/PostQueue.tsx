"use client"

import { useState } from "react"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import {
  Instagram,
  Facebook,
  Loader2,
  X,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"

interface PostQueueProps {
  businessId: Id<"businesses"> | null
}

type SocialPost = {
  _id: string
  _creationTime: number
  platform: "facebook" | "instagram"
  caption: string
  imageStorageId?: string
  status: "draft" | "scheduled" | "publishing" | "published" | "failed"
  scheduledAt?: number
  publishedAt?: number
  platformPostId?: string
  permalink?: string
  error?: string
}

function PostThumbnail({ storageId }: { storageId: Id<"_storage"> }) {
  const url = useQuery(api.adCreatives.getImageUrl, { storageId })
  if (!url) {
    return <div className="w-14 h-14 rounded-md bg-surface-alt animate-pulse flex-shrink-0" />
  }
  return (
    <img
      src={url}
      alt=""
      className="w-14 h-14 rounded-md object-cover flex-shrink-0"
    />
  )
}

function PlatformBadge({ platform }: { platform: "facebook" | "instagram" }) {
  if (platform === "facebook") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-[#5b9fff]">
        <Facebook className="w-3 h-3" />
        Facebook
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-pink-300">
      <Instagram className="w-3 h-3" />
      Instagram
    </span>
  )
}

function formatWhen(ts?: number) {
  if (!ts) return ""
  const d = new Date(ts)
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function PostRow({
  post,
  onCancel,
  onRetry,
}: {
  post: SocialPost
  onCancel?: () => void
  onRetry?: () => void
}) {
  const [busy, setBusy] = useState(false)

  async function wrap(fn?: () => Promise<void> | void) {
    if (!fn || busy) return
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      {post.imageStorageId ? (
        <PostThumbnail storageId={post.imageStorageId as Id<"_storage">} />
      ) : (
        <div className="w-14 h-14 rounded-md bg-surface-alt flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <PlatformBadge platform={post.platform} />
          {post.status === "scheduled" && post.scheduledAt && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700">
              <Clock className="w-3 h-3" />
              {formatWhen(post.scheduledAt)}
            </span>
          )}
          {post.status === "publishing" && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700">
              <Loader2 className="w-3 h-3 animate-spin" />
              Publishing…
            </span>
          )}
          {post.status === "published" && (
            <span className="inline-flex items-center gap-1 text-[10px] text-spun">
              <CheckCircle2 className="w-3 h-3" />
              {formatWhen(post.publishedAt ?? post._creationTime)}
            </span>
          )}
          {post.status === "failed" && (
            <span className="inline-flex items-center gap-1 text-[10px] text-red-600">
              <AlertCircle className="w-3 h-3" />
              Failed
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 line-clamp-2 break-words">
          {post.caption}
        </p>
        {post.status === "failed" && post.error && (
          <p className="text-[11px] text-red-600/80 mt-1 line-clamp-2 break-words">
            {post.error}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {post.status === "published" && post.permalink && (
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-surface-alt"
          >
            <ExternalLink className="w-3 h-3" />
            View
          </a>
        )}
        {post.status === "scheduled" && onCancel && (
          <button
            disabled={busy}
            onClick={() => wrap(onCancel)}
            className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-400/5 disabled:opacity-50"
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
        )}
        {post.status === "failed" && onRetry && (
          <button
            disabled={busy}
            onClick={() => wrap(onRetry)}
            className="inline-flex items-center gap-1 text-[11px] text-spun hover:text-gray-900 px-2 py-1 rounded-md hover:bg-spun-50 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Retry
          </button>
        )}
      </div>
    </li>
  )
}

export function PostQueue({ businessId }: PostQueueProps) {
  const posts = useQuery(
    api.socialPosts.listByBusiness,
    businessId ? { businessId } : "skip"
  )
  const cancelPost = useMutation(api.socialPosts.cancel)
  const publishNow = useAction(api.socialPostsActions.publishNow)

  if (!businessId || posts === undefined) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading your posts…
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <p className="text-xs text-gray-400">
        No posts yet. Generate social creatives in chat, then use Post to
        Facebook / Instagram to publish or schedule them.
      </p>
    )
  }

  const upcoming = posts
    .filter((p: SocialPost) => p.status === "scheduled" || p.status === "publishing")
    .sort(
      (a: SocialPost, b: SocialPost) =>
        (a.scheduledAt ?? a._creationTime) - (b.scheduledAt ?? b._creationTime)
    )
  const published = posts
    .filter((p: SocialPost) => p.status === "published")
    .sort(
      (a: SocialPost, b: SocialPost) =>
        (b.publishedAt ?? b._creationTime) - (a.publishedAt ?? a._creationTime)
    )
    .slice(0, 10)
  const failed = posts
    .filter((p: SocialPost) => p.status === "failed")
    .sort((a: SocialPost, b: SocialPost) => b._creationTime - a._creationTime)

  return (
    <div className="space-y-5">
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Upcoming
          </h3>
          <ul className="divide-y divide-white/5">
            {upcoming.map((post: SocialPost) => (
              <PostRow
                key={post._id}
                post={post}
                onCancel={
                  post.status === "scheduled"
                    ? async () => {
                        await cancelPost({ postId: post._id as Id<"socialPosts"> })
                      }
                    : undefined
                }
              />
            ))}
          </ul>
        </div>
      )}

      {failed.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Failed
          </h3>
          <ul className="divide-y divide-white/5">
            {failed.map((post: SocialPost) => (
              <PostRow
                key={post._id}
                post={post}
                onRetry={async () => {
                  await publishNow({ postId: post._id as Id<"socialPosts"> })
                }}
              />
            ))}
          </ul>
        </div>
      )}

      {published.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Recently published
          </h3>
          <ul className="divide-y divide-white/5">
            {published.map((post: SocialPost) => (
              <PostRow key={post._id} post={post} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
