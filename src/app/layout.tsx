import type { Metadata } from "next"
import { Inter, IBM_Plex_Mono } from "next/font/google"
import { ConvexClientProvider } from "./ConvexClientProvider"
import CookieConsent from "@/components/CookieConsent"
import { CurrencyProvider } from "@/lib/currency/context"
import { CurrencyBusinessSync } from "@/lib/currency/CurrencyBusinessSync"
import { getServerCurrency } from "@/lib/currency/server"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
})

// Force server-render on every request — prevents Vercel CDN from serving
// stale static HTML from previous deployments (the "old code" flash).
export const dynamic = "force-dynamic"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spun.bot"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Spun — Automate marketing for your local business",
    template: "%s — Spun",
  },
  description:
    "Spun is an AI agent that manages your Google listing, runs your ads, collects reviews, posts on social and follows up with leads — all while chatting with you via WhatsApp.",
  keywords: [
    "local business marketing",
    "WhatsApp marketing AI",
    "Google Business Profile",
    "Google Ads automation",
    "review collection",
    "local SEO",
    "marketing agent",
  ],
  authors: [{ name: "Spun" }],
  creator: "Spun",
  publisher: "Spun",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Spun",
    title: "Spun — Automate marketing for your local business",
    description:
      "Spun is an AI agent that manages your Google listing, runs your ads, collects reviews, posts on social and follows up with leads — all while chatting with you via WhatsApp.",
    images: [
      {
        url: "/spun_facebook_cover.png",
        width: 1200,
        height: 630,
        alt: "Spun — Automate marketing for your local business",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spun — Automate marketing for your local business",
    description:
      "Spun is an AI agent that manages your Google listing, runs your ads, collects reviews, posts on social and follows up with leads — all while chatting with you via WhatsApp.",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialCurrency = await getServerCurrency()
  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="antialiased font-sans">
        <ConvexClientProvider>
          <CurrencyProvider initialCurrency={initialCurrency}>
            <CurrencyBusinessSync />
            {children}
          </CurrencyProvider>
        </ConvexClientProvider>
        <CookieConsent />
      </body>
    </html>
  )
}
