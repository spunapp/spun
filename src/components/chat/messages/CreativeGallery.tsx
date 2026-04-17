"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import type { Id } from "../../../../convex/_generated/dataModel"
import { X } from "lucide-react"
import { renderContent } from "./renderContent"

type Creative = {
  headline: string
  copy: string
  cta: string
  format: string
  htmlContent?: string
  imageStorageId?: string
  variant: number
  funnelStage: string
}

interface CreativeGalleryProps {
  content: string
  metadata: Record<string, unknown>
}

function CreativeImage({ storageId }: { storageId: Id<"_storage"> }) {
  const url = useQuery(api.adCreatives.getImageUrl, { storageId })
  if (!url) return <div className="w-full h-20 bg-white/5 rounded animate-pulse" />
  return <img src={url} alt="" className="w-full rounded object-cover" />
}

function CreativePreviewCard({ creative }: { creative: Creative }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
      {creative.imageStorageId ? (
        <CreativeImage storageId={creative.imageStorageId as Id<"_storage">} />
      ) : (
        <div className="bg-gradient-to-br from-teal-900/40 to-purple-900/40 p-8 flex items-center justify-center min-h-[200px]">
          <p className="text-2xl font-bold text-white text-center leading-tight">
            {creative.headline}
          </p>
        </div>
      )}
      <div className="p-4 bg-white/5 space-y-3">
        <p className="text-sm font-semibold text-white">{creative.headline}</p>
        <p className="text-xs text-slate-300 leading-relaxed">{creative.copy}</p>
        <div className="flex items-center justify-between">
          <span className="px-3 py-1.5 bg-teal-600 rounded-lg text-xs font-medium text-white">
            {creative.cta}
          </span>
          <span className="text-[10px] text-slate-500">{creative.format}</span>
        </div>
      </div>
    </div>
  )
}

const stageLabels: Record<string, string> = {
  tof: "Awareness",
  mof: "Consideration",
  bof: "Conversion",
}

export function CreativeGallery({ content, metadata }: CreativeGalleryProps) {
  const [previewCreative, setPreviewCreative] = useState<Creative | null>(null)

  const creatives = (metadata.creatives as Creative[]) ?? []

  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-200 leading-relaxed">
        {renderContent(content)}
      </div>

      {creatives.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {creatives.map((creative, i) => (
            <button
              key={i}
              onClick={() => setPreviewCreative(creative)}
              className="group relative p-2 bg-white/5 border border-white/10 rounded-lg hover:border-purple-500/30 transition-all text-left overflow-hidden"
            >
              {creative.imageStorageId ? (
                <CreativeImage storageId={creative.imageStorageId as Id<"_storage">} />
              ) : (
                <div className="w-full h-16 rounded bg-gradient-to-br from-teal-900/30 to-purple-900/30 flex items-center justify-center p-2">
                  <p className="text-[10px] font-semibold text-white/70 text-center leading-tight line-clamp-3">
                    {creative.headline}
                  </p>
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
          <div className="relative bg-[var(--background-dark)] rounded-xl border border-white/10 max-w-md w-full max-h-[80vh] overflow-auto">
            <button
              onClick={() => setPreviewCreative(null)}
              className="absolute top-3 right-3 z-10 p-1 bg-slate-800 rounded-lg hover:bg-slate-700"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="p-4">
              <CreativePreviewCard creative={previewCreative} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
