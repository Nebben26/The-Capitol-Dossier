"use client";

import { useEffect, useState } from "react";
import { fetchUpcomingCatalysts, type CalendarMarket } from "@/lib/calendar";
import { TopCatalystsHero } from "@/components/calendar/TopCatalystsHero";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { UpcomingList } from "@/components/calendar/UpcomingList";

export default function CalendarPage() {
  const [catalysts, setCatalysts] = useState<CalendarMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchUpcomingCatalysts(30)
      .then((data) => {
        // Sort globally by score desc
        data.sort((a, b) => b.score - a.score);
        setCatalysts(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Top catalysts = markets resolving within 7 days, sorted by score
  const topCatalysts = catalysts.filter((m) => m.days_left <= 7);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catalyst Calendar</h1>
        <p className="text-sm text-[#8892b0] mt-1">
          Upcoming market-resolving events ranked by volume, spread, and trader activity.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#8892b0] text-sm">Loading catalysts…</div>
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
