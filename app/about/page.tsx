"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Users, GitCompareArrows, Zap } from "lucide-react";

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
    { label: "Active signals", value: stats.signals, icon: Zap, color: "#22c55e" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="size-12 rounded-xl bg-[#57D7BA]/10 flex items-center justify-center">
          <Activity className="size-6 text-[#57D7BA]" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">About Quiver Markets</h1>
      </div>

      {/* Body */}
      <div className="space-y-5 text-[#8892b0] text-[15px] leading-relaxed">
        <p>
          Quiver Markets is the intelligence layer for prediction markets. We aggregate live data from
          Polymarket and Kalshi, track 200+ of the most accurate whale traders, detect cross-platform
          arbitrage, and surface AI-generated market analysis you can&apos;t get anywhere else. Built for
          serious prediction market traders, quants, and researchers.
        </p>
        <p>
          We&apos;re an independent product built by traders for traders. Our goal is simple: close the gap
          between raw prediction market data and actionable trading intelligence. Every signal on this
          site is computed from real on-chain positions and live order book data — no opinions, no
          narrative, just math.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statItems.map((s) => (
          <Card key={s.label} className="bg-[#161b27] border-[#21262d]">
            <CardContent className="p-4 flex flex-col gap-2">
              <s.icon className="size-4" style={{ color: s.color }} />
              <div className="text-2xl font-bold text-[#e2e8f0] font-mono">{s.value}</div>
              <div className="text-[11px] text-[#8892b0]">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="pt-4 border-t border-[#21262d] flex items-center gap-4">
        <Link
          href="/contact"
          className="px-5 py-2.5 rounded-xl bg-[#57D7BA] text-[#0f1119] text-sm font-bold hover:bg-[#57D7BA]/90 transition-colors"
        >
          Get in touch
        </Link>
        <Link href="/roadmap" className="text-sm text-[#8892b0] hover:text-[#57D7BA] transition-colors">
          See what&apos;s coming →
        </Link>
      </div>
    </div>
  );
}
