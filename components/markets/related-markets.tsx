"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import type { Market } from "@/lib/mockData";

interface RelatedMarketsProps {
  markets: Market[];
}

/**
 * Compact strip of related markets shown at the bottom of a market detail page.
 */
export function RelatedMarkets({ markets }: RelatedMarketsProps) {
  if (markets.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#f0f6fc]">Related Markets</h3>
      <div className="space-y-2">
        {markets.map((m) => {
          const up = m.change >= 0;
          return (
            <Link
              key={m.id}
              href={`/markets/${m.id}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#161b27] border border-[#21262d] hover:border-[#57D7BA]/30 hover:bg-[#57D7BA]/5 transition-all group"
            >
              {/* Price pill */}
              <div className="shrink-0 w-12 text-center">
                <span className="text-sm font-bold font-mono tabular-nums text-[#f0f6fc]">
                  {m.price}¢
                </span>
                <div
                  className={`flex items-center justify-center gap-0.5 text-[9px] font-mono mt-0.5 ${
                    up ? "text-[#3fb950]" : "text-[#f85149]"
                  }`}
                >
                  {up ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
                  {up ? "+" : ""}{m.change}pt
                </div>
              </div>

              {/* Question */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#f0f6fc] line-clamp-2 leading-snug group-hover:text-[#57D7BA] transition-colors">
                  {m.question}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-[#484f58] bg-[#21262d] px-1.5 py-0.5 rounded">
                    {m.category}
                  </span>
                  <span className="text-[9px] text-[#484f58]">{m.volume} vol</span>
                  {m.daysLeft > 0 && (
                    <span className="text-[9px] text-[#484f58]">{m.daysLeft}d left</span>
                  )}
                </div>
              </div>

              <ArrowRight className="size-4 text-[#484f58] group-hover:text-[#57D7BA] shrink-0 transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
