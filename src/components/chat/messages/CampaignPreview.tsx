"use client"

import { Target, DollarSign, Users } from "lucide-react"

interface CampaignPreviewProps {
  content: string
  metadata: Record<string, unknown>
}

export function CampaignPreview({ content, metadata }: CampaignPreviewProps) {
  const campaign = metadata as {
    theme?: string
    status?: string
    budget_breakdown?: { monthly_total: number; daily_budget: number }
    suggested_channels?: Array<{ channel: string }>
    audience_breakdown?: { target_segment?: string }
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

      {campaign.theme && (
        <div className="p-3 bg-spun-50 border border-spun/15 rounded-md space-y-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-spun" />
            <span className="text-sm font-medium text-gray-900">{campaign.theme}</span>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            {campaign.budget_breakdown && (
              <div className="flex items-center gap-1 text-gray-600">
                <DollarSign className="w-3 h-3" />
                ${campaign.budget_breakdown.monthly_total?.toLocaleString()}/mo
              </div>
            )}
            {campaign.suggested_channels && (
              <div className="flex items-center gap-1 text-gray-600">
                <Users className="w-3 h-3" />
                {campaign.suggested_channels.map((c) => c.channel).join(", ")}
              </div>
            )}
          </div>

          {campaign.status && (
            <span
              className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                campaign.status === "active"
                  ? "bg-emerald-100 text-spun"
                  : campaign.status === "draft"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              {campaign.status}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
