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
    default: "Spun — AI Growth Platform for SMEs",
    template: "%s — Spun",
  },
  description:
    "AI-powered growth platform for SMEs. Strategy, campaigns, lead generation, ad execution, and analytics — all through conversation.",
  keywords: [
    "AI growth platform",
    "SME growth",
    "lead generation",
    "growth automation",
    "campaign launch",
    "Facebook Ads AI",
    "ad creatives",
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
    title: "Spun — AI Growth Platform for SMEs",
    description:
      "AI-powered growth platform for SMEs. Strategy, campaigns, lead generation, ad execution, and analytics — all through conversation.",
    images: [
      {
        url: "/spun_facebook_cover.png",
        width: 1200,
        height: 630,
        alt: "Spun — AI Growth Platform for SMEs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spun — AI Growth Platform for SMEs",
    description:
      "AI-powered growth platform for SMEs. Strategy, campaigns, lead generation, ad execution, and analytics — all through conversation.",
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
