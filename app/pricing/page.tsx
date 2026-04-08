"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, X, Star, ChevronDown, ChevronUp, Zap, Code, Building2, Terminal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PRICING } from "@/lib/pricing";
import { WaitlistForm } from "@/components/ui/waitlist-form";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TierVal = string | boolean;

interface Feature {
  label: string;
  free: TierVal;
  pro: TierVal;
  starter: TierVal;
  quant: TierVal;
  premium: TierVal;
}

interface FeatureSection {
  heading: string;
  rows: Feature[];
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const COMPARISON: FeatureSection[] = [
  {
    heading: "INTELLIGENCE",
    rows: [
      { label: "Cross-platform arbitrage scanner", free: true, pro: true, starter: true, quant: true, premium: true },
      { label: "AI Market Thesis (preview)", free: true, pro: true, starter: true, quant: true, premium: true },
      { label: "AI Market Thesis (full)", free: false, pro: true, starter: true, quant: true, premium: true },
      { label: "Smart Signal Alerts (top 5)", free: true, pro: true, starter: true, quant: true, premium: true },
      { label: "Smart Signal Alerts (all 50+)", free: false, pro: true, starter: true, quant: true, premium: true },
      { label: "Whale leaderboard", free: true, pro: true, starter: true, quant: true, premium: true },
      { label: "Whale position history", free: false, pro: true, starter: true, quant: true, premium: true },
      { label: "Copy-the-Whales", free: true, pro: true, starter: true, quant: true, premium: true },
      { label: "Smart Money Flow", free: true, pro: true, starter: true, quant: true, premium: true },
    ],
  },
  {
    heading: "DATA",
    rows: [
      { label: "6,070+ markets", free: true, pro: true, starter: true, quant: true, premium: true },
      { label: "286 disagreements", free: true, pro: true, starter: true, quant: true, premium: true },
      { label: "149 whale wallets", free: true, pro: true, starter: true, quant: true, premium: true },
      { label: "News catalysts", free: true, pro: true, starter: true, quant: true, premium: true },
      { label: "Spread history", free: false, pro: "7d", starter: "7d", quant: "30d", premium: "90d" },
      { label: "Historical archive", free: false, pro: false, starter: false, quant: false, premium: "Full" },
    ],
  },
  {
    heading: "API",
    rows: [
      { label: "REST endpoints", free: false, pro: false, starter: true, quant: true, premium: true },
      { label: "Rate limit / minute", free: false, pro: false, starter: "20", quant: "60", premium: "600" },
      { label: "Rate limit / day", free: false, pro: false, starter: "1,000", quant: "5,000", premium: "100,000" },
      { label: "Webhooks", free: false, pro: false, starter: false, quant: "Soon", premium: "Soon" },
      { label: "CSV export", free: false, pro: false, starter: true, quant: true, premium: true },
    ],
  },
  {
    heading: "SUPPORT",
    rows: [
      { label: "Email support", free: true, pro: true, starter: true, quant: true, premium: true },
      { label: "Priority support", free: false, pro: true, starter: true, quant: true, premium: true },
      { label: "Slack channel", free: false, pro: false, starter: false, quant: false, premium: true },
      { label: "Custom data requests", free: false, pro: false, starter: false, quant: false, premium: true },
      { label: "Weekly Smart Money Report", free: false, pro: false, starter: false, quant: false, premium: true },
    ],
  },
];

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings any time and you'll keep access until the end of your billing period. No questions asked.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards via Stripe. Bank transfer and crypto payment available for the Premium tier on request.",
  },
  {
    q: "Do you offer a free trial?",
    a: "The Free tier IS the trial. Upgrade only when you've validated the value yourself. No credit card required to start.",
  },
  {
    q: "Is there a discount for annual billing?",
    a: "Pro and Quant API tiers get 2 months free when billed annually ($600/year for Pro, $5,000/year for Quant API). Premium is custom-billed.",
  },
  {
    q: "What's the difference between Starter API and Quant API?",
    a: "Starter API ($150/mo) is for solo developers building personal projects or small tools — 20 req/min and 1,000 req/day with 7 days of history. Quant API ($500/mo) is for professional quants and small syndicates — 60 req/min and 5,000 req/day with 30 days of history. Most developers can start with Starter and upgrade as their usage grows.",
  },
  {
    q: "What if my API usage exceeds my tier limit?",
    a: "We'll send you a notification at 80% of your daily limit. If you go over, requests pause until the next day OR you upgrade. We never charge overage fees.",
  },
  {
    q: "Where does the data come from?",
    a: "Polymarket and Kalshi public APIs. We refresh every 30 minutes via cron jobs. AI theses are generated weekly for the top 100 markets by volume. Whale data is computed from on-chain Polymarket positions.",
  },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function CellValue({ val }: { val: TierVal }) {
  if (val === true) return <Check className="size-4 text-[#22c55e] mx-auto" />;
  if (val === false) return <span className="text-[#4a5168] text-sm">—</span>;
  return <span className="text-xs font-medium text-[#e2e8f0]">{val}</span>;
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const tiers = [
    {
      id: "free",
      badge: "Free Forever",
      badgeColor: "#8892b0",
      badgeBg: "#8892b018",
      icon: null,
      price: PRICING.free.priceLabel,
      period: "/month",
      annual: null,
      description: "Everything you need to scan the prediction market landscape",
      featured: false,
      features: [
        { label: "All 6,070 markets across Polymarket and Kalshi", included: true },
        { label: "Cross-platform arbitrage detection (286 opportunities)", included: true },
        { label: "Smart Money Flow by category", included: true },
        { label: "Whale leaderboard (149 tracked wallets)", included: true },
        { label: "Morning Brief overnight summary", included: true },
        { label: "News catalysts tagged to markets", included: true },
        { label: "AI thesis bull case (free preview)", included: true },
        { label: "Bear case, catalysts, whale read, historical context", included: false },
        { label: "Smart signal alerts beyond top 5", included: false },
        { label: "Spread history charts", included: false },
      ],
      cta: "Start free",
      ctaHref: "/",
      ctaStyle: "border border-[#2f374f] text-[#8892b0] hover:text-[#e2e8f0] hover:border-[#4a5168]",
    },
    {
      id: "pro",
      badge: "Most Popular",
      badgeColor: "#57D7BA",
      badgeBg: "#57D7BA18",
      icon: <Star className="size-3 fill-[#57D7BA]" />,
      price: PRICING.pro.priceLabel,
      period: "/month",
      annual: `or ${PRICING.pro.annualLabel}`,
      description: "For serious traders who want the full intelligence layer",
      featured: true,
      features: [
        { label: "Everything in Free", included: true },
        { label: "Full AI Market Thesis (bull/bear/catalysts/whale read/historical)", included: true },
        { label: "All Smart Signal Alerts (50+ active signals)", included: true },
        { label: "Spread convergence history (7-day window)", included: true },
        { label: "Copy-the-Whales unlimited portfolios", included: true },
        { label: "Whale position history", included: true },
        { label: "Personal calibration tracking", included: true },
        { label: "Telegram + email notifications", included: true },
        { label: "Priority support", included: true },
      ],
      cta: "Upgrade to Pro",
      ctaHref: "mailto:hello@quivermarkets.com?subject=Pro%20Tier%20Inquiry",
      ctaStyle: "bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/90 font-bold",
    },
    {
      id: "starter",
      badge: "API Starter",
      badgeColor: "#22d3ee",
      badgeBg: "#22d3ee18",
      icon: <Terminal className="size-3 text-[#22d3ee]" />,
      price: PRICING.starterApi.priceLabel,
      period: "/month",
      annual: `or ${PRICING.starterApi.annualLabel}`,
      description: "Programmatic access for solo developers and small projects",
      featured: false,
      features: [
        { label: "Everything in Pro", included: true },
        { label: "REST API: 20 requests/minute", included: true },
        { label: "1,000 requests/day", included: true },
        { label: "Disagreements feed", included: true },
        { label: "Whale leaderboard endpoint", included: true },
        { label: "Smart Money Flow snapshots", included: true },
        { label: "7-day historical archive", included: true },
        { label: "JSON export", included: true },
        { label: "Spread history time-series (Quant API+)", included: false },
        { label: "Webhooks (Quant API+)", included: false },
      ],
      cta: "Get Starter API",
      ctaHref: "mailto:hello@quivermarkets.com?subject=Starter%20API%20Tier%20Inquiry",
      ctaStyle: "bg-[#22d3ee]/10 text-[#22d3ee] border border-[#22d3ee]/30 hover:bg-[#22d3ee]/20",
    },
    {
      id: "quant",
      badge: "API Access",
      badgeColor: "#f59e0b",
      badgeBg: "#f59e0b18",
      icon: <Code className="size-3 text-[#f59e0b]" />,
      price: PRICING.quantApi.priceLabel,
      period: "/month",
      annual: `or ${PRICING.quantApi.annualLabel}`,
      description: "Programmatic access for traders building their own systems",
      featured: false,
      features: [
        { label: "Everything in Starter API", included: true },
        { label: "REST API with 60 requests/minute", included: true },
        { label: "5,000 requests/day", included: true },
        { label: "Real-time disagreements feed", included: true },
        { label: "Whale positions endpoint", included: true },
        { label: "Smart Money Flow time-series", included: true },
        { label: "Detected signals feed", included: true },
        { label: "30-day spread history", included: true },
        { label: "JSON + CSV export formats", included: true },
        { label: "Webhooks (coming soon)", included: true },
      ],
      cta: "Get API Access",
      ctaHref: "mailto:hello@quivermarkets.com?subject=Quant%20API%20Tier%20Inquiry",
      ctaStyle: "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/20",
    },
    {
      id: "premium",
      badge: "Enterprise",
      badgeColor: "#8b5cf6",
      badgeBg: "#8b5cf618",
      icon: <Building2 className="size-3 text-[#8b5cf6]" />,
      price: PRICING.premium.priceLabel,
      period: "/month",
      annual: PRICING.premium.annualLabel,
      description: "For hedge funds, market makers, and institutional traders",
      featured: false,
      features: [
        { label: "Everything in Quant API", included: true },
        { label: "600 requests/minute (10x Quant)", included: true },
        { label: "100,000 requests/day", included: true },
        { label: "Full historical archive (90+ days)", included: true },
        { label: "Custom data exports on request", included: true },
        { label: "Bulk whale monitoring (unlimited)", included: true },
        { label: "Weekly Smart Money Report PDF", included: true },
        { label: "Direct Slack channel with founder", included: true },
        { label: "SLA: 99.9% uptime", included: true },
        { label: "White-glove onboarding", included: true },
      ],
      cta: "Talk to Sales",
      ctaHref: "mailto:hello@quivermarkets.com?subject=Premium%20Tier%20Inquiry",
      ctaStyle: "bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/20",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-16">

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#57D7BA]/10 border border-[#57D7BA]/20 text-[11px] text-[#57D7BA] font-semibold">
          <Zap className="size-3" /> Transparent Pricing
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="text-[#8892b0] max-w-xl mx-auto">
          Choose the tier that matches how serious you are about prediction markets
        </p>
        <p className="text-[11px] text-[#4a5168]">
          All prices in USD · Cancel anytime · No hidden fees
        </p>
      </div>

      {/* ─── PRICING CARDS — 1 col mobile, 2 tablet, 5 desktop ─────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-start">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-2xl bg-[#222638] border flex flex-col transition-all ${
              tier.featured
                ? "border-[#57D7BA] ring-1 ring-[#57D7BA]/20 shadow-lg shadow-[#57D7BA]/10 lg:-mt-2 lg:-mb-2"
                : "border-[#2f374f]"
            }`}
          >
            <div className="p-4 flex flex-col gap-3 flex-1">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full self-start text-[9px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: tier.badgeBg, color: tier.badgeColor }}
              >
                {tier.icon}
                {tier.badge}
              </div>

              {/* Price */}
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#e2e8f0]">{tier.price}</span>
                  <span className="text-xs text-[#8892b0]">{tier.period}</span>
                </div>
                {tier.annual && (
                  <p className="text-[10px] text-[#4a5168] mt-0.5">{tier.annual}</p>
                )}
              </div>

              {/* Description */}
              <p className="text-[11px] text-[#8892b0] leading-relaxed">{tier.description}</p>

              {/* Features */}
              <ul className="space-y-1.5 flex-1">
                {tier.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-1.5">
                    {f.included ? (
                      <Check className="size-3 text-[#22c55e] shrink-0 mt-0.5" />
                    ) : (
                      <X className="size-3 text-[#4a5168] shrink-0 mt-0.5" />
                    )}
                    <span className={`text-[10px] leading-relaxed ${f.included ? "text-[#8892b0]" : "text-[#4a5168]"}`}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={tier.ctaHref}
                className={`w-full py-3 rounded-xl text-xs text-center transition-all block mt-2 min-h-[44px] flex items-center justify-center ${tier.ctaStyle}`}
              >
                {tier.cta}
              </a>

              {/* Pro tier — compact waitlist form as secondary CTA */}
              {tier.id === "pro" && (
                <div className="pt-3 border-t border-[#2f374f] space-y-2">
                  <p className="text-[10px] text-[#8892b0] text-center">
                    Or join the waitlist for $39/mo founder pricing.
                  </p>
                  <WaitlistForm compact />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ─── COMPARISON TABLE ────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-center">Full Feature Comparison</h2>
        <p className="text-[#8892b0] text-sm text-center mb-6">See exactly what&apos;s included in every tier</p>

        <div className="overflow-x-auto rounded-2xl border border-[#2f374f]">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-[#2f374f] bg-[#1a1e2e]">
                <th className="text-left px-4 py-3 text-[#8892b0] text-xs font-semibold w-[35%]">Feature</th>
                <th className="text-center px-2 py-3 text-[#8892b0] text-xs font-semibold">Free</th>
                <th className="text-center px-2 py-3 text-[#57D7BA] text-xs font-semibold">Pro</th>
                <th className="text-center px-2 py-3 text-[#22d3ee] text-xs font-semibold">Starter API</th>
                <th className="text-center px-2 py-3 text-[#f59e0b] text-xs font-semibold">Quant API</th>
                <th className="text-center px-2 py-3 text-[#8b5cf6] text-xs font-semibold">Premium</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((section) => (
                <React.Fragment key={section.heading}>
                  <tr className="bg-[#1a1e2e]/60">
                    <td colSpan={6} className="px-4 py-2 text-[10px] font-bold tracking-widest text-[#4a5168] uppercase">
                      {section.heading}
                    </td>
                  </tr>
                  {section.rows.map((row, i) => (
                    <tr
                      key={row.label}
                      className={`border-t border-[#2f374f]/40 ${i % 2 === 0 ? "bg-[#222638]" : "bg-[#1e2235]"}`}
                    >
                      <td className="px-4 py-2.5 text-[#8892b0] text-xs">{row.label}</td>
                      <td className="px-2 py-2.5 text-center"><CellValue val={row.free} /></td>
                      <td className="px-2 py-2.5 text-center"><CellValue val={row.pro} /></td>
                      <td className="px-2 py-2.5 text-center"><CellValue val={row.starter} /></td>
                      <td className="px-2 py-2.5 text-center"><CellValue val={row.quant} /></td>
                      <td className="px-2 py-2.5 text-center"><CellValue val={row.premium} /></td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── FAQ ─────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto space-y-3">
        <h2 className="text-xl font-bold text-center mb-6">Frequently Asked Questions</h2>
        {FAQS.map((faq, i) => (
          <div
            key={i}
            className="rounded-xl bg-[#222638] border border-[#2f374f] overflow-hidden"
          >
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
            >
              <span className="text-sm font-semibold text-[#e2e8f0]">{faq.q}</span>
              {openFaq === i ? (
                <ChevronUp className="size-4 text-[#8892b0] shrink-0" />
              ) : (
                <ChevronDown className="size-4 text-[#8892b0] shrink-0" />
              )}
            </button>
            {openFaq === i && (
              <div className="px-5 pb-4 border-t border-[#2f374f]">
                <p className="text-sm text-[#8892b0] leading-relaxed pt-3">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ─── BOTTOM CTA ──────────────────────────────────────────────────── */}
      <div className="text-center space-y-4 py-8 border-t border-[#2f374f]">
        <h2 className="text-2xl font-bold">Still have questions?</h2>
        <p className="text-[#8892b0] text-sm">We&apos;re happy to help you find the right tier.</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a
            href="mailto:hello@quivermarkets.com"
            className="px-5 py-2.5 rounded-xl bg-[#57D7BA] text-[#0f1119] text-sm font-bold hover:bg-[#57D7BA]/90 transition-colors"
          >
            Email us
          </a>
          <Link
            href="/api-docs"
            className="px-5 py-2.5 rounded-xl border border-[#2f374f] text-[#8892b0] text-sm hover:text-[#e2e8f0] hover:border-[#4a5168] transition-colors"
          >
            View API docs
          </Link>
        </div>
      </div>
    </div>
  );
}
