import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing your use of Spun.",
  alternates: { canonical: "/terms" },
}

const LAST_UPDATED = "10 April 2026"

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#5B9BAA] mb-3">Legal</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">Terms of Service</h1>
        <p className="text-sm text-slate-400">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="space-y-10 text-sm leading-relaxed text-slate-300">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Agreement to these terms</h2>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) form a binding agreement between you
            (&ldquo;you&rdquo;, &ldquo;your&rdquo;) and Spun (&ldquo;Spun&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;, &ldquo;our&rdquo;), governing your access to and use of the Spun
            website, chat interface, APIs, and any related services (together, the
            &ldquo;Service&rdquo;). By creating an account or using the Service you confirm that
            you have read, understood, and accepted these Terms. If you do not agree, do not use
            the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. Who can use Spun</h2>
          <p>
            You must be at least 18 years old and have the legal authority to enter into a
            contract. If you are using Spun on behalf of a business, you confirm that you are
            authorised to bind that business to these Terms, and references to &ldquo;you&rdquo;
            include that business. The Service is not intended for personal or household use.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">3. Your account</h2>
          <p>
            You are responsible for keeping your account credentials secure and for all activity
            that takes place under your account. You must provide accurate and up-to-date
            information. We reserve the right to suspend or terminate accounts that are inactive,
            fraudulent, or in breach of these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Subscriptions, trials, and billing</h2>
          <p className="mb-3">
            Spun is offered on a subscription basis. Current plans, allowances, and prices are
            shown on our pricing page. Unless stated otherwise, subscriptions renew automatically
            at the end of each billing period until cancelled.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <span className="text-white">Free trial.</span> New subscriptions include a 14-day
              free trial. You can cancel during the trial without charge. If you do not cancel,
              the subscription will begin and you will be billed at the plan&rsquo;s standard
              rate.
            </li>
            <li>
              <span className="text-white">Billing.</span> Payments are processed by Stripe. By
              providing a payment method, you authorise us to charge all fees due. Prices are
              shown in GBP unless stated otherwise and are exclusive of any applicable taxes.
            </li>
            <li>
              <span className="text-white">Monthly allowances.</span> Each plan includes monthly
              allowances (for example, AI responses, creatives, channels, and campaigns). Unused
              allowance does not roll over. Allowances reset on the first day of each calendar
              month.
            </li>
            <li>
              <span className="text-white">Credit packs.</span> You can purchase one-time credit
              packs for additional usage. Credits do not expire and are consumed before your
              monthly allowance is used.
            </li>
            <li>
              <span className="text-white">Cancellation.</span> You can cancel at any time from
              the billing portal. Cancellations take effect at the end of the current billing
              period and we do not provide refunds for partial periods except where required by
              law.
            </li>
            <li>
              <span className="text-white">Price changes.</span> We may change prices on notice.
              Changes apply from the next renewal after the notice period.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. The Service</h2>
          <p>
            Spun provides AI-powered marketing assistance, including generating strategies,
            creatives, and campaign assets, and, where you connect third-party platforms, helping
            you launch and manage marketing campaigns. The Service relies on large language models
            and generative image models that may produce outputs that are inaccurate, incomplete,
            or otherwise unsuitable. You are responsible for reviewing and approving all outputs
            before they are published or used in live campaigns.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. Connected platforms</h2>
          <p>
            Spun connects to third-party platforms such as Meta, Google, Klaviyo, and others via
            OAuth, through our connection provider. When you connect a platform, you authorise
            Spun to access and take actions on that account on your behalf, including launching
            and managing campaigns. Your use of each third-party platform remains subject to that
            platform&rsquo;s own terms of service and advertising policies, and you are
            responsible for complying with them. We are not responsible for outages, policy
            changes, account suspensions, or other issues caused by those third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Acceptable use</h2>
          <p className="mb-3">You agree not to use the Service to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>break the law or infringe anyone&rsquo;s rights;</li>
            <li>
              generate or distribute content that is illegal, defamatory, misleading, harassing,
              hateful, sexually explicit, or that exploits minors;
            </li>
            <li>run advertising that violates the policies of any connected platform;</li>
            <li>
              impersonate any person or business, or misrepresent the origin of any campaign or
              content;
            </li>
            <li>
              probe, scrape, reverse-engineer, overload, or otherwise interfere with the Service
              or its infrastructure;
            </li>
            <li>
              use the Service to build a competing product, or to train machine-learning models;
            </li>
            <li>
              share your account with others or attempt to bypass usage limits or billing
              controls.
            </li>
          </ul>
          <p className="mt-3">
            We may suspend or terminate your access immediately if we believe you have breached
            this section.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">8. Your content and licence</h2>
          <p className="mb-3">
            &ldquo;Your Content&rdquo; means anything you upload, input, or otherwise provide to
            the Service, including brand assets, business information, prompts, and instructions.
            You keep all rights in Your Content. You grant Spun a worldwide, non-exclusive,
            royalty-free licence to host, store, process, and use Your Content solely to operate
            and improve the Service for you.
          </p>
          <p>
            You are responsible for making sure Your Content does not infringe anyone&rsquo;s
            rights and that you have permission to use it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">9. AI-generated output</h2>
          <p>
            Subject to your compliance with these Terms and payment of applicable fees, as
            between you and Spun, you own the outputs generated for you through the Service
            (&ldquo;Output&rdquo;). You acknowledge that similar or identical outputs may be
            generated for other users and that we cannot guarantee exclusivity. Output is
            provided as-is and you are responsible for checking its accuracy, compliance with
            advertising standards, and suitability before use.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">10. Our intellectual property</h2>
          <p>
            The Service, including our software, models, design, branding, and documentation, is
            owned by Spun and protected by intellectual property laws. We grant you a limited,
            non-exclusive, non-transferable right to use the Service during your subscription and
            for its intended purpose. All rights not expressly granted are reserved.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">11. Suspension and termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time if you breach these
            Terms, fail to pay fees when due, or if we are required to do so by law. You may stop
            using the Service and cancel your subscription at any time. Sections of these Terms
            that by their nature should survive termination will continue to apply, including
            intellectual property, disclaimers, limitations of liability, and governing law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">12. Disclaimers</h2>
          <p>
            Except as expressly provided, the Service is provided &ldquo;as is&rdquo; and
            &ldquo;as available&rdquo; without warranties of any kind, whether express or implied,
            including warranties of merchantability, fitness for a particular purpose,
            non-infringement, accuracy, or uninterrupted availability. We do not warrant that the
            Service will be error-free, that AI outputs will be accurate or complete, or that
            campaigns launched through the Service will achieve any particular result.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">13. Limitation of liability</h2>
          <p className="mb-3">
            To the fullest extent permitted by law, Spun will not be liable for any indirect,
            incidental, special, consequential, or punitive damages, or for any loss of profits,
            revenue, data, goodwill, or business opportunities, arising out of or in connection
            with the Service.
          </p>
          <p>
            Our total aggregate liability to you for all claims arising out of or in connection
            with these Terms or the Service will not exceed the greater of (a) the fees you paid
            to Spun in the twelve months immediately before the event giving rise to the claim,
            or (b) &pound;100. Nothing in these Terms excludes or limits any liability that
            cannot be excluded or limited by law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">14. Indemnity</h2>
          <p>
            You agree to indemnify and hold Spun, its affiliates, and its personnel harmless from
            any claim, loss, damage, or expense (including reasonable legal fees) arising from
            your misuse of the Service, your breach of these Terms, or any content or campaign
            you publish through the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">15. Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material changes, we will
            give you reasonable notice by email or through the Service. Your continued use of the
            Service after the changes take effect constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">16. Governing law and disputes</h2>
          <p>
            These Terms are governed by the laws of England and Wales. You and Spun submit to the
            exclusive jurisdiction of the courts of England and Wales for any dispute arising out
            of or in connection with these Terms or the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">17. Contact</h2>
          <p>
            Questions about these Terms? Email us at{" "}
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
