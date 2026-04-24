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
    <div className="min-h-screen flex items-center justify-center bg-surface-alt text-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-400 mb-3">
          Something went wrong
        </p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-3">
          We hit an unexpected error
        </h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Our team has been notified. Please try again, or head back to the chat.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="text-sm bg-spun hover:bg-spun-dark text-white font-medium px-5 py-2.5 rounded-md transition"
          >
            Try again
          </button>
          <Link
            href="/chat"
            className="text-sm text-gray-700 hover:text-gray-900 border border-grid hover:border-gray-300 bg-white px-5 py-2.5 rounded-md transition"
          >
            Back to chat
          </Link>
        </div>
      </div>
    </div>
  )
}
