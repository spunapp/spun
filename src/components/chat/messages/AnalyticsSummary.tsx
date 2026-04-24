"use client"

import { TrendingUp, TrendingDown } from "lucide-react"

interface AnalyticsSummaryProps {
  content: string
  metadata: Record<string, unknown>
}

export function AnalyticsSummary({ content, metadata }: AnalyticsSummaryProps) {
  const analytics = metadata as {
    campaigns?: Array<{ theme: string; status: string; budget?: Record<string, unknown> }>
    summary?: {
      totalRevenue?: number
      totalSpend?: number
      roi?: string | number
      cac?: string | number
      customerCount?: number
    }
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

      {analytics.summary && (
        <div className="grid grid-cols-2 gap-2">
          {analytics.summary.totalRevenue !== undefined && (
            <div className="p-2 bg-surface-alt rounded-lg">
              <p className="text-xs text-gray-400">Revenue</p>
              <p className="text-sm font-semibold text-spun">
                ${analytics.summary.totalRevenue.toLocaleString()}
              </p>
            </div>
          )}
          {analytics.summary.roi !== undefined && (
            <div className="p-2 bg-surface-alt rounded-lg">
              <p className="text-xs text-gray-400">ROI</p>
              <div className="flex items-center gap-1">
                {Number(analytics.summary.roi) > 0 ? (
                  <TrendingUp className="w-3 h-3 text-spun" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                <p
                  className={`text-sm font-semibold ${Number(analytics.summary.roi) > 0 ? "text-spun" : "text-red-600"}`}
                >
                  {analytics.summary.roi}%
                </p>
              </div>
            </div>
          )}
          {analytics.summary.cac !== undefined && (
            <div className="p-2 bg-surface-alt rounded-lg">
              <p className="text-xs text-gray-400">CAC</p>
              <p className="text-sm font-semibold text-gray-700">
                ${analytics.summary.cac}
              </p>
            </div>
          )}
          {analytics.summary.customerCount !== undefined && (
            <div className="p-2 bg-surface-alt rounded-lg">
              <p className="text-xs text-gray-400">Customers</p>
              <p className="text-sm font-semibold text-gray-700">
                {analytics.summary.customerCount}
              </p>
            </div>
          )}
        </div>
      )}

      {analytics.campaigns && analytics.campaigns.length > 0 && (
        <div className="space-y-1">
          {analytics.campaigns.map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs p-2 bg-surface-alt rounded"
            >
              <span className="text-gray-600">{c.theme}</span>
              <span
                className={`px-1.5 py-0.5 rounded ${
                  c.status === "active"
                    ? "bg-emerald-100 text-spun"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {c.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
