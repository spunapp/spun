# Architecture

## System Overview

Spun is a chat-first AI agent. There is no dashboard. The business owner interacts entirely through WhatsApp, SMS, or a web chat fallback. The agent plans and executes marketing actions autonomously, gated by the owner's trust level.

```
┌─────────────────────────────────────────────────────────┐
│                    OWNER CHANNELS                        │
│   WhatsApp    │     SMS (Twilio)    │    Web Chat        │
└──────┬────────┴─────────┬───────────┴────────┬──────────┘
       │                  │                    │
       ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                   MESSAGE ROUTER                         │
│                                                          │
│  Normalizes inbound messages from all channels into a    │
│  unified format. Handles webhook verification, message   │
│  deduplication, and delivery receipts.                   │
│                                                          │
│  Convex HTTP actions: /webhooks/whatsapp                 │
│                       /webhooks/twilio                   │
│                       Web: direct Convex mutation         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   CONVERSATION LAYER                     │
│                                                          │
│  Stores all messages in a single thread per business,    │
│  regardless of channel. Maintains conversation state     │
│  (onboarding, active, waiting for approval).             │
│                                                          │
│  Convex tables: conversations, messages                  │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    AGENT BRAIN                           │
│                                                          │
│  Claude (Anthropic API) with tool-use. Receives the      │
│  full conversation context + business profile. Decides   │
│  what to do next: respond, ask a question, or invoke     │
│  a tool to take action.                                  │
│                                                          │
│  System prompt defines persona and available tools.      │
│  Business context injected per-request.                  │
│                                                          │
│  Convex action: agent.ts                                 │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
     (text reply)              (tool invocation)
           │                          │
           ▼                          ▼
┌──────────────────┐   ┌─────────────────────────────────┐
│  REPLY ROUTER    │   │        EXECUTION LAYER           │
│                  │   │                                   │
│  Sends agent     │   │  Convex actions that call         │
│  reply back via  │   │  external APIs:                   │
│  the same        │   │                                   │
│  channel the     │   │  - Google Business Profile API    │
│  owner used.     │   │  - Google Ads API                 │
│                  │   │  - Meta Graph API                 │
│  WhatsApp API    │   │  - Twilio SMS                     │
│  Twilio SMS      │   │  - Yelp API                       │
│  Web push        │   │                                   │
└──────────────────┘   │  All actions go through the       │
                       │  approval gate first.              │
                       └──────────┬──────────────────────┘
                                  │
                                  ▼
                       ┌─────────────────────────────────┐
                       │        APPROVAL GATE             │
                       │                                   │
                       │  Checks business trust mode:      │
                       │                                   │
                       │  Draft → show plan, don't act     │
                       │  Approve → queue, ask for YES/NO  │
                       │  Auto → execute, report after     │
                       │                                   │
                       │  Budget guardrails enforced here   │
                       │  regardless of trust mode.         │
                       └──────────┬──────────────────────┘
                                  │
                                  ▼
                       ┌─────────────────────────────────┐
                       │       PLATFORM APIs              │
                       │                                   │
                       │  Google Business Profile          │
                       │  Google Ads                       │
                       │  Meta (Facebook/Instagram)        │
                       │  Twilio (SMS outbound)            │
                       │  WhatsApp Business                │
                       │  Yelp                             │
                       └─────────────────────────────────┘
```

## Data Flow Examples

### Owner sends a message via WhatsApp

1. WhatsApp sends POST to `/api/webhooks/whatsapp`
2. Webhook handler verifies signature, extracts message text and sender phone
3. Looks up business by phone number
4. Stores message in `messages` table (channel: "whatsapp", role: "user")
5. Triggers agent brain (Convex action)
6. Claude receives conversation history + business context
7. Claude responds with text and/or tool calls
8. Text reply sent back via WhatsApp API
9. Tool calls routed through approval gate → executed or queued

### Spun sends a review request

