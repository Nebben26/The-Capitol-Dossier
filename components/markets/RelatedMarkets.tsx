"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface RelatedMarket {
  otherId: string;
  otherQuestion: string;
  otherPlatform: string;
  otherPrice: number;
  correlation: number;
}

function corrBadgeClass(r: number): string {
  if (r >= 0.7)  return "bg-[#57D7BA]/20 text-[#57D7BA] border border-[#57D7BA]/40";
  if (r >= 0.5)  return "bg-[#84cc16]/20 text-[#84cc16] border border-[#84cc16]/40";
  if (r <= -0.7) return "bg-red-500/20 text-red-400 border border-red-500/40";
  return "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40";
}

function corrSign(r: number): string {
  return r >= 0 ? `+${r.toFixed(2)}` : r.toFixed(2);
}

function platformColor(platform: string): string {
  return platform === "Kalshi" ? "#22c55e" : "#6366f1";
}

export function RelatedMarkets({ marketId }: { marketId: string }) {
  const router = useRouter();
  const [related, setRelated] = useState<RelatedMarket[]>([]);

  useEffect(() => {
    if (!marketId) return;

    supabase
      .from("correlations")
      .select(`
        market_a_id, market_b_id, correlation,
        markets!correlations_market_a_id_fkey ( question, platform, price ),
        market_b:markets!correlations_market_b_id_fkey ( question, platform, price )
      `)
      .or(`market_a_id.eq.${marketId},market_b_id.eq.${marketId}`)
      .order("correlation", { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (error || !data?.length) return;

        const items: RelatedMarket[] = (data as any[]).map((r) => {
          const isA = r.market_a_id === marketId;
          const otherId = isA ? r.market_b_id : r.market_a_id;
          const other = isA ? r.market_b : r.markets;
          return {
            otherId,
            otherQuestion: other?.question ?? otherId,
            otherPlatform: other?.platform ?? "Polymarket",
            otherPrice: Number(other?.price ?? 50),
            correlation: Number(r.correlation),
          };
        });

        // Sort by |correlation| desc
        items.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
        setRelated(items);
      });
  }, [marketId]);

  if (!related.length) return null;

  return (
    <div className="mt-6 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-[#e2e8f0]">Related Markets</h2>
        <p className="text-xs text-[#8892b0]">Markets whose prices move with this one</p>
      </div>
      <div className="space-y-1.5">
        {related.map((item) => (
          <button
            key={item.otherId}
            onClick={() => router.push(`/markets/${item.otherId}`)}
            className="w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg bg-[#222638] border border-[#2f374f] hover:border-[#57D7BA]/30 transition-colors text-left group"
          >
            {/* Correlation badge */}
            <span
              className={`shrink-0 font-mono text-xs font-bold px-1.5 py-0.5 rounded tabular-nums ${corrBadgeClass(item.correlation)}`}
            >
              {corrSign(item.correlation)}
            </span>

            {/* Question */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors line-clamp-2">
                {item.otherQuestion}
              </p>
              <span
                className="text-[9px] font-bold"
                style={{ color: platformColor(item.otherPlatform) }}
              >
                {item.otherPlatform}
              </span>
            </div>

            {/* Price */}
            <span className="shrink-0 font-mono text-sm font-bold text-[#e2e8f0] tabular-nums">
              {item.otherPrice}¢
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
