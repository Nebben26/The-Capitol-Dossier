"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  GitCompareArrows,
  DollarSign,
  TrendingUp,
  Newspaper,
  ArrowRight,
  X,
  CheckCircle,
} from "lucide-react";
import {
  getTopMarkets,
  getDisagreements,
  getAllWhales,
  getSmartMoneyFlow,
} from "@/lib/api";
import { formatUsd, formatCount } from "@/lib/format";
import { supabase } from "@/lib/supabase";

// ─── LIVE STAT STRIP ──────────────────────────────────────────────────────────

interface HeroStats {
  markets: string;
  arbs: string;
  whales: string;
  capital: string;
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────────────────

const steps = [
  { n: 1, text: "We pull live data from Polymarket and Kalshi every 30 minutes" },
  { n: 2, text: "We compute cross-platform spreads, whale flows, and catalysts" },
  { n: 3, text: "You see signals nobody else in the space is surfacing" },
];

// ─── FEATURE CARDS ────────────────────────────────────────────────────────────

interface FeatureCard {
  icon: React.ElementType;
  title: string;
  description: string;
  liveStat: string;
  color: string;
  href: string;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function FirstVisitHero() {
  const [visible, setVisible] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const [stats, setStats] = useState<HeroStats>({
    markets: "—",
    arbs: "—",
    whales: "—",
    capital: "—",
  });
  const [featureStats, setFeatureStats] = useState({
    topScore: "—",
    biggestFlow: "—",
    catalysts: "—",
  });
  const heroRef = useRef<HTMLDivElement>(null);

  // Check localStorage after mount (avoid hydration mismatch)
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("qm_seen_hero")) {
      setVisible(true);
    }
  }, []);

  // Load live stats
  useEffect(() => {
    if (!visible) return;

    Promise.all([
      getTopMarkets(500),
      getDisagreements(),
      getAllWhales(),
      getSmartMoneyFlow(),
    ]).then(([markets, disagrees, whales, flow]) => {
      const totalCapital = flow.data.reduce(
        (s, f) => s + f.yesValueUsd + f.noValueUsd,
        0
      );
      const topScore = disagrees.data.reduce(
        (max, d) => Math.max(max, (d as any).opportunityScore ?? 0),
        0
      );
      const biggestFlowCat = [...flow.data].sort(
        (a, b) => Math.abs(b.netFlowUsd) - Math.abs(a.netFlowUsd)
      )[0];

      setStats({
        markets: formatCount(markets.data.length),
        arbs: formatCount(disagrees.data.length),
        whales: formatCount(whales.data.length),
        capital: formatUsd(totalCapital),
      });

      setFeatureStats({
        topScore: topScore > 0 ? `${topScore.toLocaleString()} highest score right now` : "Score active now",
        biggestFlow: biggestFlowCat
          ? `${biggestFlowCat.category}: ${biggestFlowCat.netFlowUsd >= 0 ? "YES" : "NO"} flow ${formatUsd(Math.abs(biggestFlowCat.netFlowUsd))}`
          : "Flow data loading",
        catalysts: "—",
      });

      // Quick catalyst count from supabase
      supabase
        .from("news_articles")
        .select("id", { count: "exact", head: true })
        .then(({ count }) => {
          if (count && count > 0) {
            setFeatureStats((prev) => ({
              ...prev,
              catalysts: `${count.toLocaleString()} catalysts active now`,
            }));
          }
        });
    });
  }, [visible]);

  const dismiss = (scrollDown?: boolean) => {
    localStorage.setItem("qm_seen_hero", "1");
    setCollapsing(true);
    if (scrollDown) {
      const el = document.getElementById("dashboard-content");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
    setTimeout(() => setVisible(false), 320);
  };

  if (!visible) return null;

  const featureCards: FeatureCard[] = [
    {
      icon: GitCompareArrows,
      title: "Cross-platform arbitrage",
      description:
        "Every time Polymarket and Kalshi disagree on the same event, we surface it with an opportunity score that weights by tradeable liquidity.",
      liveStat: featureStats.topScore,
      color: "#f59e0b",
      href: "/disagrees",
    },
    {
      icon: DollarSign,
      title: "Smart money flow by category",
      description:
        "Track where whale capital is moving across Sports, Elections, Crypto, and more — aggregated from every position on both platforms.",
      liveStat: featureStats.biggestFlow,
      color: "#57D7BA",
      href: "/flow",
    },
    {
      icon: TrendingUp,
      title: "Spread convergence tracking",
      description:
        "Every disagreement has a 48-hour spread history so you can see which arbs are actively closing and which are dead money.",
      liveStat: "Snapshotted every 30 minutes",
      color: "#8b5cf6",
      href: "/disagrees",
    },
    {
      icon: Newspaper,
      title: "News catalysts tagged to markets",
      description:
        "Real-time news from 8 financial sources auto-tagged to the specific markets they affect — so you never miss what moved the price.",
      liveStat: featureStats.catalysts,
      color: "#6366f1",
      href: "/insights",
    },
  ];

  return (
    <div
      ref={heroRef}
      className="overflow-hidden transition-all duration-300 ease-in-out"
      style={{ maxHeight: collapsing ? "0px" : "2000px", opacity: collapsing ? 0 : 1 }}
    >
      <div className="rounded-xl bg-gradient-to-br from-[#1e2235] to-[#161b27] border border-[#21262d] overflow-hidden mb-5">

        {/* ── SECTION A: VALUE PROP ────────────────────────────────────── */}
        <div className="relative px-4 sm:px-5 pt-5 sm:pt-6 pb-4 sm:pb-5">
          {/* Dismiss X */}
          <button
            onClick={() => dismiss(false)}
            className="absolute top-4 right-4 text-[#8892b0] hover:text-[#e2e8f0] transition-colors"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>

          {/* Headline */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#57D7BA]/10 border border-[#57D7BA]/20 text-[#57D7BA] text-[10px] font-bold uppercase tracking-wider mb-4">
              <span className="relative flex size-1.5"><span className="absolute inline-flex size-full rounded-full bg-[#57D7BA] opacity-75 animate-ping" /><span className="relative inline-flex size-1.5 rounded-full bg-[#57D7BA]" /></span>
              Live intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#e2e8f0] leading-tight mb-3">
              Prediction market intelligence<br className="hidden sm:block" />
              <span className="text-[#57D7BA]"> you can't get anywhere else</span>
            </h1>
            <p className="text-sm sm:text-base text-[#8892b0] max-w-2xl mb-5">
              Real-time arbitrage, whale flow, and catalysts across Polymarket and Kalshi — all in one place.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <button
                onClick={() => dismiss(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#57D7BA] text-[#0f1119] text-sm font-bold hover:bg-[#57D7BA]/90 transition-colors shadow-lg shadow-[#57D7BA]/20"
              >
                See live data
                <ArrowRight className="size-4" />
              </button>
              <button
                onClick={() => dismiss(false)}
                className="px-4 py-2.5 rounded-lg border border-[#21262d] text-[#8892b0] text-sm font-medium hover:border-[#57D7BA]/30 hover:text-[#e2e8f0] transition-colors"
              >
                Dismiss
              </button>
            </div>

            {/* Live stat strip */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: "markets tracked", val: stats.markets },
                { label: "arbitrage opportunities", val: stats.arbs },
                { label: "whales monitored", val: stats.whales },
                { label: "in whale capital", val: stats.capital },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#21262d] text-xs">
                  <span className="font-mono font-bold tabular-nums text-[#57D7BA]">{s.val}</span>
                  <span className="text-[#8892b0]">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#21262d]" />

        {/* ── SECTION B: FEATURE CARDS ─────────────────────────────────── */}
        <div className="px-4 sm:px-5 py-4 sm:py-5">
          <p className="text-[10px] text-[#8892b0] uppercase tracking-widest font-semibold mb-4">What you get</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {featureCards.map((card) => (
              <Link key={card.title} href={card.href} className="group block">
                <div className="p-4 rounded-lg bg-[#0d1117] border border-[#21262d] hover:border-[#57D7BA]/20 transition-all h-full">
                  <div className="flex items-start gap-3">
                    <div className="size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${card.color}15` }}>
                      <card.icon className="size-4" style={{ color: card.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors mb-1">{card.title}</p>
                      <p className="text-[11px] text-[#8892b0] leading-relaxed mb-2">{card.description}</p>
                      <div className="flex items-center gap-1 text-[10px] font-mono font-semibold" style={{ color: card.color }}>
                        <span className="size-1 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
                        {card.liveStat}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-[#21262d]" />

        {/* ── SECTION C: HOW IT WORKS ──────────────────────────────────── */}
        <div className="px-4 sm:px-5 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0">
            {steps.map((step, i) => (
              <div key={step.n} className="flex items-start sm:items-center gap-3 flex-1 sm:min-w-0">
                {i > 0 && (
                  <div className="hidden sm:block h-px flex-1 bg-[#21262d] mx-3 shrink-0" style={{ minWidth: "16px" }} />
                )}
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <div className="size-6 rounded-full bg-[#57D7BA]/10 border border-[#57D7BA]/30 flex items-center justify-center shrink-0 text-[10px] font-bold text-[#57D7BA]">{step.n}</div>
                  <p className="text-[11px] text-[#8892b0] leading-snug">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#21262d]" />

        {/* ── SECTION D: PRIMARY CTA ───────────────────────────────────── */}
        <div className="px-4 sm:px-5 py-4 flex justify-center">
          <Link
            href="/disagrees"
            onClick={() => dismiss(false)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#57D7BA] text-[#0f1119] text-sm font-bold hover:bg-[#57D7BA]/90 transition-colors shadow-lg shadow-[#57D7BA]/20"
          >
            See today&apos;s biggest disagreement
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
