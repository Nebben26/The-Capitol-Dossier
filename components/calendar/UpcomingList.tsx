"use client";

import Link from "next/link";
import type { CalendarMarket } from "@/lib/calendar";
import { fmtVol, toDateKey } from "@/lib/calendar";

function dayLabel(dateKey: string): string {
  const todayKey = toDateKey(new Date().toISOString());
  const tomorrowKey = toDateKey(new Date(Date.now() + 86_400_000).toISOString());
  if (dateKey === todayKey) return "Today";
  if (dateKey === tomorrowKey) return "Tomorrow";
  const d = new Date(dateKey + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function platformColor(platform: string): string {
  return platform === "Kalshi" ? "#22c55e" : "#6366f1";
}

function daysColor(daysLeft: number): string {
  if (daysLeft <= 1) return "text-[#ef4444]";
  if (daysLeft <= 7) return "text-[#f59e0b]";
  return "text-[#22c55e]";
}

interface UpcomingListProps {
  catalysts: CalendarMarket[];
  selectedDate: string | null;
  onClearFilter: () => void;
}

export function UpcomingList({ catalysts, selectedDate, onClearFilter }: UpcomingListProps) {
  // Filter if a date is selected
  const filtered = selectedDate
    ? catalysts.filter((m) => toDateKey(m.end_date) === selectedDate)
    : catalysts;

  // Sort each day's events by score descending
  const grouped: { dateKey: string; events: CalendarMarket[] }[] = [];
  const seen = new Set<string>();
  for (const m of filtered) {
    const dk = toDateKey(m.end_date);
    if (!seen.has(dk)) { seen.add(dk); grouped.push({ dateKey: dk, events: [] }); }
  }
  for (const m of filtered) {
    const group = grouped.find((g) => g.dateKey === toDateKey(m.end_date));
    if (group) group.events.push(m);
  }
  for (const g of grouped) {
    g.events.sort((a, b) => b.score - a.score);
  }

  return (
    <div className="space-y-4">
      {/* Selected date header + clear */}
      {selectedDate && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#57D7BA]">
            {dayLabel(selectedDate)}
          </span>
          <button
            onClick={onClearFilter}
            className="text-xs text-[#8892b0] hover:text-[#e2e8f0] border border-[#2f374f] hover:border-[#4a5168] px-2.5 py-1 rounded-lg transition-colors"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Empty state */}
      {grouped.length === 0 && (
        <div className="text-center py-12 text-[#8892b0] text-sm">
          No catalysts in this range. Try a different day or check back tomorrow.
        </div>
      )}

      {/* Day groups */}
      {grouped.map(({ dateKey, events }) => (
        <div key={dateKey}>
          {/* Day header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-[#8892b0] uppercase tracking-wider">
              {dayLabel(dateKey)}
            </span>
            <div className="flex-1 h-px bg-[#2f374f]" />
            <span className="text-[10px] text-[#4a5168] font-mono">{events.length}</span>
          </div>

          {/* Event rows */}
          <div className="space-y-1">
            {events.map((m) => (
              <Link
                key={m.id}
                href={`/markets/${m.id}`}
                className="flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg bg-[#222638] border border-[#2f374f] hover:border-[#57D7BA]/30 transition-colors group"
              >
                {/* Days left */}
                <span className={`font-mono text-xs font-bold tabular-nums w-8 shrink-0 ${daysColor(m.days_left)}`}>
                  {m.days_left <= 0 ? "0d" : `${m.days_left}d`}
                </span>

                {/* Question */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors truncate">
                    {m.question}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[9px] font-bold"
                      style={{ color: platformColor(m.platform) }}
                    >
                      {m.platform}
                    </span>
                    {m.category && (
                      <span className="text-[9px] text-[#4a5168]">{m.category}</span>
                    )}
                    {m.spread > 0 && (
                      <span className="text-[9px] font-semibold text-[#f59e0b]">
                        {m.spread}pt spread
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: volume + price */}
                <div className="shrink-0 text-right">
                  <div className="font-mono text-xs font-semibold text-[#e2e8f0] tabular-nums">
                    {m.price}¢
                  </div>
                  <div className="text-[9px] text-[#8892b0] font-mono">
                    {fmtVol(m.volume)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
