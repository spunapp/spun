"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { ReactNode } from "react"

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL
const isConfigured =
  CONVEX_URL && CONVEX_URL !== "https://placeholder.convex.cloud"

const convex = isConfigured ? new ConvexReactClient(CONVEX_URL) : null

function SetupMessage() {
  return (
    <div className="flex items-center justify-center h-screen bg-surface-alt">
      <div className="max-w-md text-center space-y-4">
        <div className="w-12 h-12 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
          <span className="text-red-600 text-xl">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Backend not connected
        </h2>
        <p className="text-sm text-gray-500">
          Spun needs a Convex backend to run. Set it up with:
        </p>
        <pre className="bg-gray-900 rounded-md p-3 text-left text-xs text-green-400 overflow-x-auto">
          <code>npx convex dev</code>
        </pre>
        <p className="text-xs text-gray-400">
          This will create your backend and add the URL to{" "}
          <code className="text-gray-500">.env.local</code>. Then restart
          the dev server.
        </p>
      </div>
    </div>
  )
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/chat"
      signUpFallbackRedirectUrl="/chat"
      appearance={{
        variables: {
          colorPrimary: "#075E54",
          colorText: "#111827",
          colorTextSecondary: "#6b7280",
          colorBackground: "#FFFFFF",
          colorInputBackground: "#FAFBFC",
          colorInputText: "#111827",
          fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
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
