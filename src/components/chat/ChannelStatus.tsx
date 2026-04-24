"use client"

import { Wifi, WifiOff, AlertCircle } from "lucide-react"

interface Channel {
  _id: string
  platform: string
  status: "active" | "expired" | "error"
  platformAccountName?: string
}

interface ChannelStatusProps {
  channels: Channel[]
}

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta Ads",
  google: "Google Ads",
  klaviyo: "Klaviyo",
  ga4: "Analytics",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  shopify: "Shopify",
  buffer: "Buffer",
}

export function ChannelStatus({ channels }: ChannelStatusProps) {
  if (channels.length === 0) {
    return (
      <div className="px-3 py-2">
        <p className="text-xs text-gray-500">No channels connected</p>
        <p className="text-xs text-gray-400 mt-1">
          Say &quot;connect Meta&quot; in chat to get started
        </p>
      </div>
    )
  }

  return (
    <div className="px-3 space-y-1">
      {channels.map((channel) => (
        <div
          key={channel._id}
          className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-md"
        >
          {channel.status === "active" ? (
            <Wifi className="w-3 h-3 text-spun" />
          ) : channel.status === "error" ? (
            <AlertCircle className="w-3 h-3 text-red-600" />
          ) : (
            <WifiOff className="w-3 h-3 text-amber-600" />
          )}
          <span
            className={
              channel.status === "active"
                ? "text-gray-700"
                : "text-gray-500"
            }
          >
            {PLATFORM_LABELS[channel.platform] || channel.platform}
          </span>
          {channel.platformAccountName && (
            <span className="text-gray-400 truncate">
              {channel.platformAccountName}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
