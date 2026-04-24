// Google Business Profile (GBP) audit via the Places API (New).
// Uses a server-side API key to read the public-facing GBP listing for a
// website — no OAuth needed. Audits what potential customers actually see.

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
const PLACES_AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete"
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
      // Diagnostic: what the matcher tried. Useful for debugging "not found"
      // cases where a GBP actually exists.
      triedQueries?: string[]
      scrapedNames?: string[]
      scrapeStatus?: string
      domainDerivedNames?: string[]
      topResults?: Array<{ name?: string; websiteUri?: string }>
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

// Real browser user-agent — many sites (especially Cloudflare-fronted ones)
// block unknown/bot-looking agents with 403s or challenge pages.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

interface BrandScrape {
  names: string[]
  status: string
}

// Fetch the site and pull out candidate business names from <title> and
// Open Graph metadata. Returns a de-duped list of reasonable brand-name
// candidates to feed the Places API search.
async function extractBrandNames(websiteUrl: string): Promise<BrandScrape> {
  try {
    const url = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      redirect: "follow",
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
      },
    })
    if (!res.ok) return { names: [], status: `http_${res.status}` }
    const html = (await res.text()).slice(0, 400_000) // cap at 400KB
    const names: string[] = []

    const ogSiteName = html.match(
      /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i
    )
    if (ogSiteName) names.push(decodeEntities(ogSiteName[1]))

    const appName = html.match(
      /<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']+)["']/i
    )
    if (appName) names.push(decodeEntities(appName[1]))

    const ogTitle = html.match(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
    )
    if (ogTitle) names.push(decodeEntities(ogTitle[1]))

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
    const dedup = names.filter((n) => {
      const k = n.toLowerCase()
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    return { names: dedup, status: dedup.length > 0 ? "ok" : "no_metadata" }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { names: [], status: `fetch_error: ${msg.slice(0, 80)}` }
  }
}

function titleCase(s: string): string {
  if (s.length === 0) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

// Try to split a domain's brand portion into readable words by finding
// common business suffix/prefix words. e.g. "mghlmarketing" → "Mghl Marketing".
// Not always right, but Places API's fuzzy matching handles the rest.
function splitBrandFromDomain(domain: string): string[] {
  const brand = domain.split(".")[0].toLowerCase()
  if (brand.length < 4) return []

  // Longer words first so we prefer "restaurant" over "rest" etc.
  const words = [
    "marketing", "restaurant", "consulting", "properties", "construction",
    "technologies", "solutions", "engineering", "photography", "veterinary",
    "accounting", "education", "furniture", "boutique", "insurance",
    "landscaping", "wellness", "plumbing", "roofing", "fitness", "nutrition",
    "catering", "cleaning", "staffing", "training", "wedding", "electric",
    "software", "agency", "studio", "design", "digital", "online", "health",
    "fashion", "jewelry", "flowers", "realty", "travel", "coffee", "finance",
    "bakery", "kitchen", "dental", "clinic", "salon", "legal", "homes",
    "motors", "foods", "games", "books", "media", "music", "sports",
    "farms", "group", "works", "labs", "shop", "store", "cafe", "house",
    "tech", "dev", "bar", "gym", "spa", "law", "pub",
  ]

  const result: string[] = []
  for (const w of words) {
    if (brand.endsWith(w) && brand.length > w.length) {
      const prefix = brand.slice(0, brand.length - w.length)
      result.push(`${titleCase(prefix)} ${titleCase(w)}`)
    }
    if (brand.startsWith(w) && brand.length > w.length) {
      const suffix = brand.slice(w.length)
      result.push(`${titleCase(w)} ${titleCase(suffix)}`)
    }
  }
  // Also include the bare brand word itself as a search query
  result.push(titleCase(brand))
  return [...new Set(result)]
}

// Map common TLDs to ISO region codes for Places API region bias.
function regionFromDomain(domain: string): string | undefined {
  const tld = domain.split(".").slice(-2).join(".")
  const map: Record<string, string> = {
    "co.uk": "GB",
    "org.uk": "GB",
    ".uk": "GB",
    ".ie": "IE",
    ".de": "DE",
    ".fr": "FR",
    ".es": "ES",
    ".it": "IT",
    ".nl": "NL",
    ".ca": "CA",
    ".au": "AU",
    ".nz": "NZ",
  }
  if (map[tld]) return map[tld]
  const lastTld = `.${domain.split(".").pop()}`
  return map[lastTld]
}

async function textSearch(
  apiKey: string,
  query: string,
  regionCode?: string
): Promise<PlaceSearchResponse["places"]> {
  const body: Record<string, unknown> = { textQuery: query, pageSize: 20 }
  if (regionCode) body.regionCode = regionCode
  const res = await fetch(PLACES_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.websiteUri",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Places searchText failed: ${res.status} ${await res.text()}`)
  }
  const data = (await res.json()) as PlaceSearchResponse
  return data.places ?? []
}

// Places Autocomplete uses a different index than textSearch — sometimes
// surfaces newer/less-established listings that textSearch misses. Returns
// place IDs; caller must fetch details to get websiteUri.
async function autocompletePlaceIds(
  apiKey: string,
  input: string,
  regionCode?: string
): Promise<string[]> {
  const body: Record<string, unknown> = { input }
  if (regionCode) body.regionCode = regionCode
  try {
    const res = await fetch(PLACES_AUTOCOMPLETE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) return []
    const data = (await res.json()) as {
      suggestions?: Array<{ placePrediction?: { placeId?: string } }>
    }
    const ids = (data.suggestions ?? [])
      .map((s) => s.placePrediction?.placeId)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
    return ids
  } catch {
    return []
  }
}

// Lightweight details lookup for autocomplete-sourced IDs — we only need
// displayName + websiteUri to verify the domain match.
async function getPlaceMiniDetails(
  apiKey: string,
  placeId: string
): Promise<{ id: string; name?: string; websiteUri?: string } | null> {
  try {
    const res = await fetch(`${PLACES_DETAILS_URL}/${placeId}`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,websiteUri",
      },
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      id: string
      displayName?: { text: string }
      websiteUri?: string
    }
    return { id: data.id, name: data.displayName?.text, websiteUri: data.websiteUri }
  } catch {
    return null
  }
}

