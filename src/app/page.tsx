"use client"

import { useAuth } from "@clerk/nextjs"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn) {
      router.replace("/chat")
    } else {
      router.replace("/login")
    }
  }, [isLoaded, isSignedIn, router])

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
    </div>
  )
}
