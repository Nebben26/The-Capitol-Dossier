// LEGAL DISCLAIMER: This content was generated as a starting template.
// Ben should have it reviewed by a qualified attorney before launching to the public,
// especially the data processing, payment, and dispute resolution clauses.

import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using Quiver Markets.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="Please read these terms carefully before using Quiver Markets."
      lastUpdated="April 11, 2026"
    >
      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using Quiver Markets (&ldquo;the Service&rdquo;) at quivermarkets.com, you agree to be bound
        by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to all of these Terms, do not use the
        Service. These Terms constitute a legally binding agreement between you and Quiver Markets.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        Quiver Markets is an analytics and intelligence platform that aggregates publicly available data from
        prediction market platforms including Polymarket and Kalshi. We provide tools for analyzing cross-platform
        price spreads, tracking market participants, monitoring price movements, and understanding market dynamics.
      </p>
      <p>
        Quiver Markets does not operate a prediction market, accept bets or wagers, hold user funds, or execute trades
        on your behalf. We are an information and analytics service only.
      </p>

      <h2>3. Account Registration</h2>
      <p>
        Some features require creating an account. To register, you must be at least 18 years old and legally capable
        of entering into binding contracts in your jurisdiction. You agree to:
      </p>
      <ul>
        <li>Provide accurate, current, and complete information during registration</li>
        <li>Keep your account credentials confidential and not share them with others</li>
        <li>Notify us immediately of any unauthorized access to your account</li>
        <li>Be responsible for all activity that occurs under your account</li>
      </ul>
      <p>
        We reserve the right to refuse registration or terminate accounts at our discretion, including for violation of
        these Terms.
      </p>

      <h2>4. Subscription Terms</h2>
      <p>
        Quiver Markets offers free and paid subscription tiers. Paid subscriptions are billed in advance on a monthly
        or annual cycle, depending on the plan you select. Key terms:
      </p>
      <ul>
        <li><strong>Automatic renewal:</strong> Paid subscriptions automatically renew at the end of each billing period unless you cancel before the renewal date.</li>
        <li><strong>Price changes:</strong> We may change subscription prices with 30 days&rsquo; notice. Your continued use of the Service after a price change constitutes acceptance of the new price.</li>
        <li><strong>Cancellation:</strong> You may cancel at any time from your account settings at <a href="/settings">/settings</a>. Cancellation stops future billing but does not refund the current period.</li>
        <li><strong>Payment processing:</strong> All payments are processed by Stripe. By subscribing, you agree to Stripe&rsquo;s Terms of Service.</li>
      </ul>

      <h2>5. Refund Policy</h2>
      <p>
        We offer a 14-day money-back guarantee on initial purchases of paid plans. For full details, see our{" "}
        <a href="/refunds">Refund Policy</a>.
      </p>

      <h2>6. Acceptable Use</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>Violate any applicable law, regulation, or third-party rights</li>
        <li>Scrape, crawl, or systematically download data from the Service beyond what the API tier permits</li>
        <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
        <li>Attempt to gain unauthorized access to the Service, its servers, or any connected systems</li>
        <li>Transmit malware, spam, or other harmful code</li>
        <li>Misrepresent your identity or affiliation with any person or entity</li>
        <li>Use the Service in any manner that could damage, overload, or impair its operation</li>
        <li>Share API keys or account access with unauthorized parties</li>
      </ul>

      <h2>7. Intellectual Property</h2>
      <p>
        The Service, including its design, software, text, graphics, logos, and proprietary analytics (opportunity
        scores, whale accuracy metrics, market categorization, and similar computed data), is owned by Quiver Markets
        and protected by copyright and other intellectual property laws.
      </p>
      <p>
        Raw market data sourced from Polymarket and Kalshi through their public APIs remains subject to their
        respective terms of service. We make no claim of ownership over that underlying data.
      </p>

      <h2>8. User Content</h2>
      <p>
        If you submit feedback, bug reports, feature requests, or other communications to us, you grant Quiver Markets
        a non-exclusive, royalty-free, perpetual license to use that feedback to improve the Service. We will not
        attribute public statements to you without your permission.
      </p>

      <h2>9. Third-Party Services and Data</h2>
      <p>
        The Service integrates data from third-party platforms (Polymarket, Kalshi) and uses third-party service
        providers (Stripe, Supabase, Resend, PostHog, Sentry). These third parties operate under their own terms and
        privacy policies, which we encourage you to review.
      </p>
      <p>
        Data sourced from third-party APIs may be delayed, incomplete, or inaccurate. Quiver Markets does not warrant
        the accuracy of data sourced from external platforms. For real-time pricing, always check the source platform
        directly before trading.
      </p>

      <h2>10. Disclaimer of Warranties</h2>
      <p>
        THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND,
        EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, QUIVER MARKETS EXPRESSLY DISCLAIMS ALL WARRANTIES
        OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ACCURACY. WE DO NOT WARRANT THAT
        THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS, OR THAT ANY DATA WILL BE
        ACCURATE, COMPLETE, OR TIMELY.
      </p>

      <h2>11. Not Financial Advice</h2>
      <p>
        <strong>Quiver Markets is not a registered investment advisor, broker-dealer, or financial planner.</strong>{" "}
        The information provided on the Service is for informational and educational purposes only. It does not
        constitute financial advice, investment advice, trading advice, or any other sort of advice.
      </p>
      <p>
        Prediction markets carry risk of total loss. Spreads, opportunity scores, whale positions, and historical
        accuracy data displayed on the Service are computed from public market data and are not predictions of future
        performance. You should consult with a qualified financial advisor before making any financial decision based
        on information you find on the Service.
      </p>
      <p>
        You acknowledge that all trading decisions you make are your own. Quiver Markets is not liable for any losses
        you incur as a result of using the Service.
      </p>

      <h2>12. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, Quiver Markets and its operators shall not be liable for any indirect,
        incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data,
        or use, arising from your use of the Service.
      </p>
      <p>
        Our total liability to you for any claim arising from the Service shall not exceed the greater of (a) the
        total amount you paid to Quiver Markets in the 12 months preceding the claim, or (b) one hundred US dollars
        ($100).
      </p>

      <h2>13. Indemnification</h2>
      <p>
        You agree to indemnify, defend, and hold harmless Quiver Markets and its operators from any claims, damages,
        liabilities, costs, and expenses (including reasonable attorneys&rsquo; fees) arising from: (a) your use of
        the Service; (b) your violation of these Terms; (c) your violation of any third-party rights; or (d) any
        content you submit to the Service.
      </p>

      <h2>14. Termination</h2>
      <p>
        We may suspend or terminate your access to the Service at any time, with or without notice, for any reason
        including violation of these Terms, non-payment, or extended inactivity. Upon termination, your right to use
        the Service ceases immediately. Provisions of these Terms that by their nature should survive termination will
        survive, including ownership provisions, disclaimers, and limitations of liability.
      </p>

      <h2>15. Dispute Resolution and Governing Law</h2>
      <p>
        These Terms are governed by the laws of the State of Missouri, United States, without regard to its conflict
        of law provisions. Any dispute arising from these Terms or the Service shall be resolved in the state or
        federal courts located in Polk County, Missouri, and you consent to the jurisdiction of those courts.
      </p>
      <p>
        You and Quiver Markets agree to attempt to resolve any dispute informally before initiating legal action.
        Contact us at <a href="mailto:hello@quivermarkets.com">hello@quivermarkets.com</a> to begin the informal
        resolution process. If informal resolution fails after 30 days, either party may pursue formal legal remedies.
      </p>

      <h2>16. Changes to Terms</h2>
      <p>
        We may modify these Terms at any time. For material changes, we will provide notice by email (to active
        subscribers) and by posting an updated version on this page. Your continued use of the Service after changes
        constitutes acceptance of the revised Terms. If you do not agree with changes to the Terms, you must stop
        using the Service.
      </p>

      <h2>17. Contact</h2>
      <p>
        If you have questions about these Terms, contact us at{" "}
        <a href="mailto:hello@quivermarkets.com">hello@quivermarkets.com</a>.
      </p>
    </LegalPageLayout>
  );
}
