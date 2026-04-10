import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookies Policy",
  description: "How and why Spun uses cookies and similar technologies.",
  alternates: { canonical: "/cookies" },
}

const LAST_UPDATED = "10 April 2026"

export default function CookiesPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#5B9BAA] mb-3">Legal</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">Cookies Policy</h1>
        <p className="text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="space-y-10 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. What are cookies?</h2>
          <p>
            Cookies are small text files that websites place on your device to make the site
            work, to remember your preferences, and to collect information about how you use the
            site. &ldquo;Similar technologies&rdquo; include local storage, session storage, and
            tracking pixels. In this policy, we use the word &ldquo;cookies&rdquo; to cover all
            of these.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. How we use cookies</h2>
          <p className="mb-3">Spun uses cookies for a few distinct purposes:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <span className="text-white">Strictly necessary cookies.</span> These are required
              for the Service to work. They keep you signed in, remember your session, and
              protect against cross-site request forgery. You cannot disable these cookies
              without breaking core functionality.
            </li>
            <li>
              <span className="text-white">Preference cookies.</span> These remember choices you
              make, such as your preferred currency or default campaign settings, so we can
              personalise your experience.
            </li>
            <li>
              <span className="text-white">Analytics cookies.</span> Where enabled, these help us
              understand how the Service is used so we can improve it. Analytics cookies are only
              set where permitted by law and, where required, with your consent.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">3. Cookies set by our providers</h2>
          <p className="mb-3">
            Some cookies are set by third parties we use to run the Service. These providers
            operate under their own privacy policies:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <span className="text-white">Clerk</span> &mdash; session and authentication
              cookies that keep you signed in.
            </li>
            <li>
              <span className="text-white">Stripe</span> &mdash; fraud-prevention cookies set
              during checkout and billing.
            </li>
            <li>
              <span className="text-white">Vercel</span> &mdash; infrastructure and security
              cookies used to serve the Service reliably.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Managing cookies</h2>
          <p className="mb-3">
            Most browsers let you view, delete, or block cookies through their settings. Blocking
            strictly necessary cookies will prevent you from signing in or using key parts of the
            Service. For guidance on managing cookies in your browser, see:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5B9BAA] hover:underline"
              >
                Google Chrome
              </a>
            </li>
            <li>
              <a
                href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5B9BAA] hover:underline"
              >
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a
                href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5B9BAA] hover:underline"
              >
                Apple Safari
              </a>
            </li>
            <li>
              <a
                href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5B9BAA] hover:underline"
              >
                Microsoft Edge
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. Do Not Track</h2>
          <p>
            Some browsers offer a &ldquo;Do Not Track&rdquo; signal. There is no industry-wide
            standard for how Do Not Track should be interpreted, so we currently do not respond
            to these signals. We will update this policy if that changes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. Changes to this policy</h2>
          <p>
            We may update this Cookies Policy from time to time. If we make material changes, we
            will let you know through the Service. The &ldquo;Last updated&rdquo; date at the top
            of this page shows when it was last revised.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Contact us</h2>
          <p>
            Questions about cookies or this policy? Email us at{" "}
            <a href="mailto:hello@spun.bot" className="text-[#5B9BAA] hover:underline">
              hello@spun.bot
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
