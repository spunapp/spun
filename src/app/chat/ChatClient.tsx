"use client"

import { useState, useCallback, useEffect } from "react"
import { usePreloadedQuery, useQuery, useMutation, useAction } from "convex/react"
import { useUser } from "@clerk/nextjs"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import type { Preloaded } from "convex/react"
import { ChatThread } from "@/components/chat/ChatThread"
import { ChatInput } from "@/components/chat/ChatInput"
import { QuickReplies } from "@/components/chat/QuickReplies"

type Props = {
  userId: string
  preloadedData: Preloaded<typeof api.conversations.listWithLatestMessages>
  preloadedBusiness: Preloaded<typeof api.businesses.getByUser>
}

export default function ChatClient({ userId, preloadedData, preloadedBusiness }: Props) {
  const [selectedConversationId, setSelectedConversationId] =
    useState<Id<"conversations"> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quickReplies, setQuickReplies] = useState<string[]>([])

  // Data is available immediately — no loading waterfall
  const initialData = usePreloadedQuery(preloadedData)
  const business = usePreloadedQuery(preloadedBusiness)

  const { conversations, latestConversationId } = initialData

  // Derive active conversation from selection or the server-preloaded latest
  const activeConversationId =
    selectedConversationId ?? (latestConversationId as Id<"conversations"> | null)

  // Only fires when user explicitly switches to a non-latest conversation
  const switchedMessages = useQuery(
    api.conversations.getMessages,
    selectedConversationId && selectedConversationId !== latestConversationId
      ? { conversationId: selectedConversationId }
      : "skip"
  )

  const messages =
    selectedConversationId && selectedConversationId !== latestConversationId
      ? switchedMessages
      : initialData.messages

  // Mutations & Actions
  const createConversation = useMutation(api.conversations.create)
  const chat = useAction(api.ai.chat)
  const approveAction = useMutation(api.approvals.approve)
  const rejectAction = useMutation(api.approvals.reject)

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
    async (message: string) => {
      if (!userId || !activeConversationId) return

      setIsLoading(true)
      setQuickReplies([])
      setError(null)

      try {
        await chat({ conversationId: activeConversationId, userMessage: message, userId })
      } catch (err) {
        console.error("Chat error:", err)
        setError("Something went wrong. Please try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [userId, activeConversationId, chat]
  )

  const handleApprove = useCallback(
    async (approvalId: string) => {
      try {
        await approveAction({ id: approvalId as Id<"approvalQueue"> })
      } catch (err) {
        console.error("Approve error:", err)
      }
    },
    [approveAction]
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

  return (
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
        isInitializing={false}
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
  )
}
