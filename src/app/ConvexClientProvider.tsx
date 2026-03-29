"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { dark } from "@clerk/themes"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { ReactNode, useEffect, useState } from "react"

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL
const isConfigured =
  CONVEX_URL && CONVEX_URL !== "https://placeholder.convex.cloud"

const convex = isConfigured ? new ConvexReactClient(CONVEX_URL) : null

function SetupMessage() {
  // Only render after client-side mount to avoid baking into static HTML
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="h-screen" style={{ background: "#273E47" }} />

  return (
    <div className="flex items-center justify-center h-screen bg-slate-950 p-8">
      <div className="max-w-md text-center space-y-4">
        <div className="w-12 h-12 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
          <span className="text-red-400 text-xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-white">
          Backend not connected
        </h2>
        <p className="text-sm text-slate-400">
          Spun needs a Convex backend to run. Set it up with:
        </p>
        <pre className="bg-slate-800 rounded-lg p-3 text-left text-xs text-green-400 overflow-x-auto">
          <code>npx convex dev</code>
        </pre>
        <p className="text-xs text-slate-500">
          This will create your backend and add the URL to{" "}
          <code className="text-slate-400">.env.local</code>. Then restart
          the dev server.
        </p>
      </div>
    </div>
  )
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      signInForceRedirectUrl="/chat"
      signUpForceRedirectUrl="/chat"
      appearance={{
        baseTheme: dark,
        variables: {
          colorBackground: "#1F333B",
          colorPrimary: "#5B9BAA",
          colorText: "#f8fafc",
          colorTextSecondary: "#cbd5e1",
          colorInputBackground: "#273E47",
          colorInputText: "#f8fafc",
          colorNeutral: "#cbd5e1",
          borderRadius: "0.75rem",
        },
      }}
    >
      {convex ? (
        <ConvexProvider client={convex}>{children}</ConvexProvider>
      ) : (
        <SetupMessage />
      )}
    </ClerkProvider>
  )
}
