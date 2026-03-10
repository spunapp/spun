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
      <div className="text-sm text-slate-200 leading-relaxed">
        {content.split("\n").map((line, i) => (
          <p key={i} className={line ? "" : "h-3"}>
            {line}
          </p>
        ))}
      </div>

      {analytics.summary && (
        <div className="grid grid-cols-2 gap-2">
          {analytics.summary.totalRevenue !== undefined && (
            <div className="p-2 bg-white/5 rounded-lg">
              <p className="text-xs text-slate-500">Revenue</p>
              <p className="text-sm font-semibold text-emerald-400">
                ${analytics.summary.totalRevenue.toLocaleString()}
              </p>
            </div>
          )}
          {analytics.summary.roi !== undefined && (
            <div className="p-2 bg-white/5 rounded-lg">
              <p className="text-xs text-slate-500">ROI</p>
              <div className="flex items-center gap-1">
                {Number(analytics.summary.roi) > 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )}
                <p
                  className={`text-sm font-semibold ${Number(analytics.summary.roi) > 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {analytics.summary.roi}%
                </p>
              </div>
            </div>
          )}
          {analytics.summary.cac !== undefined && (
            <div className="p-2 bg-white/5 rounded-lg">
              <p className="text-xs text-slate-500">CAC</p>
              <p className="text-sm font-semibold text-slate-200">
                ${analytics.summary.cac}
              </p>
            </div>
          )}
          {analytics.summary.customerCount !== undefined && (
            <div className="p-2 bg-white/5 rounded-lg">
              <p className="text-xs text-slate-500">Customers</p>
              <p className="text-sm font-semibold text-slate-200">
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
              className="flex items-center justify-between text-xs p-2 bg-white/5 rounded"
            >
              <span className="text-slate-300">{c.theme}</span>
              <span
                className={`px-1.5 py-0.5 rounded ${
                  c.status === "active"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-500/20 text-slate-400"
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
