"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface VisitDiff {
  newSpreads: number;
  newSignals: number;
  movedMarkets: number;
  hoursAgo: number;
}

export function SinceLastVisit() {
  const [diff, setDiff] = useState<VisitDiff | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const last = localStorage.getItem("qm_last_visit");
    const now = new Date().toISOString();
    localStorage.setItem("qm_last_visit", now);

    if (!last) return;

    const lastDate = new Date(last);
    const hoursAgo = (Date.now() - lastDate.getTime()) / 3_600_000;
    if (hoursAgo < 1) return; // too recent — don't show

    // Fetch new signals and disagreements since last visit
    Promise.all([
      supabase
        .from("signals")
        .select("id", { count: "exact", head: true })
        .gte("detected_at", last),
      supabase
        .from("disagreements")
        .select("id", { count: "exact", head: true })
        .gte("created_at", last),
      supabase
        .from("markets")
        .select("id", { count: "exact", head: true })
        .gte("change_24h", 5),
    ]).then(([signals, spreads, movers]) => {
      setDiff({
        newSignals: signals.count ?? 0,
        newSpreads: spreads.count ?? 0,
        movedMarkets: movers.count ?? 0,
        hoursAgo: Math.round(hoursAgo),
      });
      setVisible(true);
    }).catch(() => {});
  }, []);

  if (!visible || !diff) return null;

  const hasActivity = diff.newSpreads > 0 || diff.newSignals > 0 || diff.movedMarkets > 0;

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#161b27] shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 border border-[#21262d]">
      <Clock className="size-4 text-[#57D7BA] shrink-0 mt-0.5" />
      <div className="text-xs text-[#8892b0] leading-relaxed">
        {hasActivity ? (
          <>
            <span className="text-[#e2e8f0] font-medium">Since you were last here {diff.hoursAgo}h ago: </span>
            {diff.newSpreads > 0 && <span className="text-[#f59e0b]">{diff.newSpreads} new spread{diff.newSpreads > 1 ? "s" : ""}</span>}
            {diff.newSpreads > 0 && (diff.newSignals > 0 || diff.movedMarkets > 0) && <span>, </span>}
            {diff.newSignals > 0 && <span className="text-[#57D7BA]">{diff.newSignals} new signal{diff.newSignals > 1 ? "s" : ""}</span>}
            {diff.newSignals > 0 && diff.movedMarkets > 0 && <span>, </span>}
            {diff.movedMarkets > 0 && <span className="text-[#22c55e]">{diff.movedMarkets} market{diff.movedMarkets > 1 ? "s" : ""} moved &gt;5%</span>}
          </>
        ) : (
          <span>Welcome back. Nothing major has moved since you left {diff.hoursAgo}h ago.</span>
        )}
      </div>
    </div>
  );
}
