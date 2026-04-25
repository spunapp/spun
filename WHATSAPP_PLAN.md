# Bringing Spun into WhatsApp — implementation plan

> Saved 2026-04-25 from a planning session. Source-of-truth design doc for
> the WhatsApp integration. Update this file as decisions change.

## 1. What "running inside WhatsApp" means

The landing page already pitches Spun as *"chatting with you via WhatsApp"*.
Right now that's aspirational — the chat lives at `/chat` in the web app,
and the only WhatsApp-looking thing is the mockup in `Hero.tsx`. This plan
makes it real: the user talks to Spun inside a real WhatsApp thread, and
everything the web app can do (onboarding, strategies, campaign launches,
approvals, social post scheduling, weekly reports, GBP audits) happens
from that thread.

**Out of scope for v1**:

- Voice notes, calls, payments, and WhatsApp Flows (their in-thread form
  builder) — v2
- Multi-agent / shared inbox with teammates — v2
- Localisation of WhatsApp templates to non-English — v2
- Replacing the web `/chat` UI — web stays, WhatsApp is parallel, same
  Convex backend powers both

## 2. Provider — Meta WhatsApp Cloud API (not Twilio)

|                | Meta Cloud API | Twilio |
|----------------|----------------|--------|
| Cost           | Free up to Meta's 1,000 conversations / 24h-window tier; per-conversation pricing after | Meta price + Twilio markup (~$0.005–0.015 extra per message) |
| Setup          | Meta Business verification + WABA + phone number (3–5 days) | Twilio sandbox in 60s, but production requires same Meta verification anyway |
| Webhooks       | First-party | Twilio proxy (extra hop, slightly more latency) |
| Media handling | Direct Meta CDN URLs | Twilio re-hosts |
| Templates      | Meta Business Manager | Twilio console (still goes through Meta) |

**Decision: Meta Cloud API direct.** Use Meta's free **test phone number**
during dev (no verification needed, 5 test recipients). Verify a real
number once the flow is stable.

## 3. Account-linking model

When a message arrives from `+44 7xxx xxx xxx`, which Spun user is it?

**Decision: web-first link flow.** User signs up on spun.bot (existing Clerk
flow), goes to Settings → Connect WhatsApp, enters their number, gets a
6-digit code via WhatsApp, enters it back on the settings page. Phone ↔
Clerk user mapping stored in Convex.

Why: matches how every enterprise WhatsApp product does it, no Clerk
plugin dependency, fully testable with Meta's free test number.

```
Settings  →  [+44 7XXX XXX XXX] [Send verification]
             ↓ (Convex action calls Meta template send: "verification_code")
User's WhatsApp ← "Your Spun code: 482913. Expires in 10 min."
             ↑
Settings  →  [482913] [Verify]
             ✓ Linked — messages to this number now route to your Spun account.
```

## 4. Architecture overview

```
         WhatsApp user types "Hi"
                   │
                   ▼
        Meta Cloud API (our business number)
                   │  (webhook POST, HMAC-signed)
                   ▼
        /api/webhooks/whatsapp         ←── verifies X-Hub-Signature-256
                   │                       (pattern matches existing
                   ▼                        Stripe webhook)
        Convex action: whatsapp.receiveInbound
                   │
     ┌─────────────┴─────────────┐
     ▼                           ▼
Identity lookup            Unknown number path
by phone → userId              │
     │                         ▼
     ▼                  reply with template:
conversation upsert     "Welcome to Spun — link
(one WhatsApp convo      your account at
per user)                spun.bot/link?token=…"
     │
     ▼
api.ai.chat(conversationId, text, userId)   ←── SAME ACTION AS WEB
     │
     │  (tool calls, AI responses, approvals — all same as web)
     │
     ▼
api.messages.send   (stores assistant message + metadata)
     │
     ▼
hook: onAssistantMessage → whatsapp.sendOutbound
     │
     ▼
Message format adapter
(messageType + metadata → WhatsApp payload
 — text / image / buttons / list / document)
     │
     ▼
Meta Cloud API graph.facebook.com/v20.0/{phone_id}/messages
     │
     ▼
WhatsApp user sees reply
```