1. Agent decides to send review request (based on schedule or owner request)
2. Invokes `send_review_request` tool with customer phone + business name
3. Approval gate checks trust mode:
   - Draft: logs the plan, tells owner "I'd send a review request to [customer]"
   - Approve: queues it, asks owner "Send review request to [customer]? YES/NO"
   - Auto: proceeds directly
4. Twilio sends SMS: "Thanks for visiting [Business]! Would you mind leaving us a review? [Google Review Link]"
5. Lead record updated with `reviewRequestSent` timestamp

### Weekly report generation

1. Cron job fires Monday 8am in business timezone
2. `generate_weekly_report` Convex action runs:
   - Queries `campaigns` for ad performance (spend, clicks, calls)
   - Queries `reviews` for new reviews this week
   - Queries `posts` for social engagement
   - Queries `leads` for new leads and pipeline movement
   - Queries `listings` for GBP insight changes
3. Passes raw metrics to Claude with report generation prompt
4. Claude produces plain-language summary
5. Report stored in `reports` table
6. Sent to owner via their preferred channel (WhatsApp or SMS)
7. Includes next week's proposed plan with approval prompt

## Deployment

```
Vercel (Next.js frontend + API routes)
  ├── Landing page (SSR)
  ├── Web chat (client-side, Convex subscriptions)
  └── Webhook endpoints (/api/webhooks/*)

Convex Cloud (backend)
  ├── Database (all tables)
  ├── Queries (real-time subscriptions)
  ├── Mutations (data writes)
  ├── Actions (external API calls, Claude requests)
  └── Cron jobs (weekly reports, scheduled posts, review requests)
```

### Why Convex

- Real-time subscriptions for web chat (messages appear instantly)
- Serverless actions for external API calls (no infrastructure to manage)
- Built-in cron scheduling for weekly reports and scheduled posts
- Transactional mutations (approval → execution is atomic)
- Scales automatically — no provisioning

### Why Not a Dashboard

The target customer (local business owner) doesn't want another login, another tab, another dashboard to check. They already live in WhatsApp and SMS. Meeting them there means:

- Zero learning curve — they already know how to text
- Higher engagement — WhatsApp messages get read, dashboards don't
- Faster feedback loop — reply YES instead of clicking through 3 screens
- Mobile-native — they're on their phone between jobs, not at a desk

The web chat exists as a fallback and for onboarding (when a landing page signup leads to the first conversation), but the primary interface is messaging.

## Security

### OAuth Tokens

Platform OAuth tokens (Google, Meta) stored in the `channels` table. Tokens are encrypted at rest via Convex. Refresh tokens used to maintain access. Token rotation on expiry handled by integration layer.

### Message Privacy

- All messages stored in Convex (encrypted at rest)
- No message content logged externally
- WhatsApp end-to-end encryption maintained for owner ↔ WhatsApp leg
- SMS is not end-to-end encrypted (Twilio limitation) — documented in terms

### API Keys

- All secrets in environment variables, never in code
- Convex actions access secrets via `process.env` server-side only
- Webhook endpoints verify signatures (WhatsApp signature, Twilio signature)

### Budget Guardrails

Regardless of trust mode, Spun enforces hard limits:

- Daily ad spend cap (set during onboarding, owner can change via chat)
- Monthly total spend cap
- No spend increase >20% without explicit approval
- Auto-pause if anomaly detected (e.g., spend rate 3x normal)

## Error Handling

### Platform API Failures

- Retry with exponential backoff (3 attempts)
- If persistent: log error, notify owner via chat ("I couldn't post to Instagram — looks like the connection expired. Can you reconnect?")
- Never fail silently — the owner always knows

### Message Delivery Failures

- WhatsApp: check delivery receipts, retry once, then fall back to SMS
- SMS: check Twilio status callback, retry once, then log and alert on next interaction
- Web: Convex real-time handles delivery natively

### Agent Errors

- If Claude returns malformed tool calls: retry once with same context
- If tool execution fails: report to owner, don't retry automatically (owner might want to adjust)
- If context too long: summarize older messages, keep recent 50 + business profile
