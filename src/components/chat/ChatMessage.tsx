"use client"

import { RotateCcw } from "lucide-react"
import { TextMessage } from "./messages/TextMessage"
import { StrategyDocument } from "./messages/StrategyDocument"
import { CampaignPreview } from "./messages/CampaignPreview"
import { AnalyticsSummary } from "./messages/AnalyticsSummary"
import { CreativeGallery } from "./messages/CreativeGallery"
import { ApprovalRequest } from "./messages/ApprovalRequest"
import { StatusUpdate } from "./messages/StatusUpdate"
import { ConnectPrompt } from "./messages/ConnectPrompt"
import { MetaSetupGuide } from "./messages/MetaSetupGuide"
import { GoogleAdsSetupGuide } from "./messages/GoogleAdsSetupGuide"
import { GA4SetupGuide } from "./messages/GA4SetupGuide"
import { GBPAuditSummary } from "./messages/GBPAuditSummary"

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
  onRetry?: (failedUserMessage: string) => void
  onSend?: (message: string) => void
}

export function ChatMessage({ message, onApprove, onReject, onRetry, onSend }: ChatMessageProps) {
  const isUser = message.role === "user"
  const meta = message.metadata as Record<string, unknown> | undefined
  const isRetryableError =
    !isUser &&
    meta?.errorKind === "llm_unreachable" &&
    meta?.retryable === true &&
    typeof meta?.failedUserMessage === "string"

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {!isUser && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/icon-192.png" alt="Spun" className="w-8 h-8 rounded-md flex-shrink-0 object-contain" />
      )}

      <div
        className={`max-w-[80%] ${
          isUser
            ? "bg-spun text-white rounded-2xl rounded-tr-sm"
            : isRetryableError
              ? "bg-amber-50 border border-amber-200 rounded-2xl rounded-tl-sm"
              : "bg-white border border-grid rounded-2xl rounded-tl-sm"
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
            onApprove={onApprove ? () => onApprove(
              (message.metadata as Record<string, unknown>)?.approvalId as string ?? message._id
            ) : undefined}
            onReject={onReject ? () => onReject(
              (message.metadata as Record<string, unknown>)?.approvalId as string ?? message._id
            ) : undefined}
          />
        ) : message.messageType === "status_update" && message.metadata ? (
          <StatusUpdate content={message.content} metadata={message.metadata} />
        ) : message.messageType === "connect_prompt" && message.metadata ? (
          <ConnectPrompt content={message.content} metadata={message.metadata} onSend={onSend} />
        ) : message.messageType === "meta_setup_guide" ? (
          <MetaSetupGuide content={message.content} metadata={message.metadata ?? {}} onSend={onSend} />
        ) : message.messageType === "google_ads_setup_guide" ? (
          <GoogleAdsSetupGuide content={message.content} metadata={message.metadata ?? {}} onSend={onSend} />
        ) : message.messageType === "ga4_setup_guide" ? (
          <GA4SetupGuide content={message.content} metadata={message.metadata ?? {}} onSend={onSend} />
        ) : message.messageType === "gbp_audit" ? (
          <GBPAuditSummary content={message.content} metadata={message.metadata ?? {}} onSend={onSend} />
        ) : (
          <TextMessage content={message.content} isUser={isUser} />
        )}

        {isRetryableError && onRetry && (
          <button
            onClick={() => onRetry(meta!.failedUserMessage as string)}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-md transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
    </div>
  )
}
