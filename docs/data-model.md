# Data Model

All data lives in Convex. Tables, fields, indexes, and relationships documented below.

## Tables

### businesses

The core entity. One per customer account.

| Field | Type | Description |
|---|---|---|
| `_id` | Id | Convex auto-generated |
| `ownerId` | string | Auth user ID |
| `ownerPhone` | string | Phone number (E.164 format, e.g., +14155551234) |
| `ownerName` | string | Owner's first name (for report personalization) |
| `name` | string | Business name |
| `description` | string | What the business does (owner's words) |
| `industry` | string | Vertical: "plumbing", "dental", "salon", "gym", "restaurant", "hvac", etc. |
| `address` | object | `{ street, city, state, zip, country }` |
| `phone` | string | Business phone number |
| `website` | string? | Business website URL (nullable — many don't have one) |
| `hours` | object? | `{ mon: { open, close }, tue: ... }` |
| `trustMode` | string | "draft" \| "approve" \| "auto" — default "approve" |
| `onboardingState` | string | "started" \| "intake" \| "auditing" \| "plan_presented" \| "active" |
| `dailyBudgetCap` | number | Max daily ad spend in cents |
| `monthlyBudgetCap` | number | Max monthly ad spend in cents |
| `preferredChannel` | string | "whatsapp" \| "sms" \| "web" |
| `timezone` | string | IANA timezone (e.g., "America/Los_Angeles") |
| `plan` | string | "starter" \| "growth" \| "pro" |
| `stripeCustomerId` | string? | Stripe customer ID |
| `createdAt` | number | Timestamp |

**Indexes:** `by_owner` (ownerId), `by_phone` (ownerPhone)

---

### conversations

One active conversation per business. Historical conversations archived.

| Field | Type | Description |
|---|---|---|
| `_id` | Id | |
| `businessId` | Id | Reference to businesses |
| `status` | string | "active" \| "archived" |
| `createdAt` | number | Timestamp |

**Indexes:** `by_business` (businessId)

---

### messages

Every message in every channel, unified.

| Field | Type | Description |
|---|---|---|
| `_id` | Id | |
| `conversationId` | Id | Reference to conversations |
| `role` | string | "user" \| "agent" \| "system" |
| `channel` | string | "whatsapp" \| "sms" \| "web" |
| `content` | string | Message text |
| `messageType` | string | "text" \| "approval_request" \| "report" \| "campaign_update" \| "review_alert" \| "lead_alert" \| "status" |
| `metadata` | object? | Type-specific data (see Message Types below) |
| `externalId` | string? | WhatsApp/Twilio message ID (for delivery tracking) |
| `deliveryStatus` | string? | "sent" \| "delivered" \| "read" \| "failed" |
| `createdAt` | number | Timestamp |

**Indexes:** `by_conversation` (conversationId), `by_external_id` (externalId)

### Message Types and Metadata

**approval_request:**
```json
{
  "approvalId": "...",
  "actionType": "create_campaign",
  "summary": "Launch a Google Ads campaign targeting 'plumber near me' at $15/day",
  "estimatedCost": 1500
}
```

**report:**
```json
{
  "reportId": "...",
  "period": "2026-04-14/2026-04-20",
  "metrics": { "calls": 12, "reviews": 4, "adSpend": 18600, "adCalls": 8 }
}
```

**campaign_update:**
```json
{
  "campaignId": "...",
  "event": "launched" | "paused" | "budget_changed" | "performance_alert",
  "detail": "..."
}
```

**review_alert:**
```json
{
  "reviewId": "...",
  "platform": "google" | "yelp",
  "rating": 5,
  "snippet": "Great service, very professional..."
}
```

**lead_alert:**
```json
{
  "leadId": "...",
  "source": "google_ads" | "google_organic" | "social" | "referral" | "website",
  "name": "Jane Smith",
  "phone": "+14155559876"
}
```

---

### listings

Google Business Profile state. One per business.

| Field | Type | Description |
|---|---|---|
| `_id` | Id | |
| `businessId` | Id | Reference to businesses |
| `googlePlaceId` | string? | Google Place ID (null if not yet claimed) |
| `googleAccountId` | string? | GBP account ID |
| `optimizationScore` | number | 0–100, calculated from completeness |
| `lastAudit` | object? | Results of last audit (missing fields, suggestions) |
| `lastSynced` | number? | Timestamp of last sync with Google |
| `status` | string | "not_connected" \| "connected" \| "optimizing" \| "managed" |

**Indexes:** `by_business` (businessId)

---

### campaigns

Ad campaigns across platforms.

| Field | Type | Description |
|---|---|---|
| `_id` | Id | |
| `businessId` | Id | Reference to businesses |
| `platform` | string | "google_ads" \| "meta" |
| `externalCampaignId` | string? | Platform campaign ID |
| `name` | string | Campaign name |
| `type` | string | "local_services" \| "search" \| "awareness" |
| `status` | string | "draft" \| "pending_approval" \| "active" \| "paused" \| "ended" |
| `dailyBudget` | number | Daily budget in cents |
| `totalSpent` | number | Total spend in cents (updated periodically) |
| `targeting` | object | `{ keywords: [], locations: [], radius: number }` |
| `performance` | object | `{ impressions, clicks, calls, conversions, ctr, cpc }` |
| `startDate` | number | Timestamp |
| `endDate` | number? | Timestamp (null = ongoing) |
| `lastSynced` | number? | Last performance data pull |
| `createdAt` | number | |

**Indexes:** `by_business` (businessId), `by_status` (businessId, status)

---

### reviews

Aggregated from Google and Yelp.

| Field | Type | Description |
|---|---|---|
| `_id` | Id | |
| `businessId` | Id | Reference to businesses |
| `platform` | string | "google" \| "yelp" |
| `externalReviewId` | string | Platform review ID |
| `authorName` | string | Reviewer name |
| `rating` | number | 1–5 |
| `text` | string? | Review text (some are rating-only) |
| `publishedAt` | number | When the review was posted |
| `responseStatus` | string | "none" \| "drafted" \| "pending_approval" \| "published" |
| `responseText` | string? | Our response |
| `respondedAt` | number? | When we responded |
| `sentiment` | string? | "positive" \| "neutral" \| "negative" (AI-classified) |
| `createdAt` | number | When we ingested it |

**Indexes:** `by_business` (businessId), `by_external` (platform, externalReviewId)

---

### leads

Customer leads from all sources.

| Field | Type | Description |
|---|---|---|
| `_id` | Id | |
| `businessId` | Id | Reference to businesses |
| `name` | string? | Lead name (if known) |
| `phone` | string? | Phone (E.164) |
| `email` | string? | Email |
| `source` | string | "google_ads" \| "google_organic" \| "social" \| "referral" \| "website" \| "walk_in" \| "phone" |
| `status` | string | "new" \| "contacted" \| "booked" \| "completed" \| "lost" |
| `notes` | string? | Agent-generated notes about this lead |
| `followUpCount` | number | How many follow-ups sent |
| `lastFollowUp` | number? | Timestamp of last follow-up |
| `nextFollowUp` | number? | Scheduled next follow-up |
| `convertedValue` | number? | Revenue from this lead in cents (if completed) |
| `createdAt` | number | |

**Indexes:** `by_business` (businessId), `by_status` (businessId, status), `by_next_followup` (businessId, nextFollowUp)

---

### posts

Social media content.

| Field | Type | Description |
|---|---|---|
| `_id` | Id | |
| `businessId` | Id | Reference to businesses |
| `platform` | string | "facebook" \| "instagram" \| "gbp" |
| `content` | string | Post text |
| `imageUrl` | string? | Image URL (if applicable) |
| `externalPostId` | string? | Platform post ID (after publishing) |
| `status` | string | "draft" \| "pending_approval" \| "scheduled" \| "published" \| "failed" |
| `scheduledFor` | number? | When to publish |
| `publishedAt` | number? | When it was published |
| `engagement` | object? | `{ likes, comments, shares, reach, clicks }` |
| `createdAt` | number | |

**Indexes:** `by_business` (businessId), `by_scheduled` (businessId, status, scheduledFor)

---

### reports

Weekly performance digests.

| Field | Type | Description |
|---|---|---|
| `_id` | Id | |
| `businessId` | Id | Reference to businesses |
| `periodStart` | number | Week start timestamp |
| `periodEnd` | number | Week end timestamp |
| `metrics` | object | Raw metrics snapshot (see below) |
| `summary` | string | Claude-generated plain-language summary |
| `nextWeekPlan` | string | Proposed plan for next week |
| `deliveryStatus` | string | "generated" \| "sent" \| "delivered" \| "read" |
| `deliveredVia` | string | "whatsapp" \| "sms" \| "web" |
| `deliveredAt` | number? | |
| `createdAt` | number | |

**Metrics object:**
```json
{
  "calls": { "total": 12, "fromGoogle": 8, "fromAds": 3, "fromSocial": 1 },
  "reviews": { "new": 4, "avgRating": 4.8, "responded": 4 },
  "ads": { "spend": 18600, "impressions": 4200, "clicks": 186, "calls": 8, "cpc": 100 },
  "social": { "posts": 3, "reach": 247, "clicks": 18, "engagement": 42 },
  "leads": { "new": 6, "contacted": 4, "booked": 3, "lost": 1 },
  "listing": { "views": 890, "viewsChange": 22, "searches": 340, "actions": 48 }
}
```

**Indexes:** `by_business` (businessId)

---

### approvalQueue

Actions waiting for owner approval.

| Field | Type | Description |
|---|---|---|
| `_id` | Id | |
| `businessId` | Id | Reference to businesses |
| `actionType` | string | Tool name (e.g., "create_campaign", "schedule_post", "send_review_request") |
| `summary` | string | Plain-language description of what will happen |
| `details` | object | Full action payload (tool arguments) |
| `estimatedCost` | number? | Cost in cents (if applicable) |
| `status` | string | "pending" \| "approved" \| "rejected" \| "executed" \| "expired" |
| `messageId` | Id? | Reference to the approval_request message |
| `resolvedAt` | number? | When approved/rejected |
| `executedAt` | number? | When the action was executed |
| `createdAt` | number | |

**Indexes:** `by_business_pending` (businessId, status)

---

### channels

Connected platform accounts and OAuth state.

| Field | Type | Description |
|---|---|---|
| `_id` | Id | |
| `businessId` | Id | Reference to businesses |
| `platform` | string | "google_business" \| "google_ads" \| "meta" \| "yelp" |
| `externalAccountId` | string? | Platform account/page ID |
| `accessToken` | string | OAuth access token (encrypted) |
| `refreshToken` | string? | OAuth refresh token |
| `tokenExpiresAt` | number? | Token expiry timestamp |
| `scopes` | string[] | Granted OAuth scopes |
| `status` | string | "active" \| "expired" \| "error" \| "disconnected" |
| `lastRefreshed` | number? | Last token refresh |
| `connectedAt` | number | |

**Indexes:** `by_business` (businessId), `by_platform` (businessId, platform)

---

### usageLedger

Monthly usage for billing enforcement.

| Field | Type | Description |
|---|---|---|
| `_id` | Id | |
| `businessId` | Id | Reference to businesses |
| `month` | string | "2026-04" format |
| `campaignsLaunched` | number | |
| `postsPublished` | number | |
| `reviewRequestsSent` | number | |
| `followUpsSent` | number | |
| `reportsGenerated` | number | |
| `agentMessages` | number | Total agent messages sent |

**Indexes:** `by_business_month` (businessId, month)

## Relationships

```
businesses (1) ──── (1) listings
businesses (1) ──── (1) conversations (active)
businesses (1) ──── (N) campaigns
businesses (1) ──── (N) reviews
businesses (1) ──── (N) leads
businesses (1) ──── (N) posts
businesses (1) ──── (N) reports
businesses (1) ──── (N) approvalQueue
businesses (1) ──── (N) channels
businesses (1) ──── (N) usageLedger

conversations (1) ── (N) messages
```