export interface FindPlaceDiagnostic {
  triedQueries: string[]
  scrapedNames: string[]
  scrapeStatus: string
  domainDerivedNames: string[]
  topResults: Array<{ name?: string; websiteUri?: string }>
}

export async function findPlaceByWebsite(
  apiKey: string,
  websiteUrl: string,
  businessName?: string,
  location?: string
): Promise<{ match: { placeId: string; name: string } | null; diagnostic: FindPlaceDiagnostic }> {
  const targetDomain = normaliseDomain(websiteUrl)
  const regionCode = regionFromDomain(targetDomain)

  // Scrape the site to discover the business name automatically — user
  // shouldn't have to type it separately.
  const { names: scrapedNames, status: scrapeStatus } = await extractBrandNames(websiteUrl)

  // Fallback: derive names from the domain itself. Works when the site
  // can't be scraped (Cloudflare, bot blocks, SPAs). "mghlmarketing" →
  // "Mghl Marketing" etc.
  const domainDerivedNames = splitBrandFromDomain(targetDomain)

  // Search by name first (Places API finds businesses by name far more
  // reliably than by bare domain). Verify every result by website-domain
  // match — wrong audits are worse than "not found".
  const queries = [
    ...scrapedNames,
    ...domainDerivedNames,
    businessName ?? null,
    businessName && location ? `${businessName} ${location}` : null,
    scrapedNames[0] && location ? `${scrapedNames[0]} ${location}` : null,
    domainDerivedNames[0] && location ? `${domainDerivedNames[0]} ${location}` : null,
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

  const diagnostic: FindPlaceDiagnostic = {
    triedQueries: uniqueQueries,
    scrapedNames,
    scrapeStatus,
    domainDerivedNames,
    topResults: [],
  }

  for (const q of uniqueQueries) {
    const places = await textSearch(apiKey, q, regionCode)
    if (!places || places.length === 0) continue

    // Record up to 3 top results for diagnostics
    for (const p of places.slice(0, 3)) {
      diagnostic.topResults.push({
        name: p.displayName?.text,
        websiteUri: p.websiteUri,
      })
    }

    // Strict match: websiteUri normalises to exactly the target domain.
    const strictMatch = places.find((p) => {
      if (!p.websiteUri) return false
      return normaliseDomain(p.websiteUri) === targetDomain
    })
    if (strictMatch) {
      return {
        match: { placeId: strictMatch.id, name: strictMatch.displayName?.text ?? "" },
        diagnostic,
      }
    }

    // Looser match: some GBPs store the website with a redirect host, tracking
    // subdomain, or a different TLD variant. Accept if the websiteUri contains
    // the target domain's distinctive brand portion (domain without the TLD).
    const brand = targetDomain.split(".")[0]
    if (brand && brand.length >= 4) {
      const brandMatch = places.find((p) => {
        if (!p.websiteUri) return false
        return p.websiteUri.toLowerCase().includes(brand)
      })
      if (brandMatch) {
        return {
          match: { placeId: brandMatch.id, name: brandMatch.displayName?.text ?? "" },
          diagnostic,
        }
      }
    }
  }

  // Fallback: Places Autocomplete uses a different index and sometimes
  // surfaces newer or less-indexed listings that textSearch misses.
  const autocompleteQueries = [
    ...scrapedNames,
    ...domainDerivedNames,
    businessName,
  ].filter((q): q is string => typeof q === "string" && q.length >= 3)

  const seenAc = new Set<string>()
  for (const q of autocompleteQueries) {
    if (seenAc.has(q.toLowerCase())) continue
    seenAc.add(q.toLowerCase())

    const placeIds = await autocompletePlaceIds(apiKey, q, regionCode)
    for (const pid of placeIds.slice(0, 5)) {
      const mini = await getPlaceMiniDetails(apiKey, pid)
      if (!mini) continue

      diagnostic.topResults.push({
        name: mini.name ? `[ac] ${mini.name}` : "[ac] (no name)",
        websiteUri: mini.websiteUri,
      })

      if (mini.websiteUri && normaliseDomain(mini.websiteUri) === targetDomain) {
        return {
          match: { placeId: mini.id, name: mini.name ?? "" },
          diagnostic,
        }
      }
      const brand = targetDomain.split(".")[0]
      if (
        brand &&
        brand.length >= 4 &&
        mini.websiteUri &&
        mini.websiteUri.toLowerCase().includes(brand)
      ) {
        return {
          match: { placeId: mini.id, name: mini.name ?? "" },
          diagnostic,
        }
      }
    }
  }

  return { match: null, diagnostic }
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

  const { match, diagnostic } = await findPlaceByWebsite(apiKey, websiteUrl, businessName, location)
  if (!match) {
    return {
      found: false,
      websiteUrl,
      triedQueries: diagnostic.triedQueries,
      scrapedNames: diagnostic.scrapedNames,
      scrapeStatus: diagnostic.scrapeStatus,
      domainDerivedNames: diagnostic.domainDerivedNames,
      topResults: diagnostic.topResults,
    }
  }

  const details = await getPlaceDetails(apiKey, match.placeId)
  return auditGbpProfile(details)
}

// Hyperlocal competitor discovery via Places searchText. Uses the postcode
// or neighbourhood in the query so results are ordered by proximity — city
// names alone (e.g. "Brighton") return businesses miles from the user's
// actual location, which is what Tavily was giving us before.

export interface LocalCompetitor {
  name: string
  address?: string
  rating?: number
  reviewCount?: number
  primaryType?: string
  websiteUri?: string
  googleMapsUri?: string
}

export interface LocalCompetitorsResult {
  queryUsed: string
  competitors: LocalCompetitor[]
}

function inferRegionCode(area: string): string {
  // UK postcodes: AA9A 9AA, A9A 9AA, A9 9AA, A99 9AA, AA9 9AA, AA99 9AA.
  // Matches the common UK formats loosely — any 1-2 letters + digits
  // followed by a space and a digit + 2 letters.
  if (/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i.test(area)) return "GB"
  // Fall back to GB as the product's primary market. Can be made
  // user-configurable later if we expand outside the UK.
  return "GB"
}

export async function findLocalCompetitors(
  category: string,
  area: string,
  excludeBusinessName?: string
): Promise<LocalCompetitorsResult | { error: string }> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return { error: "GOOGLE_PLACES_API_KEY is not set" }

  const textQuery = `${category} near ${area}`
  const regionCode = inferRegionCode(area)

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.rating",
    "places.userRatingCount",
    "places.primaryTypeDisplayName",
    "places.websiteUri",
    "places.googleMapsUri",
    "places.businessStatus",
  ].join(",")

  try {
    const res = await fetch(PLACES_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({
        textQuery,
        maxResultCount: 10,
        regionCode,
      }),
    })

    if (!res.ok) {
      return { error: `Places search failed: ${res.status} ${await res.text()}` }
    }

    const data = (await res.json()) as {
      places?: Array<{
        id: string
        displayName?: { text: string }
        formattedAddress?: string
        rating?: number
        userRatingCount?: number
        primaryTypeDisplayName?: { text: string }
        websiteUri?: string
        googleMapsUri?: string
        businessStatus?: string
      }>
    }

    const exclude = (excludeBusinessName ?? "").trim().toLowerCase()
    const competitors: LocalCompetitor[] = (data.places ?? [])
      .filter((p) => p.businessStatus !== "CLOSED_PERMANENTLY")
      .filter((p) => {
        if (!exclude) return true
        const name = (p.displayName?.text ?? "").toLowerCase()
        return !name.includes(exclude) && !exclude.includes(name)
      })
      .slice(0, 8)
      .map((p) => ({
        name: p.displayName?.text ?? "Unknown",
        address: p.formattedAddress,
        rating: p.rating,
        reviewCount: p.userRatingCount,
        primaryType: p.primaryTypeDisplayName?.text,
        websiteUri: p.websiteUri,
        googleMapsUri: p.googleMapsUri,
      }))

    return { queryUsed: textQuery, competitors }
  } catch (err) {
    return { error: `Places search threw: ${err instanceof Error ? err.message : String(err)}` }
  }
}
