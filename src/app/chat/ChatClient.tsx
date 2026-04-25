"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useQuery, useMutation, useAction } from "convex/react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { TIERS, CREDIT_PACK } from "@/lib/billing/tiers"
import { ChatThread } from "@/components/chat/ChatThread"
import { ChatInput } from "@/components/chat/ChatInput"
import { QuickReplies } from "@/components/chat/QuickReplies"
import { ChatSidebarProvider } from "./ChatSidebarContext"
import { useCurrency } from "@/lib/currency/context"

// Test accounts that bypass the subscription check (matched by email)
const TEST_ACCOUNT_EMAILS = new Set([
  "azahmed01@gmail.com",
  "a@buxor.co",
])

export default function ChatClient() {
  const { user } = useUser()
  const userId = user?.id ?? null
  const router = useRouter()
  const { formatFromGBP } = useCurrency()
  const [selectedConversationId, setSelectedConversationId] =
    useState<Id<"conversations"> | null>(null)
  const [pendingSend, setPendingSend] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quickReplies, setQuickReplies] = useState<string[]>([])

  // Queries
  const conversations = useQuery(
    api.conversations.list,
    userId ? { userId } : "skip"
  )
  const business = useQuery(
    api.businesses.getByUser,
    userId ? { userId } : "skip"
  )
  const subscription = useQuery(
    api.subscriptions.getByUser,
    userId ? { userId } : "skip"
  )
  const usage = useQuery(
    api.usage.getCurrentUsage,
    business?._id ? { businessId: business._id } : "skip"
  )
  const creditBalance = useQuery(
    api.credits.getBalance,
    business?._id ? { businessId: business._id } : "skip"
  )

  // Check if user has hit their message limit
  const tier = (subscription?.tier ?? "standard") as "standard" | "pro"
  const tierConfig = TIERS[tier]
  const aiResponsesSent = usage?.aiResponsesSent ?? 0
  const messageCreditsLeft = creditBalance?.messageCredits ?? 0
  const atMessageLimit = aiResponsesSent >= tierConfig.messages && messageCreditsLeft <= 0

  // Redirect to pricing if no active subscription (skip for test accounts)
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? null
  const isTestAccount = userEmail ? TEST_ACCOUNT_EMAILS.has(userEmail) : false
  const hasActiveSubscription = subscription &&
    (subscription.status === "active" || subscription.status === "trialing")
  const subscriptionLoaded = subscription !== undefined

  useEffect(() => {
    if (!userId || !subscriptionLoaded || isTestAccount) return
    if (!hasActiveSubscription) {
      router.replace("/pricing")
    }
  }, [userId, subscriptionLoaded, hasActiveSubscription, isTestAccount, router])

  // Derive active conversation directly — no useEffect+setState round-trip
  const activeConversationId =
    selectedConversationId ??
    (conversations && conversations.length > 0
      ? (conversations[0]._id as Id<"conversations">)
      : null)

  const messages = useQuery(
    api.conversations.getMessages,
    activeConversationId ? { conversationId: activeConversationId } : "skip"
  )

  // Loading state: true when we've sent a message and the assistant hasn't
  // replied yet (last message in the thread is from the user).
  const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null
  const isLoading = pendingSend || (lastMessage?.role === "user" && messages !== undefined)

  // Mutations & Actions
  const createConversation = useMutation(api.conversations.create)
  const chat = useAction(api.ai.chat)
  const approveAction = useMutation(api.approvals.approve)
  const rejectAction = useMutation(api.approvals.reject)
  const generateUploadUrl = useMutation(api.brandAssets.generateUploadUrl)
  const saveBrandAsset = useMutation(api.brandAssets.save)

  // Auto-create first conversation if none exist
  const [creatingFirst, setCreatingFirst] = useState(false)
  useEffect(() => {
    if (userId && conversations && conversations.length === 0 && !creatingFirst) {
      setCreatingFirst(true)
      createConversation({
        userId,
        businessId: business?._id,
        title: business ? "Marketing Strategy" : "Getting Started",
      }).then((id) => {
        setSelectedConversationId(id)
      })
    }
  }, [userId, conversations, business, createConversation, creatingFirst])

  // Determine quick replies based on context
  useEffect(() => {
    if (!business) {
      setQuickReplies([])
      return
    }

    if (messages && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === "assistant") {
        if (lastMsg.messageType === "campaign_preview") {
          setQuickReplies(["Approve this", "Adjust budget", "Now do social posts"])
        } else if (lastMsg.messageType === "strategy") {
          setQuickReplies(["Create the ads", "Adjust targeting", "Now do social posts"])
        } else if (lastMsg.messageType === "gbp_audit") {
          // Branch on whether the audit found an existing GBP. "Fix the top
          // issues" only makes sense when there's a profile to fix — the
          // not-found card already has its own "Help me set one up" CTA.
          const found = (lastMsg.metadata as { found?: boolean } | undefined)?.found
          setQuickReplies(
            found
              ? ["Fix the top issues", "Now recommend an ad platform"]
              : ["Now recommend an ad platform", "I'll create my GBP first"]
          )
        } else if (lastMsg.messageType === "creative_gallery") {
          setQuickReplies([
            "Post the best one to Instagram",
            "Schedule these across the week",
            "Try a different style",
          ])
        } else if (lastMsg.messageType === "meta_setup_guide") {
          setQuickReplies([
            "I'm stuck on business verification",
            "Which payment method should I pick?",
            "I've finished — what's next?",
          ])
        } else if (lastMsg.messageType === "google_ads_setup_guide") {
          setQuickReplies([
            "I'm stuck on billing setup",
            "How do I set up conversion tracking?",
            "I've finished — what's next?",
          ])
        } else {
          setQuickReplies([])
        }
      }
    }
  }, [messages, business])

  const sendingRef = useRef(false)
  const handleSend = useCallback(
    async (message: string, files?: File[]) => {
      if (!userId || !activeConversationId || sendingRef.current) return
      sendingRef.current = true

      setPendingSend(true)
      setQuickReplies([])
      setError(null)

      try {
        // Upload files to brand assets if provided
        if (files && files.length > 0 && business?._id) {
          const uploadedNames: string[] = []
          for (const file of files) {
            try {
              const uploadUrl = await generateUploadUrl()
              const res = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
              })
              const { storageId } = await res.json()
              await saveBrandAsset({
                businessId: business._id,
                userId,
                storageId,
                name: file.name,
                type: "images",
                size: file.size,
                mimeType: file.type,
              })
              uploadedNames.push(file.name)
            } catch (err) {
              console.error("Upload error:", err)
            }
          }
          // Append upload info to the message so the AI knows
          if (uploadedNames.length > 0) {
            message = `${message}\n\n[User uploaded ${uploadedNames.length} image${uploadedNames.length > 1 ? "s" : ""} to brand assets: ${uploadedNames.join(", ")}]`
          }
        }

        // Fire-and-forget: the action saves messages to the DB, and our
        // Convex subscription picks them up in real-time. No need to block
        // the UI waiting for the full AI response.
        chat({ conversationId: activeConversationId, userMessage: message, userId })
          .catch((err) => {
            console.error("Chat error:", err)
            setError("Something went wrong. Please try again.")
          })
          .finally(() => {
            sendingRef.current = false
            setPendingSend(false)
          })
      } catch (err) {
        console.error("Chat error:", err)
        setError("Something went wrong. Please try again.")
        sendingRef.current = false
        setPendingSend(false)
        throw err
      }
    },
    [userId, activeConversationId, chat, business, generateUploadUrl, saveBrandAsset]
  )

  // Retry a user turn that previously failed because the AI backend was
  // unreachable. The failed user text is stashed on the assistant fallback
  // message's metadata, and the retry button passes it back up here.
  const handleRetry = useCallback(
    async (failedUserMessage: string) => {
      try {
        await handleSend(failedUserMessage)
      } catch {
        // handleSend already logged + set the error banner.
      }
    },
    [handleSend]
  )

  const handleApprove = useCallback(
    async (approvalId: string) => {
      try {
        // Find the message with this approval to get campaign details
        const msg = (messages ?? []).find(
          (m: { messageType: string; metadata?: Record<string, unknown> }) =>
            m.messageType === "approval_request" && (m.metadata as Record<string, unknown>)?.approvalId === approvalId
        )
        const meta = msg?.metadata as Record<string, unknown> | undefined

        if (meta?.campaignId && meta?.platform) {
          // Execute the campaign on the ad platform first
          const res = await fetch("/api/integrations/execute-campaign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              approvalId,
              campaignId: meta.campaignId,
              platform: meta.platform,
              budget: meta.budget,
            }),
          })

          if (!res.ok) {
            const err = await res.json()
            setError(err.error ?? "Failed to launch campaign")
            return
          }
        } else {
          // Fallback: just approve the record directly
          await approveAction({ id: approvalId as Id<"approvalQueue"> })
        }
      } catch (err) {
        console.error("Approve error:", err)
        setError("Something went wrong launching the campaign.")
      }
    },
    [approveAction, messages]
  )

  const handleReject = useCallback(
    async (approvalId: string) => {
      try {
        await rejectAction({ id: approvalId as Id<"approvalQueue"> })
      } catch (err) {
        console.error("Reject error:", err)
      }
    },
    [rejectAction]
  )

  const handleNewConversation = useCallback(async () => {
    if (!userId) return
    const id = await createConversation({
      userId,
      businessId: business?._id,
      title: business ? "Marketing Strategy" : "Getting Started",
    })
    setSelectedConversationId(id)
  }, [userId, business, createConversation])

  const sidebarValue = {
    conversations: conversations as Array<{ _id: string; title?: string; _creationTime: number }> | undefined,
    activeConversationId: activeConversationId as string | null,
    onSelectConversation: (id: string) => setSelectedConversationId(id as Id<"conversations">),
    onNewConversation: handleNewConversation,
  }

  return (
    <ChatSidebarProvider value={sidebarValue}>
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-grid bg-white pl-14 lg:pl-4">
        <div>
          <h1 className="text-sm font-semibold text-gray-900">
            {business ? business.name : "Spun"}
          </h1>
          <p className="text-xs text-gray-500">
            {business
              ? `${business.industry} — ${business.trustMode === "draft" ? "preview before executing mode" : business.trustMode === "auto" ? "auto execute mode" : business.trustMode + " mode"}`
              : "Your local marketing agent is ready"}
          </p>
        </div>
      </header>

      {/* Chat thread */}
      <ChatThread
        messages={
          (messages ?? []) as Array<{
            _id: string
            role: "user" | "assistant" | "system"
            content: string
            messageType: string
            metadata?: Record<string, unknown>
            _creationTime: number
          }>
        }
        isLoading={isLoading}
        isInitializing={conversations === undefined || (activeConversationId !== null && messages === undefined)}
        onApprove={handleApprove}
        onReject={handleReject}
        onRetry={handleRetry}
        onSend={handleSend}
      />

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-3 text-red-700 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Usage limit banner */}
      {atMessageLimit && business && (
        <div className="mx-4 mb-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p className="text-amber-800 font-medium mb-1">
            You&apos;ve used all {tierConfig.messages} AI responses this month
          </p>
          <div className="flex gap-3">
            <button
              onClick={async () => {
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
              className="text-xs text-spun hover:text-spun-dark transition-colors font-medium"
            >
              Buy credits ({formatFromGBP(CREDIT_PACK.price / 100)})
            </button>
            {tier === "standard" && (
              <a href="/pricing" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
                Upgrade to Growth
              </a>
            )}
          </div>
        </div>
      )}

      {/* Quick replies */}
      {!atMessageLimit && <QuickReplies replies={quickReplies} onSelect={handleSend} />}

      {/* Chat input */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading || !activeConversationId || atMessageLimit}
        placeholder={atMessageLimit ? "Message limit reached — buy credits or upgrade" : business ? "Talk to Spun..." : "Tell me about your local business..."}
      />
    </div>
    </ChatSidebarProvider>
  )
}
