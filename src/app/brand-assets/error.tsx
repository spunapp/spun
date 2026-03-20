"use client"

export default function BrandAssetsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-white flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-slate-400 text-sm font-medium">Something went wrong loading brand assets</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
