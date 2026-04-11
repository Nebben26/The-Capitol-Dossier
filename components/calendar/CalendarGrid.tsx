"use client";

import { useState } from "react";
import type { CalendarMarket } from "@/lib/calendar";
import { toDateKey } from "@/lib/calendar";

interface Props {
  catalysts: CalendarMarket[];
  selectedDate: string | null;
  onSelectDate: (dateKey: string | null) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildGrid(year: number, month: number): (string | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function scoreColor(totalScore: number): string {
  if (totalScore === 0) return "";
  if (totalScore >= 300) return "bg-[#57D7BA]/30 border-[#57D7BA]/50";
  if (totalScore >= 150) return "bg-[#57D7BA]/15 border-[#57D7BA]/25";
  if (totalScore >= 60)  return "bg-[#f59e0b]/15 border-[#f59e0b]/25";
  return "bg-[#6366f1]/10 border-[#6366f1]/20";
}

function dotColor(totalScore: number): string {
  if (totalScore >= 300) return "bg-[#57D7BA]";
  if (totalScore >= 150) return "bg-[#57D7BA]/70";
  if (totalScore >= 60)  return "bg-[#f59e0b]";
  return "bg-[#6366f1]";
}

export function CalendarGrid({ catalysts, selectedDate, onSelectDate }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const todayKey = toDateKey(today.toISOString());

  // Aggregate score and count per day
  const dayMap: Record<string, { score: number; count: number }> = {};
  for (const m of catalysts) {
    const dk = toDateKey(m.end_date);
    if (!dayMap[dk]) dayMap[dk] = { score: 0, count: 0 };
    dayMap[dk].score += m.score;
    dayMap[dk].count += 1;
  }

  const cells = buildGrid(year, month);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });

  return (
    <div className="rounded-xl bg-[#161b27] shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 border border-[#21262d] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg text-[#8892b0] hover:text-[#e2e8f0] hover:bg-[#21262d] transition-colors"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-[#e2e8f0]">{monthLabel}</span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg text-[#8892b0] hover:text-[#e2e8f0] hover:bg-[#21262d] transition-colors"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-[#4a5168] uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((dk, i) => {
          if (!dk) return <div key={i} />;
          const day = parseInt(dk.slice(8), 10);
          const data = dayMap[dk];
          const isToday = dk === todayKey;
          const isSelected = dk === selectedDate;
          const hasData = !!data?.count;
          const sc = data?.score ?? 0;

          return (
            <button
              key={dk}
              onClick={() => onSelectDate(isSelected ? null : dk)}
              className={[
                "relative flex flex-col items-center justify-start pt-1 pb-1 min-h-[48px] rounded-lg border transition-all text-xs",
                isSelected
                  ? "bg-[#57D7BA]/20 border-[#57D7BA] text-[#57D7BA] font-bold"
                  : isToday
                  ? "border-[#57D7BA]/40 text-[#57D7BA]"
                  : hasData
                  ? `${scoreColor(sc)} text-[#e2e8f0] hover:opacity-80`
                  : "border-transparent text-[#4a5168] hover:bg-[#21262d]",
              ].join(" ")}
            >
              <span className="leading-none">{day}</span>
              {hasData && (
                <div className="flex items-center gap-0.5 mt-1 flex-wrap justify-center px-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor(sc)}`} />
                  {data.count > 1 && (
                    <span className="text-[8px] text-[#8892b0] font-mono">{data.count}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#21262d]">
        <span className="text-[10px] text-[#4a5168]">Activity:</span>
        {[
          { label: "Low", cls: "bg-[#6366f1]/30" },
          { label: "Med", cls: "bg-[#f59e0b]/40" },
          { label: "High", cls: "bg-[#57D7BA]/40" },
        ].map(({ label, cls }) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`inline-block w-2 h-2 rounded-sm ${cls}`} />
            <span className="text-[10px] text-[#8892b0]">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
