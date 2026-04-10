"use client";

import Link from "next/link";
import type { CalendarMarket } from "@/lib/calendar";
import { fmtVol, whyItMatters } from "@/lib/calendar";

function daysColor(daysLeft: number): string {
  if (daysLeft <= 1) return "text-[#ef4444]";
  if (daysLeft <= 7) return "text-[#f59e0b]";
  return "text-[#22c55e]";
}

function daysLabel(daysLeft: number): string {
  if (daysLeft <= 0) return "Today";
  if (daysLeft === 1) return "1 day";
  return `${daysLeft}d`;
}

function platformColor(platform: string): string {
  return platform === "Kalshi" ? "#22c55e" : "#6366f1";
}

export function TopCatalystsHero({ catalysts }: { catalysts: CalendarMarket[] }) {
  const top = catalysts.slice(0, 5);

  if (!top.length) {
    return (
      <div className="text-center py-10 text-[#8892b0] text-sm">
        No catalysts found in the next 7 days.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
          🔥 Top Catalysts This Week
        </h2>
        <p className="text-xs text-[#8892b0] mt-0.5">
          Biggest upcoming market-resolving events, ranked by volume, spread, and whale activity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {top.map((m) => (
          <Link
            key={m.id}
            href={`/markets/${m.id}`}
            className="block rounded-xl bg-[#222638] border border-[#2f374f] p-4 hover:border-[#57D7BA]/40 transition-colors group"
          >
            {/* Days badge */}
            <div className={`text-2xl font-bold font-mono tabular-nums mb-1 ${daysColor(m.days_left)}`}>
              {daysLabel(m.days_left)}
            </div>

            {/* Question */}
            <p className="text-xs font-semibold text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors leading-snug line-clamp-3 mb-3 min-h-[48px]">
              {m.question}
            </p>

            {/* Platform + price row */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  color: platformColor(m.platform),
                  backgroundColor: `${platformColor(m.platform)}18`,
                }}
              >
                {m.platform}
              </span>
              <span className="font-mono text-sm font-bold text-[#e2e8f0] tabular-nums">
                {m.price}¢
              </span>
            </div>

            {/* Volume */}
            <div className="text-[10px] text-[#8892b0] mb-1">
              {fmtVol(m.volume)}
            </div>

            {/* Why it matters */}
            <div className="text-[9px] text-[#57D7BA] font-medium border-t border-[#2f374f] pt-2 mt-2 truncate">
              ↑ {whyItMatters(m)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
