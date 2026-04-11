"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";
import { getTopMarkets } from "@/lib/api";
import type { Market } from "@/lib/mockData";

export default function MarketEmbedPage({ params }: { params: { id: string } }) {
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopMarkets(1000).then(({ data }) => {
      const found = data.find((m) => m.id === params.id) ?? null;
      setMarket(found);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[200px]">
        <div className="text-[10px] text-[#8892b0]">Loading…</div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[200px]">
        <div className="text-[10px] text-[#8892b0]">Market not found</div>
      </div>
    );
  }

  const positive = (market.change ?? 0) >= 0;

  return (
    <div
      className="bg-[#0d1117] text-[#e2e8f0] p-5 font-sans"
      style={{ fontFamily: "Inter, system-ui, sans-serif", width: "600px", height: "300px", overflow: "hidden", boxSizing: "border-box" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <div className="size-5 rounded bg-[#57D7BA] flex items-center justify-center">
            <Activity className="size-3 text-[#0f1119]" />
          </div>
          <span className="text-[9px] text-[#8892b0] uppercase tracking-wider font-semibold">Quiver Markets</span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#57D7BA]/10 text-[#57D7BA]">
          {market.category}
        </span>
      </div>

      {/* Question */}
      <p className="text-sm font-semibold leading-snug mb-4 line-clamp-2">{market.question}</p>

      {/* Price + change */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl font-bold font-mono tabular-nums">
          {market.price}<span className="text-xl text-[#8892b0]">¢</span>
        </span>
        <span className={`flex items-center gap-0.5 font-mono text-sm font-bold tabular-nums ${positive ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
          {positive ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
          {Math.abs(market.change ?? 0).toFixed(1)}pt
        </span>
      </div>

      {/* Probability bar */}
      <div className="h-2 rounded-full bg-[#0f1119] overflow-hidden flex mb-3">
        <div className="h-full bg-[#22c55e] rounded-l-full transition-all" style={{ width: `${market.price}%` }} />
        <div className="h-full bg-[#ef4444] rounded-r-full" style={{ width: `${100 - market.price}%` }} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#8892b0] font-mono tabular-nums">Vol: {market.volume}</span>
        <a
          href={`https://amazing-kitsune-139d51.netlify.app/markets/${market.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-[#57D7BA] hover:underline"
        >
          View on Quiver <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}
