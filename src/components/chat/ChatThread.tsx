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
  onApprove?: (approvalId: string) => void
  onReject?: (approvalId: string) => void
}

export function ChatThread({
  messages,
  isLoading,
  onApprove,
  onReject,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <img src="/icon-animated.gif" alt="Spun" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Hey! I&apos;m Spun, your CMO.
            </h2>
            <p className="text-slate-400">
              Tell me about your business and I&apos;ll start building your
              marketing strategy. Or if we&apos;ve already talked, pick up where
              we left off.
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
        />
      ))}

      {isLoading && (
        <div className="flex items-start gap-3">
          <img src="/icon.png" alt="Spun" className="w-8 h-8 rounded-lg flex-shrink-0" />
          <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
            <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
