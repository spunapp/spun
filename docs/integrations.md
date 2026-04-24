# Integrations

Platform-specific API details, OAuth flows, and implementation notes.

## Google Business Profile API

**Purpose:** Manage the business's Google listing — info, hours, photos, posts, reviews, insights.

**API version:** v1 (Google My Business API is deprecated; use Google Business Profile API)

**Auth:** OAuth 2.0 with offline access (refresh token)
- Scopes: `https://www.googleapis.com/auth/business.manage`
- Consent screen: "Spun wants to manage your Google Business Profile"

**OAuth flow:**
1. Owner clicks "Connect Google" in web or receives a link via chat
2. Redirect to Google OAuth consent screen
3. Callback to `/api/auth/google/callback`
4. Exchange code for access + refresh token
5. Store in `channels` table (platform: "google_business")
6. Fetch account → location → store `googleAccountId` and `googlePlaceId` on `listings`

**Key endpoints:**

| Action | Method | Endpoint |
|---|---|---|
| Get location info | GET | `accounts/{account}/locations/{location}` |
| Update location | PATCH | `accounts/{account}/locations/{location}` |
| List reviews | GET | `accounts/{account}/locations/{location}/reviews` |
| Reply to review | PUT | `accounts/{account}/locations/{location}/reviews/{review}/reply` |
| Create local post | POST | `accounts/{account}/locations/{location}/localPosts` |
| Get insights | GET | `accounts/{account}/locations/{location}:reportInsights` |

**Insights available:**
- `QUERIES_DIRECT` — searched for business name
- `QUERIES_INDIRECT` — searched for category/product
- `VIEWS_MAPS` / `VIEWS_SEARCH` — listing views
- `ACTIONS_WEBSITE` / `ACTIONS_PHONE` / `ACTIONS_DRIVING_DIRECTIONS`

**Sync schedule:**
- Reviews: poll every 4 hours
- Insights: pull daily
- Listing info: pull on-demand when auditing

**Rate limits:** 60 requests/minute per project. Batch where possible.

---

## Google Ads API

**Purpose:** Create and manage search campaigns and Local Services Ads.

**API version:** v17

**Auth:** OAuth 2.0 + Developer Token
- Scopes: `https://www.googleapis.com/auth/adwords`
- Requires approved Developer Token (apply via Google Ads)
- Each business links their Google Ads customer ID

**OAuth flow:**
1. Same Google OAuth as GBP (can request both scopes together)
2. Store in `channels` table (platform: "google_ads")
3. Fetch accessible customer IDs → store `externalAccountId`

**Campaign creation flow:**

1. Agent decides to create a campaign (based on onboarding or ongoing optimization)
2. Build campaign structure:
   - Campaign → Ad Group → Keywords + Ad
   - For Local Services: uses LSA-specific resource types
3. Set budget (CampaignBudget resource)
4. Set targeting: location (radius from business address), keywords
5. Create responsive search ad: up to 15 headlines, 4 descriptions
6. Submit via mutate request

**Key resources:**

| Resource | Use |
|---|---|
| `Campaign` | Campaign settings, status, budget reference |
| `CampaignBudget` | Daily budget |
| `AdGroup` | Groups keywords + ads |
| `AdGroupCriterion` | Keywords and targeting |
| `Ad` | Ad creative (responsive search ad) |
| `GeoTargetConstant` | Location targeting |
| `Metrics` | Performance data (via GoogleAdsService.search) |

**Performance queries (GAQL):**
```sql
SELECT campaign.name, metrics.impressions, metrics.clicks,
       metrics.phone_calls, metrics.conversions, metrics.cost_micros
FROM campaign
WHERE segments.date DURING LAST_7_DAYS
```

**Sync schedule:**
- Performance metrics: pull daily (and on-demand for reports)
- Campaign status: pull every 4 hours

**Rate limits:** 15,000 operations/day for basic access. Sufficient for our scale.

**Notes:**
- Local Services Ads have a separate API (`LocalServicesLead`). Leads come via webhook or poll.
- Google Ads requires a manager account (MCC) to manage customer accounts. Spun operates as an MCC.

---

## Meta Graph API (Facebook / Instagram)

**Purpose:** Post to Facebook Pages and Instagram Business accounts. Pull engagement metrics.

**API version:** v19.0

**Auth:** OAuth 2.0 (Facebook Login)
- Permissions: `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish`
- Long-lived page token (60-day, auto-refreshed)

**OAuth flow:**
1. Owner clicks "Connect Facebook" → Facebook Login dialog
2. User grants permissions
3. Exchange short-lived user token for long-lived user token
4. Exchange user token for page token (never expires if user token is long-lived)
5. Store page token in `channels` table (platform: "meta")
6. Store Facebook Page ID and Instagram Business Account ID

**Key endpoints:**

| Action | Method | Endpoint |
|---|---|---|
| Post to page | POST | `{page_id}/feed` |
| Post photo to page | POST | `{page_id}/photos` |
| Post to Instagram | POST | `{ig_user_id}/media` + `{ig_user_id}/media_publish` |
| Get post insights | GET | `{post_id}/insights` |
| Get page insights | GET | `{page_id}/insights` |

**Instagram posting (2-step):**
1. Create media container: `POST {ig_user_id}/media` with `image_url` and `caption`
2. Publish: `POST {ig_user_id}/media_publish` with container ID

**Metrics available:**
- Page: `page_impressions`, `page_engaged_users`, `page_fans`
- Post: `post_impressions`, `post_engaged_users`, `post_clicks`
- Instagram: `impressions`, `reach`, `engagement`

**Sync schedule:**
- Post engagement: pull daily
- Page metrics: pull weekly (for reports)

**Rate limits:** 200 calls/hour per user. Page tokens have higher limits.

