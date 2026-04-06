"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Activity, AlertTriangle } from "lucide-react";
import { disagreements } from "@/lib/mockData";

function DisagreeEmbed() {
  const params = useSearchParams();
  const id = params.get("id") || disagreements[0]?.id || "d1";
  const d = disagreements.find((x) => x.id === id) || disagreements[0];
  if (!d) return <div className="p-4 text-xs text-[#8892b0]">Not found</div>;

  return (
    <div className="bg-[#1a1e2e] text-[#e2e8f0] p-4 rounded-xl border border-[#2f374f] font-sans max-w-sm" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="flex items-center gap-1.5 mb-2">
        <div className="size-4 rounded bg-[#57D7BA] flex items-center justify-center"><Activity className="size-2.5 text-[#0f1119]" /></div>
        <span className="text-[8px] text-[#8892b0] uppercase tracking-wider font-semibold">Quiver Markets</span>
        <span className="ml-auto px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[7px] font-bold flex items-center gap-0.5"><AlertTriangle className="size-2" />DISAGREES</span>
      </div>
      <p className="text-xs font-semibold leading-snug mb-3">{d.question}</p>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 text-center p-2 rounded-lg bg-[#0f1119] border border-[#2f374f]">
          <div className="text-[8px] text-[#8892b0] mb-0.5">Polymarket</div>
          <div className="font-mono text-lg font-bold tabular-nums">{d.polyPrice}¢</div>
        </div>
        <div className="px-2 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-sm font-bold font-mono tabular-nums border border-[#f59e0b]/20">{d.spread}pt</div>
        <div className="flex-1 text-center p-2 rounded-lg bg-[#0f1119] border border-[#2f374f]">
          <div className="text-[8px] text-[#8892b0] mb-0.5">Kalshi</div>
          <div className="font-mono text-lg font-bold tabular-nums">{d.kalshiPrice}¢</div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[9px] text-[#8892b0]">
        <span>{d.category}</span>
        <a href={`https://quivermarkets.com/disagrees`} target="_blank" rel="noopener" className="text-[#57D7BA] hover:underline">View on Quiver →</a>
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="p-4 text-xs text-[#8892b0]">Loading...</div>}><DisagreeEmbed /></Suspense>;
}
