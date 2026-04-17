"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, FileText } from "lucide-react"

interface StrategyDocumentProps {
  content: string
  metadata: Record<string, unknown>
}

function formatCurrency(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return `£${value.toLocaleString()}`
  return String(value ?? "")
}

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export function StrategyDocument({ content, metadata }: StrategyDocumentProps) {
  const [expanded, setExpanded] = useState(false)

  const strategy = metadata as {
    theme?: string
    audience_breakdown?: Record<string, unknown>
    suggested_channels?: Array<{ channel: string; reason: string }>
    budget_breakdown?: { monthly_total: unknown; channel_split: Array<{ channel: string; percentage: number; amount: unknown }> }
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-200 leading-relaxed">
        {content.split("\n").map((line, i) => (
          <p key={i} className={line ? "" : "h-3"}>
            {renderInlineBold(line)}
          </p>
        ))}
      </div>

      {strategy.theme && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          <FileText className="w-3 h-3" />
          View full strategy
        </button>
      )}

      {expanded && strategy.theme && (
        <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/5 text-xs space-y-3">
          <div>
            <span className="text-slate-500 uppercase tracking-wider">Theme</span>
            <p className="text-slate-200 mt-1">{renderInlineBold(strategy.theme)}</p>
          </div>

          {strategy.suggested_channels && (
            <div>
              <span className="text-slate-500 uppercase tracking-wider">Channels</span>
              <div className="mt-1 space-y-1">
                {strategy.suggested_channels.map((ch, i) => (
                  <div key={i} className="text-slate-300">
                    <span className="font-medium">{ch.channel}</span> — {renderInlineBold(ch.reason)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {strategy.budget_breakdown && (
            <div>
              <span className="text-slate-500 uppercase tracking-wider">Budget</span>
              <p className="text-slate-200 mt-1">
                {formatCurrency(strategy.budget_breakdown.monthly_total)}/mo
              </p>
              {strategy.budget_breakdown.channel_split?.map((split, i) => (
                <div key={i} className="text-slate-400">
                  {split.channel}: {split.percentage}% ({formatCurrency(split.amount)})
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
