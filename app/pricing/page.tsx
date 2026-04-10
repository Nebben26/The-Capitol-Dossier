"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, X, Star, ChevronDown, ChevronUp, Zap, Building2, BarChart2 } from "lucide-react";
import { PRICING } from "@/lib/pricing";
import { WaitlistForm } from "@/components/ui/waitlist-form";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TierVal = string | boolean;

interface Feature {
  label: string;
  free: TierVal;
  pro: TierVal;
  trader: TierVal;
  quant: TierVal;
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
      { label: "Cross-platform arbitrage scanner", free: true, pro: true, trader: true, quant: true },
      { label: "AI Market Thesis (preview)", free: true, pro: true, trader: true, quant: true },
      { label: "AI Market Thesis (full)", free: false, pro: true, trader: true, quant: true },
      { label: "Smart Signal Alerts (top 5)", free: true, pro: true, trader: true, quant: true },
      { label: "Smart Signal Alerts (all 180+)", free: false, pro: true, trader: true, quant: true },
      { label: "Whale leaderboard", free: true, pro: true, trader: true, quant: true },
      { label: "Whale position history", free: false, pro: true, trader: true, quant: true },
      { label: "Smart Money Watch", free: true, pro: true, trader: true, quant: true },
      { label: "Market Insights stories", free: "Free only", pro: true, trader: true, quant: true },
    ],
  },
  {
    heading: "EXECUTION",
    rows: [
      { label: "Spread execution calculator", free: true, pro: true, trader: true, quant: true },
      { label: "Causation analysis", free: true, pro: true, trader: true, quant: true },
      { label: "Resolution criteria diff", free: false, pro: true, trader: true, quant: true },
      { label: "Spread velocity indicator", free: false, pro: true, trader: true, quant: true },
      { label: "Spread history", free: false, pro: "7d", trader: "30d", quant: "90d" },
      { label: "Capital efficiency ranker", free: false, pro: true, trader: true, quant: true },
      { label: "Best annualized return strip", free: false, pro: true, trader: true, quant: true },
    ],
  },
  {
    heading: "DATA",
    rows: [
      { label: "6,500+ markets", free: true, pro: true, trader: true, quant: true },
      { label: "300+ disagreements", free: true, pro: true, trader: true, quant: true },
      { label: "200+ whale wallets", free: true, pro: true, trader: true, quant: true },
      { label: "News catalysts", free: true, pro: true, trader: true, quant: true },
      { label: "Historical archive", free: false, pro: false, trader: "90d", quant: "Full" },
      { label: "CSV export", free: false, pro: true, trader: true, quant: true },
    ],
  },
  {
    heading: "API",
    rows: [
      { label: "REST endpoints", free: false, pro: false, trader: false, quant: true },
      { label: "Rate limit / minute", free: false, pro: false, trader: false, quant: "60" },
      { label: "Rate limit / day", free: false, pro: false, trader: false, quant: "5,000" },
      { label: "Webhooks", free: false, pro: false, trader: false, quant: "Soon" },
    ],
  },
  {
    heading: "SUPPORT",
    rows: [
      { label: "Email support", free: true, pro: true, trader: true, quant: true },
      { label: "Priority support", free: false, pro: true, trader: true, quant: true },
      { label: "Slack channel", free: false, pro: false, trader: true, quant: true },
      { label: "Custom data requests", free: false, pro: false, trader: false, quant: true },
      { label: "Weekly Smart Money Report", free: false, pro: false, trader: true, quant: true },
    ],
  },
];

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your account settings any time and you'll keep access until the end of your billing period. No questions asked.",
  },
  {
    q: "What's the difference between Pro and Trader?",
    a: "Pro gives you full intelligence and execution tools — ideal for active market followers. Trader adds 30-day spread history, resolution criteria diff, Slack access, and the Weekly Smart Money Report — built for professionals who execute regularly.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards via Stripe. Bank transfer available for Quant API on request.",
  },
  {
    q: "Do you offer a free trial?",
    a: "The Free tier IS the trial. Upgrade only when you've validated the value yourself. No credit card required to start.",
  },
  {
    q: "Is there a discount for annual billing?",
    a: "Yes — 2 months free when billed annually on any paid tier. Pro: $490/yr, Trader: $1,490/yr, Quant API: $2,990/yr.",
  },
  {
    q: "What does the Quant API tier include?",
    a: "REST API access at 60 req/min and 5,000 req/day, 90-day spread history, full historical archive, CSV export, and webhooks (coming soon). Built for teams who want to feed Quiver data into their own systems.",
  },
  {
    q: "What if my API usage exceeds my limit?",
    a: "We'll notify you at 80% of your daily limit. Requests pause until the next day or you upgrade — we never charge overage fees.",
  },
  {
    q: "Where does the data come from?",
    a: "Polymarket and Kalshi public APIs, refreshed every 30 minutes. AI theses are generated weekly for top-100 markets by volume. Whale data is computed from on-chain Polymarket positions.",
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
      description: "Scan the prediction market landscape",
      featured: false,
      features: [
        { label: "All 6,500+ markets (Polymarket + Kalshi)", included: true },
        { label: "300+ cross-platform arbitrage opportunities", included: true },
        { label: "Whale leaderboard (200+ tracked wallets)", included: true },
        { label: "Smart Money Flow by category", included: true },
        { label: "Morning Brief overnight summary", included: true },
        { label: "AI thesis bull case (preview)", included: true },
        { label: "Execution calculator", included: true },
        { label: "Full AI thesis + spread history", included: false },
        { label: "REST API access", included: false },
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
      description: "Full intelligence layer for active traders",
      featured: true,
      features: [
        { label: "Everything in Free", included: true },
        { label: "Full AI Market Thesis (all sections)", included: true },
        { label: "All 180+ Smart Signal Alerts", included: true },
        { label: "Spread history (7-day window)", included: true },
        { label: "Spread velocity indicator", included: true },
        { label: "Resolution criteria diff", included: true },
        { label: "Capital efficiency ranker", included: true },
        { label: "Market Insights stories (all tiers)", included: true },
        { label: "Priority support + CSV export", included: true },
      ],
      cta: "Join the waitlist",
      ctaHref: "#waitlist",
      ctaStyle: "bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/90 font-bold",
    },
    {
      id: "trader",
      badge: "For Professionals",
      badgeColor: "#f59e0b",
      badgeBg: "#f59e0b18",
      icon: <BarChart2 className="size-3 text-[#f59e0b]" />,
      price: PRICING.trader.priceLabel,
      period: "/month",
      annual: `or ${PRICING.trader.annualLabel}`,
      description: "For professionals who execute regularly",
      featured: false,
      isNew: true,
      features: [
        { label: "Everything in Pro", included: true },
        { label: "30-day spread history", included: true },
        { label: "Slack channel access", included: true },
        { label: "Weekly Smart Money Report PDF", included: true },
        { label: "Priority Slack support", included: true },
        { label: "REST API access (coming soon)", included: false },
      ],
      cta: "Join the waitlist",
      ctaHref: "#waitlist",
      ctaStyle: "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/20 font-semibold",
    },
    {
      id: "quant",
      badge: "Quant API",
      badgeColor: "#8b5cf6",
      badgeBg: "#8b5cf618",
      icon: <Building2 className="size-3 text-[#8b5cf6]" />,
      price: PRICING.quant.priceLabel,
      period: "/month",
      annual: `or ${PRICING.quant.annualLabel}`,
      description: "For quants, hedge funds, and system builders",
      featured: false,
      features: [
        { label: "Everything in Trader", included: true },
        { label: "REST API: 60 req/min, 5,000/day", included: true },
        { label: "90-day spread history", included: true },
        { label: "Full historical archive", included: true },
        { label: "Webhooks (coming soon)", included: true },
        { label: "Custom data exports", included: true },
      ],
      cta: "Talk to Sales",
      ctaHref: "mailto:hello@quivermarkets.com?subject=Quant%20API%20Inquiry",
      ctaStyle: "bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/20",
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#57D7BA]/10 border border-[#57D7BA]/20 text-[11px] text-[#57D7BA] font-semibold">
          <Zap className="size-3" /> Transparent Pricing
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="text-[#8892b0] max-w-xl mx-auto">
          Four tiers, no hidden fees. Start free, upgrade when you see the alpha.
        </p>
        <p className="text-[11px] text-[#4a5168]">
          All prices in USD · Cancel anytime · No overage charges
        </p>
      </div>

      {/* ─── PRICING CARDS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`rounded-2xl bg-[#222638] border flex flex-col transition-all ${
              tier.featured
                ? "border-[#57D7BA] ring-1 ring-[#57D7BA]/20 shadow-lg shadow-[#57D7BA]/10 lg:-mt-2 lg:-mb-2"
                : "border-[#2f374f]"
            }`}
          >
            <div className="p-5 flex flex-col gap-3 flex-1">
              {/* Badge */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: tier.badgeBg, color: tier.badgeColor }}
                >
                  {tier.icon}
                  {tier.badge}
                </div>
                {"isNew" in tier && tier.isNew && (
                  <span className="text-[8px] font-bold uppercase tracking-wide text-[#57D7BA] bg-[#57D7BA]/10 border border-[#57D7BA]/20 px-1.5 py-0.5 rounded-full">
                    NEW
                  </span>
                )}
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

              {/* Pro / Trader waitlist form */}
              {(tier.id === "pro" || tier.id === "trader") && (
                <div id={tier.id === "pro" ? "waitlist" : undefined} className="pt-3 border-t border-[#2f374f] space-y-2">
                  <p className="text-[10px] text-[#8892b0] text-center">
                    {tier.id === "pro"
                      ? "Waitlist members get $39/mo founder pricing (20% off)."
                      : "Waitlist members get $119/mo founder pricing (20% off)."}
                  </p>
                  <WaitlistForm compact source={`pricing-${tier.id}-tier`} />
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
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-[#2f374f] bg-[#1a1e2e]">
                <th className="text-left px-4 py-3 text-[#8892b0] text-xs font-semibold w-[36%]">Feature</th>
                <th className="text-center px-3 py-3 text-[#8892b0] text-[11px] font-semibold uppercase tracking-wider w-[16%] border-l border-[#2f374f]">Free</th>
                <th className="text-center px-3 py-3 text-[#57D7BA] text-[11px] font-semibold uppercase tracking-wider w-[16%] border-l border-[#2f374f]">Pro</th>
                <th className="text-center px-3 py-3 text-[#f59e0b] text-[11px] font-semibold uppercase tracking-wider w-[16%] border-l border-[#2f374f]">Trader</th>
                <th className="text-center px-3 py-3 text-[#8b5cf6] text-[11px] font-semibold uppercase tracking-wider w-[16%] border-l border-[#2f374f]">Quant API</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((section) => (
                <React.Fragment key={section.heading}>
                  <tr className="bg-[#1a1e2e]/60">
                    <td colSpan={5} className="px-4 py-2 text-[10px] font-bold tracking-widest text-[#4a5168] uppercase">
                      {section.heading}
                    </td>
                  </tr>
                  {section.rows.map((row, i) => (
                    <tr
                      key={row.label}
                      className={`border-t border-[#2f374f]/40 ${i % 2 === 0 ? "bg-[#222638]" : "bg-[#1e2235]"}`}
                    >
                      <td className="px-4 py-2.5 text-[#8892b0] text-xs">{row.label}</td>
                      <td className="px-3 py-2.5 text-center border-l border-[#2f374f]/40"><CellValue val={row.free} /></td>
                      <td className="px-3 py-2.5 text-center border-l border-[#2f374f]/40"><CellValue val={row.pro} /></td>
                      <td className="px-3 py-2.5 text-center border-l border-[#2f374f]/40"><CellValue val={row.trader} /></td>
                      <td className="px-3 py-2.5 text-center border-l border-[#2f374f]/40"><CellValue val={row.quant} /></td>
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
