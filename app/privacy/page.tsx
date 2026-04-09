"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold text-[#e2e8f0]">{title}</h2>
      <div className="text-sm text-[#8892b0] leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[#8892b0] hover:text-[#57D7BA] transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to Dashboard
      </Link>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#e2e8f0]">Privacy Policy</h1>
        <p className="text-sm text-[#4a5168]">Last updated: April 8, 2026</p>
      </div>

      <Section title="1. Who we are">
        <p>
          Quiver Markets (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is an intelligence platform for
          prediction markets, aggregating publicly available data from Polymarket, Kalshi, and related sources. You
          can contact us at{" "}
          <a href="mailto:hello@quivermarkets.com" className="text-[#57D7BA] hover:underline">
            hello@quivermarkets.com
          </a>
          .
        </p>
      </Section>

      <Section title="2. What we collect">
        <p>We collect the minimum information necessary to operate the service:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Anonymous, aggregated page-view analytics via Cloudflare Web Analytics (no cookies, no IP storage)</li>
          <li>Anonymous JavaScript error reports via Sentry (no personally identifiable information)</li>
          <li>Email addresses voluntarily submitted to our waitlist or contact forms</li>
          <li>Account credentials if you create an account (email and hashed password only)</li>
        </ul>
        <p>
          We do not currently process payments. When paid tiers launch, all payment processing will be handled by
          Stripe under their privacy policy, and we will not store credit card information directly.
        </p>
      </Section>

      <Section title="3. How we use your information">
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>To provide and improve the Quiver Markets service</li>
          <li>To respond to inquiries and support requests</li>
          <li>To send product updates to users who have opted in</li>
          <li>To detect and prevent fraud, abuse, and security incidents</li>
          <li>To comply with legal obligations</li>
        </ul>
      </Section>

      <Section title="4. Cookies and tracking">
        <p>
          Quiver Markets does not set tracking cookies. Our analytics provider (Cloudflare Web Analytics) is
          privacy-first and does not use cookies or fingerprinting. We do not participate in cross-site tracking,
          retargeting, or advertising networks.
        </p>
      </Section>

      <Section title="5. Data sharing">
        <p>
          We do not sell, rent, or trade your personal information. We share data only with service providers
          strictly necessary to operate the service: Supabase (database hosting), Netlify (web hosting), Cloudflare
          (analytics, CDN), Sentry (error reporting), Stripe (when payment processing launches).
        </p>
      </Section>

      <Section title="6. Your rights">
        <p>
          You have the right to access, correct, or delete any personal information we hold about you. To exercise
          these rights, email{" "}
          <a href="mailto:hello@quivermarkets.com" className="text-[#57D7BA] hover:underline">
            hello@quivermarkets.com
          </a>
          . We will respond within 30 days.
        </p>
        <p>
          If you are located in the European Union, you have additional rights under the GDPR, including the right
          to data portability and the right to lodge a complaint with a supervisory authority. If you are a
          California resident, you have rights under the CCPA, including the right to know what personal
          information we collect and the right to request deletion.
        </p>
      </Section>

      <Section title="7. Data retention">
        <p>
          We retain personal information only as long as necessary to provide the service. Account data is deleted
          within 30 days of account closure. Analytics data is aggregated and anonymized.
        </p>
      </Section>

      <Section title="8. Security">
        <p>
          We use industry-standard security measures to protect your data, including HTTPS encryption, hashed
          passwords, and access controls. No method of transmission over the internet is 100% secure, but we work
          to protect your information.
        </p>
      </Section>

      <Section title="9. Children">
        <p>
          Quiver Markets is not intended for users under 18. We do not knowingly collect information from children.
        </p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify users of material changes by posting
          the updated policy on this page with a new &ldquo;Last updated&rdquo; date.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Questions about this Privacy Policy? Email{" "}
          <a href="mailto:hello@quivermarkets.com" className="text-[#57D7BA] hover:underline">
            hello@quivermarkets.com
          </a>
          .
        </p>
      </Section>

      <p className="text-[11px] text-[#4a5168] pt-4 border-t border-[#2f374f]">
        © 2026 Quiver Markets. Not financial advice.
      </p>
    </div>
  );
}
