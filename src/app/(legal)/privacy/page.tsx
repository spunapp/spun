import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Spun collects, uses, and protects your personal data.",
  alternates: { canonical: "/privacy" },
}

const LAST_UPDATED = "10 April 2026"

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#5B9BAA] mb-3">Legal</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">Privacy Policy</h1>
        <p className="text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="space-y-10 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Introduction</h2>
          <p>
            This Privacy Policy explains how Spun (&ldquo;Spun&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;) collects, uses, and protects your personal data when you use our
            website, chat interface, and related services (the &ldquo;Service&rdquo;). Spun acts
            as the data controller for personal data processed through the Service, unless stated
            otherwise. We are committed to protecting your privacy and complying with the UK GDPR,
            the EU GDPR, and the Data Protection Act 2018.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. Data we collect</h2>
          <p className="mb-3">We collect and process the following categories of personal data:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <span className="text-white">Account data.</span> Your name, email address, and
              authentication details, collected when you sign up via our authentication provider,
              Clerk.
            </li>
            <li>
              <span className="text-white">Business data.</span> Information about your business,
              brand, products, audiences, goals, and any assets you upload to the Service
              (documents, images, brand guidelines).
            </li>
            <li>
              <span className="text-white">Chat and prompt data.</span> Messages you send to the
              Spun assistant, instructions you provide, and any files attached to conversations.
            </li>
            <li>
              <span className="text-white">Generated output.</span> Strategies, creatives, copy,
              and other assets produced by the Service in response to your prompts.
            </li>
            <li>
              <span className="text-white">Connected-platform data.</span> When you connect a
              third-party platform (for example, Meta, Google, Klaviyo), we receive and store
              OAuth tokens and limited account metadata (account IDs and names) so we can act on
              your behalf. We do not store your passwords for those platforms.
            </li>
            <li>
              <span className="text-white">Payment data.</span> Billing is handled by Stripe.
              Stripe collects and processes your payment card details directly; we only receive
              limited information such as your customer ID, subscription status, and the last
              four digits of your card.
            </li>
            <li>
              <span className="text-white">Usage data.</span> Information about how you interact
              with the Service, such as feature usage, message counts, errors, and timestamps.
            </li>
            <li>
              <span className="text-white">Technical data.</span> IP address, device type,
              browser, operating system, and cookies (see our Cookies Policy).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">3. How we use your data</h2>
          <p className="mb-3">We use your personal data to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>provide, maintain, and improve the Service;</li>
            <li>
              process prompts, generate AI outputs, and execute actions you request on connected
              platforms;
            </li>
            <li>manage your account, subscription, and billing;</li>
            <li>
              send you transactional messages, including service updates, approvals, billing
              notices, and usage warnings;
            </li>
            <li>detect, prevent, and respond to fraud, abuse, or security incidents;</li>
            <li>comply with our legal and regulatory obligations;</li>
            <li>
              analyse usage trends in aggregate to understand and improve the Service (we do not
              use your content to train third-party foundation models).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Legal bases (UK &amp; EU GDPR)</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <span className="text-white">Contract.</span> To provide the Service you have signed
              up for.
            </li>
            <li>
              <span className="text-white">Legitimate interests.</span> To secure and improve the
              Service, prevent abuse, and understand how it is used.
            </li>
            <li>
              <span className="text-white">Legal obligation.</span> To meet our tax, accounting,
              and other regulatory duties.
            </li>
            <li>
              <span className="text-white">Consent.</span> Where required, for example for
              non-essential cookies or marketing emails. You can withdraw consent at any time.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. Sub-processors</h2>
          <p className="mb-3">
            We rely on trusted third parties to operate the Service. Each sub-processor is bound
            by contract to protect your data and only process it on our instructions:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <span className="text-white">Clerk</span> &mdash; authentication and user management.
            </li>
            <li>
              <span className="text-white">Convex</span> &mdash; application database and file
              storage.
            </li>
            <li>
              <span className="text-white">Vercel</span> &mdash; application hosting and content
              delivery.
            </li>
            <li>
              <span className="text-white">Stripe</span> &mdash; subscription and payment
              processing.
            </li>
            <li>
              <span className="text-white">OpenRouter</span> &mdash; routing prompts to large
              language models.
            </li>
            <li>
              <span className="text-white">Google</span> &mdash; image generation via the
              Generative Language API.
            </li>
            <li>
              <span className="text-white">Pipedream</span> &mdash; OAuth connections and API
              proxying for connected platforms.
            </li>
          </ul>
          <p className="mt-3">
            An up-to-date list of sub-processors is available on request by emailing{" "}
            <a href="mailto:hello@spun.bot" className="text-[#5B9BAA] hover:underline">
              hello@spun.bot
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. International transfers</h2>
          <p>
            Some of our sub-processors are located outside the UK and EEA, including in the
            United States. When personal data is transferred outside the UK or EEA, we rely on
            appropriate safeguards, including the UK International Data Transfer Agreement and
            the EU Standard Contractual Clauses, and we assess the destination country&rsquo;s
            laws to ensure your data is protected to an equivalent standard.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Retention</h2>
          <p>
            We keep your personal data for as long as your account is active and for a reasonable
            period afterwards to meet our legal, tax, and accounting obligations, to resolve
            disputes, and to enforce our agreements. You can request deletion of your account at
            any time from the Settings page. Some data may be retained for longer where required
            by law or in anonymised form for analytics.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">8. Your rights</h2>
          <p className="mb-3">
            Subject to applicable law, you have the following rights over your personal data:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>to access a copy of the personal data we hold about you;</li>
            <li>to request correction of inaccurate or incomplete data;</li>
            <li>to request deletion of your data;</li>
            <li>to request that we restrict or stop processing your data;</li>
            <li>to request a portable copy of your data;</li>
            <li>to object to processing carried out on the basis of legitimate interests;</li>
            <li>to withdraw consent where processing is based on consent.</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, email us at{" "}
            <a href="mailto:hello@spun.bot" className="text-[#5B9BAA] hover:underline">
              hello@spun.bot
            </a>
            . You also have the right to complain to a supervisory authority. In the UK this is
            the Information Commissioner&rsquo;s Office (
            <a
              href="https://ico.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5B9BAA] hover:underline"
            >
              ico.org.uk
            </a>
            ).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">9. Security</h2>
          <p>
            We use industry-standard technical and organisational measures to protect your data,
            including encryption in transit, access controls, and logging. No system is perfectly
            secure, and we cannot guarantee absolute security. If we become aware of a personal
            data breach affecting you, we will notify you and the relevant regulator as required
            by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">10. Children</h2>
          <p>
            The Service is not intended for individuals under 18. We do not knowingly collect
            personal data from children. If you believe a child has given us personal data,
            please contact us so we can delete it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">11. Automated decision-making</h2>
          <p>
            The Service uses AI models to generate content and suggest campaign actions, but it
            does not make decisions that produce legal or similarly significant effects on you
            without your review. You approve each campaign action before it is executed, unless
            you have explicitly enabled automatic execution.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">12. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we
            will let you know by email or through the Service. The &ldquo;Last updated&rdquo;
            date at the top of this page shows when it was last revised.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">13. Contact us</h2>
          <p>
            Questions about this Privacy Policy or how we handle your data? Email us at{" "}
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
