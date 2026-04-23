import type { Metadata } from "next"
import Link from "next/link"
import LegalLayout from "@/components/LegalLayout"

export const metadata: Metadata = {
  title: "Data Processing Agreement",
  description:
    "The Data Processing Agreement between Spun App Ltd and its business customers, as required by UK GDPR and EU GDPR.",
  alternates: { canonical: "/dpa" },
}

export default function DpaPage() {
  return (
    <LegalLayout title="Data Processing Agreement" lastUpdated="10 April 2026">
      <div className="legal-note">
        This Data Processing Agreement (&ldquo;DPA&rdquo;) forms part of the agreement
        between <strong>Spun App Ltd</strong> (&ldquo;Processor&rdquo;) and the customer
        entity that has subscribed to Spun (&ldquo;Controller&rdquo; or
        &ldquo;Customer&rdquo;). It applies whenever Spun processes personal data on
        the Customer&rsquo;s behalf as part of providing the Service. If you need this
        DPA signed separately for your procurement process, email{" "}
        <a href="mailto:privacy@spun.bot">privacy@spun.bot</a>.
      </div>

      <h2>1. Definitions</h2>
      <p>
        &ldquo;<strong>Data Protection Laws</strong>&rdquo; means the UK GDPR, the Data
        Protection Act 2018, the EU General Data Protection Regulation (Regulation
        (EU) 2016/679), and any other applicable data protection or privacy laws.
      </p>
      <p>
        &ldquo;<strong>Personal Data</strong>&rdquo;, &ldquo;<strong>Controller</strong>&rdquo;,
        &ldquo;<strong>Processor</strong>&rdquo;, &ldquo;<strong>Data Subject</strong>&rdquo;,
        and &ldquo;<strong>Processing</strong>&rdquo; have the meanings given in the
        UK GDPR.
      </p>
      <p>
        &ldquo;<strong>Customer Personal Data</strong>&rdquo; means personal data that
        Spun processes on behalf of the Customer under the main agreement (including
        these Terms of Service).
      </p>
      <p>
        &ldquo;<strong>Sub-processor</strong>&rdquo; means any processor engaged by
        Spun to process Customer Personal Data.
      </p>

      <h2>2. Subject matter and details of processing</h2>
      <p>The details of processing carried out by Spun under this DPA are:</p>
      <ul>
        <li><strong>Subject matter</strong> — provision of the Spun AI growth platform.</li>
        <li><strong>Duration</strong> — the term of the main agreement, plus any period during which Spun retains Customer Personal Data as described in the Privacy Policy.</li>
        <li><strong>Nature and purpose</strong> — hosting, transmitting, and transforming customer content to generate marketing outputs, execute campaigns on connected platforms, and report on performance.</li>
        <li><strong>Types of personal data</strong> — contact details, account identifiers, authentication data, usage data, IP addresses, content submitted by users (prompts, briefs, uploaded assets), and campaign metadata. The Customer may choose to include additional categories in the content it submits.</li>
        <li><strong>Categories of Data Subject</strong> — the Customer&rsquo;s authorised users, employees, and, depending on the content submitted, the Customer&rsquo;s own customers, prospects, and contacts.</li>
      </ul>

      <h2>3. Obligations of Spun as Processor</h2>
      <p>Spun shall:</p>
      <ul>
        <li>Process Customer Personal Data only on the Customer&rsquo;s documented instructions, including those set out in the main agreement and this DPA, unless required to do otherwise by applicable law (in which case Spun shall notify the Customer before processing, unless that law prohibits notification);</li>
        <li>Ensure that personnel authorised to process Customer Personal Data are bound by confidentiality obligations;</li>
        <li>Implement appropriate technical and organisational measures as set out in Annex A;</li>
        <li>Assist the Customer in responding to requests from Data Subjects exercising their rights under Data Protection Laws, taking into account the nature of processing;</li>
        <li>Assist the Customer in ensuring compliance with its obligations under Articles 32 to 36 UK GDPR (security, breach notification, DPIAs, prior consultation);</li>
        <li>At the Customer&rsquo;s choice, delete or return all Customer Personal Data after the end of the provision of services, and delete existing copies unless retention is required by law;</li>
        <li>Make available to the Customer all information necessary to demonstrate compliance with the obligations in Article 28 UK GDPR, and allow for and contribute to audits conducted by the Customer or an auditor it mandates (see Section 8).</li>
      </ul>

      <h2>4. Sub-processors</h2>
      <p>
        The Customer provides a general authorisation for Spun to engage sub-processors
        to process Customer Personal Data, subject to the following:
      </p>
      <ul>
        <li>Spun maintains a current list of sub-processors at{" "}
          <Link href="/subprocessors">spun.bot/subprocessors</Link>;</li>
        <li>Spun shall impose data protection obligations on each sub-processor that are no less protective than those in this DPA;</li>
        <li>Spun shall give the Customer at least <strong>14 days&rsquo; notice</strong> before appointing a new sub-processor by updating the sub-processor page and, where the Customer has subscribed to updates, by email. The Customer may object on reasonable data protection grounds within that period, and the parties shall work together in good faith to resolve the objection; if it cannot be resolved, the Customer may terminate the affected portion of the service;</li>
        <li>Spun remains fully liable for the acts and omissions of its sub-processors.</li>
      </ul>

      <h2>5. International transfers</h2>
      <p>
        Where Spun (or a sub-processor) transfers Customer Personal Data outside the
        UK or the EEA, such transfers shall be subject to appropriate safeguards in
        accordance with Data Protection Laws, including the UK International Data
        Transfer Addendum (IDTA), the EU Standard Contractual Clauses (Module 3 or
        Module 4 as applicable), or another lawful transfer mechanism. By accepting
        this DPA, the Customer authorises Spun to enter into such transfer mechanisms
        on its behalf with its sub-processors.
      </p>

      <h2>6. Security</h2>
      <p>
        Spun implements and maintains appropriate technical and organisational
        measures to protect Customer Personal Data against accidental or unlawful
        destruction, loss, alteration, unauthorised disclosure, or access. Current
        measures are described in Annex A.
      </p>

      <h2>7. Personal data breaches</h2>
      <p>
        Spun shall notify the Customer without undue delay and in any event within{" "}
        <strong>72 hours</strong> after becoming aware of a personal data breach
        affecting Customer Personal Data. The notification will include the information
        required under Article 33(3) UK GDPR to the extent known. Spun will cooperate
        with the Customer and take reasonable steps to mitigate and remediate the
        breach.
      </p>

      <h2>8. Audits</h2>
      <p>
        Spun shall make available to the Customer, on written request, information
        reasonably necessary to demonstrate compliance with this DPA, including
        summaries of independent audits where available. Where a Customer reasonably
        requires additional audit activity, the parties shall agree the scope, timing,
        and costs in advance. Audits shall be conducted during business hours, with at
        least 30 days&rsquo; notice, subject to confidentiality, and shall not
        unreasonably interfere with Spun&rsquo;s operations.
      </p>

      <h2>9. Data subject requests</h2>
      <p>
        Spun shall, taking into account the nature of processing, assist the Customer
        by appropriate technical and organisational measures, insofar as possible, in
        fulfilling its obligation to respond to Data Subject requests. Where a request
        is sent directly to Spun, Spun shall promptly forward it to the Customer and
        shall not respond directly unless required to do so by law.
      </p>

      <h2>10. Return and deletion</h2>
      <p>
        On termination or expiry of the main agreement, Spun shall, at the
        Customer&rsquo;s choice, delete or return all Customer Personal Data within 30
        days, and delete existing copies unless UK or EU law requires further storage.
      </p>

      <h2>11. Liability</h2>
      <p>
        Each party&rsquo;s liability under or in connection with this DPA is subject
        to the exclusions and limitations of liability set out in the main agreement.
      </p>

      <h2>12. Conflict</h2>
      <p>
        In the event of any conflict between this DPA and the main agreement, this
        DPA prevails with regard to the processing of Customer Personal Data.
      </p>

      <hr />

      <h2>Annex A — Technical and organisational measures</h2>
      <p>Spun implements the following measures, reviewed on an ongoing basis:</p>
      <ul>
        <li><strong>Encryption</strong> — TLS 1.2+ in transit; encryption at rest for databases and backups.</li>
        <li><strong>Access control</strong> — role-based access, least-privilege principles, multi-factor authentication for administrative access, and audit logging.</li>
        <li><strong>Authentication</strong> — customer authentication handled by Clerk, including support for SSO and MFA.</li>
        <li><strong>Network security</strong> — managed cloud infrastructure, DDoS protection, and web application firewall at the edge.</li>
        <li><strong>Secure development</strong> — code review, dependency scanning, and secret scanning in the CI/CD pipeline.</li>
        <li><strong>Backups</strong> — regular encrypted backups with defined retention and recovery testing.</li>
        <li><strong>Incident response</strong> — documented process with defined roles and notification timelines.</li>
        <li><strong>Personnel</strong> — confidentiality obligations, data-protection training, and background-appropriate access controls.</li>
        <li><strong>Vendor management</strong> — due diligence on sub-processors and contractual data-protection obligations no less protective than this DPA.</li>
      </ul>

      <h2>Annex B — Sub-processors</h2>
      <p>
        The current list of sub-processors is published at{" "}
        <Link href="/subprocessors">spun.bot/subprocessors</Link> and is incorporated
        into this DPA by reference.
      </p>
    </LegalLayout>
  )
}
