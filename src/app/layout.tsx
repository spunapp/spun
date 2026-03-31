import type { Metadata } from "next"
import { ConvexClientProvider } from "./ConvexClientProvider"
import "./globals.css"

// Force server-render on every request — prevents Vercel CDN from serving
// stale static HTML from previous deployments (the "old code" flash).
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Spun — Your Marketing Department in a Chat Window",
  description:
    "AI-powered CMO for founders. Strategy, campaigns, creatives, ad execution, and analytics — all through conversation.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" style={{ background: "#273E47" }}>
      <body className="antialiased font-sans" style={{ background: "#273E47", color: "#f8fafc" }}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  )
}
