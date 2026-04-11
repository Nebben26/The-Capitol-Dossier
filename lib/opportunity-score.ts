// ─── Opportunity Score ────────────────────────────────────────────────────────
// Scores a cross-platform disagreement on a 0–100 scale based on:
//   spread size, relative return (internal), volume, days to resolution, trend direction
//
// NOTE: calcAnnReturn is used here ONLY as a relative ranking signal — a higher
// annualized return means the spread is larger relative to the time remaining,
// which is a valid relative measure. It is NOT displayed to users (see formatReturn
// in spread-execution-calculator.tsx for the honest user-facing display).

import { calcAnnReturn } from "@/components/ui/spread-execution-calculator";

export interface OpportunityScore {
  score: number;         // 0–100
  verdict: "elite" | "strong" | "moderate" | "weak";
  breakdown: {
    spreadScore: number;     // 0–30
    returnScore: number;     // 0–30
    volumeScore: number;     // 0–20
    timeScore: number;       // 0–10
    trendScore: number;      // 0–10
  };
}

function parseVol(v: string): number {
  const n = parseFloat(v.replace(/[$KM,]/g, ""));
  if (v.includes("M")) return n * 1_000_000;
  if (v.includes("K")) return n * 1_000;
  return isNaN(n) ? 0 : n;
}

export function scoreOpportunity(d: {
  spread: number;
  polyPrice: number;
  kalshiPrice: number;
  polyVol: string;
  kalshiVol: string;
  daysLeft: number;
  spreadTrend?: string | null;
  opportunityScore?: number | null;
}): OpportunityScore {
  const daysToRes = d.daysLeft > 0 ? d.daysLeft : null;
  const annReturn = calcAnnReturn(d.polyPrice, d.kalshiPrice, d.spread, daysToRes);

  // Spread score: 0–30 (15pt = 15 pts, 30pt = 30 pts)
  const spreadScore = Math.min(30, Math.round((d.spread / 30) * 30));

  // Annualized return score: 0–30
  let returnScore = 0;
  if (annReturn !== null && annReturn > 0) {
    returnScore = Math.min(30, Math.round((annReturn / 200) * 30));
  }

  // Volume score: 0–20 (min of poly/kalshi, $10K+ = max)
  const minVol = Math.min(parseVol(d.polyVol), parseVol(d.kalshiVol));
  const volumeScore = Math.min(20, Math.round((minVol / 10_000) * 20));

  // Time score: 0–10 (7–30 days = optimal, very short or no resolution = lower)
  let timeScore = 5;
  if (daysToRes === null) timeScore = 2;
  else if (daysToRes >= 7 && daysToRes <= 30) timeScore = 10;
  else if (daysToRes > 30 && daysToRes <= 90) timeScore = 7;
  else if (daysToRes < 7 && daysToRes >= 3) timeScore = 6;
  else if (daysToRes < 3) timeScore = 3;

  // Trend score: 0–10
  let trendScore = 5;
  if (d.spreadTrend === "diverging") trendScore = 10;
  else if (d.spreadTrend === "converging") trendScore = 2;
  else if (d.spreadTrend === "stable") trendScore = 5;

  const score = spreadScore + returnScore + volumeScore + timeScore + trendScore;

  let verdict: OpportunityScore["verdict"];
  if (score >= 75) verdict = "elite";
  else if (score >= 50) verdict = "strong";
  else if (score >= 30) verdict = "moderate";
  else verdict = "weak";

  return { score, verdict, breakdown: { spreadScore, returnScore, volumeScore, timeScore, trendScore } };
}

export function verdictColor(verdict: OpportunityScore["verdict"]): string {
  switch (verdict) {
    case "elite":    return "#f85149";
    case "strong":   return "#d29922";
    case "moderate": return "#57D7BA";
    case "weak":     return "#484f58";
  }
}

export function verdictBg(verdict: OpportunityScore["verdict"]): string {
  switch (verdict) {
    case "elite":    return "#f85149";
    case "strong":   return "#d29922";
    case "moderate": return "#57D7BA";
    case "weak":     return "#484f58";
  }
}
