"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { X, Eye } from "lucide-react"

interface CreativeGalleryProps {
  content: string
  metadata: Record<string, unknown>
}

function CreativeImage({ storageId }: { storageId: Id<"_storage"> }) {
  const url = useQuery(api.adCreatives.getImageUrl, { storageId })
  if (!url) return <div className="w-full h-20 bg-white/5 rounded animate-pulse" />
  return <img src={url} alt="" className="w-full rounded object-cover" />
}

export function CreativeGallery({ content, metadata }: CreativeGalleryProps) {
  const [previewCreative, setPreviewCreative] = useState<{
    htmlContent?: string
    imageStorageId?: string
  } | null>(null)

  const creatives = (metadata.creatives as Array<{
    headline: string
    copy: string
    cta: string
    format: string
    htmlContent?: string
    imageStorageId?: string
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
              onClick={() => setPreviewCreative({
                htmlContent: creative.htmlContent,
                imageStorageId: creative.imageStorageId,
              })}
              className="group relative p-2 bg-white/5 border border-white/10 rounded-lg hover:border-purple-500/30 transition-all text-left overflow-hidden"
            >
              {creative.imageStorageId ? (
                <CreativeImage storageId={creative.imageStorageId as Id<"_storage">} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 rounded-lg transition-opacity">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              )}
              <p className="text-xs font-medium text-white truncate mt-1">
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

      {previewCreative && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative bg-[var(--background-dark)] rounded-xl border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-auto">
            <button
              onClick={() => setPreviewCreative(null)}
              className="absolute top-3 right-3 z-10 p-1 bg-slate-800 rounded-lg hover:bg-slate-700"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="p-4">
              {previewCreative.imageStorageId ? (
                <CreativeImage storageId={previewCreative.imageStorageId as Id<"_storage">} />
              ) : previewCreative.htmlContent ? (
                <div dangerouslySetInnerHTML={{ __html: previewCreative.htmlContent }} />
              ) : (
                <p className="text-slate-400 text-sm">No preview available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
