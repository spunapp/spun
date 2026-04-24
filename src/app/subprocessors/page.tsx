import type { Metadata } from "next"
import Link from "next/link"
import LegalLayout from "@/components/LegalLayout"

export const metadata: Metadata = {
  title: "Sub-processors",
  description: "The list of third-party sub-processors Spun uses to deliver its service.",
  alternates: { canonical: "/subprocessors" },
}

type Row = {
  name: string
  entity: string
  purpose: string
  data: string
  location: string
  transfer: string
}

const SUBPROCESSORS: Row[] = [
  {
    name: "Convex",
    entity: "Convex, Inc.",
    purpose: "Application database, backend functions, file storage",
    data: "Account data, chat history, content submitted, usage data",
    location: "United States",
    transfer: "UK IDTA / EU SCCs",
  },
  {
    name: "Clerk",
    entity: "Clerk, Inc.",
    purpose: "User authentication, session management, SSO",
    data: "Name, email, password hash, profile image, session tokens, IP address",
    location: "United States",
    transfer: "UK IDTA / EU SCCs",
  },
  {
    name: "Vercel",
    entity: "Vercel Inc.",
    purpose: "Application hosting, edge network, serverless compute",
    data: "Request logs, IP address, and any data in transit",
    location: "United States (global edge network)",
    transfer: "UK IDTA / EU SCCs",
  },
  {
    name: "Stripe",
    entity: "Stripe Payments Europe, Ltd.",
    purpose: "Payment processing, subscription billing, invoicing",
    data: "Billing name and address, payment card details, email, VAT number, transaction history",
    location: "Ireland (EU); with onward transfer to Stripe, Inc. (US)",
    transfer: "Adequacy / EU SCCs",
  },
  {
    name: "OpenRouter",
    entity: "OpenRouter, Inc.",
    purpose: "AI model gateway used to generate chat responses, campaign plans, and ad copy",
    data: "Prompts and content the user submits to the chat; generated output",
    location: "United States",
    transfer: "UK IDTA / EU SCCs",
  },
  {
    name: "Google AI (Gemini / Imagen 4)",
    entity: "Google LLC",
    purpose: "AI image generation (Imagen 4) and text generation for ad creatives",
    data: "Image generation prompts and any reference imagery submitted",
    location: "United States (global infrastructure)",
    transfer: "UK IDTA / EU SCCs",
  },
  {
    name: "Pipedream Connect",
    entity: "Pipedream, Inc.",
    purpose:
      "OAuth token broker for advertising platform integrations (Meta, Google Ads)",
    data: "OAuth tokens and account identifiers for the ad platforms the customer connects",
    location: "United States",
    transfer: "UK IDTA / EU SCCs",
  },
  {
    name: "Google Analytics 4",
    entity: "Google LLC (via Google Ireland Ltd. for UK/EEA users)",
    purpose: "Website analytics to measure traffic and product usage",
    data: "IP address (truncated), device and browser data, page views, pseudonymous identifiers",
    location: "Ireland / United States",
    transfer: "EU SCCs (loaded only after user consent)",
  },
]

export default function SubprocessorsPage() {
  return (
    <LegalLayout title="Sub-processors" lastUpdated="24 April 2026">
      <div className="legal-note">
        This page lists the third-party <strong>sub-processors</strong> that{" "}
        <strong>Spun App Ltd</strong> engages to deliver the Spun service. It forms
        part of our <Link href="/dpa">Data Processing Agreement</Link>. We update this
        list whenever we add, remove, or change a sub-processor, and we give at least
        14 days&rsquo; notice of new additions.
      </div>

      <h2>Current sub-processors</h2>

      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Legal entity</th>
            <th>Purpose</th>
            <th>Data processed</th>
            <th>Location</th>
            <th>Transfer mechanism</th>
          </tr>
        </thead>
        <tbody>
          {SUBPROCESSORS.map((row) => (
            <tr key={row.name}>
              <td><strong>{row.name}</strong></td>
              <td>{row.entity}</td>
              <td>{row.purpose}</td>
              <td>{row.data}</td>
              <td>{row.location}</td>
              <td>{row.transfer}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>A note on advertising platforms</h2>
      <p>
        When you connect an advertising platform (e.g. Meta, Google Ads) and
        instruct Spun to launch campaigns, Spun transmits campaign data
        to that platform <em>on your behalf and at your direction</em>. Those platforms
        act as independent data controllers for the data you push to them — they are
        not sub-processors of Spun in the strict sense, but are disclosed here for
        transparency. You should review each platform&rsquo;s own privacy and data
        processing terms.
      </p>

      <h2>Notification of changes</h2>
      <p>
        Customers who wish to receive email notifications of sub-processor changes can
        subscribe by emailing{" "}
        <a href="mailto:privacy@spun.bot">privacy@spun.bot</a> with the subject
        &ldquo;Sub-processor updates&rdquo;.
      </p>

      <h2>Objections</h2>
      <p>
        If you have a reasonable data protection concern about a new sub-processor,
        email <a href="mailto:privacy@spun.bot">privacy@spun.bot</a> within the
        14-day notice period. We will work with you in good faith to resolve the
        concern as described in our{" "}
        <Link href="/dpa">Data Processing Agreement</Link>.
      </p>
    </LegalLayout>
  )
}
