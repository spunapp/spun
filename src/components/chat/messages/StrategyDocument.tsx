"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, FileText } from "lucide-react"
import { renderContent } from "./renderContent"
import { useCurrency } from "@/lib/currency/context"

interface StrategyDocumentProps {
  content: string
  metadata: Record<string, unknown>
}

export function StrategyDocument({ content, metadata }: StrategyDocumentProps) {
  const [expanded, setExpanded] = useState(false)
  const { format } = useCurrency()

  function formatAmount(value: unknown): string {
    if (typeof value === "string") return value
    if (typeof value === "number") return format(value, { whole: true })
    return String(value ?? "")
  }

  const strategy = metadata as {
    theme?: string
    audience_breakdown?: Record<string, unknown>
    suggested_channels?: Array<{ channel: string; reason: string }>
    budget_breakdown?: { monthly_total: unknown; channel_split: Array<{ channel: string; percentage: number; amount: unknown }> }
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-700 leading-relaxed">
        {renderContent(content)}
      </div>

      {strategy.theme && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs text-spun hover:text-spun transition-colors"
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
        <div className="mt-2 p-3 bg-surface-alt rounded-lg border border-grid text-xs space-y-3">
          <div>
            <span className="text-gray-400 uppercase tracking-wider">Theme</span>
            <p className="text-gray-700 mt-1">{strategy.theme}</p>
          </div>

          {strategy.suggested_channels && (
            <div>
              <span className="text-gray-400 uppercase tracking-wider">Channels</span>
              <div className="mt-1 space-y-1">
                {strategy.suggested_channels.map((ch, i) => (
                  <div key={i} className="text-gray-600">
                    <span className="font-medium">{ch.channel}</span> — {ch.reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          {strategy.budget_breakdown && (
            <div>
              <span className="text-gray-400 uppercase tracking-wider">Budget</span>
              <p className="text-gray-700 mt-1">
                {formatAmount(strategy.budget_breakdown.monthly_total)}/mo
              </p>
              {strategy.budget_breakdown.channel_split?.map((split, i) => (
                <div key={i} className="text-gray-500">
                  {split.channel}: {split.percentage}% ({formatAmount(split.amount)})
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