The trick: **reuse `api.ai.chat` as-is**. Everything that makes the web
chat work — persona, tool use, approval queue, credit metering, usage
limits — applies identically. Only the rendering layer differs.

## 5. Schema changes (Convex)

```ts
// businesses — add:
phoneNumber: v.optional(v.string()),          // E.164, e.g. "+447700900000"
phoneVerifiedAt: v.optional(v.number()),
whatsappOptInAt: v.optional(v.number()),      // GDPR/TCPA — record of consent

// NEW: phoneVerifications
{
  phoneNumber: v.string(),
  code: v.string(),                           // hashed, not plaintext
  userId: v.string(),
  expiresAt: v.number(),
  attempts: v.number(),
  consumedAt: v.optional(v.number()),
}.index("by_phone", ["phoneNumber"])

// NEW: whatsappMessages (audit log; keeps us out of trouble with Meta)
{
  businessId: v.id("businesses"),
  direction: v.union(v.literal("inbound"), v.literal("outbound")),
  waMessageId: v.string(),                    // Meta's id, for idempotency
  conversationId: v.id("conversations"),
  messageId: v.optional(v.id("messages")),
  status: v.optional(v.string()),             // sent/delivered/read/failed
  payload: v.any(),                           // raw JSON for debugging
}.index("by_wa_id", ["waMessageId"])
 .index("by_business", ["businessId"])

// conversations — add:
channel: v.optional(v.union(v.literal("web"), v.literal("whatsapp"))),
```

Conversations get a `channel` discriminator so the sidebar can show both
and the AI persona can know which surface it's on (useful: "on WhatsApp"
means no markdown, shorter replies, no rich HTML previews).

## 6. New Convex actions / mutations

| File | Purpose |
|------|---------|
| `convex/whatsapp.ts` — `receiveInbound` | Called by webhook. Looks up phone → user. Unknown: send link template. Known: upsert conversation, save inbound message, invoke `api.ai.chat`. |
| `convex/whatsapp.ts` — `sendOutbound` | Formats assistant message via the adapter (§8), POSTs to Meta Graph API. Writes to `whatsappMessages`. Retries on 429/5xx with exponential backoff. |
| `convex/whatsapp.ts` — `markDelivery` | Webhook side-events (delivered / read / failed) → update `whatsappMessages.status`. |
| `convex/phoneVerifications.ts` — `start` | Generate code, hash it, store, send WhatsApp template. |
| `convex/phoneVerifications.ts` — `verify` | Check code, set `business.phoneNumber`. Register consent. |
| `convex/whatsapp.ts` — `scheduleWeeklyReport` | Convex scheduler, runs Monday 08:00 user-local, sends template + follow-up stats. |

## 7. New Next.js routes

| Path | Purpose |
|------|---------|
| `src/app/api/webhooks/whatsapp/route.ts` | GET = Meta verification handshake (responds with `hub.challenge`). POST = dispatches inbound/status events to Convex. HMAC-verifies X-Hub-Signature-256 against `META_APP_SECRET`. Follows the existing Stripe webhook pattern. |
| Convex mutation called directly from Settings | Trigger verification-code send |

## 8. Message format adapter (the hard part)

The existing `ChatMessage.tsx` dispatches on `messageType` to 13 renderers
(StrategyDocument, CampaignPreview, AnalyticsSummary, ApprovalRequest,
CreativeGallery, StatusUpdate, ConnectPrompt, MetaSetupGuide,
GoogleAdsSetupGuide, Ga4SetupGuide, GbpAudit, OnboardingCard, plain text).
WhatsApp has a much thinner vocabulary:

- **text** (up to 4096 chars, no markdown — WhatsApp does its own
  *bold* / _italic_ / ~strike~)
- **image** (+ optional caption)
- **document** (PDF etc.)
- **interactive buttons** (up to 3 buttons, ≤20 char labels)
- **interactive list** (one section, up to 10 rows)
- **template** (pre-approved structured messages — required outside the
  24-hour service window)

New file: `src/lib/whatsapp/adapter.ts`:

