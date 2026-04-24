"use client"

import { useEffect, useRef } from "react"
import { ChatMessage } from "./ChatMessage"
import { Loader2 } from "lucide-react"

interface Message {
  _id: string
  role: "user" | "assistant" | "system"
  content: string
  messageType: string
  metadata?: Record<string, unknown>
  _creationTime: number
}

interface ChatThreadProps {
  messages: Message[]
  isLoading: boolean
  isInitializing?: boolean
  onApprove?: (approvalId: string) => void
  onReject?: (approvalId: string) => void
  onRetry?: (failedUserMessage: string) => void
  onSend?: (message: string) => void
}

export function ChatThread({
  messages,
  isLoading,
  isInitializing = false,
  onApprove,
  onReject,
  onRetry,
  onSend,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.length === 0 && !isLoading && !isInitializing && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <img src="/spun.gif" alt="Spun" className="w-16 h-16 rounded-2xl mx-auto mb-4 object-contain" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Hi, I&apos;m Spun — your local marketing team.
            </h2>
            <p className="text-slate-400">
              Tell me about your local business — cafe, salon, barber, gym,
              restaurant — and I&apos;ll handle your Google Business Profile,
              local ads, and social posts. Or pick up where we left off.
            </p>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <ChatMessage
          key={message._id}
          message={message}
          onApprove={onApprove}
          onReject={onReject}
          onRetry={onRetry}
          onSend={onSend}
        />
      ))}

      {isLoading && (
        <div className="flex items-start gap-3">
          <img
            src="/spun.gif"
            alt="Spun is thinking"
            className="w-8 h-8 rounded-lg flex-shrink-0 object-contain animate-pulse"
          />
          <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
            <span className="text-sm text-slate-400 animate-pulse">
              Working on it&hellip;
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
