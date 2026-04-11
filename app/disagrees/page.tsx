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
  Flame,
  Inbox,
} from "lucide-react";
import { useDisagreements } from "@/hooks/useData";
import { getSpreadHistory } from "@/lib/api";
import { InlineSparkline } from "@/components/ui/inline-sparkline";
import { LastUpdated } from "@/components/layout/LastUpdated";
import { DisagreeShareButton } from "@/components/ui/disagree-share";
import { Sparkline } from "@/components/ui/sparkline";
import { SpreadExecutionCalculator, calcAnnReturn, formatReturn } from "@/components/ui/spread-execution-calculator";
import { SpreadHistoryChart } from "@/components/ui/spread-history-chart";
import { SpreadVelocityIndicator } from "@/components/ui/spread-velocity-indicator";
import { CausationTag } from "@/components/ui/causation-tag";
import { ResolutionCriteriaDiff } from "@/components/ui/resolution-criteria-diff";
import { analyzeCausation } from "@/lib/causation";
import { analyzeResolutionDiff } from "@/lib/resolution-diff";
import type { CausationType, CausationAnalysis } from "@/lib/causation";
import type { Disagreement } from "@/lib/mockData";
import { DataFreshness } from "@/components/ui/data-freshness";
import { OpportunityScoreBadge } from "@/components/disagrees/opportunity-score-badge";
import { ArbCalculatorModal } from "@/components/disagrees/arb-calculator-modal";
import { scoreOpportunity } from "@/lib/opportunity-score";
import { generateThesis, thesisSignalColor } from "@/lib/market-thesis";
import { Sparkles } from "lucide-react";

const catFilters = ["All", "Economics", "Elections", "Crypto", "Tech", "Geopolitics"];

type SortKey = "opportunity" | "spread" | "polyVol" | "daysLeft" | "rawReturn";
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

