"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { marketById } from "@/lib/mockData";

function MarketEmbed() {
  const params = useSearchParams();
  const id = params.get("id") || "recession-2026";
  const m = marketById[id];
  if (!m) return <div className="p-4 text-xs text-[#8892b0]">Market not found</div>;
  const positive = m.change >= 0;

  return (
    <div className="bg-[#0d1117] text-[#e2e8f0] p-4 rounded-xl border border-[#21262d] font-sans max-w-sm" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="flex items-center gap-1.5 mb-2">
        <div className="size-4 rounded bg-[#57D7BA] flex items-center justify-center"><Activity className="size-2.5 text-[#0f1119]" /></div>
        <span className="text-[8px] text-[#8892b0] uppercase tracking-wider font-semibold">Quiver Markets</span>
      </div>
      <p className="text-xs font-semibold leading-snug mb-3">{m.question}</p>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums">{m.price}<span className="text-sm text-[#8892b0]">¢</span></span>
          <span className={`flex items-center gap-0.5 font-mono text-xs font-bold tabular-nums ${positive ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
            {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}{Math.abs(m.change)}%
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#57D7BA]/10 text-[#57D7BA]">{m.category}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#0f1119] overflow-hidden flex mb-2">
        <div className="h-full bg-[#22c55e] rounded-l-full" style={{ width: `${m.price}%` }} />
        <div className="h-full bg-[#ef4444] rounded-r-full" style={{ width: `${100 - m.price}%` }} />
      </div>
      <div className="flex items-center justify-between text-[9px] text-[#8892b0]">
        <span>Vol: {m.volume}</span>
        <a href={`https://quivermarkets.com/markets/${m.id}`} target="_blank" rel="noopener" className="text-[#57D7BA] hover:underline">View on Quiver →</a>
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="p-4 text-xs text-[#8892b0]">Loading...</div>}><MarketEmbed /></Suspense>;
}
