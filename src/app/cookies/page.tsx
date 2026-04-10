import type { Metadata } from "next"
import Link from "next/link"
import LegalLayout from "@/components/LegalLayout"

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Spun uses cookies and similar technologies.",
  alternates: { canonical: "/cookies" },
}

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="10 April 2026">
      <div className="legal-note">
        This Cookie Policy explains how <strong>Spun App Ltd</strong> uses cookies and
        similar technologies on spun.bot. Read alongside our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </div>

      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small text files that a website stores on your device when you
        visit. They let the site remember your actions and preferences (such as login
        state) and help us understand how the site is used. We also use similar
        technologies such as local storage and web beacons, which we collectively
        refer to as &ldquo;cookies&rdquo; below.
      </p>

      <h2>2. Categories of cookies we use</h2>
      <h3>Strictly necessary</h3>
      <p>
        Required for the site to work. These cannot be switched off. They include
        cookies set by Clerk for authentication and session management, and cookies
        used to remember your cookie preferences.
      </p>

      <h3>Analytics (optional, consent required)</h3>
      <p>
        Help us understand how visitors use the site so we can improve it. We use
        <strong> Google Analytics 4</strong> for this. These cookies only load after
        you accept them via the cookie banner.
      </p>

      <h3>Functional (optional)</h3>
      <p>
        Remember choices you make to give you a better experience (e.g. UI
        preferences). These load only if you accept them.
      </p>

      <p>
        <strong>We do not use advertising or cross-site tracking cookies</strong> on
        spun.bot.
      </p>

      <h2>3. Cookies in detail</h2>
      <table>
        <thead>
          <tr>
            <th>Cookie / storage key</th>
            <th>Set by</th>
            <th>Purpose</th>
            <th>Duration</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>__session, __clerk_*</td>
            <td>Clerk</td>
            <td>Authentication &amp; session</td>
            <td>Session / up to 1 year</td>
            <td>Strictly necessary</td>
          </tr>
          <tr>
            <td>spun_cookie_consent</td>
            <td>Spun</td>
            <td>Remembers your cookie choices</td>
            <td>12 months</td>
            <td>Strictly necessary</td>
          </tr>
          <tr>
            <td>_ga, _ga_*</td>
            <td>Google Analytics</td>
            <td>Distinguishes users and measures site usage</td>
            <td>Up to 13 months</td>
            <td>Analytics (consent)</td>
          </tr>
          <tr>
            <td>_gid</td>
            <td>Google Analytics</td>
            <td>Distinguishes users over a 24-hour period</td>
            <td>24 hours</td>
            <td>Analytics (consent)</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Your choices</h2>
      <p>
        When you first visit spun.bot you will see a cookie banner. You can:
      </p>
      <ul>
        <li><strong>Accept all</strong> — enable analytics cookies.</li>
        <li><strong>Reject non-essential</strong> — only strictly necessary cookies are set.</li>
      </ul>
      <p>
        You can change your choice at any time by clicking the &ldquo;Cookie
        settings&rdquo; link in the site footer, or by clearing cookies in your browser
        and reloading the page.
      </p>
      <p>
        Most browsers also let you block or delete cookies via their settings. Note
        that blocking strictly necessary cookies will break login and other core
        features.
      </p>

      <h2>5. Changes to this policy</h2>
      <p>
        We may update this Cookie Policy when we add or change cookies. The
        &ldquo;Last updated&rdquo; date at the top will reflect any changes.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about cookies or this policy? Email{" "}
        <a href="mailto:privacy@spun.bot">privacy@spun.bot</a>.
      </p>
    </LegalLayout>
  )
}
