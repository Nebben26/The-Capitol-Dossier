"use client";

import React, { useState, useMemo, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GitCompareArrows,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  BarChart3,
  Search,
  Timer,
  LayoutGrid,
  List,
  Target,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useDisagreements } from "@/hooks/useData";
import { getSpreadHistory } from "@/lib/api";
import { InlineSparkline } from "@/components/ui/inline-sparkline";
import { LastUpdated } from "@/components/layout/LastUpdated";
import { DisagreeShareButton } from "@/components/ui/disagree-share";
import { Sparkline } from "@/components/ui/sparkline";
import { SpreadExecutionCalculator, calcAnnReturn, formatAnnReturn } from "@/components/ui/spread-execution-calculator";
import { SpreadHistoryChart } from "@/components/ui/spread-history-chart";
import { SpreadVelocityIndicator } from "@/components/ui/spread-velocity-indicator";
import { CausationTag } from "@/components/ui/causation-tag";
import { ResolutionCriteriaDiff } from "@/components/ui/resolution-criteria-diff";
import { analyzeCausation } from "@/lib/causation";
import { analyzeResolutionDiff } from "@/lib/resolution-diff";
import type { CausationType, CausationAnalysis } from "@/lib/causation";
import type { Disagreement } from "@/lib/mockData";

const catFilters = ["All", "Economics", "Elections", "Crypto", "Tech", "Geopolitics"];

type SortKey = "opportunity" | "spread" | "polyVol" | "daysLeft" | "annReturn";
type SortDir = "asc" | "desc";
type ViewMode = "grid" | "table";
type CauseFilter = "all" | "information_lag" | "liquidity_gap" | "resolution_mismatch" | "structural";

function parseVol(v: string): number {
  const n = parseFloat(v.replace(/[$KM,]/g, ""));
  if (v.includes("M")) return n * 1000000;
  if (v.includes("K")) return n * 1000;
  return n;
}