```ts
export function toWhatsAppMessages(m: AssistantMessage): WaMessage[] {
  switch (m.messageType) {
    case "text":              return [{ type: "text", body: stripMarkdown(m.content) }]
    case "campaign_preview":  return campaignToWa(m)        // image + caption + buttons
    case "strategy":          return strategyToWa(m)        // PDF attach + short text
    case "approval_request":  return approvalToWa(m)        // interactive buttons
    case "creative_gallery":  return galleryToWa(m)         // up to 5 images (1 per msg)
    case "analytics":         return analyticsToWa(m)       // text-only digest
    case "status_update":     return [{ type: "text", body: renderStatus(m) }]
    case "connect_prompt":    return connectLinkToWa(m)     // text + CTA URL
    case "*_setup_guide":     return setupGuideToWa(m)      // text + URL to guide page
    case "gbp_audit":         return auditToWa(m)           // render PNG via satori (server-side) or send score summary + link
    case "onboarding":        return [{ type: "text", body: stripMarkdown(m.content) }]
  }
}
```

Key calls:

- **ApprovalRequest → interactive buttons.** Approve/Reject map cleanly.
  Tap callback (button-reply webhook event) → mutate `approvalQueue`,
  trigger existing execution path.
- **Strategy document → PDF.** The React renderer is pretty, but a
  WhatsApp user doesn't want 20 text messages. Render server-side with
  `@react-pdf/renderer` or print the existing JSX via `satori` +
  `puppeteer` (we already have image deps via `jimp`/`sharp`). Attach as
  document.
- **GBP audit card → PNG.** Same treatment — render to an image, send as
  photo message.
- **Creative gallery → sequential images.** Max 5 to keep the thread
  readable. Batch-send with captions.
- **Persona prompt** already has the currency treatment — add a
  `channel: "whatsapp"` branch to `buildSystemPrompt` that:
  - instructs "no markdown", "short replies", "avoid long lists, use numbers".
  - notes that approvals go via reply buttons, not text.

## 9. Message templates (Meta-approved)

Anything sent **outside the 24-hour window** from the user's last message
must be a pre-approved template. Templates we need (category in parens):

1. `verification_code` (utility) — "Your Spun code: {{1}}. Expires in 10 minutes."
2. `weekly_report_intro` (marketing) — "Hey {{1}}, your Spun week is ready. Calls: {{2}}, reviews: {{3}}, ad spend: {{4}}. Tap to see the full breakdown." + URL button to web version
3. `campaign_launched` (utility) — triggered by `launch_campaign` tool
4. `approval_needed_reminder` (utility) — nag after 24h if approval still pending
5. `usage_limit_warning` (utility) — "You've used 90% of this month's AI responses. Top up or upgrade?"
6. `integration_expiring` (utility) — "Your Google Ads connection expires in 3 days."

Each template takes 24–48h for Meta to approve. Submit all six in
parallel on day 1.

## 10. Web-app UX changes

- **Settings → new section: "WhatsApp"** above Connected Platforms.
  States: not linked / pending verification / linked. "Send me Spun
  responses via WhatsApp" toggle (`business.whatsappOptInAt`).
- **Onboarding tweak** (optional, v2) — at end of web onboarding, offer
  "Continue over WhatsApp?" with the verification flow inline.
- **Chat sidebar** shows web and WhatsApp conversations interleaved,
  tagged with a small icon. One `conversation` row per WhatsApp user
  (since WhatsApp threads are infinite).
- **Hero mockup** stays — it's now actually true.

## 11. Environment & secrets

New vars (Vercel + Convex):

```
META_APP_ID                 # the Meta app that owns the WABA
META_APP_SECRET             # signs webhooks
META_WABA_ID                # WhatsApp Business Account ID
META_PHONE_NUMBER_ID        # the phone number sending messages
META_ACCESS_TOKEN           # system user token (long-lived)
META_WEBHOOK_VERIFY_TOKEN   # random string for the GET handshake
```

Subprocessors page (`src/app/subprocessors/page.tsx`) gets a new entry
for **Meta Platforms Inc.** — DPA commits us to 14 days' notice per
`CLAUDE.md`.

## 12. Manual setup on Meta's side (user must do this)

