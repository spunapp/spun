"use client"

import { useState, useCallback, useEffect } from "react"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { ChatThread } from "@/components/chat/ChatThread"
import { ChatInput } from "@/components/chat/ChatInput"
import { QuickReplies } from "@/components/chat/QuickReplies"
import { auth } from "@/lib/auth/provider"

export default function ChatClient() {
  const [userId, setUserId] = useState<string | null>(null)
  const [activeConversationId, setActiveConversationId] =
    useState<Id<"conversations"> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const [chatError, setChatError] = useState<string | null>(null)

  // Load user
  useEffect(() => {
    auth.getUser().then((user) => {
      if (user) setUserId(user.id)
    })
  }, [])

  // Queries
  const conversations = useQuery(
    api.conversations.list,
    userId ? { userId } : "skip"
  )
  const business = useQuery(
    api.businesses.getByUser,
    userId ? { userId } : "skip"
  )
  const messages = useQuery(
    api.conversations.getMessages,
    activeConversationId ? { conversationId: activeConversationId } : "skip"
  )

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
        setActiveConversationId(id)
      })
    } else if (
      conversations &&
      conversations.length > 0 &&
      !activeConversationId
    ) {
      setActiveConversationId(conversations[0]._id as Id<"conversations">)
    }
  }, [userId, conversations, business, activeConversationId, createConversation])

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
          setQuickReplies([
            "Approve this",
            "Adjust budget",
            "Try different angle",
          ])
        } else if (lastMsg.messageType === "strategy") {
          setQuickReplies([
            "Generate creatives",
            "Adjust targeting",
            "Launch this",
          ])
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
      setChatError(null)

      try {
        await chat({
          conversationId: activeConversationId,
          userMessage: message,
          userId,
        })
      } catch (err) {
        console.error("Chat error:", err)
        setChatError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
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
              ? `${business.industry} — ${business.trustMode} mode`
              : "Your CMO is ready"}
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
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Error banner */}
      {chatError && (
        <div className="mx-4 mb-2 px-3 py-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
          {chatError}
        </div>
      )}

      {/* Quick replies */}
      <QuickReplies replies={quickReplies} onSelect={handleSend} />

      {/* Chat input */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading || !activeConversationId}
        placeholder={
          business
            ? "Talk to Spun..."
            : "Tell me about your business..."
        }
      />
    </div>
  )
}
