"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/auth/provider"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError("")
    try {
      await auth.login()
      router.push("/chat")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="max-w-sm w-full space-y-8 text-center">
        <div>
          <Image
            src="/icon-animated.gif"
            alt="Spun"
            width={80}
            height={80}
            className="mx-auto mb-4 rounded-2xl"
            unoptimized
          />
          <Image
            src="/logo.png"
            alt="Spun"
            width={200}
            height={56}
            className="mx-auto"
          />
          <p className="text-slate-300 mt-3">
            Your marketing department in a chat window.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Sign in with Passkey"
            )}
          </button>

          <p className="text-xs text-slate-600">
            Powered by keypass.id
          </p>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="text-xs text-slate-600 space-y-1">
          <p>One chat. Full funnel.</p>
          <p>Strategy. Campaigns. Creatives. Execution. Analytics.</p>
        </div>
      </div>
    </div>
  )
}
