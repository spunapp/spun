# Launch checklist

Everything that must be done before flipping Spun from development to a
public-facing production service. Kept in the repo so it travels with the
code and is visible to Claude Code in future sessions.

Nothing in this list is urgent right now — Spun is still in development /
sandbox mode. Use this when planning the launch cutover.

## 1. Stripe — sandbox to live migration

Currently (as of commit `79abf7f`) the Stripe price IDs hardcoded in
`src/lib/billing/tiers.ts` are **sandbox/test mode** prices:

| Line | Tier | Sandbox price ID |
|------|------|------------------|
| 23 | Standard (£69.99/mo) | `price_1TIy8N86WuAcuQwgw5p0rlzw` |
| 39 | Pro (£119.99/mo) | `price_1TIy8l86WuAcuQwgpEXD3TsO` |
| 56 | Credit pack (£9.99 one-time) | `price_1TKgcJ86WuAcuQwgsr9PDiNs` |

Test and live modes in Stripe are effectively separate accounts — a test
price ID does **not** exist in live mode, so launch day must include:

1. **Create the three products in Stripe live mode** (toggle the dashboard
   from Test to Live first):
   - Standard subscription: £69.99 GBP, recurring monthly
   - Pro subscription: £119.99 GBP, recurring monthly
   - Credit pack: £9.99 GBP, one-time payment
2. **Copy the three new `price_1...` IDs** from live mode and update
   `src/lib/billing/tiers.ts` lines 23, 39, 56. Commit and deploy.
3. **Swap the Vercel env vars** (Project Settings → Environment Variables):
   - `STRIPE_SECRET_KEY` → `sk_live_...` (from live mode)
   - `STRIPE_WEBHOOK_SECRET` → the live webhook signing secret (see next step)
4. **Create a new webhook endpoint in Stripe live mode** pointing at
   `https://spun.bot/api/webhooks/stripe`. Subscribe it to the same events
   as the sandbox webhook (at minimum: `checkout.session.completed`,
   `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.payment_succeeded`,
   `invoice.payment_failed`). Copy its signing secret into
   `STRIPE_WEBHOOK_SECRET` in Vercel.
5. **Redeploy Vercel** so the new env vars take effect.
6. **Smoke-test in live mode** with a small real-card transaction (use a
   card you control, then refund) — confirm webhook fires, subscription
   is created in Convex, tier is assigned correctly.

If any one of those five steps is skipped, checkout will break with either
"No such price" (mismatched mode) or webhook signature verification errors.

### Alternative: move price IDs to env vars (Option B from the discussion)

If we end up keeping a permanent staging environment on sandbox keys after
launch, refactor `tiers.ts` to read the three price IDs from environment
variables (`STRIPE_STANDARD_PRICE_ID`, `STRIPE_PRO_PRICE_ID`,
`STRIPE_CREDIT_PACK_PRICE_ID`). Set sandbox values in Vercel preview/dev
env and live values in production env. The code then doesn't change at
launch. Decision deferred — currently hardcoded for simplicity.

## 2. Google AI (Imagen 4) — API key

`convex/ai.ts:296` reads `process.env.GOOGLE_AI_API_KEY` and silently
skips Imagen 4 generation if it is missing. Image ad creative generation
will not work until this is set.

1. Visit https://aistudio.google.com → sign in → **Get API key** → Create
   API key in a new or existing project.
2. **Vercel:** Project Settings → Environment Variables → add
   `GOOGLE_AI_API_KEY` (no `NEXT_PUBLIC_` prefix — server-side only) for
   Production (and Preview if desired).
3. **Convex:** from the repo root run
   `npx convex env set GOOGLE_AI_API_KEY <the-key>`.
   Convex actions do **not** receive Vercel env vars, so this step is
   required in addition to step 2.
4. Redeploy Vercel.

## 3. Google Analytics — Measurement ID

