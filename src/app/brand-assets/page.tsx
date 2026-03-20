"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, ImageIcon, FileText, Film, Music, Trash2 } from "lucide-react"
import { useState, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { useUser } from "@clerk/nextjs"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"

type AssetType = "all" | "images" | "videos" | "documents" | "audio"

const FILTERS: { id: AssetType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "images", label: "Images" },
  { id: "videos", label: "Videos" },
  { id: "documents", label: "Documents" },
  { id: "audio", label: "Audio" },
]

function fileTypeCategory(file: File): "images" | "videos" | "documents" | "audio" {
  if (file.type.startsWith("image/")) return "images"
  if (file.type.startsWith("video/")) return "videos"
  if (file.type.startsWith("audio/")) return "audio"
  return "documents"
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AssetIcon({ type }: { type: string }) {
  if (type === "images") return <ImageIcon className="w-6 h-6 text-slate-400" />
  if (type === "videos") return <Film className="w-6 h-6 text-slate-400" />
  if (type === "audio") return <Music className="w-6 h-6 text-slate-400" />
  return <FileText className="w-6 h-6 text-slate-400" />
}

export default function BrandAssetsPage() {
  const router = useRouter()
  const { user } = useUser()
  const inputRef = useRef<HTMLInputElement>(null)
  const [filter, setFilter] = useState<AssetType>("all")
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  const business = useQuery(
    api.businesses.getByUser,
    user?.id ? { userId: user.id } : "skip"
  )
  const assets = useQuery(
    api.brandAssets.list,
    business?._id ? { businessId: business._id } : "skip"
  )

  const generateUploadUrl = useMutation(api.brandAssets.generateUploadUrl)
  const save = useMutation(api.brandAssets.save)
  const remove = useMutation(api.brandAssets.remove)

  async function uploadFiles(files: FileList | null) {
    if (!files || !business?._id || !user?.id) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const uploadUrl = await generateUploadUrl()
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        })
        const { storageId } = await res.json()
        await save({
          businessId: business._id,
          userId: user.id,
          storageId,
          name: file.name,
          type: fileTypeCategory(file),
          size: file.size,
          mimeType: file.type,
        })
      }
    } finally {
      setUploading(false)
    }
  }

  const visible = !assets
    ? []
    : filter === "all"
    ? assets
    : assets.filter((a) => a.type === filter)

  return (
    <div className="min-h-screen bg-[var(--background)] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </button>
        <h1 className="text-base font-semibold">Brand assets</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); uploadFiles(e.dataTransfer.files) }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
            uploading
              ? "border-[#5B9BAA]/50 bg-[#5B9BAA]/5 cursor-wait"
              : dragging
              ? "border-[#5B9BAA] bg-[#5B9BAA]/10 cursor-copy"
              : "border-white/10 hover:border-white/20 hover:bg-white/[0.02] cursor-pointer"
          }`}
        >
          <Upload className={`w-8 h-8 mx-auto mb-3 ${uploading ? "animate-bounce text-[#5B9BAA]" : "text-slate-500"}`} />
          <p className="text-sm font-medium text-slate-300">
            {uploading ? "Uploading…" : "Drop files here or click to upload"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Images, videos, documents, audio — any brand files</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.ai,.eps,.svg,.zip"
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-[var(--background-dark)] rounded-xl p-1 w-fit">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.id
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Asset grid */}
        {assets === undefined ? (
          <div className="text-center py-16 text-slate-500 text-sm">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            {assets.length === 0
              ? "No assets yet — upload your first brand file above."
              : `No ${filter} found.`}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {visible.map((asset) => (
              <div
                key={asset._id}
                className="group bg-[var(--background-dark)] border border-white/5 rounded-xl overflow-hidden"
              >
                {/* Preview */}
                <div className="h-32 bg-white/[0.03] flex items-center justify-center relative">
                  {asset.type === "images" && asset.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                  ) : asset.type === "videos" && asset.url ? (
                    <video src={asset.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <AssetIcon type={asset.type} />
                  )}
                  <button
                    onClick={() => remove({ id: asset._id as Id<"brandAssets">, storageId: asset.storageId })}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
                {/* Info */}
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-white truncate">{asset.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatBytes(asset.size)} · {new Date(asset.addedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
