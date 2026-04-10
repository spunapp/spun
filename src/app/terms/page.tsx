import type { Metadata } from "next"
import Link from "next/link"
import LegalLayout from "@/components/LegalLayout"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms and conditions that govern your use of Spun.",
  alternates: { canonical: "/terms" },
}

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="10 April 2026">
      <div className="legal-note">
        These Terms of Service (&ldquo;Terms&rdquo;) form a legally binding agreement
        between you and <strong>Spun App Ltd</strong>. By creating an account or using
        the Spun service, you agree to these Terms. If you are accepting on behalf of
        a company, you confirm you have authority to bind that company.
      </div>

      <h2>1. Who we are</h2>
      <p>
        The Spun service is operated by <strong>Spun App Ltd</strong>, a company
        registered in England and Wales with its registered office at 53 Langley
        Crescent, Brighton, BN2 6NL, United Kingdom.
      </p>

      <h2>2. The service</h2>
      <p>
        Spun is an AI-powered marketing platform that helps you plan, create, launch,
        and analyse marketing campaigns through a chat interface. Features include
        strategy and campaign generation, ad copy, image generation, ad platform
        integrations, and performance reporting.
      </p>
      <p>
        We may add, change, or remove features over time. We will give reasonable
        notice for material changes that materially reduce functionality you have
        paid for.
      </p>

      <h2>3. Your account</h2>
      <ul>
        <li>You must be at least 18 years old and able to enter into a binding contract.</li>
        <li>You must provide accurate account information and keep it up to date.</li>
        <li>You are responsible for all activity under your account and for keeping your credentials secure.</li>
        <li>Notify us immediately at <a href="mailto:security@spun.bot">security@spun.bot</a> if you suspect unauthorised access.</li>
      </ul>

      <h2>4. Subscriptions, free trial, and billing</h2>
      <p>
        Spun is offered on a subscription basis. Current plans and prices are shown
        on our <Link href="/pricing">pricing page</Link>.
      </p>
      <ul>
        <li><strong>Free trial</strong> — new accounts include a 14-day free trial. You can cancel before the trial ends at no charge.</li>
        <li><strong>Billing</strong> — subscriptions renew automatically each month or year, charged to your payment method via Stripe, until you cancel.</li>
        <li><strong>Taxes</strong> — prices exclude VAT and other applicable taxes, which will be added at checkout.</li>
        <li><strong>Price changes</strong> — we may change prices with at least 30 days&rsquo; notice. Changes take effect at the start of your next billing cycle.</li>
        <li><strong>Cancellation</strong> — you can cancel at any time from your account settings. Cancellation takes effect at the end of the current billing period. We do not provide refunds for partial periods unless required by law.</li>
        <li><strong>Failed payments</strong> — if payment fails, we may suspend access until the balance is settled.</li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You agree not to use Spun to:</p>
      <ul>
        <li>Break any law or regulation, including advertising standards and consumer protection rules;</li>
        <li>Infringe anyone&rsquo;s intellectual property, privacy, or publicity rights;</li>
        <li>Generate or distribute content that is defamatory, harassing, hateful, sexually explicit involving minors, or incites violence;</li>
        <li>Generate malware, phishing, spam, or content designed to deceive;</li>
        <li>Reverse-engineer, scrape, or attempt to extract the underlying models or training data;</li>
        <li>Circumvent rate limits, usage caps, or security controls;</li>
        <li>Use Spun to build a competing product;</li>
        <li>Resell the service without our written permission.</li>
      </ul>
      <p>
        We may suspend or terminate accounts that violate these rules, and in serious
        cases may report illegal activity to the authorities.
      </p>

      <h2>6. Your content and AI-generated output</h2>
      <p>
        <strong>Your content.</strong> You retain all rights in the content you submit
        to Spun (prompts, uploads, brand assets, briefs). You grant Spun a worldwide,
        non-exclusive, royalty-free licence to host, process, and transmit your content
        solely to provide and improve the service.
      </p>
      <p>
        <strong>Generated output.</strong> Subject to your compliance with these Terms,
        you own the outputs Spun generates for you (campaigns, copy, images). Because
        AI systems can produce similar output for different users, we cannot guarantee
        exclusivity, and you are responsible for checking that output does not infringe
        third-party rights before you publish or run it.
      </p>
      <p>
        <strong>No model training on your content.</strong> We do not use your prompts,
        uploads, or generated outputs to train the underlying AI models.
      </p>

      <h2>7. Connected platforms</h2>
      <p>
        Spun can connect to third-party platforms (such as Meta, Google Ads, TikTok
        Ads, and Klaviyo) on your authorisation. When you connect an account and
        instruct Spun to run campaigns, you authorise Spun to act on your behalf within
        the scope you grant via OAuth. You are responsible for complying with each
        platform&rsquo;s own terms and policies, and for any costs or ad spend incurred.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        Spun and all associated software, branding, and content (excluding your content
        and generated outputs) are owned by Spun App Ltd or our licensors and are
        protected by intellectual property laws. These Terms do not grant you any right
        to use our trademarks or branding.
      </p>

      <h2>9. Service availability</h2>
      <p>
        We work hard to keep Spun available but do not guarantee uninterrupted service.
        We may need to perform maintenance, deploy updates, or address incidents that
        temporarily affect availability. Upstream providers (AI model APIs, ad platforms)
        may also experience outages outside our control.
      </p>

      <h2>10. Disclaimers</h2>
      <p>
        To the maximum extent permitted by law, Spun is provided &ldquo;as is&rdquo;
        and &ldquo;as available&rdquo; without warranties of any kind, whether express
        or implied, including merchantability, fitness for a particular purpose, and
        non-infringement. Spun does not warrant that AI-generated output will be accurate,
        factual, lawful in your jurisdiction, or suitable for your purposes. You are
        responsible for reviewing output before relying on or publishing it.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        Nothing in these Terms excludes or limits liability that cannot be excluded or
        limited by law (including liability for death or personal injury caused by
        negligence, fraud, or fraudulent misrepresentation).
      </p>
      <p>
        Subject to the above, to the maximum extent permitted by law:
      </p>
      <ul>
        <li>Spun will not be liable for any indirect, incidental, consequential, special, or punitive damages, or for loss of profits, revenue, data, goodwill, or business opportunity;</li>
        <li>Spun&rsquo;s total aggregate liability in any 12-month period will not exceed the fees you paid to Spun in the 12 months preceding the claim.</li>
      </ul>

      <h2>12. Indemnity</h2>
      <p>
        You agree to indemnify and hold Spun harmless from any claim, loss, or expense
        (including reasonable legal fees) arising from your breach of these Terms, your
        content, or your misuse of the service.
      </p>

      <h2>13. Termination</h2>
      <p>
        You may stop using Spun and cancel your subscription at any time. We may
        suspend or terminate your account immediately if you materially breach these
        Terms, if continued provision would expose us to legal risk, or if required by
        law. On termination, your access ends and your data will be handled as
        described in our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>14. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be notified
        by email or in-app notice at least 30 days before taking effect. Continued use
        after the effective date constitutes acceptance of the new Terms.
      </p>

      <h2>15. Governing law and jurisdiction</h2>
      <p>
        These Terms are governed by the laws of England and Wales. The courts of
        England and Wales will have exclusive jurisdiction to hear any dispute,
        except that if you are a consumer resident in another part of the UK or the
        EEA, you may also bring proceedings in your local courts.
      </p>

      <h2>16. Contact</h2>
      <p>
        Questions? Email <a href="mailto:hello@spun.bot">hello@spun.bot</a>, or write to:
      </p>
      <p>
        Spun App Ltd<br />
        53 Langley Crescent<br />
        Brighton, BN2 6NL<br />
        United Kingdom
      </p>
    </LegalLayout>
  )
}
