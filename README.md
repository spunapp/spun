# Spun

**Automate marketing for your local business.**

Spun is an AI agent that manages your Google listing, runs your ads, collects reviews, posts on social and follows up with leads — all while chatting with you via WhatsApp or SMS.

## How It Works

1. **Tell Spun about your business** — a quick chat conversation, not a form
2. **Spun audits your online presence** — your Google listing, reviews, website, ad accounts
3. **Spun builds a plan** — plain English, no jargon, sent to your phone
4. **You approve (or let it run)** — reply YES or tell it what to change
5. **Spun executes and reports back** — weekly report showing exactly where customers came from

## What Spun Does

| Function | What happens |
|---|---|
| **Google listing** | Optimizes your Google Business Profile — hours, photos, categories, posts |
| **Ads** | Creates and manages Google Ads campaigns, adjusts budget based on performance |
| **Reviews** | Sends review requests to customers, responds to new reviews |
| **Social** | Posts to Facebook and Instagram on a schedule |
| **Lead follow-up** | Tracks new leads, sends follow-up messages, moves them through a pipeline |
| **Reporting** | Weekly plain-language report via WhatsApp/SMS — calls, reviews, ad spend, ROI |

## Who It's For

Local service businesses — plumbers, dentists, salons, gyms, restaurants, HVAC, chiropractors, auto shops, cleaning services. Businesses doing $100K–$2M/yr that know they should be marketing but don't have the time, knowledge, or budget for an agency.

## Pricing

| Plan | Price | Includes |
|---|---|---|
| **Starter** | $99/mo | Google listing management, review collection, weekly reports |
| **Growth** | $199/mo | + Ads management, social posting, lead follow-ups |
| **Pro** | $399/mo | + Multi-location, priority support, custom integrations |

Ad spend is separate (passed through to Google/Meta).

## Tech Stack

- Next.js 16 / React 19 / TypeScript / Tailwind v4
- Convex (real-time backend)
- Anthropic Claude (AI agent brain)
- WhatsApp Business API / Twilio (SMS)
- Google Business Profile API / Google Ads API / Meta Graph API / Yelp API

## Development

```bash
npm install
npx convex dev     # Start Convex backend
npm run dev        # Start Next.js dev server
```

Copy `.env.example` to `.env.local` and fill in your API keys.

## Documentation

- [Architecture](docs/architecture.md) — system design, data flow, deployment
- [Data Model](docs/data-model.md) — Convex schema with field-level detail
- [Agent System](docs/agent-system.md) — Claude tool-use, system prompt, trust escalation
- [Integrations](docs/integrations.md) — platform API specs and OAuth flows
- [Messaging](docs/messaging.md) — WhatsApp/SMS channel architecture
- [Onboarding](docs/onboarding.md) — conversational intake flow

## License

Proprietary. All rights reserved.
