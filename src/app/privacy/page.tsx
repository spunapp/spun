import type { Metadata } from "next"
import Link from "next/link"
import LegalLayout from "@/components/LegalLayout"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Spun App Ltd collects, uses, and protects your personal data.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="24 April 2026">
      <div className="legal-note">
        This Privacy Policy explains how <strong>Spun App Ltd</strong> (&ldquo;Spun&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and shares
        personal data when you use our website and services. We are the data controller
        for the personal data described in this policy, except where we act as a processor
        on behalf of our business customers (see our <Link href="/dpa">Data Processing
        Agreement</Link>).
      </div>

      <h2>1. Who we are</h2>
      <p>
        <strong>Spun App Ltd</strong> is a company registered in England and Wales
        under company number <strong>17136483</strong>.
      </p>
      <p>
        <strong>Registered address:</strong> 53 Langley Crescent, Brighton, BN2 6NL,
        United Kingdom.<br />
        <strong>Contact:</strong> <a href="mailto:privacy@spun.bot">privacy@spun.bot</a>
      </p>
      <p>
        For the purposes of the UK GDPR and the Data Protection Act 2018, Spun App Ltd
        is the controller of the personal data we collect about you as a website visitor
        or account holder.
      </p>

      <h2>2. What personal data we collect</h2>
      <h3>Information you give us</h3>
      <ul>
        <li><strong>Account data</strong> — name, email address, password hash (via Clerk), profile image.</li>
        <li><strong>Billing data</strong> — billing name, billing address, payment card details (handled directly by Stripe — we do not store full card numbers), VAT number, and subscription history.</li>
        <li><strong>Content you submit</strong> — messages, prompts, uploaded images, brand assets, campaign briefs, and any other content you send to the service.</li>
        <li><strong>Connected-platform data</strong> — OAuth tokens and account identifiers for advertising platforms you connect (e.g. Meta, Google). These are brokered by Pipedream Connect.</li>
        <li><strong>Support data</strong> — correspondence when you contact us by email.</li>
      </ul>

      <h3>Information we collect automatically</h3>
      <ul>
        <li><strong>Usage data</strong> — pages viewed, features used, credit/usage counters, and session timestamps.</li>
        <li><strong>Device &amp; log data</strong> — IP address, browser type, operating system, referring URL, and diagnostic logs.</li>
        <li><strong>Cookies &amp; similar technologies</strong> — see our <Link href="/cookies">Cookie Policy</Link>.</li>
      </ul>

      <h3>Information we receive from third parties</h3>
      <ul>
        <li><strong>Authentication providers</strong> — if you sign in with Google or another single sign-on option via Clerk, we receive your name, email, and profile image.</li>
        <li><strong>Payment processor</strong> — Stripe sends us subscription status, invoice metadata, and the last four digits of your card.</li>
        <li><strong>Advertising platforms</strong> — when you connect an ad account, we receive campaign performance metrics so we can report back to you.</li>
      </ul>

      <h2>3. How we use your personal data</h2>
      <p>We use personal data to:</p>
      <ul>
        <li>Provide, operate, and improve the Spun service;</li>
        <li>Authenticate you and secure your account;</li>
        <li>Generate AI responses, ad creatives, and campaign outputs you request;</li>
        <li>Execute campaigns on your behalf on platforms you have connected;</li>
        <li>Process payments and manage subscriptions;</li>
        <li>Provide customer support and respond to enquiries;</li>
        <li>Send service announcements and transactional emails;</li>
        <li>Monitor, prevent, and investigate fraud, abuse, and security incidents;</li>
        <li>Comply with legal obligations and enforce our Terms of Service.</li>
      </ul>

      <h2>4. Legal bases for processing (UK/EU GDPR)</h2>
      <p>We rely on the following legal bases under Article 6 UK GDPR:</p>
      <ul>
        <li><strong>Contract</strong> — to provide the service you have signed up for.</li>
        <li><strong>Legitimate interests</strong> — to secure, improve, and market the service, to prevent fraud, and to keep the service running reliably. We have balanced these interests against your rights.</li>
        <li><strong>Legal obligation</strong> — for tax, accounting, and regulatory compliance.</li>
        <li><strong>Consent</strong> — for non-essential cookies, analytics, and marketing emails. You can withdraw consent at any time.</li>
      </ul>

      <h2>5. How we share your personal data</h2>
      <p>
        We share personal data with third-party service providers (&ldquo;sub-processors&rdquo;)
        who help us run the service. A full list is maintained at{" "}
        <Link href="/subprocessors">spun.bot/subprocessors</Link>.
      </p>
      <p>We may also share personal data:</p>
      <ul>
        <li>With <strong>advertising platforms you authorise</strong> (e.g. Meta, Google Ads) when you instruct Spun to launch or manage campaigns on them;</li>
        <li>With <strong>professional advisers</strong> (lawyers, accountants, auditors) bound by confidentiality;</li>
        <li>With <strong>regulators, courts, or law enforcement</strong> where required by law;</li>
        <li>In connection with a <strong>business transfer</strong>, merger, acquisition, or sale of assets.</li>
      </ul>
      <p>We do not sell your personal data.</p>

      <h2>6. International data transfers</h2>
      <p>
        Several of our sub-processors are based in the United States or process data
        globally. When we transfer personal data outside the UK or EEA, we rely on
        appropriate safeguards such as the UK International Data Transfer Addendum,
        the EU Standard Contractual Clauses, or adequacy decisions where available.
      </p>

      <h2>7. How long we keep your data</h2>
      <p>
        We keep personal data only as long as necessary for the purposes set out in
        this policy:
      </p>
      <ul>
        <li>Account data — for the life of your account, then deleted within 30 days of account closure (unless we are required to retain it for legal reasons).</li>
        <li>Billing records — 7 years, to comply with UK tax law.</li>
        <li>Support correspondence — up to 3 years after your last interaction.</li>
        <li>Backups — rotated out within 30 days.</li>
      </ul>

      <h2>8. Your rights</h2>
      <p>Under UK/EU GDPR, you have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you;</li>
        <li>Rectify inaccurate or incomplete data;</li>
        <li>Erase your data (&ldquo;right to be forgotten&rdquo;);</li>
        <li>Restrict or object to certain processing;</li>
        <li>Data portability;</li>
        <li>Withdraw consent at any time;</li>
        <li>Lodge a complaint with the UK Information Commissioner&rsquo;s Office (<a href="https://ico.org.uk" target="_blank" rel="noreferrer noopener">ico.org.uk</a>) or your local supervisory authority.</li>
      </ul>
      <p>
        To exercise any of these rights, email{" "}
        <a href="mailto:privacy@spun.bot">privacy@spun.bot</a>. We will respond within
        one month.
      </p>

      <h2>9. Security</h2>
      <p>
        We use industry-standard measures to protect personal data, including TLS
        encryption in transit, encryption at rest, role-based access controls, and
        regular security reviews. No system is 100% secure, but we work hard to keep
        yours safe.
      </p>

      <h2>10. Children</h2>
      <p>
        Spun is not directed at children under 16, and we do not knowingly collect
        personal data from children. If you believe a child has provided us with
        personal data, please contact us.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes will
        be notified by email or in-app notice. The &ldquo;Last updated&rdquo; date at
        the top of this page shows when it was last revised.
      </p>

      <h2>12. Contact us</h2>
      <p>
        Questions about this policy or how we handle your data? Email us at{" "}
        <a href="mailto:privacy@spun.bot">privacy@spun.bot</a> or write to:
      </p>
      <p>
        Spun App Ltd (company no. 17136483)<br />
        53 Langley Crescent<br />
        Brighton, BN2 6NL<br />
        United Kingdom
      </p>
    </LegalLayout>
  )
}
