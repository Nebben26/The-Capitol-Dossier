// LEGAL DISCLAIMER: This content was generated as a starting template.
// Ben should have it reviewed by a qualified attorney before launching to the public,
// especially the data processing, payment, and dispute resolution clauses.

import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Quiver Markets collects, uses, and protects your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your information."
      lastUpdated="April 11, 2026"
    >
      <p>
        Quiver Markets (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the website at
        quivermarkets.com (the &ldquo;Service&rdquo;). This Privacy Policy explains how we collect, use, store, and
        disclose information when you use the Service. By using Quiver Markets, you agree to the practices described in
        this policy.
      </p>

      <h2>1. Information We Collect</h2>

      <h3>1.1 Information You Provide</h3>
      <p>When you create an account, subscribe to a paid plan, or sign up for the Morning Brief newsletter, we collect:</p>
      <ul>
        <li>Email address</li>
        <li>Password (stored as a salted hash, never in plain text)</li>
        <li>Payment information (processed directly by Stripe &mdash; we do not store credit card numbers on our servers)</li>
        <li>Billing address (when required by Stripe for tax purposes)</li>
        <li>Communications you send to us (support emails, feedback)</li>
      </ul>

      <h3>1.2 Information Collected Automatically</h3>
      <p>When you use the Service, we automatically collect:</p>
      <ul>
        <li>Pages visited and features used (via PostHog product analytics)</li>
        <li>Approximate location based on IP address (city-level only, never precise GPS)</li>
        <li>Device type, browser type, and operating system</li>
        <li>Referring URL and search terms that brought you to the Service</li>
        <li>Session duration and interaction patterns</li>
        <li>Error reports if the Service crashes or encounters bugs (via Sentry)</li>
      </ul>

      <h3>1.3 Information We Do Not Collect</h3>
      <ul>
        <li>We do not collect your wallet addresses, trading positions, or transaction history from external prediction market platforms</li>
        <li>We do not collect your real name unless you choose to provide it in correspondence</li>
        <li>We do not collect Social Security numbers, government IDs, or bank account details</li>
        <li>We do not access your email account, contacts, or files</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the collected information to:</p>
      <ul>
        <li>Provide, maintain, and improve the Service</li>
        <li>Process subscription payments via Stripe</li>
        <li>Send you the Morning Brief newsletter (if you subscribe) and transactional emails (account confirmations, password resets, payment receipts)</li>
        <li>Respond to your support requests and feedback</li>
        <li>Detect and prevent fraud, abuse, and security incidents</li>
        <li>Understand which features users find valuable so we can build a better product</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h2>3. How We Share Your Information</h2>
      <p>We share information only in these limited circumstances:</p>
      <ul>
        <li><strong>Service providers:</strong> We share data with vendors who help us operate the Service, including Supabase (database), Stripe (payments), Resend (email delivery), Netlify (hosting), PostHog (analytics), and Sentry (error tracking). Each vendor is bound by their own privacy policy and processes your data only on our behalf.</li>
        <li><strong>Legal compliance:</strong> We may disclose information when required by law, subpoena, or court order, or when we believe disclosure is necessary to protect our rights or the safety of users.</li>
        <li><strong>Business transfers:</strong> If Quiver Markets is acquired, merged, or sold, your information may be transferred to the new owner, who will be bound by this policy.</li>
      </ul>
      <p>We do not sell, rent, or trade your personal information to third parties for their marketing purposes.</p>

      <h2>4. Cookies and Tracking</h2>
      <p>We use cookies and similar technologies for:</p>
      <ul>
        <li><strong>Essential cookies:</strong> Required for authentication, session management, and core functionality. These cannot be disabled.</li>
        <li><strong>Analytics cookies:</strong> PostHog uses cookies to track usage patterns. You can opt out by enabling Do Not Track in your browser or by contacting us.</li>
        <li><strong>Functional storage:</strong> We use localStorage to remember your preferences (recently viewed markets, followed whales, saved searches). This data stays in your browser and is not sent to our servers.</li>
      </ul>
      <p>For full details, see our <a href="/cookies">Cookie Notice</a>.</p>

      <h2>5. Data Retention</h2>
      <p>We retain your account information for as long as your account is active. If you delete your account, we delete your personal information within 30 days, except where retention is required by law (for example, financial records for tax purposes are kept for 7 years).</p>
      <p>Email subscribers can unsubscribe at any time using the unsubscribe link in any Morning Brief email. After unsubscribing, your email is retained in a suppression list to ensure we do not email you again.</p>

      <h2>6. Your Rights</h2>
      <p>Depending on your jurisdiction, you may have the right to:</p>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Correct inaccurate information</li>
        <li>Delete your account and associated data</li>
        <li>Export your data in a portable format</li>
        <li>Object to processing of your data for specific purposes</li>
        <li>Withdraw consent at any time</li>
      </ul>
      <p>
        To exercise these rights, email{" "}
        <a href="mailto:hello@quivermarkets.com">hello@quivermarkets.com</a> from the email address associated with
        your account. We will respond within 30 days.
      </p>

      <h2>7. Security</h2>
      <p>We take reasonable measures to protect your information, including encryption in transit (TLS), secure password hashing (bcrypt via Supabase Auth), and access controls limiting who can view user data. However, no system is perfectly secure. If we discover a breach affecting your data, we will notify you within 72 hours of discovery.</p>

      <h2>8. Children</h2>
      <p>Quiver Markets is not intended for users under 18. We do not knowingly collect information from children. If you believe we have collected information from a child, contact us and we will delete it immediately.</p>

      <h2>9. International Users</h2>
      <p>Quiver Markets is operated from the United States. If you access the Service from outside the US, your information will be transferred to and processed in the US. By using the Service, you consent to this transfer.</p>

      <h2>10. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. Material changes will be announced via email to active subscribers and via a banner on the Service. The &ldquo;Last updated&rdquo; date at the top of this page indicates when the policy was last revised.</p>

      <h2>11. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or how we handle your data, contact us at{" "}
        <a href="mailto:hello@quivermarkets.com">hello@quivermarkets.com</a>.
      </p>
    </LegalPageLayout>
  );
}
