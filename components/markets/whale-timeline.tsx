"use client";

import { useMemo } from "react";
import { getWhaleGradientStyle } from "@/lib/whale-colors";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { formatUsd } from "@/lib/format";

interface WhalePosition {
  whale_id: string;
  outcome: string;       // "YES" / "NO" or outcome label
  current_value: number;
  pnl: number | null;
  updated_at: string;
}

interface Props {
  positions: WhalePosition[];
  loading?: boolean;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function ageColor(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 30 * 60_000) return "#3fb950";
  if (ms < 6 * 3_600_000) return "#d29922";
  return "#484f58";
}

export function WhaleTimeline({ positions, loading = false }: Props) {
  // Sort by updated_at descending
  const sorted = useMemo(
    () => [...positions].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [positions]
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#161b27] border border-[#21262d] animate-pulse">
            <div className="size-8 rounded-full bg-[#21262d]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 bg-[#21262d] rounded" />
              <div className="h-3 w-36 bg-[#21262d] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-[#8d96a0]">
        No whale positions tracked on this market yet.
      </div>
    );
  }

  // Summarise: group by outcome
  const yesBulk = sorted.filter((p) => p.outcome?.toUpperCase() === "YES").reduce((s, p) => s + (p.current_value || 0), 0);
  const noBulk = sorted.filter((p) => p.outcome?.toUpperCase() !== "YES").reduce((s, p) => s + (p.current_value || 0), 0);
  const totalBulk = yesBulk + noBulk;
  const yesShare = totalBulk > 0 ? Math.round((yesBulk / totalBulk) * 100) : 50;

  return (
    <div className="space-y-4">
      {/* Whale consensus bar */}
      <div className="rounded-xl bg-[#0d1117] border border-[#21262d] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Whale Consensus</span>
          <span className="text-[10px] text-[#8d96a0]">{sorted.length} positions · {formatUsd(totalBulk)} tracked</span>
        </div>
        <div className="flex rounded-full overflow-hidden h-2 bg-[#21262d]">
          <div className="h-full bg-[#3fb950] transition-all duration-500" style={{ width: `${yesShare}%` }} />
          <div className="h-full bg-[#f85149] transition-all duration-500" style={{ width: `${100 - yesShare}%` }} />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px]">
          <span className="text-[#3fb950] font-semibold">{yesShare}% YES ({formatUsd(yesBulk)})</span>
          <span className="text-[#f85149] font-semibold">{100 - yesShare}% NO ({formatUsd(noBulk)})</span>
        </div>
      </div>

      {/* Timeline entries */}
      <div className="relative space-y-1">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-[#21262d]" />

        {sorted.map((pos, i) => {
          const isYes = pos.outcome?.toUpperCase() === "YES";
          const outcomeColor = isYes ? "#3fb950" : "#f85149";
          const hasPnl = pos.pnl !== null && pos.pnl !== undefined;
          const pnlPositive = (pos.pnl ?? 0) >= 0;

          return (
            <div key={`${pos.whale_id}-${i}`} className="flex items-start gap-3 pl-1">
              {/* Avatar dot */}
              <div className="relative z-10 mt-0.5">
                <div
                  className="size-9 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#0d1117]"
                  style={getWhaleGradientStyle(pos.whale_id)}
                >
                  {pos.whale_id.slice(0, 2).toUpperCase()}
                </div>
                <div
                  className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border border-[#0d1117] flex items-center justify-center"
                  style={{ backgroundColor: outcomeColor }}
                >
                  {isYes
                    ? <ArrowUpRight className="size-1.5 text-[#0d1117]" />
                    : <ArrowDownRight className="size-1.5 text-[#0d1117]" />
                  }
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-[#f0f6fc] font-mono truncate max-w-[120px]">
                        {pos.whale_id.slice(0, 8)}…
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{ backgroundColor: `${outcomeColor}18`, color: outcomeColor }}
                      >
                        {pos.outcome?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#8d96a0] mt-0.5">
                      {formatUsd(pos.current_value)} position
                      {hasPnl && (
                        <span className={`ml-2 font-semibold ${pnlPositive ? "text-[#3fb950]" : "text-[#f85149]"}`}>
                          {pnlPositive ? "+" : ""}{formatUsd(pos.pnl!)} PnL
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-0.5 text-[9px] font-mono shrink-0"
                    style={{ color: ageColor(pos.updated_at) }}
                  >
                    <Clock className="size-2.5" />
                    {timeAgo(pos.updated_at)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