These are account-level things that can't be automated. Concrete steps:

1. **Meta Business verification** at [business.facebook.com](https://business.facebook.com).
   Company registration docs, tax ID, address. 1–5 days.
2. **Create WhatsApp Business Account (WABA)** under the verified business.
3. **Add a phone number** — a number **not already registered to a
   personal WhatsApp account** (you'd have to delete the personal account).
   Most teams buy a fresh number. Verify via SMS / voice code.
4. **Create / choose a Meta app**, add the **WhatsApp product**. Generate
   a **system user** + long-lived access token.
5. **Subscribe the app to webhook events** (`messages`, `message_status`)
   pointing at `https://spun.bot/api/webhooks/whatsapp` with the verify
   token.
6. **Submit templates** (the six listed in §9) in Meta Business Manager
   → WhatsApp Manager → Message Templates.
7. **Set up Display Name** ("Spun") — Meta reviews, sometimes rejects,
   re-submit with proof of business ownership of the name.

During dev: use Meta's **test number** (generated free in the app
dashboard) which skips 1, 3, and 7 and can send to up to 5 manually-added
test recipients.

## 13. Phased delivery

| Phase | Deliverable | Real number? | ETA |
|-------|-------------|--------------|-----|
| **0** | Start Meta Business verification + kick off template approvals in parallel | No | Day 1 |
| **1** | Schema + phone-verification flow in Settings (using Meta test number). Sends & verifies OTP end-to-end. | Test | ~1 day build |
| **2** | Inbound webhook + `receiveInbound` + adapter for `text` / `approval_request` / `status_update` / `connect_prompt`. AI replies over WhatsApp, approvals via buttons work. | Test | ~2 days |
| **3** | Adapter for rich types — campaign preview image, gallery, GBP audit PNG, strategy PDF. | Test | ~1.5 days |
| **4** | Outbound templates — weekly report, campaign launched, usage warnings. Convex scheduled functions wired up. | Test | ~1 day |
| **5** | Swap test number for real verified number. Remove test-recipient allowlist. | Yes | gated on verification |
| **6** | Launch-day checks: opt-in consent stored, subprocessors page updated, weekly-report cron verified, retry logic on 429 proven. | Yes | ½ day |

Total build time once verification is in flight: ~1 week of focused work.

## 14. Testing

- **Local**: Meta test number + ngrok (or Vercel preview deployments) for
  webhook URL. The free test number supports up to 5 recipient numbers.
- **End-to-end cases**:
  - Cold message from an unknown number → "sign up" reply
  - Verification flow from Settings → code arrives → verified
  - Onboarding conversation over WhatsApp, generating a strategy,
    launching a campaign with approval button
  - Receive a weekly report outside the 24h window (template path)
  - Approval button tap → campaign actually launches on Google Ads
  - Rate-limit test (deliberately trigger 429) → retries, no message loss
- **Idempotency**: Meta retries webhooks. `whatsappMessages.by_wa_id`
  index ensures re-delivered webhooks don't double-insert.

## 15. Pricing note

Meta charges per **24-hour conversation window**, not per message.
Current UK pricing:

- Service conversations (user-initiated): free tier up to 1,000/month, then £0.01–0.03
- Utility conversations (template-based, service-related): £0.01–0.03
- Marketing conversations (template-based, promotional): £0.04–0.09

Weekly reports are **utility**, not marketing, if worded as status
updates (which they are). Budget ~£0.05/user/month for the average Spun
user on Standard.

## 16. Open questions to confirm before implementation

1. Meta Cloud API OK, or any reason to prefer Twilio? (Sometimes chosen
   for built-in SMS fallback.)
2. Who owns the Meta Business verification — personal or a Spun company
   entity? Affects phone-number ownership and template display name.
3. During dev: which `+44` / `+1` test-recipient numbers go on the
   allowlist? (Need yours + any beta testers.)
4. Weekly reports — send even if user has been inactive? (Affects
   utility-vs-marketing template approval wording.)
5. Settings toggle default — if a user links WhatsApp, should web
   replies *also* go to WhatsApp, or is WhatsApp-linking = "primary
   channel is WhatsApp now"?
