"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, X, Star, ChevronDown, ChevronUp, Zap, Building2, BarChart2 } from "lucide-react";
import { PRICING } from "@/lib/pricing";
import { WaitlistModal } from "@/components/pricing/waitlist-modal";

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
  if (val === true) return <Check className="size-4 text-[#3fb950] mx-auto" />;
  if (val === false) return <span className="text-[#484f58] text-sm">—</span>;
  return <span className="text-xs font-medium text-[#f0f6fc]">{val}</span>;
}

function PriceDisplay({ monthlyPrice, billingCycle }: { monthlyPrice: number; billingCycle: "monthly" | "annual" }) {
  if (monthlyPrice === 0) {
    return (
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-[#f0f6fc] font-mono">$0</span>
          <span className="text-xs text-[#8d96a0]">forever</span>
        </div>
      </div>
    );
  }
  const annualTotal = monthlyPrice * 10;
  const annualMonthly = (annualTotal / 12).toFixed(2);
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-[#f0f6fc] font-mono tabular-nums">
          {billingCycle === "monthly" ? `$${monthlyPrice}` : `$${annualTotal}`}
        </span>
        <span className="text-xs text-[#8d96a0]">{billingCycle === "monthly" ? "/mo" : "/yr"}</span>
      </div>
      {billingCycle === "annual" && (
        <p className="text-[10px] text-[#8d96a0] mt-0.5">${annualMonthly}/mo billed annually</p>
      )}
      {billingCycle === "monthly" && (
        <p className="text-[10px] text-[#484f58] mt-0.5">or ${annualTotal}/yr (save 17%)</p>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [waitlistOpen, setWaitlistOpen] = useState<string | null>(null);

  const tiers = [
    {
      id: "free",
      badge: "Free Forever",
      badgeColor: "#8d96a0",
      badgeBg: "#8d96a018",
      icon: null,
      monthlyPrice: 0,
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
      ctaStyle: "border border-[#21262d] text-[#8d96a0] hover:text-[#f0f6fc] hover:border-[#484f58]",
      ctaIsLink: true,
    },
    {
      id: "pro",
      badge: "Most Popular",
      badgeColor: "#57D7BA",
      badgeBg: "#57D7BA18",
      icon: <Star className="size-3 fill-[#57D7BA]" />,
      monthlyPrice: PRICING.pro.price,
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
      ctaStyle: "bg-[#57D7BA] text-[#0d1117] hover:bg-[#57D7BA]/90 font-bold shadow-glow-brand",
      ctaIsLink: false,
    },
    {
      id: "trader",
      badge: "For Professionals",
      badgeColor: "#f59e0b",
      badgeBg: "#f59e0b18",
      icon: <BarChart2 className="size-3 text-[#f59e0b]" />,
      monthlyPrice: PRICING.trader.price,
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
      ctaStyle: "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/20 font-semibold",
      ctaIsLink: false,
    },
    {
      id: "quant",
      badge: "Quant API",
      badgeColor: "#8b5cf6",
      badgeBg: "#8b5cf618",
      icon: <Building2 className="size-3 text-[#8b5cf6]" />,
      monthlyPrice: PRICING.quant.price,
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
      ctaIsLink: true,
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

      <WaitlistModal
        open={waitlistOpen !== null}
        onClose={() => setWaitlistOpen(null)}
        tier={waitlistOpen ?? undefined}
      />

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#57D7BA]/10 border border-[#57D7BA]/20 text-[11px] text-[#57D7BA] font-semibold">
          <Zap className="size-3" /> Transparent Pricing
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="text-[#8d96a0] max-w-xl mx-auto">
          Four tiers, no hidden fees. Start free, upgrade when you see the alpha.
        </p>
        <p className="text-[11px] text-[#484f58]">
          All prices in USD · Cancel anytime · No overage charges
        </p>
      </div>

      {/* ─── BILLING TOGGLE ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-center -mt-8">
        <div className="inline-flex items-center gap-1 bg-[#161b27] border border-[#21262d] rounded-full p-1">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-150 ${
              billingCycle === "monthly"
                ? "bg-[#57D7BA] text-[#0d1117]"
                : "text-[#8d96a0] hover:text-[#f0f6fc]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-150 flex items-center gap-2 ${
              billingCycle === "annual"
                ? "bg-[#57D7BA] text-[#0d1117]"
                : "text-[#8d96a0] hover:text-[#f0f6fc]"
            }`}
          >
            Annual
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                billingCycle === "annual"
                  ? "bg-[#0d1117]/20 text-[#0d1117]"
                  : "bg-[#57D7BA]/15 text-[#57D7BA]"
              }`}
            >
              SAVE 17%
            </span>
          </button>
        </div>
      </div>

      {/* ─── PRICING CARDS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {tiers.map((tier) => (
          <div key={tier.id} className="relative">
            {/* Floating "Most Popular" badge for Pro */}
            {tier.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <div className="inline-flex items-center gap-1.5 bg-[#57D7BA] text-[#0d1117] text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-glow-brand">
                  <Star className="w-3 h-3 fill-[#0d1117]" />
                  Most Popular
                </div>
              </div>
            )}
            <div
              className={`rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 border flex flex-col ${
                tier.featured
                  ? "bg-gradient-to-b from-[#57D7BA]/8 to-[#161b27] border-[#57D7BA]/40 shadow-glow-brand scale-[1.03] pt-3"
                  : "bg-[#161b27] border-[#21262d]"
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
                <PriceDisplay monthlyPrice={tier.monthlyPrice} billingCycle={billingCycle} />

                {/* Description */}
                <p className="text-[11px] text-[#8d96a0] leading-relaxed">{tier.description}</p>

                {/* Features */}
                <ul className="space-y-1.5 flex-1">
                  {tier.features.map((f) => (
                    <li key={f.label} className="flex items-start gap-1.5">
                      {f.included ? (
                        <Check className="size-3 text-[#3fb950] shrink-0 mt-0.5" />
                      ) : (
                        <X className="size-3 text-[#484f58] shrink-0 mt-0.5" />
                      )}
                      <span className={`text-[10px] leading-relaxed ${f.included ? "text-[#8d96a0]" : "text-[#484f58]"}`}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {tier.ctaIsLink ? (
                  <a
                    href={tier.ctaHref}
                    className={`w-full py-3 rounded-xl text-xs text-center transition-all block mt-2 min-h-[44px] flex items-center justify-center active:scale-[0.97] ${tier.ctaStyle}`}
                  >
                    {tier.cta}
                  </a>
                ) : (
                  <button
                    onClick={() => setWaitlistOpen(tier.badge)}
                    className={`w-full py-3 rounded-xl text-xs text-center transition-all block mt-2 min-h-[44px] flex items-center justify-center active:scale-[0.97] ${tier.ctaStyle}`}
                  >
                    {tier.cta}
                  </button>
                )}

                {/* Waitlist pricing note */}
                {(tier.id === "pro" || tier.id === "trader") && (
                  <p className="text-[10px] text-[#8d96a0] text-center pt-1">
                    {tier.id === "pro"
                      ? "Waitlist members get $39/mo founder pricing (20% off)."
                      : "Waitlist members get $119/mo founder pricing (20% off)."}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── COMPARISON TABLE ────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-[#f0f6fc] text-center mb-2 tracking-tight">Compare plans</h2>
        <p className="text-sm text-[#8d96a0] text-center mb-8">Every feature at a glance.</p>

        <div className="overflow-x-auto rounded-xl border border-[#21262d] shadow-card">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-[#21262d] bg-[#161b27]">
                <th className="text-left px-6 py-4 text-[#8d96a0] font-medium w-[36%]">Feature</th>
                <th className="text-center px-6 py-4 text-[#f0f6fc] font-semibold w-[16%] border-l border-[#21262d]">Free</th>
                <th className="text-center px-6 py-4 text-[#57D7BA] font-semibold w-[16%] border-l border-[#21262d]">Pro</th>
                <th className="text-center px-6 py-4 text-[#f59e0b] font-semibold w-[16%] border-l border-[#21262d]">Trader</th>
                <th className="text-center px-6 py-4 text-[#8b5cf6] font-semibold w-[16%] border-l border-[#21262d]">Quant API</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((section) => (
                <React.Fragment key={section.heading}>
                  <tr className="bg-[#0d1117]/60">
                    <td colSpan={5} className="px-6 py-2 text-[10px] font-bold tracking-widest text-[#484f58] uppercase">
                      {section.heading}
                    </td>
                  </tr>
                  {section.rows.map((row, i) => (
                    <tr
                      key={row.label}
                      className={`border-t border-[#21262d]/40 ${i % 2 === 0 ? "bg-[#161b27]" : "bg-[#1c2333]"}`}
                    >
                      <td className="px-6 py-2.5 text-[#8d96a0] text-xs">{row.label}</td>
                      <td className="px-6 py-2.5 text-center border-l border-[#21262d]/40"><CellValue val={row.free} /></td>
                      <td className="px-6 py-2.5 text-center border-l border-[#21262d]/40"><CellValue val={row.pro} /></td>
                      <td className="px-6 py-2.5 text-center border-l border-[#21262d]/40"><CellValue val={row.trader} /></td>
                      <td className="px-6 py-2.5 text-center border-l border-[#21262d]/40"><CellValue val={row.quant} /></td>
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
            className="rounded-xl bg-[#161b27] shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 border border-[#21262d] overflow-hidden"
          >
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
            >
              <span className="text-sm font-semibold text-[#f0f6fc]">{faq.q}</span>
              {openFaq === i ? (
                <ChevronUp className="size-4 text-[#8d96a0] shrink-0" />
              ) : (
                <ChevronDown className="size-4 text-[#8d96a0] shrink-0" />
              )}
            </button>
            {openFaq === i && (
              <div className="px-5 pb-4 border-t border-[#21262d]">
                <p className="text-sm text-[#8d96a0] leading-relaxed pt-3">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ─── BOTTOM CTA ──────────────────────────────────────────────────── */}
      <div className="text-center space-y-4 py-8 border-t border-[#21262d]">
        <h2 className="text-2xl font-bold">Still have questions?</h2>
        <p className="text-[#8d96a0] text-sm">We&apos;re happy to help you find the right tier.</p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a
            href="mailto:hello@quivermarkets.com"
            className="px-5 py-2.5 rounded-xl bg-[#57D7BA] text-[#0d1117] text-sm font-bold hover:bg-[#57D7BA]/90 transition-colors active:scale-[0.97]"
          >
            Email us
          </a>
          <Link
            href="/api-docs"
            className="px-5 py-2.5 rounded-xl border border-[#21262d] text-[#8d96a0] text-sm hover:text-[#f0f6fc] hover:border-[#484f58] transition-colors"
          >
            View API docs
          </Link>
        </div>
      </div>
    </div>
  );
}
