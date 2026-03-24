"use client"

import { TextMessage } from "./messages/TextMessage"
import { StrategyDocument } from "./messages/StrategyDocument"
import { CampaignPreview } from "./messages/CampaignPreview"
import { AnalyticsSummary } from "./messages/AnalyticsSummary"
import { CreativeGallery } from "./messages/CreativeGallery"
import { ApprovalRequest } from "./messages/ApprovalRequest"
import { StatusUpdate } from "./messages/StatusUpdate"
import { ConnectPrompt } from "./messages/ConnectPrompt"

interface Message {
  _id: string
  role: "user" | "assistant" | "system"
  content: string
  messageType: string
  metadata?: Record<string, unknown>
}

interface ChatMessageProps {
  message: Message
  onApprove?: (approvalId: string) => void
  onReject?: (approvalId: string) => void
}

export function ChatMessage({ message, onApprove, onReject }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        <img src="/icon.png" alt="Spun" className="w-8 h-8 rounded-lg flex-shrink-0 object-contain" />
      )}

      <div
        className={`max-w-[80%] ${
          isUser
            ? "bg-white/10 border border-white/20 rounded-2xl rounded-tr-sm"
            : "bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm"
        } px-4 py-3`}
      >
        {message.messageType === "strategy" && message.metadata ? (
          <StrategyDocument content={message.content} metadata={message.metadata} />
        ) : message.messageType === "campaign_preview" && message.metadata ? (
          <CampaignPreview content={message.content} metadata={message.metadata} />
        ) : message.messageType === "analytics" && message.metadata ? (
          <AnalyticsSummary content={message.content} metadata={message.metadata} />
        ) : message.messageType === "creative_gallery" && message.metadata ? (
          <CreativeGallery content={message.content} metadata={message.metadata} />
        ) : message.messageType === "approval_request" && message.metadata ? (
          <ApprovalRequest
            content={message.content}
            metadata={message.metadata}
            onApprove={onApprove ? () => onApprove(message._id) : undefined}
            onReject={onReject ? () => onReject(message._id) : undefined}
          />
        ) : message.messageType === "status_update" && message.metadata ? (
          <StatusUpdate content={message.content} metadata={message.metadata} />
        ) : message.messageType === "connect_prompt" && message.metadata ? (
          <ConnectPrompt content={message.content} metadata={message.metadata} />
        ) : (
          <TextMessage content={message.content} isUser={isUser} />
        )}
      </div>
    </div>
  )
}
