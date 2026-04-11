"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Users, GitCompareArrows, Zap, BookOpen, Target, Star } from "lucide-react";

export default function AboutPage() {
  const [stats, setStats] = useState({
    markets: "6,500+",
    whales: "200+",
    disagreements: "300+",
    signals: "180+",
  });

  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const [mRes, wRes, dRes, sRes] = await Promise.all([
          supabase.from("markets").select("id", { count: "exact", head: true }),
          supabase.from("whales").select("id", { count: "exact", head: true }),
          supabase.from("disagreements").select("id", { count: "exact", head: true }),
          supabase.from("signals").select("id", { count: "exact", head: true }),
        ]);
        setStats({
          markets: mRes.count ? `${mRes.count.toLocaleString()}+` : "6,500+",
          whales: wRes.count ? wRes.count.toLocaleString() : "200+",
          disagreements: dRes.count ? `${dRes.count.toLocaleString()}+` : "300+",
          signals: sRes.count ? `${sRes.count.toLocaleString()}+` : "180+",
        });
      } catch { /* use defaults */ }
    })();
  }, []);

  const statItems = [
    { label: "Markets tracked", value: stats.markets, icon: Activity, color: "#57D7BA" },
    { label: "Whale wallets", value: stats.whales, icon: Users, color: "#8b5cf6" },
    { label: "Disagreements detected", value: stats.disagreements, icon: GitCompareArrows, color: "#f59e0b" },
    { label: "Active signals", value: stats.signals, icon: Zap, color: "#3fb950" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">

      {/* ─── Hero ─── */}
      <div className="space-y-4">
        <div className="size-14 rounded-2xl bg-[#57D7BA]/10 border border-[#57D7BA]/20 flex items-center justify-center shadow-glow-brand">
          <Activity className="size-7 text-[#57D7BA]" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#f0f6fc]">About Quiver Markets</h1>
          <p className="text-base text-[#8d96a0] mt-2 leading-relaxed max-w-2xl">
            The intelligence layer for prediction markets. Built by traders who got tired of missing edge because the data was scattered, opaque, and slow.
          </p>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statItems.map((s) => (
          <Card key={s.label} className="bg-[#161b27] border-[#21262d] shadow-card">
            <CardContent className="p-4 flex flex-col gap-2">
              <s.icon className="size-4" style={{ color: s.color }} />
              <div className="text-2xl font-bold text-[#f0f6fc] font-mono tabular-nums">{s.value}</div>
              <div className="text-[11px] text-[#8d96a0]">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Founder story ─── */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-[#f0f6fc]">Why we built this</h2>
        <div className="space-y-5 text-[15px] text-[#8d96a0] leading-relaxed">
          <p>
            Prediction markets are the most honest pricing mechanism humanity has ever built.
            When a market puts a question on the line with real money, the crowd gets serious.
            The problem isn&apos;t the markets — it&apos;s access to the intelligence layer on top of them.
          </p>
          <p>
            We started as quant traders who noticed the same pattern repeatedly: a 15-point spread
            between Polymarket and Kalshi on the same question, sitting there for hours. Whale wallets
            accumulating one side days before a move. Volume anomalies that preceded resolution surges.
            None of this was hard to see — if you had the data aggregated and surfaced in real time.
            Most traders didn&apos;t. We decided to build the tool we wished existed.
          </p>
          <p>
            Quiver Markets aggregates live data from Polymarket and Kalshi, tracks the 200+ most
            accurate whale wallets on-chain, detects cross-platform arbitrage as it forms, and surfaces
            AI-computed signals from real position data — not narratives. We refresh every 30 minutes.
            Everything on this site is derived from math, not opinions.
          </p>
        </div>
      </div>

      {/* ─── Principles ─── */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#f0f6fc]">How we think about this</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: Target,
              color: "#57D7BA",
              title: "Data over narrative",
              body: "Every insight on this platform is computed from on-chain positions and live orderbook data. No opinions, no editorial slant — just the math.",
            },
            {
              icon: Star,
              color: "#d29922",
              title: "Edge belongs to the prepared",
              body: "Most prediction market edge comes from better information processing, not insider knowledge. We level that playing field.",
            },
            {
              icon: BookOpen,
              color: "#388bfd",
              title: "Transparency by default",
              body: "We show our methodology. If you disagree with how a signal is computed, you should be able to see why it fired and make your own call.",
            },
          ].map((p) => (
            <Card key={p.title} className="bg-[#161b27] border-[#21262d]">
              <CardContent className="p-4 space-y-2">
                <div
                  className="size-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${p.color}18` }}
                >
                  <p.icon className="size-4" style={{ color: p.color }} />
                </div>
                <div className="text-sm font-semibold text-[#f0f6fc]">{p.title}</div>
                <div className="text-[12px] text-[#8d96a0] leading-relaxed">{p.body}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ─── What we cover ─── */}
      <div className="rounded-2xl bg-[#161b27] border border-[#21262d] p-6 space-y-4">
        <h2 className="text-base font-bold text-[#f0f6fc]">What Quiver Markets covers</h2>
        <ul className="space-y-2 text-[13px] text-[#8d96a0]">
          {[
            "Live Polymarket + Kalshi market aggregation — 6,500+ markets, updated every 30 minutes",
            "Cross-platform arbitrage scanner — find spreads before they close",
            "Whale wallet tracking — 200+ wallets ranked by historical accuracy",
            "Smart Money signals — AI-detected whale consensus, size spikes, and divergence",
            "Market Calibration — measure your prediction accuracy with Brier scores",
            "Catalyst Calendar — upcoming market-resolving events ranked by tradability",
            "Morning Brief — your daily digest of movers, arbs, and whale activity",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-[#57D7BA] shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* ─── CTA ─── */}
      <div className="pt-4 border-t border-[#21262d] flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link
          href="/pricing"
          className="px-5 py-2.5 rounded-xl bg-[#57D7BA] text-[#0d1117] text-sm font-bold hover:bg-[#57D7BA]/80 transition-colors"
        >
          View pricing
        </Link>
        <Link href="/screener" className="text-sm text-[#8d96a0] hover:text-[#57D7BA] transition-colors">
          Browse markets →
        </Link>
        <Link href="/disagrees" className="text-sm text-[#8d96a0] hover:text-[#57D7BA] transition-colors">
          Find arbitrage →
        </Link>
      </div>
    </div>
  );
}
