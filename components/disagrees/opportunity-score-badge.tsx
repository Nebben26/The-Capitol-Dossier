"use client";

import { scoreOpportunity, verdictColor, type OpportunityScore } from "@/lib/opportunity-score";
import type { Disagreement } from "@/lib/mockData";
import { Zap } from "lucide-react";

interface Props {
  d: Disagreement;
  size?: "sm" | "md";
}

export function OpportunityScoreBadge({ d, size = "md" }: Props) {
  const result = scoreOpportunity({
    spread: d.spread,
    polyPrice: d.polyPrice,
    kalshiPrice: d.kalshiPrice,
    polyVol: d.polyVol,
    kalshiVol: d.kalshiVol,
    daysLeft: d.daysLeft,
    spreadTrend: d.spreadTrend,
    opportunityScore: d.opportunityScore,
  });

  const color = verdictColor(result.verdict);
  const isElite = result.verdict === "elite";

  if (size === "sm") {
    return (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold tabular-nums border"
        style={{ color, borderColor: `${color}40`, backgroundColor: `${color}12` }}
        title={`Opportunity Score: ${result.score}/100 — ${result.verdict}`}
      >
        {isElite && <Zap className="size-2.5" />}
        {result.score}
      </span>
    );
  }

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border"
      style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
    >
      <div
        className="size-6 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Zap className="size-3.5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-1">
          <span
            className="text-sm font-bold font-mono tabular-nums leading-none"
            style={{ color }}
          >
            {result.score}
          </span>
          <span className="text-[9px] text-[#8d96a0]">/100</span>
        </div>
        <div
          className="text-[9px] font-bold uppercase tracking-wide"
          style={{ color }}
        >
          {result.verdict}
        </div>
      </div>
    </div>
  );
}

export { scoreOpportunity };
