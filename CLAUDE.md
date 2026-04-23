# Project Guidelines

## Working with the user

- Always confirm when code has been pushed to GitHub. Don't make them guess.
- Double and triple check work before saying something is fixed. Don't let it take multiple rounds.
- When the user uploads a screenshot, examine every element in it carefully before touching any code.
- When asked to research something online, do deep research on every possible angle first, then and only then start coding.
- Never tell the user to push via terminal. They use Vercel for deployments — code deploys automatically when pushed to GitHub.
- Read over all prior context in the codebase and conversation before making changes. Don't make assumptions.
- **The user does NOT run the app locally.** They do not have a local dev environment, do not run `npm run dev`, and do not maintain a `.env.local` file. All environment variables live in **Vercel** (frontend/Next.js) and **Convex** (backend actions). Never instruct them to edit `.env.local` or run local dev commands. For any new env var: tell them to set it in Vercel and/or Convex only.

## Tech stack

- Next.js app with Tailwind CSS v4 (uses `@tailwindcss/postcss`, oklab color space)
- Convex backend
- Clerk auth
- Deployed via Vercel (auto-deploys on push)

## Known gotchas

- Tailwind v4 `border-white/*` classes use `color-mix(in oklab)` which can produce purple tint artifacts. Use explicit `rgba()` inline styles for borders when color accuracy matters.
- Tailwind v4 adds default focus-visible outlines. Global override exists in globals.css.
- Textarea scrollbar gutter can show as a visible line on dark backgrounds. Use `overflowY: hidden` + `scrollbarWidth: none` + `textarea::-webkit-scrollbar { display: none }`.

## Launch status

- Spun is **still in development / Stripe sandbox mode** — not live yet.
- The Stripe price IDs in `src/lib/billing/tiers.ts` (lines 23, 39, 56) are all sandbox/test-mode prices. They must be swapped for live-mode prices at launch.
- **Before launching, read `LAUNCH.md` at the repo root in full.** It contains the complete pre-launch checklist: Stripe sandbox→live migration, Google AI API key setup, Google Analytics Measurement ID, legal page pre-launch checks, and the end-to-end test plan. Do not skip it.
- Whenever a new sub-processor is added (Sentry, PostHog, Resend, Cloudflare, etc.), update `src/app/subprocessors/page.tsx` — the DPA at `/dpa` commits us to 14 days' notice before adding one.
