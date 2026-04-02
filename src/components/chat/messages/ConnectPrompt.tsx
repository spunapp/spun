"use client"

import { useState, useEffect, useCallback } from "react"
import { useMutation } from "convex/react"
import { useUser } from "@clerk/nextjs"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { Link2, CheckCircle, XCircle } from "lucide-react"
import type { PipedreamClient as FrontendClient } from "@pipedream/sdk/browser"

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta (Facebook & Instagram)",
  google: "Google Ads",
  ga4: "Google Analytics 4",
  klaviyo: "Klaviyo",
  tiktok: "TikTok Ads",
  linkedin: "LinkedIn Ads",
  shopify: "Shopify",
  buffer: "Buffer",
}

interface ConnectPromptProps {
  content: string
  metadata: Record<string, unknown>
}

export function ConnectPrompt({ content, metadata }: ConnectPromptProps) {
  const { user } = useUser()
  const userId = user?.id
  const upsertChannel = useMutation(api.channels.upsert)

  const platform = metadata.platform as string
  const pipedreamApp = metadata.pipedreamApp as string
  const oauthAppId = metadata.oauthAppId as string | undefined
  const label = PLATFORM_LABELS[platform] ?? platform

  const [status, setStatus] = useState<"idle" | "connecting" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // We need the businessId to save the connection. Get it from metadata or skip.
  const businessId = metadata.businessId as string | undefined

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
    if (!userId || !pipedreamApp || status === "connecting") return
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
                  platform,
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

  if (metadata.error) {
    return (
      <div className="space-y-2">
        <p className="text-white/90 whitespace-pre-wrap">{content}</p>
        <p className="text-red-400 text-sm">{metadata.error as string}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-white/90 whitespace-pre-wrap">{content}</p>

      {status === "success" ? (
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle size={18} />
          <span>{label} connected successfully!</span>
        </div>
      ) : status === "error" ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-red-400">
            <XCircle size={18} />
            <span>Connection failed{errorMsg ? `: ${errorMsg}` : ""}</span>
          </div>
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-colors"
          >
            Try again
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={status === "connecting"}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors"
        >
          <Link2 size={16} />
          {status === "connecting" ? "Connecting..." : `Connect ${label}`}
        </button>
      )}
    </div>
  )
}
