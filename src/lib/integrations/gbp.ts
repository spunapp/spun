// Google Business Profile (GBP) audit via the Places API (New).
// Uses a server-side API key to read the public-facing GBP listing for a
// website — no OAuth needed. Audits what potential customers actually see.

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
const PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places"

const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "addressComponents",
  "internationalPhoneNumber",
  "nationalPhoneNumber",
  "websiteUri",
  "regularOpeningHours",
  "primaryType",
  "primaryTypeDisplayName",
  "types",
  "photos",
  "rating",
  "userRatingCount",
  "editorialSummary",
  "businessStatus",
  "priceLevel",
  "googleMapsUri",
].join(",")

interface PlaceSearchResponse {
  places?: Array<{
    id: string
    displayName?: { text: string }
    formattedAddress?: string
    websiteUri?: string
  }>
}

interface PlaceDetails {
  id: string
  displayName?: { text: string }
  formattedAddress?: string
  addressComponents?: Array<{ types: string[]; longText: string }>
  internationalPhoneNumber?: string
  nationalPhoneNumber?: string
  websiteUri?: string
  regularOpeningHours?: { weekdayDescriptions?: string[] }
  primaryType?: string
  primaryTypeDisplayName?: { text: string }
  types?: string[]
  photos?: Array<{ name: string }>
  rating?: number
  userRatingCount?: number
  editorialSummary?: { text: string }
  businessStatus?: "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY"
  priceLevel?: string
  googleMapsUri?: string
}

export interface GbpAuditCheck {
  name: string
  passed: boolean
  value?: string
  recommendation?: string
}

export type GbpAuditResult =
  | {
      found: true
      placeId: string
      placeName: string
      googleMapsUri?: string
      score: number
      verdict: "excellent" | "good" | "needs-work" | "critical"
      checks: GbpAuditCheck[]
      summary: string
    }
  | {
      found: false
      websiteUrl: string
    }

function normaliseDomain(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase()
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim()
}

// Fetch the site and pull out candidate business names from <title> and
// Open Graph metadata. Returns a de-duped list of reasonable brand-name
// candidates to feed the Places API search.
async function extractBrandNames(websiteUrl: string): Promise<string[]> {
  try {
    const url = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SpunBot/1.0; +https://spun.bot) gzip",
        Accept: "text/html,application/xhtml+xml",
      },
    })
    if (!res.ok) return []
    const html = (await res.text()).slice(0, 200_000) // cap at 200KB
    const names: string[] = []

    const ogSiteName = html.match(
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i
    )
    if (ogSiteName) names.push(decodeEntities(ogSiteName[1]))

    const twitterSite = html.match(
      /<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']+)["']/i
    )
    if (twitterSite) names.push(decodeEntities(twitterSite[1]))

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) {
      const title = decodeEntities(titleMatch[1])
      names.push(title)
      // Split on common separators; each segment is a candidate brand name.
      title
        .split(/\s*[|\-–—·•:]\s*/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2 && s.length <= 60)
        .forEach((s) => names.push(s))
    }

    // De-duplicate, preserve order
    const seen = new Set<string>()
    return names.filter((n) => {
      const k = n.toLowerCase()
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  } catch {
    return []
  }
}

