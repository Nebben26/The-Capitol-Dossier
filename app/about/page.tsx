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
            Built for traders who got tired of prediction market intelligence being scattered across five tabs.
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

      {/* ─── Story ─── */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-[#f0f6fc]">Why this exists</h2>
        <div className="space-y-5 text-[15px] text-[#8d96a0] leading-relaxed">
          <p>
            Quiver Markets started from a specific frustration. If you wanted to know what was actually
            happening across Polymarket and Kalshi at the same time, you had to open both sites in separate
            tabs, manually compare prices on the same event, and try to spot spreads before they closed.
            There was no single dashboard for cross-platform arbitrage, no systematic whale tracking, no
            honest data layer on top of the raw market feeds. Every trader was reinventing the same
            research workflow.
          </p>
          <p>
            The prediction market space is small but it rewards information advantage more brutally than
            any other corner of finance. A 15-point spread between Polymarket and Kalshi on the same
            question is free money — if you can see it. A whale wallet accumulating YES on a political
            market two weeks before a poll shift is an edge — if you know who to watch. None of this is
            hidden. It&apos;s just scattered. We built Quiver to aggregate it.
          </p>
          <p>
            We refresh every 30 minutes. We compute every signal from live on-chain and exchange data,
            not editorial opinions. We document every formula on the{" "}
            <Link href="/methodology" className="text-[#57D7BA] hover:underline">Methodology page</Link>{" "}
            so you can see how the numbers are built and decide whether to trust them. We don&apos;t take
            positions in the markets we track, we don&apos;t sell leads to trading firms, and we don&apos;t serve
            ads. The business model is a subscription, the product is intelligence, and the bet is that a
            small number of serious prediction market traders will pay for a tool that saves them hours
            per week.
          </p>
        </div>
      </div>

      {/* ─── Founder ─── */}
      <div className="rounded-2xl bg-[#161b27] border border-[#21262d] p-6 space-y-3">
        <h2 className="text-base font-bold text-[#f0f6fc]">Who built this</h2>
        <p className="text-[13px] text-[#8d96a0] leading-relaxed">
          Built and operated by Ben Horch, a solo entrepreneur in Missouri who&apos;s been watching prediction
          markets since 2020 and running a separate options alerts business that taught him how serious
          traders actually consume data. Quiver is the tool he wished existed.
        </p>
        <p className="text-[13px] text-[#8d96a0] leading-relaxed">
          If you want to reach out, email{" "}
          <a href="mailto:hello@quivermarkets.com" className="text-[#57D7BA] hover:underline">hello@quivermarkets.com</a>
          {" "}or find him on{" "}
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-[#57D7BA] hover:underline">Twitter</a>.
        </p>
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
