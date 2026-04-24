import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { CURRENCY_COOKIE, currencyForCountry, isSupportedCurrency } from "@/lib/currency/currencies"

const isProtectedRoute = createRouteMatcher(["/chat(.*)", "/settings(.*)", "/brand-assets(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // Geo-detect a default currency on first visit and stash it in a cookie so
  // the server renderer and client both see the same value. We never
  // overwrite an existing cookie — the settings page and CurrencyProvider
  // may set a user-preferred currency that should survive across requests.
  const existing = req.cookies.get(CURRENCY_COOKIE)?.value
  if (isSupportedCurrency(existing)) {
    return NextResponse.next()
  }

  const country = req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry") ?? ""
  const currency = currencyForCountry(country)

  const res = NextResponse.next()
  res.cookies.set(CURRENCY_COOKIE, currency, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    httpOnly: false, // client JS reads this to hydrate the CurrencyProvider
  })
  return res
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