**Notes:**
- Instagram requires a Business or Creator account linked to a Facebook Page
- Image URLs for Instagram must be publicly accessible (use Convex file storage or S3)
- Video posting has additional requirements (processing time, format restrictions) — v1 is image + text only

---

## Twilio (SMS)

**Purpose:** Send and receive SMS for owner communication, review requests, and lead follow-ups.

**Auth:** Account SID + Auth Token (not OAuth — API key auth)

**Sending SMS:**
```
POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
Body: To={phone}&From={twilio_number}&Body={message}
```

**Receiving SMS (webhook):**
- Configure Twilio number webhook URL: `https://spun.app/api/webhooks/twilio`
- Twilio POSTs: `From`, `To`, `Body`, `MessageSid`
- Verify `X-Twilio-Signature` header

**Delivery status (status callback):**
- Set `StatusCallback` URL when sending
- Twilio POSTs status updates: `queued` → `sent` → `delivered` (or `failed`/`undelivered`)

**Phone number setup:**
- One Twilio number per Spun instance (shared across businesses)
- Route inbound SMS by matching `From` phone to `businesses.ownerPhone`
- If unknown sender: store message, don't process (prevent spam)

**Compliance:**
- TCPA: owner must have prior relationship with customers before sending review requests
- Include opt-out language in first SMS to a new recipient: "Reply STOP to unsubscribe"
- Handle STOP/START keywords (Twilio Advanced Opt-Out handles this)
- A2P 10DLC registration required for US SMS at scale

**Rate limits:** 1 message/second per number (default). Upgrade to higher throughput as needed.

---

## WhatsApp Business API

**Purpose:** Primary communication channel between Spun and business owners.

**Provider:** Meta Cloud API (hosted by Meta, no BSP needed)

**Auth:** System User Access Token (long-lived, generated in Meta Business Manager)

**Sending messages:**
```
POST https://graph.facebook.com/v19.0/{phone_number_id}/messages
{
  "messaging_product": "whatsapp",
  "to": "{owner_phone}",
  "type": "text",
  "text": { "body": "..." }
}
```

**Rich messages:**
- Interactive buttons (up to 3): good for approval prompts (YES / NO / DETAILS)
- Interactive lists (up to 10 items): good for selecting options
- Templates: required for initiating conversation (24-hour window rule)

**24-hour messaging window:**
- After owner sends a message, Spun can reply freely for 24 hours
- After 24 hours with no owner message, Spun must use an approved template
- Templates: pre-registered with Meta, support variables
- Key templates to register:
  - `weekly_report` — "Hi {{1}}, here's your weekly marketing report: {{2}}"
  - `approval_request` — "Hi {{1}}, I'd like to {{2}}. Reply YES to approve."
  - `new_review_alert` — "New {{1}}-star review on {{2}}: {{3}}"

**Receiving messages (webhook):**
- Configure webhook URL in Meta App Dashboard: `https://spun.app/api/webhooks/whatsapp`
- Verify webhook with `hub.verify_token`
- Inbound message payload includes: sender phone, message text/type, timestamp

**Delivery receipts:**
- Webhook receives status updates: `sent`, `delivered`, `read`
- Update `messages.deliveryStatus` accordingly

**Rate limits:**
- New business: 250 unique recipients/24h
- Tier 1: 1,000/24h (after quality verification)
- Tier 2-4: up to 100,000/24h

**Notes:**
- Business must verify with Meta to get a green checkmark (not required but builds trust)
- All message templates require Meta approval (1-2 business days)
- WhatsApp Business accounts are separate from personal WhatsApp

---

## Yelp API

**Purpose:** Monitor reviews on Yelp. Read-only (Yelp does not allow posting responses via API).

**Auth:** API Key (Bearer token)

**Key endpoints:**

| Action | Method | Endpoint |
|---|---|---|
| Business search | GET | `/v3/businesses/search` |
| Business details | GET | `/v3/businesses/{id}` |
| Reviews | GET | `/v3/businesses/{id}/reviews` |

**Limitations:**
- Yelp API returns only 3 reviews per business (excerpt, not full text)
- No webhook for new reviews — must poll
- Cannot respond to reviews via API (owner must do it on Yelp directly)
- Yelp's Display Requirements must be followed (attribution, linking)

**What we can do:**
- Match business to Yelp listing (by name + location)
- Monitor review count and average rating
- Show new review excerpts as alerts to owner
- Prompt owner to respond on Yelp directly when a negative review appears

**Sync schedule:** Poll daily

**Notes:**
- Yelp Fusion API is free for up to 5,000 calls/day
- Consider Yelp's content scraping policies — API only, no scraping
- The 3-review limit is a known pain point. If deeper review data is needed, evaluate third-party review aggregators (Grade.us, BirdEye) in v2

---

## Integration Architecture

All integrations follow a shared pattern:

```typescript
interface PlatformIntegration {
  // Connection
  getAuthUrl(businessId: string): string;
  handleCallback(code: string, businessId: string): Promise<void>;
  refreshToken(channelId: string): Promise<void>;

  // Health
  checkConnection(channelId: string): Promise<{ status: string; error?: string }>;
}
```

Each platform module (`src/lib/integrations/*.ts`) implements the connection lifecycle. Platform-specific operations (create campaign, post content, etc.) are separate functions called by Convex actions.

**Token refresh strategy:**
- On every API call, check if token expires within 5 minutes
- If so, refresh first
- If refresh fails, mark channel as "expired" and notify owner

**Error handling:**
- API errors: retry 3x with exponential backoff
- Auth errors (401/403): mark channel as expired, notify owner
- Rate limit errors (429): respect `Retry-After` header
- Network errors: retry 3x, then fail with notification
