"use client"

import { useState, useCallback, useEffect } from "react"
import { useQuery, useMutation, useAction } from "convex/react"
import { useUser } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { ChatThread } from "@/components/chat/ChatThread"
import { ChatInput } from "@/components/chat/ChatInput"
import { QuickReplies } from "@/components/chat/QuickReplies"
import { ChatSidebarProvider } from "./ChatSidebarContext"

// Test accounts that bypass the subscription check (matched by email)
const TEST_ACCOUNT_EMAILS = new Set([
  "azahmed01@gmail.com",
])

export default function ChatClient() {
  const { user } = useUser()
  const userId = user?.id ?? null
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedConversationId, setSelectedConversationId] =
    useState<Id<"conversations"> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
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

  // Mutations & Actions
  const createConversation = useMutation(api.conversations.create)
  const chat = useAction(api.ai.chat)
  const approveAction = useMutation(api.approvals.approve)
  const rejectAction = useMutation(api.approvals.reject)
  const generateUploadUrl = useMutation(api.brandAssets.generateUploadUrl)
  const saveBrandAsset = useMutation(api.brandAssets.save)

  // Auto-create first conversation if none exist
  useEffect(() => {
    if (userId && conversations && conversations.length === 0) {
      createConversation({
        userId,
        businessId: business?._id,
        title: business ? "Marketing Strategy" : "Getting Started",
      }).then((id) => {
        setSelectedConversationId(id)
      })
    }
  }, [userId, conversations, business, createConversation])

  // Handle ?new=true param to create a fresh conversation
  useEffect(() => {
    if (!userId || searchParams.get("new") !== "true") return
    // Clear the param from the URL immediately
    router.replace("/chat")
    createConversation({
      userId,
      businessId: business?._id,
      title: business ? "Marketing Strategy" : "Getting Started",
    }).then((id) => {
      setSelectedConversationId(id)
    })
  }, [userId, searchParams, business, createConversation, router])

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
          setQuickReplies(["Approve this", "Adjust budget", "Try different angle"])
        } else if (lastMsg.messageType === "strategy") {
          setQuickReplies(["Generate creatives", "Adjust targeting", "Launch this"])
        } else {
          setQuickReplies([])
        }
      }
    }
  }, [messages, business])

  const handleSend = useCallback(
    async (message: string, files?: File[]) => {
      if (!userId || !activeConversationId) return

      setIsLoading(true)
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

        await chat({ conversationId: activeConversationId, userMessage: message, userId })
      } catch (err) {
        console.error("Chat error:", err)
        setError("Something went wrong. Please try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [userId, activeConversationId, chat, business, generateUploadUrl, saveBrandAsset]
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
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 pl-14 lg:pl-4">
        <div>
          <h1 className="text-sm font-medium text-white">
            {business ? business.name : "Spun"}
          </h1>
          <p className="text-xs text-slate-500">
            {business
              ? `${business.industry} — ${business.trustMode === "draft" ? "preview before executing mode" : business.trustMode === "auto" ? "auto execute mode" : business.trustMode + " mode"}`
              : "Your Marketing Team is ready"}
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
      />

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 flex items-center justify-between rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-3 text-red-400 hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick replies */}
      <QuickReplies replies={quickReplies} onSelect={handleSend} />

      {/* Chat input */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading || !activeConversationId}
        placeholder={business ? "Talk to Spun..." : "Tell me about your business..."}
      />
    </div>
    </ChatSidebarProvider>
  )
}
