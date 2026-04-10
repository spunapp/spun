"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-white px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
          Something went wrong
        </p>
        <h1 className="text-2xl font-semibold text-white mb-3">
          We hit an unexpected error
        </h1>
        <p className="text-sm text-slate-400 mb-8">
          Our team has been notified. Please try again, or head back to the chat.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="text-sm bg-[#5B9BAA] hover:bg-[#4A8A99] text-white px-5 py-2.5 rounded-lg transition-colors"
          >
            Try again
          </button>
          <Link
            href="/chat"
            className="text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-5 py-2.5 rounded-lg transition-colors"
          >
            Back to chat
          </Link>
        </div>
      </div>
    </div>
  )
}