async function textSearch(
  apiKey: string,
  query: string
): Promise<PlaceSearchResponse["places"]> {
  const res = await fetch(PLACES_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.websiteUri",
    },
    body: JSON.stringify({ textQuery: query, pageSize: 5 }),
  })
  if (!res.ok) {
    throw new Error(`Places searchText failed: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as PlaceSearchResponse
  return data.places ?? []
}

export async function findPlaceByWebsite(
  apiKey: string,
  websiteUrl: string,
  businessName?: string,
  location?: string
): Promise<{ placeId: string; name: string } | null> {
  const targetDomain = normaliseDomain(websiteUrl)

  // Scrape the site to discover the business name automatically — user
  // shouldn't have to type it separately.
  const scrapedNames = await extractBrandNames(websiteUrl)

  // Search by name first (Places API finds businesses by name far more
  // reliably than by bare domain). Verify every result by website-domain
  // match — wrong audits are worse than "not found".
  const queries = [
    ...scrapedNames,
    businessName ?? null,
    businessName && location ? `${businessName} ${location}` : null,
    scrapedNames[0] && location ? `${scrapedNames[0]} ${location}` : null,
    targetDomain,
    `https://${targetDomain}`,
  ].filter((q): q is string => typeof q === "string" && q.length > 0)

  const seen = new Set<string>()
  const uniqueQueries = queries.filter((q) => {
    const k = q.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  for (const q of uniqueQueries) {
    const places = await textSearch(apiKey, q)
    if (!places || places.length === 0) continue

    const domainMatch = places.find((p) => {
      if (!p.websiteUri) return false
      return normaliseDomain(p.websiteUri) === targetDomain
    })
    if (domainMatch) {
      return { placeId: domainMatch.id, name: domainMatch.displayName?.text ?? "" }
    }
  }

  return null
}

export async function getPlaceDetails(
  apiKey: string,
  placeId: string
): Promise<PlaceDetails> {
  const res = await fetch(`${PLACES_DETAILS_URL}/${placeId}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": DETAILS_FIELD_MASK,
    },
  })
  if (!res.ok) {
    throw new Error(`Places details failed: ${res.status} ${await res.text()}`)
  }
  return (await res.json()) as PlaceDetails
}

export function auditGbpProfile(details: PlaceDetails): Extract<GbpAuditResult, { found: true }> {
  const checks: GbpAuditCheck[] = []

  // Business name
  const hasName = Boolean(details.displayName?.text)
  checks.push({
    name: "Business name",
    passed: hasName,
    value: details.displayName?.text,
    recommendation: hasName ? undefined : "Add a clear business name to your profile.",
  })

  // Address — look for a street_number to distinguish a full address from just a city
  const hasStreet = (details.addressComponents ?? []).some((c) => c.types.includes("street_number"))
  const hasAddress = Boolean(details.formattedAddress) && hasStreet
  checks.push({
    name: "Complete address",
    passed: hasAddress,
    value: details.formattedAddress,
    recommendation: hasAddress ? undefined : "Add your full street address, not just the city.",
  })

  // Phone number
  const phone = details.internationalPhoneNumber ?? details.nationalPhoneNumber
  checks.push({
    name: "Phone number",
    passed: Boolean(phone),
    value: phone,
    recommendation: phone ? undefined : "Add a phone number so customers can call you.",
  })

  // Website
  const hasWebsite = Boolean(details.websiteUri)
  checks.push({
    name: "Website link",
    passed: hasWebsite,
    value: details.websiteUri,
    recommendation: hasWebsite ? undefined : "Link your website so customers can visit it directly.",
  })

  // Business hours — all 7 days covered
  const hours = details.regularOpeningHours?.weekdayDescriptions ?? []
  const hasHours = hours.length === 7
  checks.push({
    name: "Business hours",
    passed: hasHours,
    value: hasHours ? "All 7 days covered" : hours.length > 0 ? `${hours.length}/7 days` : undefined,
    recommendation: hasHours ? undefined : "Set opening hours for every day of the week, including closed days.",
  })

  // Primary category
  const hasPrimary = Boolean(details.primaryType)
  checks.push({
    name: "Primary category",
    passed: hasPrimary,
    value: details.primaryTypeDisplayName?.text ?? details.primaryType,
    recommendation: hasPrimary ? undefined : "Set a primary business category — it's how Google decides when to show you.",
  })

  // Additional categories (types minus primary)
  const extraTypes = (details.types ?? []).filter((t) => t !== details.primaryType)
  const hasExtras = extraTypes.length >= 1
  checks.push({
    name: "Additional categories",
    passed: hasExtras,
    value: hasExtras ? `${extraTypes.length} additional` : "None",
    recommendation: hasExtras ? undefined : "Add 1–4 secondary categories to expand how customers find you.",
  })

  // Photos
  const photoCount = details.photos?.length ?? 0
  const hasEnoughPhotos = photoCount >= 5
  checks.push({
    name: "Photos",
    passed: hasEnoughPhotos,
    value: `${photoCount} photo${photoCount === 1 ? "" : "s"}`,
    recommendation: hasEnoughPhotos
      ? undefined
      : photoCount === 0
        ? "Add at least 5 high-quality photos — listings with photos get 42% more direction requests."
        : "Add more photos — aim for at least 5, ideally 10+.",
  })

  // Reviews
  const rating = details.rating ?? 0
  const reviewCount = details.userRatingCount ?? 0
  const hasHealthyReviews = rating >= 4.0 && reviewCount >= 10
  checks.push({
    name: "Reviews",
    passed: hasHealthyReviews,
    value: reviewCount > 0 ? `${rating.toFixed(1)}★ from ${reviewCount} review${reviewCount === 1 ? "" : "s"}` : "No reviews yet",
    recommendation: hasHealthyReviews
      ? undefined
      : reviewCount < 10
        ? "Aim for at least 10 reviews — ask happy customers directly. A link in a receipt or follow-up email works well."
        : "Your rating is below 4.0 — reply to negative reviews and chase satisfied customers for positive ones.",
  })

  // Business description
  const hasDescription = Boolean(details.editorialSummary?.text)
  checks.push({
    name: "Business description",
    passed: hasDescription,
    value: details.editorialSummary?.text?.slice(0, 100),
    recommendation: hasDescription
      ? undefined
      : "Write a short description of what you do — this appears prominently on your profile.",
  })

  // Business status
  const isOperational = details.businessStatus === "OPERATIONAL" || details.businessStatus === undefined
  checks.push({
    name: "Business status",
    passed: isOperational,
    value: details.businessStatus ?? "OPERATIONAL",
    recommendation: isOperational
      ? undefined
      : "Your listing is marked as closed. If you're still trading, update the status immediately.",
  })

  const passed = checks.filter((c) => c.passed).length
  const score = Math.round((passed / checks.length) * 100)

  const verdict: Extract<GbpAuditResult, { found: true }>["verdict"] =
    score >= 90 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "needs-work" : "critical"

  const failedCount = checks.length - passed
  const summary =
    verdict === "excellent"
      ? "Your Google Business Profile is in great shape — a few small tweaks and it's perfect."
      : verdict === "good"
        ? `Your profile is mostly there. ${failedCount} thing${failedCount === 1 ? "" : "s"} to fix.`
        : verdict === "needs-work"
          ? `Your profile is missing some important details. ${failedCount} fixes to make.`
          : `Your profile needs serious work. ${failedCount} critical gaps are costing you customers.`

  return {
    found: true,
    placeId: details.id,
    placeName: details.displayName?.text ?? "Unknown",
    googleMapsUri: details.googleMapsUri,
    score,
    verdict,
    checks,
    summary,
  }
}

export async function runGbpAudit(
  websiteUrl: string,
  businessName?: string,
  location?: string
): Promise<GbpAuditResult> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not set")
  }

  const match = await findPlaceByWebsite(apiKey, websiteUrl, businessName, location)
  if (!match) {
    return { found: false, websiteUrl }
  }

  const details = await getPlaceDetails(apiKey, match.placeId)
  return auditGbpProfile(details)
}
