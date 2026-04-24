import "server-only"
import { cookies, headers } from "next/headers"
import {
  BASE_CURRENCY,
  CURRENCY_COOKIE,
  currencyForCountry,
  normaliseCurrency,
} from "./currencies"

/**
 * Resolve the user's display currency during server rendering.
 *
 * Priority:
 *   1. `spun_currency` cookie (set by middleware on first visit, or by the
 *      settings page when the user picks one explicitly)
 *   2. Vercel / Cloudflare geo header on the incoming request
 *   3. GBP (base currency)
 */
export async function getServerCurrency(): Promise<string> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(CURRENCY_COOKIE)?.value
  if (fromCookie) return normaliseCurrency(fromCookie)

  const hdrs = await headers()
  const country =
    hdrs.get("x-vercel-ip-country") ?? hdrs.get("cf-ipcountry") ?? ""
  return country ? currencyForCountry(country) : BASE_CURRENCY
}
