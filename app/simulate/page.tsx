"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calculator, AlertTriangle, ChevronRight, Zap, TrendingUp } from "lucide-react";

interface ArbRow {
  id: string;
  question: string;
  spread: number;
  poly_price: number;
  kalshi_price: number;
  category: string;
  score?: number;
}

export default function SimulateLandingPage() {
  const [arbs, setArbs] = useState<ArbRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { getDisagreements } = await import("@/lib/api");
        const result = await getDisagreements();
        setArbs(
          result.data.slice(0, 10).map((d) => ({
            id: d.id,
            question: d.question,
            spread: d.spread,
            poly_price: d.polyPrice,
            kalshi_price: d.kalshiPrice,
            category: d.category ?? "Other",
            score: d.opportunityScore,
          }))
        );
      } catch {
        // show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#388bfd]/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-[#388bfd]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">Arb Simulator</h1>
            <p className="text-xs text-[#8d96a0]">Step-by-step execution plans for cross-platform arbitrage.</p>
          </div>
        </div>
        <p className="text-sm text-[#8d96a0] leading-relaxed">
          Select any live arb spread to see a full execution walkthrough: exact legs, risk assessment, fee-adjusted P&L calculator, and historical spread data. Know exactly what you&apos;re trading before you open a position.
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-[#d29922]/10 border border-[#d29922]/20 px-3 py-2 text-[11px] text-[#d29922]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          These are not recommendations. Prediction market arbitrage carries real risk. Read every risk factor in each simulator before executing.
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Zap, title: "Pick an arb", desc: "Choose from the top live spreads below, sorted by spread size." },
          { icon: Calculator, title: "Run the simulator", desc: "See step-by-step execution, risk factors, and fee-adjusted return." },
          { icon: TrendingUp, title: "Execute or watch", desc: "Execute with confidence or track the spread history over time." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl bg-[#161b27] border border-[#21262d] p-3 space-y-1.5">
            <f.icon className="w-4 h-4 text-[#388bfd]" />
            <div className="text-xs font-semibold text-[#f0f6fc]">{f.title}</div>
            <div className="text-[10px] text-[#8d96a0] leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Top arbs */}
      <div>
        <h2 className="text-sm font-bold text-[#f0f6fc] mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#d29922]" />
          Top 10 Live Arb Spreads
        </h2>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-[#161b27] border border-[#21262d] animate-pulse" />
            ))}
          </div>
        ) : arbs.length === 0 ? (
          <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-8 text-center">
            <Calculator className="w-8 h-8 text-[#484f58] mx-auto mb-3" />
            <p className="text-sm text-[#484f58]">No arb spreads found.</p>
            <p className="text-xs text-[#484f58] mt-1">Run the ingestion script to populate live data.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {arbs.map((arb, i) => {
              const spreadColor = arb.spread >= 20 ? "#f85149" : arb.spread >= 10 ? "#d29922" : "#57D7BA";
              return (
                <Link
                  key={arb.id}
                  href={`/simulate/${arb.id}`}
                  className="flex items-center gap-3 rounded-xl bg-[#161b27] border border-[#21262d] hover:border-[#388bfd]/30 hover:bg-[#1c2333] p-4 transition-all group"
                >
                  <span className="text-[10px] font-bold text-[#484f58] w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#f0f6fc] line-clamp-1 group-hover:text-[#388bfd] transition-colors">
                      {arb.question}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#484f58]">{arb.category}</span>
                      <span className="text-[10px] text-[#484f58]">·</span>
                      <span className="text-[10px] font-mono text-[#8d96a0]">
                        Poly {arb.poly_price}¢ · Kalshi {arb.kalshi_price}¢
                      </span>
                    </div>
                  </div>
                  <span
                    className="text-sm font-bold font-mono tabular-nums shrink-0 px-2.5 py-1 rounded-lg border"
                    style={{ color: spreadColor, borderColor: `${spreadColor}30`, backgroundColor: `${spreadColor}10` }}
                  >
                    {arb.spread}pt
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#484f58] shrink-0 group-hover:text-[#388bfd] transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center">
        <Link
          href="/disagrees"
          className="inline-flex items-center gap-1.5 text-xs text-[#388bfd] hover:text-[#388bfd]/80 transition-colors"
        >
          View all arb spreads on the Disagrees page →
        </Link>
      </div>
    </div>
  );
}
