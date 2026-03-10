"use client"

import { useState } from "react"
import { X, Eye } from "lucide-react"

interface CreativeGalleryProps {
  content: string
  metadata: Record<string, unknown>
}

export function CreativeGallery({ content, metadata }: CreativeGalleryProps) {
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)

  const creatives = (metadata.creatives as Array<{
    headline: string
    copy: string
    cta: string
    format: string
    htmlContent: string
    variant: number
    funnelStage: string
  }>) ?? []

  const stageLabels: Record<string, string> = {
    tof: "Awareness",
    mof: "Consideration",
    bof: "Conversion",
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

      {creatives.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {creatives.map((creative, i) => (
            <button
              key={i}
              onClick={() => setPreviewHtml(creative.htmlContent)}
              className="group relative p-2 bg-white/5 border border-white/10 rounded-lg hover:border-purple-500/30 transition-all text-left"
            >
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 rounded-lg transition-opacity">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-medium text-white truncate">
                {creative.headline}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {stageLabels[creative.funnelStage]} #{creative.variant}
              </p>
              <p className="text-xs text-slate-600 truncate mt-1">
                {creative.format}
              </p>
            </button>
          ))}
        </div>
      )}

      {previewHtml && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative bg-[var(--background-dark)] rounded-xl border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <button
              onClick={() => setPreviewHtml(null)}
              className="absolute top-3 right-3 z-10 p-1 bg-slate-800 rounded-lg hover:bg-slate-700"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div
              className="p-4"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
