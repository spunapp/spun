# Project Guidelines

## Working with the user

- Always confirm when code has been pushed to GitHub. Don't make them guess.
- Double and triple check work before saying something is fixed. Don't let it take multiple rounds.
- When the user uploads a screenshot, examine every element in it carefully before touching any code.
- When asked to research something online, do deep research on every possible angle first, then and only then start coding.
- Never tell the user to push via terminal. They use Vercel for deployments — code deploys automatically when pushed to GitHub.
- Read over all prior context in the codebase and conversation before making changes. Don't make assumptions.

## Tech stack

- Next.js app with Tailwind CSS v4 (uses `@tailwindcss/postcss`, oklab color space)
- Convex backend
- Clerk auth
- Deployed via Vercel (auto-deploys on push)

## Known gotchas

- Tailwind v4 `border-white/*` classes use `color-mix(in oklab)` which can produce purple tint artifacts. Use explicit `rgba()` inline styles for borders when color accuracy matters.
- Tailwind v4 adds default focus-visible outlines. Global override exists in globals.css.
- Textarea scrollbar gutter can show as a visible line on dark backgrounds. Use `overflowY: hidden` + `scrollbarWidth: none` + `textarea::-webkit-scrollbar { display: none }`.