The cookie consent banner in `src/components/CookieConsent.tsx` is wired
to Google Consent Mode v2 and only loads GA after the user accepts.
Without `NEXT_PUBLIC_GA_MEASUREMENT_ID`, the loader no-ops — the banner
still respects consent, but no analytics data is collected.

1. Create a GA4 property at https://analytics.google.com if you don't
   already have one. Grab the Measurement ID (format `G-XXXXXXXXXX`).
2. **Vercel:** add `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX` for
   Production. (Convex does not need this — GA runs client-side only.)
3. Redeploy Vercel.
4. Verify in an incognito window: visit spun.bot, click **Accept all** on
   the banner, open DevTools → Network, confirm a request to
   `www.googletagmanager.com/gtag/js?id=G-...` and that GA4 DebugView shows
   the session.

## 4. Legal pages — pre-launch checks

The legal pages at `/privacy`, `/terms`, `/cookies`, `/dpa`, and
`/subprocessors` are drafts grounded in UK GDPR / Companies Act / English
contract norms. Before you rely on them in customer contracts:

1. **Confirm the Stripe legal entity.** The sub-processor list currently
   names **Stripe Payments Europe, Ltd. (Ireland)**. Check Stripe Dashboard
   → Settings → Account details. If your account is on Stripe Payments UK
   Ltd or Stripe, Inc. (US) instead, update the row in
   `src/app/subprocessors/page.tsx`.
2. **Create the mailboxes `privacy@spun.bot` and `security@spun.bot`**
   (real inboxes or forwarders to `hello@spun.bot`). Legal pages direct
   data subjects and security researchers to these addresses — if they
   bounce, there is a GDPR-compliance gap.
3. **Decide how to treat the ad platforms** (Meta / Google Ads / TikTok /
   Klaviyo). Currently listed as independent controllers in a separate
   note on `/subprocessors`, not as sub-processors. Some lawyers prefer
   listing them as sub-processors as well. Ask a solicitor.
4. **Get a solicitor to review the legal pages.** They are drafts, not a
   substitute for legal review before you sign your first paying business
   customer.

## 5. End-to-end testing before launch

Items #10–12 from the original launch plan. Must be done by a human
against real accounts in sandbox mode before cutting over to live.

### #10 Stripe flows

- [ ] Sign up → trial status shows in Stripe + Convex
- [ ] Subscribe to Standard with test card `4242 4242 4242 4242` → webhook
      fires, tier updates in Convex
- [ ] Subscribe to Pro → tier upgrades
- [ ] Buy the credit pack → credits appear on user record
- [ ] Customer portal → cancel → webhook downgrades tier
- [ ] Failed payment with test card `4000 0000 0000 0341` → subscription
      enters `past_due`, UI reflects it

### #11 Chat / AI flow

- [ ] Send a message → OpenRouter returns a response
- [ ] Generate an ad creative → Imagen 4 returns an image (requires
      section 2 done first)
- [ ] Hit the Standard plan message / creative limits → upgrade prompt
      appears
- [ ] Sign out + sign back in → conversations persist

### #12 Pipedream / OAuth

- [ ] Connect Facebook (Meta) → connection shows active
- [ ] Repeat for Google Ads, TikTok, Klaviyo
- [ ] Launch a test campaign on a connected platform → appears in the
      platform's own dashboard
- [ ] Disconnect a platform → token revoked, UI updates

## 6. Sub-processor maintenance (ongoing)

Once launched, the DPA (`/dpa` section 4) commits Spun to **14 days'
notice** before adding a new sub-processor. If/when any of these are
added later, update `src/app/subprocessors/page.tsx` and notify customers
who have subscribed to updates via `privacy@spun.bot`:

- Sentry (error monitoring)
- PostHog / Plausible / Mixpanel (product analytics)
- Resend / Postmark / SendGrid (transactional email)
- Intercom / Loops / Customer.io (customer messaging)
- Cloudflare (if added as a CDN / WAF in front of Vercel)
