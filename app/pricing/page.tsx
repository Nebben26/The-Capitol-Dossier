"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Check, X, Star, ChevronDown, ChevronUp, Zap, Building2, BarChart2, Loader2, Send } from "lucide-react";
import { PRICING } from "@/lib/pricing";
import { WaitlistModal } from "@/components/pricing/waitlist-modal";
import { CheckoutSuccess } from "@/components/pricing/checkout-success";
import { AuthModal } from "@/components/auth/auth-modal";
import { TestModeBanner } from "@/components/ui/test-mode-banner";
import { supabase } from "@/lib/supabase";
import { trackEvent, AnalyticsEvents } from "@/lib/analytics";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TierVal = string | boolean;

interface Feature {
  label: string;
  free: TierVal;
  pro: TierVal;
  trader: TierVal;
  signal_desk: TierVal;
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
      { label: "Cross-platform arbitrage scanner", free: true, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "AI Market Thesis (preview)", free: true, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "AI Market Thesis (full)", free: false, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "Smart Signal Alerts (top 5)", free: true, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "Smart Signal Alerts (all 180+)", free: false, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "Whale leaderboard", free: true, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "Whale position history", free: false, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "Smart Money Watch", free: true, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "Market Insights stories", free: "Free only", pro: true, trader: true, signal_desk: true, quant: true },
    ],
  },
  {
    heading: "EXECUTION",
    rows: [
      { label: "Spread execution calculator", free: true, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "Causation analysis", free: true, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "Resolution criteria diff", free: false, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "Spread velocity indicator", free: false, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "Spread history", free: false, pro: "7d", trader: "30d", signal_desk: "30d", quant: "90d" },
      { label: "Capital efficiency ranker", free: false, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "Best annualized return strip", free: false, pro: true, trader: true, signal_desk: true, quant: true },
    ],
  },
  {
    heading: "REAL-TIME ALERTS",
    rows: [
      { label: "Telegram push alerts", free: false, pro: false, trader: false, signal_desk: true, quant: true },
      { label: "Configurable spread thresholds (3–30pt)", free: false, pro: false, trader: false, signal_desk: true, quant: true },
      { label: "Whale position alerts ($10K–$500K)", free: false, pro: false, trader: false, signal_desk: true, quant: true },
      { label: "Category-specific alert filters", free: false, pro: false, trader: false, signal_desk: true, quant: true },
      { label: "Up to 50 alerts/day", free: false, pro: false, trader: false, signal_desk: true, quant: true },
      { label: "Private Discord/Telegram community", free: false, pro: false, trader: false, signal_desk: true, quant: true },
      { label: "Weekly recap PDF", free: false, pro: false, trader: false, signal_desk: true, quant: true },
    ],
  },
  {
    heading: "DATA",
    rows: [
      { label: "6,500+ markets", free: true, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "300+ disagreements", free: true, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "200+ whale wallets", free: true, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "News catalysts", free: true, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "Historical archive", free: false, pro: false, trader: "90d", signal_desk: "90d", quant: "Full" },
      { label: "CSV export", free: false, pro: true, trader: true, signal_desk: true, quant: true },
    ],
  },
  {
    heading: "API",
    rows: [
      { label: "REST endpoints", free: false, pro: false, trader: false, signal_desk: false, quant: true },
      { label: "Rate limit / minute", free: false, pro: false, trader: false, signal_desk: false, quant: "60" },
      { label: "Rate limit / day", free: false, pro: false, trader: false, signal_desk: false, quant: "5,000" },
      { label: "Webhooks", free: false, pro: false, trader: false, signal_desk: false, quant: "Soon" },
    ],
  },
  {
    heading: "SUPPORT",
    rows: [
      { label: "Email support", free: true, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "Priority support", free: false, pro: true, trader: true, signal_desk: true, quant: true },
      { label: "Slack channel", free: false, pro: false, trader: true, signal_desk: true, quant: true },
      { label: "Custom data requests", free: false, pro: false, trader: false, signal_desk: false, quant: true },
      { label: "Weekly Smart Money Report", free: false, pro: false, trader: true, signal_desk: true, quant: true },
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
    q: "What makes Signal Desk different from Trader?",
    a: "Signal Desk is for traders who deploy capital and need to act fast. It adds real-time Telegram push alerts the moment arbitrage spreads open or whale wallets take large positions. You set your own thresholds (3–30pt spreads, $10K–$500K whale size) and get alerted instantly — no refreshing required. It also includes private Discord/Telegram community access and a weekly closed-arb recap PDF.",
  },
  {
    q: "How do the Telegram alerts work?",
    a: "After subscribing to Signal Desk, go to Settings → Telegram Alerts and generate a connection link. Open it in Telegram, tap Start, and you're linked. Alerts fire in real-time as our ingest pipeline runs (every 30 minutes). You can adjust thresholds, pause alerts, or unsubscribe at any time via bot commands.",
  },
  {
    q: "What is the Signal Desk founder price?",
    a: "The first 25 Signal Desk subscribers lock in $149/mo forever — a $50/mo discount off the $199/mo list price. This pricing is locked for life and won't increase when you renew. After 25 spots are filled, the price moves to $199/mo.",
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
    a: "Yes — 2 months free when billed annually on any paid tier. Pro: $490/yr, Trader: $1,490/yr, Signal Desk: $1,990/yr, Quant API: $3,990/yr.",
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

  useEffect(() => {
    trackEvent(AnalyticsEvents.VIEW_PRICING);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [waitlistOpen, setWaitlistOpen] = useState<string | null>(null);

  // Stripe checkout state
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<{ tier: "pro" | "trader" | "signal_desk"; cycle: "monthly" | "annual" } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle success/cancel redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      setShowSuccess(true);
      window.history.replaceState({}, "", "/pricing");
    } else if (params.get("canceled") === "true") {
      window.history.replaceState({}, "", "/pricing");
    }
  }, []);

  // After auth: fire pending checkout
  useEffect(() => {
    if (!pendingCheckout) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && pendingCheckout) {
        const { tier, cycle } = pendingCheckout;
        setPendingCheckout(null);
        handleCheckout(tier, cycle);
      }
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCheckout]);

  const handleCheckout = async (tier: "pro" | "trader" | "signal_desk", cycle: "monthly" | "annual") => {
    trackEvent(AnalyticsEvents.CLICK_SUBSCRIBE, { tier, cycle });
    const key = `${tier}_${cycle}`;
    setCheckoutLoading(key);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setPendingCheckout({ tier, cycle });
        setAuthModalOpen(true);
        setCheckoutLoading(null);
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          cycle,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      const data = await res.json();
      if (data.error) {
        alert(data.error);
        setCheckoutLoading(null);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      alert(err.message || "Checkout failed. Please try again.");
      setCheckoutLoading(null);
    }
  };

  const isStripeEnabled = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes("PLACEHOLDER");

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
        { label: "Real-time Telegram alerts", included: false },
      ],
      cta: "Start free",
      ctaHref: "/",
      ctaIsLink: true,
      ctaStyle: "border border-[#21262d] text-[#8d96a0] hover:text-[#f0f6fc] hover:border-[#484f58]",
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
      cta: isStripeEnabled ? "Subscribe to Pro" : "Join the waitlist",
      ctaStyle: "bg-[#57D7BA] text-[#0d1117] hover:bg-[#57D7BA]/90 font-bold shadow-glow-brand",
      ctaIsLink: false,
      tierId: "pro" as const,
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
      features: [
        { label: "Everything in Pro", included: true },
        { label: "30-day spread history", included: true },
        { label: "Slack channel access", included: true },
        { label: "Weekly Smart Money Report PDF", included: true },
        { label: "Priority Slack support", included: true },
        { label: "Real-time Telegram alerts", included: false },
      ],
      cta: isStripeEnabled ? "Subscribe to Trader" : "Join the waitlist",
      ctaStyle: "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 hover:bg-[#f59e0b]/20 font-semibold",
      ctaIsLink: false,
      tierId: "trader" as const,
    },
    {
      id: "signal_desk",
      badge: "Signal Desk",
      badgeColor: "#d29922",
      badgeBg: "#d2992218",
      icon: <Send className="size-3 text-[#d29922]" />,
      monthlyPrice: PRICING.signal_desk.price,
      description: "Real-time push alerts for traders who deploy capital",
      featured: false,
      isNew: true,
      founderPrice: PRICING.signal_desk.founderPrice,
      founderSpots: PRICING.signal_desk.founderSpots,
      features: [
        { label: "Everything in Trader", included: true },
        { label: "Real-time Telegram push alerts", included: true },
        { label: "Configurable spread thresholds (3–30pt)", included: true },
        { label: "Whale position alerts ($10K–$500K)", included: true },
        { label: "Up to 50 alerts per day", included: true },
        { label: "Private Discord/Telegram community", included: true },
        { label: "Weekly recap PDF (closed arb performance)", included: true },
      ],
      cta: isStripeEnabled ? "Subscribe to Signal Desk" : "Join the waitlist",
      ctaStyle: "bg-[#d29922]/10 text-[#d29922] border border-[#d29922]/30 hover:bg-[#d29922]/20 font-semibold",
      ctaIsLink: false,
      tierId: "signal_desk" as const,
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
        { label: "Everything in Signal Desk", included: true },
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
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Modals */}
      <WaitlistModal
        open={waitlistOpen !== null}
        onClose={() => setWaitlistOpen(null)}
        tier={waitlistOpen ?? undefined}
      />
      <AuthModal
        open={authModalOpen}
        onClose={() => { setAuthModalOpen(false); setCheckoutLoading(null); }}
        title="Sign in to subscribe"
        subtitle="Create a free account or sign in to continue checkout"
        onSuccess={() => { /* pendingCheckout useEffect handles the rest */ }}
      />
      {showSuccess && <CheckoutSuccess onClose={() => setShowSuccess(false)} />}

      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <div className="text-center space-y-3">
        <div className="flex justify-center mb-2">
          <TestModeBanner />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#57D7BA]/10 border border-[#57D7BA]/20 text-[11px] text-[#57D7BA] font-semibold">
          <Zap className="size-3" /> Transparent Pricing
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Pricing</h1>
        <p className="text-[#8d96a0] max-w-xl mx-auto">
          Five tiers, no hidden fees. Start free, upgrade when you see the alpha.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 items-start">
        {tiers.map((tier) => (
          <div key={tier.id} className="relative">
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
                  {!tier.featured && (
                    <div
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: tier.badgeBg, color: tier.badgeColor }}
                    >
                      {tier.icon}
                      {tier.badge}
                    </div>
                  )}
                  {"isNew" in tier && tier.isNew && (
                    <span className="text-[8px] font-bold uppercase tracking-wide text-[#d29922] bg-[#d29922]/10 border border-[#d29922]/20 px-1.5 py-0.5 rounded-full">
                      NEW
                    </span>
                  )}
                </div>

                {/* Price */}
                <PriceDisplay monthlyPrice={tier.monthlyPrice} billingCycle={billingCycle} />

                {/* Founder price note for signal_desk */}
                {"founderPrice" in tier && tier.founderPrice && (
                  <p className="text-[10px] text-[#d29922] leading-relaxed -mt-1">
                    First {tier.founderSpots} customers lock in ${tier.founderPrice}/mo forever
                  </p>
                )}

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
                {"ctaIsLink" in tier && tier.ctaIsLink && "ctaHref" in tier ? (
                  <a
                    href={tier.ctaHref as string}
                    className={`w-full py-3 rounded-xl text-xs text-center transition-all block mt-2 min-h-[44px] flex items-center justify-center active:scale-[0.97] ${tier.ctaStyle}`}
                  >
                    {tier.cta}
                  </a>
                ) : "tierId" in tier && tier.tierId && isStripeEnabled ? (
                  <button
                    onClick={() => handleCheckout(tier.tierId as "pro" | "trader" | "signal_desk", billingCycle)}
                    disabled={checkoutLoading === `${tier.tierId}_${billingCycle}`}
                    className={`w-full py-3 rounded-xl text-xs text-center transition-all block mt-2 min-h-[44px] flex items-center justify-center active:scale-[0.97] disabled:opacity-70 gap-2 ${tier.ctaStyle}`}
                  >
                    {checkoutLoading === `${tier.tierId}_${billingCycle}` && (
                      <Loader2 className="size-3.5 animate-spin" />
                    )}
                    {checkoutLoading === `${tier.tierId}_${billingCycle}` ? "Loading..." : tier.cta}
                  </button>
                ) : (
                  <button
                    onClick={() => setWaitlistOpen(tier.badge)}
                    className={`w-full py-3 rounded-xl text-xs text-center transition-all block mt-2 min-h-[44px] flex items-center justify-center active:scale-[0.97] ${tier.ctaStyle}`}
                  >
                    {tier.cta}
                  </button>
                )}

                {/* Waitlist pricing note (only when Stripe not configured) */}
                {!isStripeEnabled && (tier.id === "pro" || tier.id === "signal_desk") && (
                  <p className="text-[10px] text-[#8d96a0] text-center pt-1">
                    {tier.id === "pro"
                      ? "Founder cohort: $39/mo locked in for life."
                      : "Founder cohort: first 25 get $149/mo locked in for life."}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── SIGNAL DESK CALLOUT ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#d29922]/30 bg-gradient-to-r from-[#d29922]/5 via-[#161b27] to-[#161b27] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-10 h-10 rounded-xl bg-[#d29922]/15 flex items-center justify-center shrink-0">
          <Send className="w-5 h-5 text-[#d29922]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-[#d29922]">Signal Desk</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#d29922] bg-[#d29922]/10 border border-[#d29922]/20 px-1.5 py-0.5 rounded-full">NEW</span>
          </div>
          <p className="text-sm text-[#8d96a0] leading-relaxed">
            The moment an arb spread opens or a whale takes a $50K+ position, you get a Telegram message.
            Set your own thresholds, filter by category, get up to 50 alerts/day. No dashboard refreshing required.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-[#d29922] font-mono">$199<span className="text-sm font-normal text-[#8d96a0]">/mo</span></div>
          <p className="text-[10px] text-[#d29922] mt-0.5">First 25 spots: $149/mo forever</p>
        </div>
      </div>

      {/* ─── COMPARISON TABLE ────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-[#f0f6fc] text-center mb-2 tracking-tight">Compare plans</h2>
        <p className="text-sm text-[#8d96a0] text-center mb-8">Every feature at a glance.</p>

        <div className="overflow-x-auto rounded-xl border border-[#21262d] shadow-card">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-[#21262d] bg-[#161b27]">
                <th className="text-left px-4 py-4 text-[#8d96a0] font-medium w-[26%]">Feature</th>
                <th className="text-center px-3 py-4 text-[#f0f6fc] font-semibold w-[12%] border-l border-[#21262d]">Free</th>
                <th className="text-center px-3 py-4 text-[#57D7BA] font-semibold w-[13%] border-l border-[#21262d]">Pro</th>
                <th className="text-center px-3 py-4 text-[#f59e0b] font-semibold w-[13%] border-l border-[#21262d]">Trader</th>
                <th className="text-center px-3 py-4 text-[#d29922] font-semibold w-[14%] border-l border-[#21262d]">
                  Signal Desk
                  <span className="ml-1 text-[8px] font-bold bg-[#d29922]/15 px-1 py-0.5 rounded">NEW</span>
                </th>
                <th className="text-center px-3 py-4 text-[#8b5cf6] font-semibold w-[13%] border-l border-[#21262d]">Quant API</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((section) => (
                <React.Fragment key={section.heading}>
                  <tr className="bg-[#0d1117]/60">
                    <td colSpan={6} className="px-4 py-2 text-[10px] font-bold tracking-widest text-[#484f58] uppercase">
                      {section.heading}
                    </td>
                  </tr>
                  {section.rows.map((row, i) => (
                    <tr
                      key={row.label}
                      className={`border-t border-[#21262d]/40 ${i % 2 === 0 ? "bg-[#161b27]" : "bg-[#1c2333]"}`}
                    >
                      <td className="px-4 py-2.5 text-[#8d96a0] text-xs">{row.label}</td>
                      <td className="px-3 py-2.5 text-center border-l border-[#21262d]/40"><CellValue val={row.free} /></td>
                      <td className="px-3 py-2.5 text-center border-l border-[#21262d]/40"><CellValue val={row.pro} /></td>
                      <td className="px-3 py-2.5 text-center border-l border-[#21262d]/40"><CellValue val={row.trader} /></td>
                      <td className="px-3 py-2.5 text-center border-l border-[#21262d]/40"><CellValue val={row.signal_desk} /></td>
                      <td className="px-3 py-2.5 text-center border-l border-[#21262d]/40"><CellValue val={row.quant} /></td>
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
