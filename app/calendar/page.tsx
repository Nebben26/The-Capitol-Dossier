"use client";

import { useEffect, useState } from "react";
import { fetchUpcomingCatalysts, type CalendarMarket } from "@/lib/calendar";
import { getLastIngestTimestamp } from "@/lib/api";
import { TopCatalystsHero } from "@/components/calendar/TopCatalystsHero";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { UpcomingList } from "@/components/calendar/UpcomingList";
import { DataFreshness } from "@/components/ui/data-freshness";
import { Inbox } from "lucide-react";

export default function CalendarPage() {
  const [catalysts, setCatalysts] = useState<CalendarMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [freshnessTs, setFreshnessTs] = useState<string | null>(null);

  useEffect(() => {
    fetchUpcomingCatalysts(30)
      .then((data) => {
        // Sort globally by score desc
        data.sort((a, b) => b.score - a.score);
        setCatalysts(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    getLastIngestTimestamp().then(setFreshnessTs);
  }, []);

  // Top catalysts = markets resolving within 7 days, sorted by score
  const topCatalysts = catalysts.filter((m) => m.days_left <= 7);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Page title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catalyst Calendar</h1>
          <p className="text-sm text-[#8892b0] mt-1">
            Upcoming market-resolving events ranked by volume, spread, and trader activity.
          </p>
        </div>
        <DataFreshness timestamp={freshnessTs} />
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#8d96a0] text-sm">Loading catalysts…</div>
      ) : catalysts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#161b27] border border-[#21262d] flex items-center justify-center mb-4">
            <Inbox className="w-7 h-7 text-[#484f58]" />
          </div>
          <h3 className="text-lg font-semibold text-[#f0f6fc] mb-1">No upcoming catalysts</h3>
          <p className="text-sm text-[#8d96a0] max-w-md mb-4">Markets resolving in the next 30 days will appear here once ingested.</p>
          <div className="text-[11px] text-[#484f58]">Next update in {30 - (new Date().getMinutes() % 30)} minutes</div>
        </div>
      ) : (
        <>
          {/* Hero: top catalysts this week */}
          <TopCatalystsHero catalysts={topCatalysts.length ? topCatalysts : catalysts} />

          {/* Calendar + list layout */}
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
            {/* Calendar grid — desktop only sidebar */}
            <div className="hidden md:block">
              <CalendarGrid
                catalysts={catalysts}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            </div>

            {/* Upcoming list — always visible */}
            <div>
              <UpcomingList
                catalysts={catalysts}
                selectedDate={selectedDate}
                onClearFilter={() => setSelectedDate(null)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
