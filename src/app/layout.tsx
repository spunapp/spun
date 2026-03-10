import type { Metadata } from "next"
import { ConvexClientProvider } from "./ConvexClientProvider"
import "./globals.css"

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
    <html lang="en">
      <body className="antialiased font-sans">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  )
}