function ReturnCell({ spread, daysLeft }: { spread: number; daysLeft?: number }) {
  const r = formatReturn(spread, daysLeft ?? null);
  return (
    <span
      className="font-mono text-xs font-bold tabular-nums"
      style={{ color: r.color }}
      title={r.tooltip}
    >
      {r.text}
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
  d, history, expanded, onToggleExpand, causationAnalysis, onOpenCalc,
}: {
  d: Disagreement;
  history: Array<{ t: number; spread: number }>;
  expanded: boolean;
  onToggleExpand: () => void;
  causationAnalysis: CausationAnalysis;
  onOpenCalc?: () => void;
}) {
  const { polymarketSide, kalshiSide } = sidesFor(d);
  const daysToRes = d.daysLeft > 0 ? d.daysLeft : null;
  const isProfit = d.spread > 0;
  const urgencyBorderColor = d.spread > 30 ? "#f85149" : d.spread > 15 ? "#d29922" : "#57D7BA";

  return (
    <div>
      <Card
        className="bg-[#161b27] border-[#21262d] hover:border-[#f59e0b]/30 transition-all h-full overflow-hidden"
        style={{ borderLeftColor: urgencyBorderColor, borderLeftWidth: "4px" }}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[8px] font-bold flex items-center gap-0.5">
              <AlertTriangle className="size-2.5" /> ARBITRAGE
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#57D7BA]/10 text-[#57D7BA] text-[8px] font-semibold">{d.category}</span>
            <OpportunityScoreBadge d={d} size="sm" />
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
            <div className="flex-1 text-center p-2 rounded-lg bg-[#0d1117] border border-[#21262d]">
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
            <div className="flex-1 text-center p-2 rounded-lg bg-[#0d1117] border border-[#21262d]">
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
          {/* Market thesis TL;DR */}
          {(() => {
            const thesis = generateThesis({
              question: d.question,
              price: d.polyPrice,
              change: 0,
              volNum: parseVol(d.polyVol),
              daysLeft: d.daysLeft,
              category: d.category,
            });
            return (
              <div className="flex items-start gap-1.5 mb-1.5 px-2 py-1.5 rounded-lg bg-[#0d1117] border border-[#21262d]">
                <Sparkles className="size-3 shrink-0 mt-0.5" style={{ color: thesisSignalColor(thesis.signal) }} />
                <p className="text-[9px] text-[#8d96a0] leading-relaxed italic">{thesis.text}</p>
              </div>
            );
          })()}
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
              {onOpenCalc && (
                <button
                  onClick={onOpenCalc}
                  className="flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-semibold bg-[#388bfd]/10 text-[#388bfd] border border-[#388bfd]/20 hover:bg-[#388bfd]/20 transition-all"
                  title="Open Arb Calculator"
                >
                  <BarChart3 className="size-3" />
                  Calc
                </button>
              )}
              <button
                onClick={onToggleExpand}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                  expanded
                    ? "bg-[#57D7BA]/20 text-[#57D7BA] border border-[#57D7BA]/30"
                    : isProfit
                      ? "bg-[#57D7BA]/10 text-[#57D7BA] border border-[#57D7BA]/20 animate-pulse-glow"
                      : "bg-[#21262d] text-[#8892b0] border border-[#21262d] hover:text-[#57D7BA]"
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
          <div className="rounded-xl bg-[#0d1117] border border-[#21262d] p-3">
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
  const [eliteOnly, setEliteOnly]     = useState(false);
  const [arbModalId, setArbModalId]   = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<"active" | "resolved">("active");

  // Dynamic tab title
  useEffect(() => {
    if (disagreements.length > 0) {
      document.title = `${disagreements.length} Disagreements · Quiver Markets`;
    }
    return () => { document.title = "Disagreements · Quiver Markets"; };
  }, [disagreements.length]);
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

  // Pre-compute annualized returns for each disagreement (internal ranking only — not displayed directly)
  const rawReturnMap = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const d of disagreements) {
      // Use annReturn internally for ranking (higher ann = relatively better opportunity)
      // but we display raw % to users via formatReturn()
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
    if (eliteOnly) {
      result = result.filter((d) =>
        scoreOpportunity({
          spread: d.spread, polyPrice: d.polyPrice, kalshiPrice: d.kalshiPrice,
          polyVol: d.polyVol, kalshiVol: d.kalshiVol, daysLeft: d.daysLeft,
          spreadTrend: d.spreadTrend, opportunityScore: d.opportunityScore,
        }).verdict === "elite"
      );
    }
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
      else if (sortBy === "rawReturn") {
        av = rawReturnMap.get(a.id) ?? -Infinity;
        bv = rawReturnMap.get(b.id) ?? -Infinity;
      }
      else { av = a.daysLeft; bv = b.daysLeft; }
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [disagreements, category, causeFilter, searchQuery, sortBy, sortDir, rawReturnMap, causationMap]);

  // Top opportunities strip — biggest spreads with enough liquidity
  const topOpportunities = useMemo(() => {
    return [...disagreements]
      .filter((d) => {
        if (d.spread < 10) return false;
        const minVol = Math.min(parseVol(d.polyVol), parseVol(d.kalshiVol));
        if (minVol < 500) return false;
        return true;
      })
      .sort((a, b) => b.spread - a.spread)
      .slice(0, 3);
  }, [disagreements]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortBy !== col) return <ChevronDown className="size-3 opacity-30" />;
    return sortDir === "desc" ? <ChevronDown className="size-3 text-[#57D7BA]" /> : <ChevronUp className="size-3 text-[#57D7BA]" />;
  };

  const topOpportunity = useMemo(() => {
    return disagreements
      .filter((d) => (d.matchConfidence ?? 1) >= 0.7 && d.spread >= 10)
      .sort((a, b) => b.spread - a.spread)[0] ?? null;
  }, [disagreements]);

  const scrollToDisagreement = (id: string) => {
    const el = document.getElementById(`disagreement-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const minutesUntilNextUpdate = 30 - (new Date().getMinutes() % 30);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* Sticky top opportunity banner */}
      {topOpportunity && (
        <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-gradient-to-r from-[#f85149]/10 via-[#161b27] to-[#161b27] border-b border-[#f85149]/20 backdrop-blur-sm mb-4">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#f85149]/15 flex items-center justify-center">
                <Flame className="w-4 h-4 text-[#f85149]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#f85149]">Top Opportunity Right Now</div>
                <div className="text-sm font-semibold text-[#f0f6fc] truncate">{topOpportunity.question}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <div className="text-xl font-bold text-[#f0f6fc] tabular-nums font-mono">{topOpportunity.spread.toFixed(1)}pt</div>
                <div className="text-[10px] text-[#8d96a0]">spread</div>
              </div>
              <button
                onClick={() => scrollToDisagreement(topOpportunity.id)}
                className="text-[11px] font-semibold text-[#57D7BA] hover:text-[#57D7BA]/80 transition-colors"
              >
                View →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <GitCompareArrows className="size-7 text-[#f59e0b]" />
            The Market Disagrees
          </h1>
          <p className="text-sm text-[#8892b0] mt-1">
            Cross-platform price spreads — where Polymarket and Kalshi see the world differently ·{" "}
            <Link href="/methodology" className="text-[#57D7BA] hover:underline text-xs">How is this computed?</Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated lastFetched={lastFetched} refreshing={refreshing} error={error} onRetry={retry} />
          <DataFreshness timestamp={lastFetched} />
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] font-bold">
            <AlertTriangle className="size-3" />
            {filtered.length} opportunities
          </span>
        </div>
      </div>

      {/* Urgency legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#8d96a0]">
        <span className="font-semibold text-[#484f58] uppercase tracking-wider">Urgency:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-1 h-4 bg-[#f85149] rounded-sm inline-block" />
          <span>High (30pt+ spread)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1 h-4 bg-[#d29922] rounded-sm inline-block" />
          <span>Medium (15–30pt)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1 h-4 bg-[#57D7BA] rounded-sm inline-block" />
          <span>Low (under 15pt)</span>
        </div>
      </div>

      {/* Top Opportunities Strip (Part 6) */}
      {topOpportunities.length > 0 && (
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <h2 className="text-sm font-bold text-[#e2e8f0] flex items-center gap-1.5">
              <TrendingUp className="size-4 text-[#fbbf24]" />
              Biggest Spreads Right Now
            </h2>
            <span className="text-[10px] text-[#8892b0]">Ranked by raw return on capital — not annualized, not net of fees</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topOpportunities.map((d) => {
              const r = formatReturn(d.spread, d.daysLeft > 0 ? d.daysLeft : null);
              return (
                <Card key={d.id} className="bg-[#161b27] border-[#fbbf24]/20 hover:border-[#fbbf24]/40 transition-all">
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
                        <div className="text-[9px] text-[#8892b0] uppercase tracking-wide">Return</div>
                        <div
                          className="font-mono font-bold text-2xl tabular-nums"
                          style={{ color: r.color }}
                          title={r.tooltip}
                        >
                          {r.text}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-[#8892b0] uppercase tracking-wide">Resolves</div>
                        <div className="font-mono font-bold text-[#e2e8f0] tabular-nums">
                          {d.daysLeft > 0 ? `${d.daysLeft}d` : "—"}
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
        <Card className="bg-[#161b27] border-[#f59e0b]/20">
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
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#161b27] shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 border border-[#21262d] text-sm text-[#e2e8f0] placeholder:text-[#8892b0]/60 focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          {/* Category chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {catFilters.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${category === cat ? "bg-[#f59e0b] text-[#0f1119]" : "bg-[#161b27] text-[#8892b0] hover:text-[#e2e8f0] border border-[#21262d]"}`}
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
                    : "bg-[#0d1117] text-[#8892b0] hover:text-[#e2e8f0] border-[#21262d]"
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
              onClick={() => setEliteOnly((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold transition-all border ${
                eliteOnly ? "bg-[#f85149]/20 text-[#f85149] border-[#f85149]/40" : "bg-[#161b27] text-[#8892b0] border-[#21262d] hover:text-[#e2e8f0]"
              }`}
            >
              <Zap className="size-3" /> Elite Only
            </button>
            <button
              onClick={() => handleSort("opportunity")}
              className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all ${sortBy === "opportunity" ? "bg-[#f59e0b] text-[#0f1119]" : "bg-[#161b27] text-[#8892b0] border border-[#21262d] hover:text-[#e2e8f0]"}`}
            >
              Score ↓
            </button>
            <button
              onClick={() => handleSort("rawReturn")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium transition-all ${sortBy === "rawReturn" ? "bg-[#fbbf24] text-[#0f1119]" : "bg-[#161b27] text-[#8892b0] border border-[#21262d] hover:text-[#e2e8f0]"}`}
            >
              Return ↓
            </button>
          </div>
          <span className="text-[10px] text-[#8892b0] font-mono">{filtered.length} results</span>
          <div className="flex items-center gap-0.5 bg-[#161b27] rounded-lg p-0.5 border border-[#21262d]">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-[#f59e0b] text-[#0f1119]" : "text-[#8892b0]"}`}><LayoutGrid className="size-3.5" /></button>
            <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-[#f59e0b] text-[#0f1119]" : "text-[#8892b0]"}`}><List className="size-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Active / Resolved tabs */}
      <div className="flex items-center gap-1 border-b border-[#21262d]">
        {(["active", "resolved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold transition-all capitalize border-b-2 -mb-px ${
              activeTab === tab
                ? "border-[#57D7BA] text-[#57D7BA]"
                : "border-transparent text-[#8892b0] hover:text-[#f0f6fc]"
            }`}
          >
            {tab === "active" ? "Active Arbs" : "Did This Arb Close?"}
            {tab === "active" && <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#f59e0b]/15 text-[#f59e0b] text-[9px]">{disagreements.length}</span>}
          </button>
        ))}
      </div>

      {/* Resolved tab content */}
      {activeTab === "resolved" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-6 text-center space-y-3">
            <GitCompareArrows className="size-10 text-[#21262d] mx-auto" />
            <h3 className="text-base font-semibold text-[#f0f6fc]">Resolved Arbitrage Archive</h3>
            <p className="text-sm text-[#8d96a0] max-w-md mx-auto">
              Track which spreads converged before resolution vs. which ones blew out.
              Historical resolution data is collected every ingestion cycle and will appear here once enough spreads have resolved.
            </p>
            <div className="flex items-center justify-center gap-4 pt-2 text-[11px] text-[#484f58]">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#3fb950]" />Converged — arb profitable</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#f85149]" />Blew out — arb lost</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#8d96a0]" />Unresolved</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "active" && (
        <>
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
            <Card key={s.label} className="bg-[#161b27] border-[#21262d]">
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
          {filtered.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#161b27] border border-[#21262d] flex items-center justify-center mb-4">
                <Inbox className="w-7 h-7 text-[#484f58]" />
              </div>
              <h3 className="text-lg font-semibold text-[#f0f6fc] mb-1">No significant disagreements right now</h3>
              <p className="text-sm text-[#8d96a0] max-w-md mb-4">Markets are in agreement. Check back soon — spreads open and close throughout the day.</p>
              <div className="text-[11px] text-[#484f58]">Next update in {minutesUntilNextUpdate} minutes</div>
            </div>
          ) : (
            filtered.map((d) => (
              <div key={d.id} id={`disagreement-${d.id}`}>
                <DisagreeCard
                  d={d}
                  history={historyMap[d.marketId] || []}
                  expanded={expandedId === d.id}
                  onToggleExpand={() => toggleExpand(d.id)}
                  causationAnalysis={causationMap.get(d.id)!}
                  onOpenCalc={() => setArbModalId(d.id)}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Table view */}
      {viewMode === "table" && (
        <Card className="bg-[#161b27] border-[#21262d]">
          <CardContent className="px-0 py-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#21262d] hover:bg-transparent">
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
                  {/* Raw return column */}
                  <TableHead
                    className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] hidden xl:table-cell"
                    onClick={() => handleSort("rawReturn")}
                  >
                    <span className="flex items-center gap-0.5">
                      RETURN
                      <SortIcon col="rawReturn" />
                      <Tooltip>
                        <TooltipTrigger><HelpCircle className="size-3 text-[#4a5168] cursor-help ml-0.5" /></TooltipTrigger>
                        <TooltipContent className="max-w-[260px] text-[11px]">
                          Raw return if the spread converges fully at resolution. Not annualized — prediction market arbs are one-shot trades. Actual return will be lower after fees.
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
                  const causationAnalysis = causationMap.get(d.id)!;
                  const isExpanded = expandedId === d.id;
                  const isProfit = d.spread > 0;
                  const colSpan = 13;

                  const tableUrgencyColor = d.spread > 30 ? "#f85149" : d.spread > 15 ? "#d29922" : "#57D7BA";
                  return (
                    <React.Fragment key={d.id}>
                      <TableRow
                        id={`disagreement-${d.id}`}
                        ref={(el) => { rowRefs.current[d.id] = el; }}
                        className={`border-[#21262d]/50 hover:bg-[#f59e0b]/5 transition-colors ${isExpanded ? "bg-[#57D7BA]/5" : ""}`}
                        style={{ borderLeftColor: tableUrgencyColor, borderLeftWidth: "3px" }}
                      >
                        <TableCell className="pl-4 py-2.5 max-w-[120px] sm:max-w-[220px]">
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
                          <ReturnCell spread={d.spread} daysLeft={d.daysLeft > 0 ? d.daysLeft : undefined} />
                        </TableCell>
                        <TableCell className="pr-4 py-2.5 text-right">
                          <button
                            onClick={() => toggleExpand(d.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                              isExpanded
                                ? "bg-[#57D7BA]/20 text-[#57D7BA] border border-[#57D7BA]/30"
                                : isProfit
                                  ? "bg-[#57D7BA]/10 text-[#57D7BA] border border-[#57D7BA]/20 animate-pulse-glow"
                                  : "bg-[#21262d] text-[#8892b0] border border-[#21262d] hover:text-[#57D7BA] hover:border-[#57D7BA]/20"
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
                              <div className="rounded-xl bg-[#0d1117] border border-[#21262d] p-3">
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
        <Card className="bg-[#161b27] border-[#21262d]">
          <CardContent className="py-16 text-center">
            <GitCompareArrows className="size-12 text-[#21262d] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active arbitrage opportunities right now</h3>
            <p className="text-sm text-[#8892b0]">Check back in 30 minutes — disagreements are recalculated each ingestion cycle.</p>
          </CardContent>
        </Card>
      )}

      {disagreements.length > 0 && filtered.length === 0 && (
        <Card className="bg-[#161b27] border-[#21262d]">
          <CardContent className="py-16 text-center">
            <GitCompareArrows className="size-12 text-[#21262d] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No disagreements found</h3>
            <p className="text-sm text-[#8892b0]">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
        </>
      )}

      {/* Arb Calculator Modal */}
      {arbModalId && (() => {
        const d = disagreements.find((x) => x.id === arbModalId);
        return d ? (
          <ArbCalculatorModal d={d} open={true} onClose={() => setArbModalId(null)} />
        ) : null;
      })()}

      <footer className="flex items-center justify-between py-4 border-t border-[#21262d] text-[10px] text-[#8892b0]">
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
