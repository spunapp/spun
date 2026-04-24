"use client"

import { useState } from "react"
import { Shield, Check, X, AlertTriangle, Loader2 } from "lucide-react"

interface ApprovalRequestProps {
  content: string
  metadata: Record<string, unknown>
  onApprove?: () => void
  onReject?: () => void
}

export function ApprovalRequest({
  content,
  metadata,
  onApprove,
  onReject,
}: ApprovalRequestProps) {
  const [executing, setExecuting] = useState(false)
  const [executed, setExecuted] = useState(false)

  const approval = metadata as {
    actionType?: string
    platform?: string
    budget?: number
    campaignTheme?: string
    campaignId?: string
    approvalId?: string
    status?: "pending" | "approved" | "rejected"
  }

  const actionLabels: Record<string, string> = {
    launch_campaign: "Launch Campaign",
    send_email: "Send Email",
    adjust_budget: "Adjust Budget",
    publish_content: "Publish Content",
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700 leading-relaxed">
        {content.split("\n").map((line, i) => (
          <p key={i} className={line ? "" : "h-3"}>
            {line}
          </p>
        ))}
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">
            {actionLabels[approval.actionType ?? ""] ?? "Action"} — Needs
            your approval
          </span>
        </div>

        <div className="text-xs space-y-1">
          {approval.platform && (
            <p className="text-gray-500">
              Platform: <span className="text-gray-700">{approval.platform}</span>
            </p>
          )}
          {approval.budget !== undefined && (
            <p className="text-gray-500">
              Budget: <span className="text-gray-700">${approval.budget}/day</span>
            </p>
          )}
          {approval.campaignTheme && (
            <p className="text-gray-500">
              Campaign: <span className="text-gray-700">{approval.campaignTheme}</span>
            </p>
          )}
        </div>

        {(!approval.status || approval.status === "pending") && !executing && !executed && (
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setExecuting(true)
                try {
                  await onApprove?.()
                  setExecuted(true)
                } finally {
                  setExecuting(false)
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-100 text-spun border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Check className="w-3 h-3" />
              Approve & Launch
            </button>
            <button
              onClick={onReject}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-100 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <X className="w-3 h-3" />
              Reject
            </button>
          </div>
        )}

        {executing && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Launching on {approval.platform ?? "platform"}...
          </div>
        )}

        {(approval.status === "approved" || executed) && (
          <div className="flex items-center gap-1.5 text-xs text-spun">
            <Check className="w-3 h-3" />
            Launched on {approval.platform ?? "platform"}
          </div>
        )}

        {approval.status === "rejected" && (
          <div className="flex items-center gap-1.5 text-xs text-red-600">
            <AlertTriangle className="w-3 h-3" />
            Rejected
          </div>
        )}
      </div>
    </div>
  )
}
