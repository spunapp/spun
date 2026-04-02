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
      <div className="text-sm text-slate-200 leading-relaxed">
        {content.split("\n").map((line, i) => (
          <p key={i} className={line ? "" : "h-3"}>
            {line}
          </p>
        ))}
      </div>

      <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-300">
            {actionLabels[approval.actionType ?? ""] ?? "Action"} — Needs
            your approval
          </span>
        </div>

        <div className="text-xs space-y-1">
          {approval.platform && (
            <p className="text-slate-400">
              Platform: <span className="text-slate-200">{approval.platform}</span>
            </p>
          )}
          {approval.budget !== undefined && (
            <p className="text-slate-400">
              Budget: <span className="text-slate-200">${approval.budget}/day</span>
            </p>
          )}
          {approval.campaignTheme && (
            <p className="text-slate-400">
              Campaign: <span className="text-slate-200">{approval.campaignTheme}</span>
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors"
            >
              <Check className="w-3 h-3" />
              Approve & Launch
            </button>
            <button
              onClick={onReject}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <X className="w-3 h-3" />
              Reject
            </button>
          </div>
        )}

        {executing && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Launching on {approval.platform ?? "platform"}...
          </div>
        )}

        {(approval.status === "approved" || executed) && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Check className="w-3 h-3" />
            Launched on {approval.platform ?? "platform"}
          </div>
        )}

        {approval.status === "rejected" && (
          <div className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertTriangle className="w-3 h-3" />
            Rejected
          </div>
        )}
      </div>
    </div>
  )
}
