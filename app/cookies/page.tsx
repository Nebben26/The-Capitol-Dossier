// LEGAL DISCLAIMER: This content was generated as a starting template.
// Ben should have it reviewed by a qualified attorney before launching to the public,
// especially the data processing, payment, and dispute resolution clauses.

import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Notice",
  description: "How Quiver Markets uses cookies and similar technologies.",
};

export default function CookieNoticePage() {
  return (
    <LegalPageLayout
      title="Cookie Notice"
      subtitle="What we store in your browser and why."
      lastUpdated="April 11, 2026"
    >
      <p>
        This Cookie Notice explains how Quiver Markets uses cookies and similar technologies when you visit
        quivermarkets.com. We keep our cookie usage minimal and purposeful.
      </p>

      <h2>1. What Cookies Are</h2>
      <p>
        Cookies are small text files stored in your browser by websites you visit. They allow sites to remember
        information about your visit — like whether you&rsquo;re logged in, your preferences, or how you interact
        with the site. Cookies can be &ldquo;session cookies&rdquo; (deleted when you close your browser) or
        &ldquo;persistent cookies&rdquo; (stored until they expire or you delete them).
      </p>
      <p>
        We also use localStorage and sessionStorage — browser storage mechanisms similar to cookies but stored
        locally and never sent to our servers.
      </p>

      <h2>2. How We Use Cookies</h2>

      <h3>Essential Cookies</h3>
      <p>
        These are required for the Service to function. You cannot opt out of them without losing core
        functionality.
      </p>
      <ul>
        <li><strong>Authentication cookies</strong> (set by Supabase): Keep you logged in across page loads. These are session cookies that expire when you close your browser or after your session timeout.</li>
        <li><strong>CSRF protection tokens</strong>: Prevent cross-site request forgery attacks. Short-lived session cookies.</li>
      </ul>

      <h3>Analytics Cookies</h3>
      <p>
        We use PostHog to understand how users interact with the Service so we can improve it. PostHog sets
        cookies to identify returning visitors (anonymously) and track which pages and features are used.
      </p>
      <ul>
        <li><strong>ph_*</strong> cookies (set by PostHog): Identify an anonymous user session. Persistent, 1-year expiry. No personally identifiable information is stored in these cookies.</li>
      </ul>
      <p>
        You can opt out of PostHog analytics by enabling the &ldquo;Do Not Track&rdquo; setting in your browser.
      </p>

      <h3>Functional Storage (localStorage)</h3>
      <p>
        We store the following in your browser&rsquo;s localStorage. This data never leaves your device.
      </p>
      <ul>
        <li><strong>Recently viewed markets</strong>: The last 10 markets you visited, for quick access.</li>
        <li><strong>Followed whales</strong>: Your watchlist of whale wallets.</li>
        <li><strong>Saved searches</strong>: Filters you&rsquo;ve saved on the screener page.</li>
        <li><strong>UI preferences</strong>: View mode (grid vs. table), sort settings, collapsed sidebar state.</li>
        <li><strong>Disclaimer dismissal</strong> (sessionStorage): Whether you&rsquo;ve dismissed the &ldquo;not financial advice&rdquo; banner this session.</li>
      </ul>

      <h2>3. Third-Party Cookies</h2>
      <p>These third parties may set cookies when you interact with their services on our site:</p>
      <ul>
        <li><strong>Stripe</strong>: Sets cookies when you interact with the payment flow (checkout, billing portal). These cookies are subject to Stripe&rsquo;s Cookie Policy.</li>
        <li><strong>PostHog</strong>: As described above under analytics cookies.</li>
        <li><strong>Sentry</strong>: May set a session identifier to correlate error reports with sessions. No personal data is included.</li>
      </ul>

      <h2>4. How to Manage Cookies</h2>
      <p>You can control cookies in several ways:</p>
      <ul>
        <li><strong>Browser settings</strong>: All modern browsers allow you to view, delete, and block cookies. Blocking essential cookies will prevent you from logging in.</li>
        <li><strong>Do Not Track</strong>: Enabling this signal in your browser will cause PostHog to stop tracking your sessions.</li>
        <li><strong>Clearing localStorage</strong>: In your browser&rsquo;s developer tools, you can clear localStorage at any time. This will reset your preferences and watchlist.</li>
        <li><strong>Private/Incognito mode</strong>: Session cookies and localStorage are automatically cleared when you close a private browsing window.</li>
      </ul>

      <h2>5. Changes to This Notice</h2>
      <p>
        We may update this Cookie Notice as we add or change features. The &ldquo;Last updated&rdquo; date at the
        top of this page reflects the most recent revision. For questions, contact{" "}
        <a href="mailto:hello@quivermarkets.com">hello@quivermarkets.com</a>.
      </p>
    </LegalPageLayout>
  );
}
