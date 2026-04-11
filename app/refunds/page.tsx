// LEGAL DISCLAIMER: This content was generated as a starting template.
// Ben should have it reviewed by a qualified attorney before launching to the public,
// especially the data processing, payment, and dispute resolution clauses.

import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Quiver Markets refund and cancellation policy.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Refund Policy"
      subtitle="We believe in fair, transparent refund terms."
      lastUpdated="April 11, 2026"
    >
      <p>
        We want you to be satisfied with Quiver Markets. If you&rsquo;re not, here&rsquo;s exactly what we do and
        don&rsquo;t refund and how to request one.
      </p>

      <h2>1. 14-Day Money-Back Guarantee</h2>
      <p>
        If you subscribe to Quiver Markets Pro or Trader and decide it&rsquo;s not for you within 14 days of your
        initial purchase, we&rsquo;ll refund 100% of your payment with no questions asked. To request a refund, email{" "}
        <a href="mailto:hello@quivermarkets.com">hello@quivermarkets.com</a> from the email address associated with
        your account. We process refunds within 5 business days.
      </p>
      <p>
        The 14-day refund window applies to your initial purchase only. Renewals (monthly or annual) are not eligible
        for the money-back guarantee.
      </p>

      <h2>2. Annual Subscriptions</h2>
      <p>
        If you purchase an annual subscription and request a refund within 14 days, you receive a full refund. Between
        15 and 30 days from initial purchase, you receive a pro-rated refund based on the number of days remaining in
        your annual term. After 30 days from the initial purchase date, annual subscriptions are non-refundable for
        the remainder of the annual period.
      </p>
      <p>
        You can cancel auto-renewal at any time from your account settings to prevent the next year&rsquo;s charge.
        Cancellation does not refund the current annual period.
      </p>

      <h2>3. Renewal Charges</h2>
      <p>
        Monthly and annual subscription renewals are not eligible for refunds. If you did not intend to renew, you
        should cancel your subscription before the renewal date. We send a renewal reminder email at least 7 days
        before each annual renewal.
      </p>
      <p>
        If you were charged for a renewal and did not receive the 7-day notice email, contact us and we will evaluate
        your situation on a case-by-case basis.
      </p>

      <h2>4. How to Cancel</h2>
      <p>To cancel your subscription:</p>
      <ol>
        <li>Go to <a href="/settings">Account Settings</a></li>
        <li>Click &ldquo;Manage Billing&rdquo; to open the Stripe billing portal</li>
        <li>Select &ldquo;Cancel subscription&rdquo;</li>
      </ol>
      <p>
        Alternatively, email <a href="mailto:hello@quivermarkets.com">hello@quivermarkets.com</a> and we will cancel
        on your behalf. Cancellation stops auto-renewal but does not refund the current billing period. You retain
        access to your plan until the period ends.
      </p>

      <h2>5. Failed Payments</h2>
      <p>
        If a renewal payment fails, Stripe will automatically retry the charge 3 times over 7 days. During this
        period, your account remains active. If all retries fail, your subscription is automatically downgraded to the
        free tier and you will be notified by email. To reactivate, simply update your payment method and resubscribe.
      </p>

      <h2>6. Promotional and Discounted Pricing</h2>
      <p>
        Subscriptions purchased at promotional or discounted rates are subject to the same refund policy as regular
        subscriptions. If you received a discount code, the refund amount is the discounted price you paid, not the
        standard price.
      </p>

      <h2>7. Disputed Charges</h2>
      <p>
        Before disputing a charge with your bank or credit card company, please contact us first at{" "}
        <a href="mailto:hello@quivermarkets.com">hello@quivermarkets.com</a>. We can almost always resolve billing
        issues faster than a bank dispute, and chargebacks impose additional costs on small businesses. We&rsquo;re
        easy to reach and will work with you.
      </p>

      <h2>8. How to Request a Refund</h2>
      <p>
        Email <a href="mailto:hello@quivermarkets.com">hello@quivermarkets.com</a> with:
      </p>
      <ul>
        <li>The email address on your Quiver Markets account</li>
        <li>The date of the charge</li>
        <li>A brief reason (optional but helpful so we can improve)</li>
      </ul>
      <p>We will confirm receipt and process eligible refunds within 5 business days. Stripe typically posts refunds to your card within 5&ndash;10 business days of processing.</p>
    </LegalPageLayout>
  );
}
