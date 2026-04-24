"use client"

export default function BrandAssetsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-surface-alt flex items-center justify-center">
      <div className="text-center space-y-3 max-w-sm px-6">
        <p className="text-gray-600 text-sm font-medium">Something went wrong loading brand assets</p>
        <p className="text-red-600 text-xs font-mono break-all">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 border border-grid bg-white hover:border-gray-300 text-gray-700 text-xs rounded-md transition"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