function SpreadBadge({ spread }: { spread: number }) {
  const color = spread >= 15 ? "#ef4444" : "#f59e0b";
  const bg    = spread >= 15 ? "bg-[#ef4444]/10" : "bg-[#f59e0b]/10";
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-mono text-xs font-bold tabular-nums ${bg}`} style={{ color }}>
      <AlertTriangle className="size-2.5" />
      {spread}pt
    </span>
  );
}

function AnnReturnCell({ value, daysLeft }: { value: number | null; daysLeft?: number }) {
  const formatted = formatAnnReturn(value, daysLeft ?? null);
  if (value === null) return <span className="text-[10px] text-[#8892b0] font-mono">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-xs font-bold tabular-nums" style={{ color: formatted.color }}>
        {formatted.text}
      </span>
      {formatted.isShortTerm && (
        <span className="text-[7px] font-bold uppercase tracking-wide text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-1 py-0.5 rounded-full">
          ST
        </span>
      )}
    </span>
  );
}

function sidesFor(d: Disagreement): { polymarketSide: "YES" | "NO"; kalshiSide: "YES" | "NO" } {
  // Buy YES on cheaper platform, NO on more expensive
  if (d.direction === "poly-higher") {
    return { polymarketSide: "NO", kalshiSide: "YES" };
  }
  return { polymarketSide: "YES", kalshiSide: "NO" };
}

// ─── Grid card ────────────────────────────────────────────────────────────
function DisagreeCard({
  d, history, expanded, onToggleExpand, causationAnalysis,
}: {
  d: Disagreement;
  history: Array<{ t: number; spread: number }>;
  expanded: boolean;
  onToggleExpand: () => void;
  causationAnalysis: CausationAnalysis;
}) {
  const { polymarketSide, kalshiSide } = sidesFor(d);
  const daysToRes = d.daysLeft > 0 ? d.daysLeft : null;
  const annReturn = calcAnnReturn(d.polyPrice, d.kalshiPrice, d.spread, daysToRes);
  const isProfit = annReturn !== null && annReturn > 0;

  return (
    <div>
      <Card className="bg-[#222638] border-[#2f374f] hover:border-[#f59e0b]/30 transition-all h-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[8px] font-bold flex items-center gap-0.5">
              <AlertTriangle className="size-2.5" /> ARBITRAGE
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#57D7BA]/10 text-[#57D7BA] text-[8px] font-semibold">{d.category}</span>
            {(d.opportunityScore ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-[#57D7BA]/10 text-[#57D7BA] text-[8px] font-bold font-mono tabular-nums border border-[#57D7BA]/20">
                Score: {d.opportunityScore}
              </span>
            )}
            <span className="flex items-center gap-0.5 text-[8px] text-[#8892b0]">
              {d.daysLeft > 0 && <><Timer className="size-2.5" />{d.daysLeft}d</>}
            </span>
          </div>
          <Link href={`/markets/${d.marketId}`} className="group block">
            <p className="text-xs font-semibold text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors leading-snug line-clamp-2 mb-3">
              {d.question}
            </p>
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 text-center p-2 rounded-lg bg-[#1a1e2e] border border-[#2f374f]">
              <div className="text-[9px] text-[#8892b0] mb-0.5">Polymarket</div>
              <div className="font-mono text-lg font-bold tabular-nums text-[#e2e8f0]">{d.polyPrice}¢</div>
              <div className="text-[8px] text-[#8892b0] mt-0.5">{d.polyVol}</div>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-0.5">
              <div className="px-2.5 py-1.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-sm font-bold font-mono tabular-nums border border-[#f59e0b]/20">
                {d.spread}pt
              </div>
              <span className="text-[7px] text-[#8892b0]">spread</span>
              <div className="mt-1">
                <Sparkline data={history} width={80} height={24} strokeColor="#f59e0b" />
              </div>
            </div>
            <div className="flex-1 text-center p-2 rounded-lg bg-[#1a1e2e] border border-[#2f374f]">
              <div className="text-[9px] text-[#8892b0] mb-0.5">Kalshi</div>
              <div className="font-mono text-lg font-bold tabular-nums text-[#e2e8f0]">{d.kalshiPrice}¢</div>
              <div className="text-[8px] text-[#8892b0] mt-0.5">{d.kalshiVol}</div>
            </div>
          </div>
          {/* Implied trade line */}
          <div className="flex items-center gap-1 mb-1.5 text-[10px] text-[#8892b0] italic">
            <Target className="size-3 shrink-0 text-[#8892b0]" />
            {d.direction === "poly-higher"
              ? `Buy Kalshi YES at ${d.kalshiPrice}¢, sell Polymarket YES at ${d.polyPrice}¢ → ${d.spread}pt arb`
              : `Buy Polymarket YES at ${d.polyPrice}¢, sell Kalshi YES at ${d.kalshiPrice}¢ → ${d.spread}pt arb`
            }
          </div>
          {/* Causation tag */}
          <div className="mb-1.5">
            <CausationTag analysis={causationAnalysis} compact={true} />
          </div>
          {/* Velocity indicator */}
          <div className="mb-2.5">
            <SpreadVelocityIndicator marketId={d.marketId} compact={false} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-semibold ${d.direction === "poly-higher" ? "text-[#6366f1]" : "text-[#22c55e]"}`}>
                {d.direction === "poly-higher" ? "Poly prices higher" : "Kalshi prices higher"}
              </span>
              {d.spreadTrend && d.spreadTrend !== "stable" && (
                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[7px] font-bold ${
                  d.spreadTrend === "converging" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"
                }`}>
                  {d.spreadTrend === "converging" ? <ChevronDown className="size-2" /> : <ChevronUp className="size-2" />}
                  {d.spreadTrend === "converging" ? "Converging" : "Diverging"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <DisagreeShareButton d={d} />
              <button
                onClick={onToggleExpand}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                  expanded
                    ? "bg-[#57D7BA]/20 text-[#57D7BA] border border-[#57D7BA]/30"
                    : isProfit
                      ? "bg-[#57D7BA]/10 text-[#57D7BA] border border-[#57D7BA]/20 animate-pulse-glow"
                      : "bg-[#2f374f] text-[#8892b0] border border-[#2f374f] hover:text-[#57D7BA]"
                }`}
              >
                <Zap className="size-3" />
                Execute
                {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Expandable chart + resolution diff + calculator */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? "1200px" : "0px", opacity: expanded ? 1 : 0 }}
      >
        <div className="pt-2 space-y-2">
          <div className="rounded-xl bg-[#1a1e2e] border border-[#2f374f] p-3">
            <SpreadHistoryChart marketId={d.marketId} question={d.question} heightPx={180} />
          </div>
          <ResolutionCriteriaDiff
            result={analyzeResolutionDiff(null, null)}
            polymarketUrl={null}
            kalshiUrl={null}
          />
          <SpreadExecutionCalculator
            polymarketPrice={d.polyPrice}
            kalshiPrice={d.kalshiPrice}
            spread={d.spread}
            daysToResolution={daysToRes}
            polymarketSide={polymarketSide}
            kalshiSide={kalshiSide}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
