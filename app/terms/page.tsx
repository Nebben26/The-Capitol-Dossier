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

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[#8892b0] hover:text-[#57D7BA] transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to Dashboard
      </Link>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#e2e8f0]">Terms of Service</h1>
        <p className="text-sm text-[#4a5168]">Last updated: April 8, 2026</p>
      </div>

      <Section title="1. Acceptance of terms">
        <p>
          By accessing or using Quiver Markets (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of
          Service. If you do not agree, do not use the Service.
        </p>
      </Section>

      <Section title="2. Description of the Service">
        <p>
          Quiver Markets is an intelligence platform that aggregates publicly available data from prediction markets
          including Polymarket and Kalshi. We provide analytics, AI-generated commentary, signal detection, and
          cross-platform comparison tools.
        </p>
      </Section>

      <Section title="3. Not financial advice">
        <p className="font-semibold text-[#e2e8f0]">
          QUIVER MARKETS DOES NOT PROVIDE FINANCIAL, INVESTMENT, LEGAL, OR TAX ADVICE.
        </p>
        <p>
          All information, signals, AI-generated theses, whale tracking data, and analysis provided by the Service
          are for informational and educational purposes only. Nothing on Quiver Markets constitutes a
          recommendation, solicitation, or offer to buy or sell any financial instrument or to participate in any
          prediction market.
        </p>
        <p>
          Prediction markets and event contracts involve substantial risk of loss. Past performance does not
          guarantee future results. You should consult qualified financial, legal, and tax professionals before
          making any decisions based on information from this Service. You are solely responsible for your own
          trading decisions.
        </p>
      </Section>

      <Section title="4. Eligibility">
        <p>
          You must be at least 18 years old and legally able to enter into binding contracts in your jurisdiction
          to use the Service. You are responsible for ensuring that your use of the Service complies with all laws
          applicable to you.
        </p>
      </Section>

      <Section title="5. Account and access">
        <p>
          Some features require an account. You agree to provide accurate information and to keep your credentials
          secure. You are responsible for all activity under your account. We reserve the right to suspend or
          terminate accounts that violate these Terms.
        </p>
      </Section>

      <Section title="6. Subscriptions and payment">
        <p>
          Paid tiers are billed in advance on a recurring basis. Subscriptions automatically renew unless
          cancelled. You can cancel anytime from your account settings. Refunds are at our sole discretion. All
          payments are processed by Stripe under their terms.
        </p>
      </Section>

      <Section title="7. API usage">
        <p>
          Access to the Quiver Markets API is governed by the rate limits and usage tiers described on our{" "}
          <Link href="/pricing" className="text-[#57D7BA] hover:underline">
            pricing page
          </Link>
          . You may not share API keys, abuse the rate limiting, or use the API in any way that interferes with the
          Service for other users. We reserve the right to revoke API access for any abuse.
        </p>
      </Section>

      <Section title="8. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Use the Service for any unlawful purpose</li>
          <li>Scrape, copy, or republish substantial portions of our data without permission</li>
          <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
          <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure</li>
          <li>Use the Service to harass, abuse, or harm others</li>
          <li>Misrepresent your identity or affiliation</li>
        </ul>
      </Section>

      <Section title="9. Intellectual property">
        <p>
          The Service, including all text, graphics, logos, software, and content, is owned by Quiver Markets or
          its licensors and is protected by copyright and other intellectual property laws. Aggregated public data
          from Polymarket and Kalshi remains the property of their respective owners.
        </p>
      </Section>

      <Section title="10. Disclaimers">
        <p className="uppercase font-semibold text-[#e2e8f0]">
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY
          KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT
          THE DATA WILL BE ACCURATE, COMPLETE, OR TIMELY. WE EXPLICITLY DISCLAIM ALL WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
      </Section>

      <Section title="11. Limitation of liability">
        <p className="uppercase font-semibold text-[#e2e8f0]">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, QUIVER MARKETS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, OR USE,
          ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM SHALL NOT
          EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
        </p>
      </Section>

      <Section title="12. Indemnification">
        <p>
          You agree to indemnify and hold Quiver Markets harmless from any claims, damages, or expenses arising
          from your use of the Service, your violation of these Terms, or your violation of any third-party rights.
        </p>
      </Section>

      <Section title="13. Termination">
        <p>
          We may suspend or terminate your access to the Service at any time, with or without notice, for any
          reason including violation of these Terms. Upon termination, your right to use the Service immediately
          ceases.
        </p>
      </Section>

      <Section title="14. Governing law">
        <p>
          These Terms are governed by the laws of the State of Missouri, United States, without regard to its
          conflict of laws principles. Any disputes arising out of these Terms or your use of the Service shall be
          resolved in the state or federal courts located in Missouri.
        </p>
      </Section>

      <Section title="15. Changes to these Terms">
        <p>
          We may modify these Terms at any time. Material changes will be posted on this page with an updated
          &ldquo;Last updated&rdquo; date. Continued use of the Service after changes constitutes acceptance of the
          new Terms.
        </p>
      </Section>

      <Section title="16. Contact">
        <p>
          Questions about these Terms? Email{" "}
          <a href="mailto:hello@quivermarkets.com" className="text-[#57D7BA] hover:underline">
            hello@quivermarkets.com
          </a>
          .
        </p>
      </Section>

      <p className="text-[11px] text-[#4a5168] pt-4 border-t border-[#21262d]">
        © 2026 Quiver Markets. Not financial advice.
      </p>
    </div>
  );
}
