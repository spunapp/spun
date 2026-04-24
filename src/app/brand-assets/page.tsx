"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, ImageIcon, FileText, Film, Music, Trash2 } from "lucide-react"
import { useState, useRef, useEffect, Component, ReactNode } from "react"
import { useQuery, useMutation } from "convex/react"
import { useUser } from "@clerk/nextjs"
import { api } from "../../../convex/_generated/api"
import type { Id, Doc } from "../../../convex/_generated/dataModel"

type BrandAsset = Doc<"brandAssets"> & { url: string | null }
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
  if (type === "images") return <ImageIcon className="w-6 h-6 text-gray-400" />
  if (type === "videos") return <Film className="w-6 h-6 text-gray-400" />
  if (type === "audio") return <Music className="w-6 h-6 text-gray-400" />
  return <FileText className="w-6 h-6 text-gray-400" />
}

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  render() { return this.state.error ? this.props.fallback : this.props.children }
}

function AssetGrid({ businessId, filter }: { businessId: Id<"businesses">; filter: AssetType }) {
  const assets = useQuery(api.brandAssets.list, { businessId })
  const remove = useMutation(api.brandAssets.remove)

  const visible: BrandAsset[] = !assets
    ? []
    : filter === "all"
    ? (assets as BrandAsset[])
    : (assets as BrandAsset[]).filter((a) => a.type === filter)

  if (assets === undefined) {
    return <div className="text-center py-16 text-gray-500 text-sm">Loading…</div>
  }
  if (visible.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 text-sm">
        {assets.length === 0 ? "No assets yet — upload your first brand file above." : `No ${filter} found.`}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {visible.map((asset) => (
        <div key={asset._id} className="group bg-white border border-grid rounded-md overflow-hidden">
          <div className="h-32 bg-surface-alt flex items-center justify-center relative">
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
              className="absolute top-2 right-2 p-1.5 bg-white border border-grid rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
            </button>
          </div>
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-gray-900 truncate">{asset.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatBytes(asset.size)} · {new Date(asset.addedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function BrandAssetsPage() {
  const router = useRouter()
  const { user } = useUser()
  const inputRef = useRef<HTMLInputElement>(null)
  const [filter, setFilter] = useState<AssetType>("all")
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const business = useQuery(
    api.businesses.getByUser,
    user?.id ? { userId: user.id } : "skip"
  )

  const createBusiness = useMutation(api.businesses.create)
  const generateUploadUrl = useMutation(api.brandAssets.generateUploadUrl)
  const save = useMutation(api.brandAssets.save)

  const creatingRef = useRef(false)
  useEffect(() => {
    if (business === null && user?.id && !creatingRef.current) {
      creatingRef.current = true
      createBusiness({
        userId: user.id,
        name: user.fullName ?? user.firstName ?? "My Business",
        description: "",
        productOrService: "service",
        whatTheySell: "",
        industry: "",
        targetAudience: "",
        demographics: {},
        locations: [],
        competitors: [],
        imageryUrls: [],
      }).catch(() => { creatingRef.current = false })
    }
  }, [business, user?.id])

  async function uploadFiles(files: FileList | null) {
    if (!files || !business?._id || !user?.id) return
    setUploading(true)
    setUploadError(null)
    try {
      for (const file of Array.from(files)) {
        const uploadUrl = await generateUploadUrl()
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        })
        if (!res.ok) throw new Error(`Upload failed (${res.status})`)
        const data = await res.json()
        const storageId = data.storageId
        if (!storageId) throw new Error("Upload failed: no storage ID returned")
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
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-alt text-gray-900">
      <div className="bg-surface border-b border-grid">
        <div className="px-6 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-surface-alt rounded-md transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <h1 className="text-base font-semibold text-gray-900">Brand assets</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); uploadFiles(e.dataTransfer.files) }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-md p-10 text-center transition-colors ${
            uploading
              ? "border-spun bg-spun-50/50 cursor-wait"
              : dragging
              ? "border-spun bg-spun-50 cursor-copy"
              : "border-grid bg-white hover:border-gray-300 hover:bg-surface cursor-pointer"
          }`}
        >
          <Upload className={`w-8 h-8 mx-auto mb-3 ${uploading ? "animate-bounce text-spun" : "text-gray-400"}`} />
          <p className="text-sm font-medium text-gray-700">
            {uploading ? "Uploading…" : "Drop files here or click to upload"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Images, videos, documents, audio — any brand files</p>
          {uploadError && <p className="text-xs text-red-600 mt-2">{uploadError}</p>}
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
        <div className="flex gap-1 bg-white border border-grid rounded-md p-1 w-fit">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-[4px] text-xs font-medium transition-colors ${
                filter === f.id ? "bg-spun-50 text-spun" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {business === undefined ? (
          <div className="text-center py-16 text-gray-500 text-sm">Loading…</div>
        ) : business === null ? (
          <div className="text-center py-16 text-gray-500 text-sm">Setting up your profile…</div>
        ) : (
          <ErrorBoundary fallback={<div className="text-center py-16 text-gray-500 text-sm">Could not load assets — uploads still work above.</div>}>
            <AssetGrid businessId={business._id} filter={filter} />
          </ErrorBoundary>
        )}
      </div>
    </div>
  )
}