function DisagreesContent() {
  const { disagreements, refreshing, lastFetched, error, retry } = useDisagreements();
  const searchParams = useSearchParams();
  const highlightId  = searchParams.get("highlight");

  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory]       = useState("All");
  const [causeFilter, setCauseFilter] = useState<CauseFilter>("all");
  const [sortBy, setSortBy]           = useState<SortKey>("opportunity");
  const [sortDir, setSortDir]         = useState<SortDir>("desc");
  const [viewMode, setViewMode]       = useState<ViewMode>("grid");
  const [historyMap, setHistoryMap]   = useState<Record<string, Array<{ t: number; spread: number }>>>({});
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  useEffect(() => {
    if (!disagreements.length) return;
    const ids = disagreements.map((d) => d.marketId).filter(Boolean);
    getSpreadHistory(ids).then(setHistoryMap).catch(() => {/* non-blocking */});
  }, [disagreements]);

  // Auto-expand highlighted row from URL param
  useEffect(() => {
    if (!highlightId || !disagreements.length) return;
    const match = disagreements.find((d) => d.marketId === highlightId || d.id === highlightId);
    if (match) {
      setExpandedId(match.id);
      // Switch to table view for better visibility
      setViewMode("table");
      // Scroll to row after render
      setTimeout(() => {
        const el = rowRefs.current[match.id];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [highlightId, disagreements]);

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  // Pre-compute annualized returns for each disagreement
  const annReturnMap = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const d of disagreements) {
      map.set(d.id, calcAnnReturn(d.polyPrice, d.kalshiPrice, d.spread, d.daysLeft > 0 ? d.daysLeft : null));
    }
    return map;
  }, [disagreements]);

  // Pre-compute causation analysis for each disagreement
  const causationMap = useMemo(() => {
    const map = new Map<string, CausationAnalysis>();
    for (const d of disagreements) {
      map.set(d.id, analyzeCausation({
        polymarketPrice: d.polyPrice,
        kalshiPrice: d.kalshiPrice,
        spread: d.spread,
        polymarketVolume: parseVol(d.polyVol),
        kalshiVolume: parseVol(d.kalshiVol),
        daysToResolution: d.daysLeft > 0 ? d.daysLeft : null,
        spreadAgeHours: null,
        convergenceVelocity: null,
        category: d.category,
        resolutionCriteriaDiffer: null,
      }));
    }
    return map;
  }, [disagreements]);

  const actionableCount = useMemo(
    () => [...causationMap.values()].filter((a) => a.actionable).length,
    [causationMap]
  );

  const filtered = useMemo(() => {
    let result = disagreements;
    if (category !== "All") result = result.filter((d) => d.category === category);
    if (searchQuery) result = result.filter((d) => d.question.toLowerCase().includes(searchQuery.toLowerCase()));
    // Causation filter
    if (causeFilter !== "all") {
      result = result.filter((d) => {
        const cause = causationMap.get(d.id)?.primaryCause;
        if (causeFilter === "structural") {
          return cause === "structural_persistent" || cause === "fee_differential" || cause === "user_base_bias";
        }
        return cause === causeFilter;
      });
    }
    return [...result].sort((a, b) => {
      let av: number, bv: number;
      if (sortBy === "opportunity")    { av = a.opportunityScore ?? 0; bv = b.opportunityScore ?? 0; }
      else if (sortBy === "spread")    { av = a.spread; bv = b.spread; }
      else if (sortBy === "polyVol")   { av = parseVol(a.polyVol); bv = parseVol(b.polyVol); }
      else if (sortBy === "annReturn") {
        av = annReturnMap.get(a.id) ?? -Infinity;
        bv = annReturnMap.get(b.id) ?? -Infinity;
      }
      else { av = a.daysLeft; bv = b.daysLeft; }
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [disagreements, category, causeFilter, searchQuery, sortBy, sortDir, annReturnMap, causationMap]);

  // Top opportunities strip (Part 6) — exclude shorts (≤3d) and tiny positions
  const topOpportunities = useMemo(() => {
    return [...disagreements]
      .map((d) => ({ d, annReturn: annReturnMap.get(d.id) ?? null }))
      .filter(({ d, annReturn }) => {
        if (annReturn === null || annReturn <= 0) return false;
        if (d.daysLeft > 0 && d.daysLeft <= 3) return false; // exclude short-term
        // Rough min position check: need enough volume for $500+
        const minVol = Math.min(parseVol(d.polyVol), parseVol(d.kalshiVol));
        if (minVol < 500) return false;
        return true;
      })
      .sort((a, b) => (b.annReturn ?? 0) - (a.annReturn ?? 0))
      .slice(0, 3);
  }, [disagreements, annReturnMap]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortBy !== col) return <ChevronDown className="size-3 opacity-30" />;
    return sortDir === "desc" ? <ChevronDown className="size-3 text-[#57D7BA]" /> : <ChevronUp className="size-3 text-[#57D7BA]" />;
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <GitCompareArrows className="size-7 text-[#f59e0b]" />
            The Market Disagrees
          </h1>
          <p className="text-sm text-[#8892b0] mt-1">
            Cross-platform price spreads — where Polymarket and Kalshi see the world differently
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated lastFetched={lastFetched} refreshing={refreshing} error={error} onRetry={retry} />
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] font-bold">
            <AlertTriangle className="size-3" />
            {filtered.length} opportunities
          </span>
        </div>
      </div>

      {/* Top Opportunities Strip (Part 6) */}
      {topOpportunities.length > 0 && (
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h2 className="text-sm font-bold text-[#e2e8f0] flex items-center gap-1.5">
              <TrendingUp className="size-4 text-[#fbbf24]" />
              Best Capital Efficiency Right Now
            </h2>
            <span className="text-[10px] text-[#8892b0]">Ranked by annualized return after fees — not raw spread size</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topOpportunities.map(({ d, annReturn }) => {
              const daysToRes = d.daysLeft > 0 ? d.daysLeft : null;
              return (
                <Card key={d.id} className="bg-[#222638] border-[#fbbf24]/20 hover:border-[#fbbf24]/40 transition-all">
                  <CardContent className="p-4">
                    <p className="text-xs text-[#e2e8f0] font-medium leading-snug line-clamp-2 mb-3">
                      {d.question.length > 60 ? d.question.slice(0, 60) + "…" : d.question}
                    </p>
                    <div className="flex items-end justify-between gap-2 mb-3">
                      <div>
                        <div className="text-[9px] text-[#8892b0] uppercase tracking-wide">Spread</div>
                        <div className="font-mono font-bold text-[#f59e0b] tabular-nums">{d.spread}pt</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-[#8892b0] uppercase tracking-wide">Ann. Return</div>
                        {(() => {
                          const fmt = formatAnnReturn(annReturn, d.daysLeft > 0 ? d.daysLeft : null);
                          return (
                            <div className="font-mono font-bold text-2xl tabular-nums" style={{ color: fmt.color }}>
                              {fmt.text}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-[#8892b0] uppercase tracking-wide">Resolves</div>
                        <div className="font-mono font-bold text-[#e2e8f0] tabular-nums">
                          {daysToRes ? `${daysToRes}d` : "—"}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setViewMode("table");
                        setExpandedId(d.id);
                        setTimeout(() => {
                          const el = rowRefs.current[d.id];
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                        }, 200);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-[#57D7BA]/10 text-[#57D7BA] text-[10px] font-semibold border border-[#57D7BA]/20 hover:bg-[#57D7BA]/20 transition-all"
                    >
                      <Zap className="size-3" /> View Calculator
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Explainer */}
      {disagreements.length >= 10 && (
        <Card className="bg-[#222638] border-[#f59e0b]/20">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="size-5 text-[#f59e0b] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-[#e2e8f0] mb-1">How to read this</p>
              <p className="text-[11px] text-[#8892b0] leading-relaxed">
                When two major platforms price the same event differently by ≥ 10 percentage points, one of them is likely wrong.
                Smart traders buy the cheaper side and sell the expensive side — capturing the spread as profit when prices converge.
                Higher spreads = bigger potential edge. Higher volume = more liquid opportunity.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8892b0]" />
          <input
            type="text"
            placeholder="Search disagreements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#222638] border border-[#2f374f] text-sm text-[#e2e8f0] placeholder:text-[#8892b0]/60 focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          {/* Category chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {catFilters.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${category === cat ? "bg-[#f59e0b] text-[#0f1119]" : "bg-[#222638] text-[#8892b0] hover:text-[#e2e8f0] border border-[#2f374f]"}`}
              >
                {cat}
              </button>
            ))}
          </div>
          {/* Causation filter chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {(
              [
                { key: "all",                 label: "All causes" },
                { key: "information_lag",     label: "Info Lag",         color: "#22c55e" },
                { key: "liquidity_gap",       label: "Liquidity Gap",    color: "#f59e0b" },
                { key: "resolution_mismatch", label: "Resolution Risk",  color: "#ef4444" },
                { key: "structural",          label: "Structural",       color: "#6b7280" },
              ] as { key: CauseFilter; label: string; color?: string }[]
            ).map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setCauseFilter(key)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-medium transition-all border ${
                  causeFilter === key
                    ? "text-[#0f1119] border-transparent"
                    : "bg-[#1a1e2e] text-[#8892b0] hover:text-[#e2e8f0] border-[#2f374f]"
                }`}
                style={causeFilter === key ? { backgroundColor: color ?? "#f59e0b", borderColor: "transparent" } : undefined}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleSort("opportunity")}
              className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all ${sortBy === "opportunity" ? "bg-[#f59e0b] text-[#0f1119]" : "bg-[#222638] text-[#8892b0] border border-[#2f374f] hover:text-[#e2e8f0]"}`}
            >
              Score ↓
            </button>
            <button
              onClick={() => handleSort("annReturn")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium transition-all ${sortBy === "annReturn" ? "bg-[#fbbf24] text-[#0f1119]" : "bg-[#222638] text-[#8892b0] border border-[#2f374f] hover:text-[#e2e8f0]"}`}
            >
              Ann. Return ↓
              {sortBy !== "annReturn" && <span className="px-1 py-0.5 rounded text-[7px] font-bold bg-[#fbbf24]/20 text-[#fbbf24]">NEW</span>}
            </button>
          </div>
          <span className="text-[10px] text-[#8892b0] font-mono">{filtered.length} results</span>
          <div className="flex items-center gap-0.5 bg-[#222638] rounded-lg p-0.5 border border-[#2f374f]">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-[#f59e0b] text-[#0f1119]" : "text-[#8892b0]"}`}><LayoutGrid className="size-3.5" /></button>
            <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-[#f59e0b] text-[#0f1119]" : "text-[#8892b0]"}`}><List className="size-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {disagreements.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Active Spreads", val: `${disagreements.length}`, color: "#f59e0b", sparkline: true },
            { label: "Avg Spread", val: `${Math.round(disagreements.reduce((s, d) => s + d.spread, 0) / disagreements.length)}pt`, color: "#ef4444" },
            { label: "Widest Spread", val: `${Math.max(...disagreements.map((d) => d.spread))}pt`, color: "#ec4899" },
            { label: "Combined Volume", val: "$" + (disagreements.reduce((s, d) => s + parseVol(d.polyVol) + parseVol(d.kalshiVol), 0) / 1000000).toFixed(0) + "M", color: "#57D7BA" },
            { label: "Actionable", val: `${actionableCount}`, color: "#22c55e" },
          ].map((s) => (
            <Card key={s.label} className="bg-[#222638] border-[#2f374f]">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center">
                  <div className="text-lg font-bold font-mono tabular-nums" style={{ color: s.color }}>{s.val}</div>
                  {/* TODO: replace placeholder with real historical data */}
                  {(s as any).sparkline && <InlineSparkline data={[10, 11, 10, 12, 11, 13, 12, 14]} positive={true} />}
                </div>
                <div className="text-[9px] text-[#8892b0] uppercase tracking-wider">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Grid view */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <DisagreeCard
              key={d.id}
              d={d}
              history={historyMap[d.marketId] || []}
              expanded={expandedId === d.id}
              onToggleExpand={() => toggleExpand(d.id)}
              causationAnalysis={causationMap.get(d.id)!}
            />
          ))}
        </div>
      )}

      {/* Table view */}
      {viewMode === "table" && (
        <Card className="bg-[#222638] border-[#2f374f]">
          <CardContent className="px-0 py-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2f374f] hover:bg-transparent">
                  <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">MARKET</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium">POLY</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium">KALSHI</TableHead>
                  <TableHead
                    className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]"
                    onClick={() => handleSort("opportunity")}
                  >
                    <span className="flex items-center gap-0.5">SCORE <SortIcon col="opportunity" /></span>
                  </TableHead>
                  <TableHead
                    className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]"
                    onClick={() => handleSort("spread")}
                  >
                    <span className="flex items-center gap-0.5">SPREAD <SortIcon col="spread" /></span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium hidden md:table-cell">
                    VELOCITY
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium hidden xl:table-cell">
                    <span className="flex items-center gap-0.5">
                      CAUSE
                      <Tooltip>
                        <TooltipTrigger><HelpCircle className="size-3 text-[#4a5168] cursor-help" /></TooltipTrigger>
                        <TooltipContent className="max-w-[220px] text-[11px]">
                          Diagnosed reason this spread exists. Green = actionable information lag. Red = resolution mismatch risk. Gray = structural, unlikely to profit.
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] hidden md:table-cell"
                    onClick={() => handleSort("polyVol")}
                  >
                    <span className="flex items-center gap-0.5">VOLUME <SortIcon col="polyVol" /></span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium hidden lg:table-cell">CAT</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium hidden lg:table-cell">
                    <span className="flex items-center gap-0.5">TREND
                      <Tooltip>
                        <TooltipTrigger><HelpCircle className="size-3 text-[#4a5168] cursor-help" /></TooltipTrigger>
                        <TooltipContent className="max-w-[200px] text-[11px]">Spread convergence — when two platforms&apos; prices get closer to each other over time.</TooltipContent>
                      </Tooltip>
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] hidden sm:table-cell"
                    onClick={() => handleSort("daysLeft")}
                  >
                    <span className="flex items-center gap-0.5">RESOLVES <SortIcon col="daysLeft" /></span>
                  </TableHead>
                  {/* Annualized return column (Part 5) */}
                  <TableHead
                    className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] hidden xl:table-cell"
                    onClick={() => handleSort("annReturn")}
                  >
                    <span className="flex items-center gap-0.5">
                      ANN. RETURN
                      <SortIcon col="annReturn" />
                      <Tooltip>
                        <TooltipTrigger><HelpCircle className="size-3 text-[#4a5168] cursor-help ml-0.5" /></TooltipTrigger>
                        <TooltipContent className="max-w-[260px] text-[11px]">
                          Net return after fees on a $1,000 position, annualized using days to resolution. A 2¢ spread resolving tomorrow can beat a 7¢ spread resolving in 90 days.
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4 text-right">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => {
                  const { polymarketSide, kalshiSide } = sidesFor(d);
                  const daysToRes = d.daysLeft > 0 ? d.daysLeft : null;
                  const annReturn = annReturnMap.get(d.id) ?? null;
                  const causationAnalysis = causationMap.get(d.id)!;
                  const isExpanded = expandedId === d.id;
                  const isProfit = annReturn !== null && annReturn > 0;
                  const colSpan = 13;

                  return (
                    <React.Fragment key={d.id}>
                      <TableRow
                        ref={(el) => { rowRefs.current[d.id] = el; }}
                        className={`border-[#2f374f]/50 hover:bg-[#f59e0b]/5 transition-colors ${isExpanded ? "bg-[#57D7BA]/5" : ""}`}
                      >
                        <TableCell className="pl-4 py-2.5 max-w-[220px]">
                          <div className="flex items-start gap-1.5">
                            {(d.matchConfidence ?? 1) < 0.5 && (
                              <span title="Low-confidence cross-platform match — verify before trading.">
                                <AlertTriangle className="size-3 text-[#f59e0b] shrink-0 mt-0.5" />
                              </span>
                            )}
                            <Link
                              href={`/markets/${d.marketId}`}
                              className="text-xs font-medium text-[#e2e8f0] hover:text-[#57D7BA] transition-colors leading-snug line-clamp-2"
                            >
                              {d.question}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono text-sm font-bold tabular-nums text-[#e2e8f0]">{d.polyPrice}¢</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono text-sm font-bold tabular-nums text-[#e2e8f0]">{d.kalshiPrice}¢</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          {(d.opportunityScore ?? 0) > 0
                            ? <span className="font-mono text-xs font-bold tabular-nums text-[#57D7BA]">{d.opportunityScore}</span>
                            : <span className="text-[#8892b0] text-xs">—</span>
                          }
                        </TableCell>
                        <TableCell className="py-2.5">
                          <SpreadBadge spread={d.spread} />
                        </TableCell>
                        <TableCell className="py-2.5 hidden md:table-cell">
                          <SpreadVelocityIndicator marketId={d.marketId} compact={true} />
                        </TableCell>
                        <TableCell className="py-2.5 hidden xl:table-cell">
                          <CausationTag analysis={causationAnalysis} compact={true} />
                        </TableCell>
                        <TableCell className="py-2.5 hidden md:table-cell">
                          <div className="text-[10px] text-[#8892b0] font-mono tabular-nums">
                            <div>P: {d.polyVol}</div>
                            <div>K: {d.kalshiVol}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 hidden lg:table-cell">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#57D7BA]/10 text-[#57D7BA]">{d.category}</span>
                        </TableCell>
                        <TableCell className="py-2.5 hidden lg:table-cell">
                          {d.spreadTrend && d.spreadTrend !== "stable" ? (
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                              d.spreadTrend === "converging" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"
                            }`}>
                              {d.spreadTrend === "converging" ? "Converging" : "Diverging"}
                            </span>
                          ) : (
                            <span className="text-[8px] text-[#8892b0]">Stable</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2.5 hidden sm:table-cell">
                          <span className="text-[10px] text-[#8892b0] font-mono tabular-nums">{d.daysLeft > 0 ? `${d.daysLeft}d` : "—"}</span>
                        </TableCell>
                        <TableCell className="py-2.5 hidden xl:table-cell">
                          <AnnReturnCell value={annReturn} daysLeft={d.daysLeft > 0 ? d.daysLeft : undefined} />
                        </TableCell>
                        <TableCell className="pr-4 py-2.5 text-right">
                          <button
                            onClick={() => toggleExpand(d.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                              isExpanded
                                ? "bg-[#57D7BA]/20 text-[#57D7BA] border border-[#57D7BA]/30"
                                : isProfit
                                  ? "bg-[#57D7BA]/10 text-[#57D7BA] border border-[#57D7BA]/20 animate-pulse-glow"
                                  : "bg-[#2f374f] text-[#8892b0] border border-[#2f374f] hover:text-[#57D7BA] hover:border-[#57D7BA]/20"
                            }`}
                          >
                            <Zap className="size-3" />
                            Execute
                            {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                          </button>
                        </TableCell>
                      </TableRow>
                      {/* Expanded chart + resolution diff + calculator row */}
                      {isExpanded && (
                        <TableRow className="border-[#57D7BA]/20 bg-[#57D7BA]/5">
                          <TableCell colSpan={colSpan} className="p-4">
                            <div className="space-y-3">
                              <div className="rounded-xl bg-[#1a1e2e] border border-[#2f374f] p-3">
                                <SpreadHistoryChart marketId={d.marketId} question={d.question} heightPx={180} />
                              </div>
                              <ResolutionCriteriaDiff
                                result={analyzeResolutionDiff(null, null)}
                                polymarketUrl={null}
                                kalshiUrl={null}
                              />
                              <SpreadExecutionCalculator
                                polymarketPrice={d.polyPrice}
                                kalshiPrice={d.kalshiPrice}
                                spread={d.spread}
                                daysToResolution={daysToRes}
                                polymarketSide={polymarketSide}
                                kalshiSide={kalshiSide}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {disagreements.length === 0 && (
        <Card className="bg-[#222638] border-[#2f374f]">
          <CardContent className="py-16 text-center">
            <GitCompareArrows className="size-12 text-[#2f374f] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active arbitrage opportunities right now</h3>
            <p className="text-sm text-[#8892b0]">Check back in 30 minutes — disagreements are recalculated each ingestion cycle.</p>
          </CardContent>
        </Card>
      )}

      {disagreements.length > 0 && filtered.length === 0 && (
        <Card className="bg-[#222638] border-[#2f374f]">
          <CardContent className="py-16 text-center">
            <GitCompareArrows className="size-12 text-[#2f374f] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No disagreements found</h3>
            <p className="text-sm text-[#8892b0]">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}

      <footer className="flex items-center justify-between py-4 border-t border-[#2f374f] text-[10px] text-[#8892b0]">
        <span>© 2026 Quiver Markets. Not financial advice. Data from Polymarket &amp; Kalshi.</span>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}

export default function DisagreesPage() {
  return (
    <Suspense fallback={null}>
      <DisagreesContent />
    </Suspense>
  );
}
