import type { Metadata } from "next"
import { ConvexClientProvider } from "./ConvexClientProvider"
import CookieConsent from "@/components/CookieConsent"
import "./globals.css"

// Force server-render on every request — prevents Vercel CDN from serving
// stale static HTML from previous deployments (the "old code" flash).
export const dynamic = "force-dynamic"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spun.bot"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Spun — Your Marketing Department in a Chat Window",
    template: "%s — Spun",
  },
  description:
    "AI-powered marketing team for founders. Strategy, campaigns, creatives, ad execution, and analytics — all through conversation.",
  keywords: [
    "AI marketing",
    "AI marketing team",
    "marketing automation",
    "ad creatives",
    "campaign launch",
    "Facebook Ads AI",
    "founders marketing",
  ],
  authors: [{ name: "Spun" }],
  creator: "Spun",
  publisher: "Spun",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Spun",
    title: "Spun — Your Marketing Department in a Chat Window",
    description:
      "AI-powered marketing team for founders. Strategy, campaigns, creatives, ad execution, and analytics — all through conversation.",
    images: [
      {
        url: "/spun_facebook_cover.png",
        width: 1200,
        height: 630,
        alt: "Spun — Your Marketing Department in a Chat Window",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spun — Your Marketing Department in a Chat Window",
    description:
      "AI-powered marketing team for founders. Strategy, campaigns, creatives, ad execution, and analytics — all through conversation.",
    images: ["/spun_facebook_cover.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
        <CookieConsent />
      </body>
    </html>
  )
}
