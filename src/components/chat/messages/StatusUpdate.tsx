"use client"

import { Activity, TrendingUp, Zap } from "lucide-react"

interface StatusUpdateProps {
  content: string
  metadata: Record<string, unknown>
}

export function StatusUpdate({ content, metadata }: StatusUpdateProps) {
  const status = metadata as {
    type?: "campaign_live" | "performance" | "milestone"
    campaignName?: string
    metrics?: Record<string, string | number>
  }

  const icons = {
    campaign_live: Zap,
    performance: Activity,
    milestone: TrendingUp,
  }

  const Icon = icons[status.type ?? "performance"] ?? Activity

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-lg">
        <Icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <div className="text-sm text-slate-200 leading-relaxed">
          {content.split("\n").map((line, i) => (
            <p key={i} className={line ? "" : "h-3"}>
              {line}
            </p>
          ))}
        </div>
      </div>

      {status.metrics && Object.keys(status.metrics).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(status.metrics).map(([key, value]) => (
            <div
              key={key}
              className="px-2 py-1 bg-white/5 rounded text-xs"
            >
              <span className="text-slate-500">{key}: </span>
              <span className="text-slate-200">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
