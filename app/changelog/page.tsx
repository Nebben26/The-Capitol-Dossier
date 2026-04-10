"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const ENTRIES = [
  {
    version: "v0.42",
    date: "April 10, 2026",
    description:
      "Backend hardening + mobile polish: fixed ingest schema cache errors (NOTIFY pgrst reload on startup); added poly_volume/kalshi_volume columns to disagreements table; fixed detect-story-events.ts (close_time → end_date, removed bad volume filter, added diagnostics); stories now generate correctly. Mobile audit — screener search debounced (250ms) with clear button, filter bar split into 2 rows; leaderboard and screener category chips full-width bleed scroll on mobile; calibration tables scroll horizontally on 375px. Added /api/v1/spread-history endpoint to API docs.",
  },
  {
    version: "v0.39",
    date: "April 9, 2026",
    description:
      "Insight Engine + Polish: Auto-generated Market Insights stories from live events (spread moves, whale activity, resolution alerts) — 10 templates, quality scoring, free/pro tiers, RSS feed, and methodology page. Annualized return capped at 999%+ with SHORT-TERM badge for ≤3-day windows; Capital Efficiency strip now filters out short-duration and low-volume positions. 4-tier pricing (Free $0, Pro $49, Trader $149 NEW, Quant API $299). Whale wallet labels with display-name resolution throughout the site.",
  },
  {
    version: "v0.38",
    date: "April 9, 2026",
    description:
      "Spread Diagnostics: Every disagreement now shows WHY it exists (Information Lag, Liquidity Gap, Fee Differential, Resolution Mismatch, User Base Bias, or Structural) and resolution criteria verification catches pseudo-arbitrage where platforms define markets differently. Filter disagreements by cause type to find only actionable spreads. The screener now shows causation tags inline on cross-platform markets.",
  },
  {
    version: "v0.37",
    date: "April 9, 2026",
    description:
      "Historical Spread Charts + Velocity Indicator: lightweight-charts spread history (24H/3D/7D windows) on all arbitrage opportunities, real-time velocity signal (widening/narrowing/stable with confidence rating), velocity column in table view, spread-history API endpoint for Pro+ subscribers.",
  },
  {
    version: "v0.36",
    date: "April 9, 2026",
    description:
      "Spread Execution Planner + Capital Efficiency Ranker: interactive capital slider with 4 fee regimes, gross/net profit, annualized return after fees, Execute panel on all disagree rows/cards, Best Capital Efficiency strip (top-3 by annualized return), annualized return sort column.",
  },
  {
    version: "v0.35",
    date: "April 8, 2026",
    description:
      "Audit cleanup #2: homepage search box, section reorder, pricing collapsed to 3 tiers, breadcrumbs on market pages, changelog page, sitemap.xml, sharper Pro paywall, category filters on /alerts, Back-to-top button, Smart Money Watch rename, robots.txt, waitlist copy clarified.",
  },
  {
    version: "v0.34",
    date: "April 8, 2026",
    description:
      "Audit cleanup #1: 0.0% display bug fixed, S&P HTML entity decoded, PWA manifest added, OG image dynamic route, marketing copy refreshed (200+ whales, 180+ signals), /status fake uptime removed, leaderboard accuracy footnote, health route returns 503 on DB error, 18+ consent on waitlist, aria-labels.",
  },
  {
    version: "v0.33",
    date: "April 7, 2026",
    description:
      "External services: Cloudflare Web Analytics, Sentry error tracking, Privacy Policy, Terms of Service, waitlist form with Supabase backend and 18+ consent.",
  },
  {
    version: "v0.32",
    date: "April 6, 2026",
    description:
      "Data freshness indicators on /alerts and /status, Morning Brief scroll arrows, shared Footer with disclaimer, centralized pricing config in lib/pricing.ts, signal accuracy infrastructure.",
  },
  {
    version: "v0.31",
    date: "April 5, 2026",
    description:
      "Smart Signals historical accuracy infrastructure, About/Roadmap/Contact pages, market detail performance fixes, Smart Money Watch (virtual portfolio tracker).",
  },
  {
    version: "v0.30",
    date: "April 4, 2026",
    description:
      "Pricing page with tier comparison table, AI Market Thesis with Pro gating (bull/bear/catalysts/whale read/historical context).",
  },
  {
    version: "v0.29",
    date: "April 3, 2026",
    description:
      "Kalshi candlestick charts with lightweight-charts v5, 23,000+ price candles ingested.",
  },
  {
    version: "v0.28",
    date: "April 2, 2026",
    description:
      "Smart Money Watch — virtual portfolio tracker for top whale positions.",
  },
  {
    version: "v0.27",
    date: "April 1, 2026",
    description:
      "Morning Brief overnight summary with category hotspots and AI-generated context.",
  },
  {
    version: "v0.26",
    date: "March 31, 2026",
    description:
      "Smart Signal Alerts: Whale Consensus, Concentration, Size Spike, and Divergence detection across all markets.",
  },
  {
    version: "v0.25",
    date: "March 30, 2026",
    description:
      "Cross-platform arbitrage scanner tracking 300+ disagreements across 6,500+ markets.",
  },
  {
    version: "v0.20",
    date: "March 25, 2026",
    description:
      "Public REST API with API key auth, rate limiting, and three access tiers.",
  },
  {
    version: "v0.10",
    date: "March 15, 2026",
    description:
      "Initial dashboard with 200+ whale wallets tracked across Polymarket.",
  },
];

export default function ChangelogPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[#8892b0] hover:text-[#57D7BA] transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to Dashboard
      </Link>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-[#e2e8f0]">Changelog</h1>
        <p className="text-sm text-[#8892b0]">Every meaningful update to Quiver Markets.</p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[7.5rem] top-0 bottom-0 w-px bg-[#2f374f]" />

        <div className="space-y-8">
          {ENTRIES.map((entry) => (
            <div key={entry.version} className="flex gap-6">
              {/* Left: date */}
              <div className="w-28 shrink-0 pt-0.5 text-right">
                <div className="text-[10px] text-[#4a5168] leading-relaxed">{entry.date}</div>
              </div>

              {/* Dot */}
              <div className="relative shrink-0 flex items-start pt-1.5">
                <div className="size-3 rounded-full bg-[#57D7BA] border-2 border-[#1a1e2e] z-10" />
              </div>

              {/* Right: content */}
              <div className="flex-1 pb-2">
                <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#57D7BA]/10 border border-[#57D7BA]/20 text-[#57D7BA] text-[10px] font-bold font-mono mb-2">
                  {entry.version}
                </div>
                <p className="text-sm text-[#8892b0] leading-relaxed">{entry.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-[#4a5168] pt-4 border-t border-[#2f374f]">
        © 2026 Quiver Markets.{" "}
        <Link href="/roadmap" className="hover:text-[#57D7BA] transition-colors">
          See what&apos;s coming next →
        </Link>
      </p>
    </div>
  );
}
