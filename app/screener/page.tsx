"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  BarChart3,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  LayoutGrid,
  List,
  Filter,
  Timer,
  Flame,
  SlidersHorizontal,
  X,
  Crown,
  Zap,
  GitCompareArrows,
  Newspaper,
  Brain,
} from "lucide-react";
import { useMarkets, useDisagreements } from "@/hooks/useData";
import { CATEGORIES, PLATFORMS } from "@/lib/mockData";
import type { Market } from "@/lib/mockData";
import { LastUpdated } from "@/components/layout/LastUpdated";
import { ProBadge } from "@/components/ui/pro-gate";
import { formatPct, formatCents } from "@/lib/format";
import { getMarketInsights, type MarketInsight } from "@/lib/api";
import { analyzeCausation, getCausationLabel } from "@/lib/causation";

type SortKey = "volume" | "change" | "spread" | "resolution" | "price" | "liquidity";
type SortDir = "asc" | "desc";
type ViewMode = "grid" | "table";

const sortOptions: { label: string; key: SortKey }[] = [
  { label: "Top volume", key: "volume" },
  { label: "Biggest movers", key: "change" },
  { label: "Spread", key: "spread" },
  { label: "Resolution", key: "resolution" },
  { label: "Liquidity", key: "liquidity" },
];

function MiniSparkline({ data, positive }: { data: { d: number; v: number }[]; positive: boolean }) {
  return (
    <div className="h-8 w-16">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={data}><Line type="monotone" dataKey="v" stroke={positive ? "#22c55e" : "#ef4444"} strokeWidth={1.5} dot={false} /></LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ResBadge({ days }: { days: number }) {
  const color = days <= 14 ? "#ef4444" : days <= 60 ? "#f59e0b" : days <= 180 ? "#57D7BA" : "#8892b0";
  const bg = days <= 14 ? "bg-[#ef4444]/10" : days <= 60 ? "bg-[#f59e0b]/10" : days <= 180 ? "bg-[#57D7BA]/10" : "bg-[#2a2f45]";
  const label = days <= 7 ? `${days}d` : days <= 60 ? `${days}d` : days <= 365 ? `${Math.round(days / 30)}mo` : `${(days / 365).toFixed(1)}y`;
  return <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold ${bg}`} style={{ color }}><Timer className="size-2.5" />{label}</span>;
}

function InsightIcon({ type }: { type: MarketInsight["type"] }) {
  if (type === "signal") return <Zap className="size-2.5 shrink-0" />;
  if (type === "disagreement") return <GitCompareArrows className="size-2.5 shrink-0" />;
  if (type === "catalyst") return <Newspaper className="size-2.5 shrink-0" />;
  return <Brain className="size-2.5 shrink-0" />;
}

function ScreenerCard({ m, spread, insight, causeType }: {
  m: Market;
  spread: number | null;
  insight?: MarketInsight;
  causeType?: ReturnType<typeof getCausationLabel> | null;
}) {
  const positive = m.change >= 0;
  const isInfoLag = causeType?.label === "Information Lag";
  const isResMismatch = causeType?.label === "Resolution Mismatch";
  return (
    <Link href={`/markets/${m.id}`} className="block group">
      <Card className="bg-[#222638] border-[#2f374f] hover:border-[#57D7BA]/30 hover:shadow-lg hover:shadow-[#57D7BA]/5 hover:scale-[1.02] transition-all duration-200 h-full">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#57D7BA]/10 text-[#57D7BA]">{m.category}</span>
            <ResBadge days={m.daysLeft} />
            {m.trending && <span className="px-1 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[8px] font-bold flex items-center gap-0.5"><Flame className="size-2" />HOT</span>}
            {spread !== null && spread >= 10 && <span className="px-1 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[8px] font-bold">{spread}pt spread</span>}
            <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-[#2a2f45] text-[#8892b0]">{m.platform}</span>
          </div>
          <p className="text-xs font-semibold leading-snug group-hover:text-[#57D7BA] transition-colors line-clamp-2 mb-2 flex-1">{m.question}</p>
          {insight && (
            insight.type === "disagreement" ? (
              <Link
                href={`/disagrees?highlight=${m.id}`}
                onClick={(e) => e.stopPropagation()}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] mb-2 max-w-full truncate transition-colors ${
                  isResMismatch
                    ? "text-[#ef4444] bg-[#ef4444]/10 hover:bg-[#ef4444]/20"
                    : "text-[#f59e0b] bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20"
                }`}
              >
                {isInfoLag && (
                  <span className="size-1.5 rounded-full bg-[#22c55e] animate-pulse shrink-0" />
                )}
                <InsightIcon type={insight.type} />
                <span className="truncate">
                  {insight.label}{causeType ? ` · ${causeType.label}` : ""}
                </span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-[#57D7BA] bg-[#57D7BA]/10 mb-2 max-w-full truncate">
                <InsightIcon type={insight.type} />
                <span className="truncate">{insight.label}</span>
              </span>
            )
          )}
          <div className="h-8 w-full mb-2">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={m.spark}>
                <defs><linearGradient id={`sc-${m.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={positive ? "#22c55e" : "#ef4444"} stopOpacity={0.3} /><stop offset="95%" stopColor={positive ? "#22c55e" : "#ef4444"} stopOpacity={0} /></linearGradient></defs>
                <Area type="monotone" dataKey="v" stroke={positive ? "#22c55e" : "#ef4444"} strokeWidth={1.5} fill={`url(#sc-${m.id})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold tabular-nums text-[#e2e8f0]">{formatCents(m.price)}</span>
              {Math.abs(m.change) > 0.05 && (
                <span className={`flex items-center gap-0.5 font-mono text-xs font-semibold tabular-nums ${positive ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}{formatPct(Math.abs(m.change))}
                </span>
              )}
            </div>
            <span className="font-mono text-[10px] text-[#8892b0] tabular-nums">{m.volume}</span>
          </div>
          <div className="h-1.5 rounded-full bg-[#1a1e2e] overflow-hidden flex">
            <div className="h-full bg-[#22c55e] rounded-l-full" style={{ width: `${m.price}%` }} />
            <div className="h-full bg-[#ef4444] rounded-r-full" style={{ width: `${100 - m.price}%` }} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function ScreenerPage() {
  const { markets, source, refreshing, lastFetched, error, retry } = useMarkets();
  const { disagreements } = useDisagreements();
  const [insightsMap, setInsightsMap] = useState<Map<string, MarketInsight>>(new Map());

  useEffect(() => {
    getMarketInsights().then(setInsightsMap).catch(() => {});
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [category, setCategory] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [sortBy, setSortBy] = useState<SortKey>("volume");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [displayCount, setDisplayCount] = useState(60);

  // Advanced filters
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minVolume, setMinVolume] = useState("");
  const [spreadOnly, setSpreadOnly] = useState(false);
  const [resolvingSoon, setResolvingSoon] = useState(false);

  // Build spread lookup and causation map
  const spreadMap = useMemo(() => {
    const map: Record<string, number> = {};
    disagreements.forEach((d) => { map[d.marketId] = d.spread; });
    return map;
  }, [disagreements]);

  function parseVolStr(v: string): number {
    const n = parseFloat(v.replace(/[$KM,]/g, ""));
    if (v.includes("M")) return n * 1_000_000;
    if (v.includes("K")) return n * 1_000;
    return n || 0;
  }

  const causationLabelMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof getCausationLabel>> = {};
    for (const d of disagreements) {
      const analysis = analyzeCausation({
        polymarketPrice: d.polyPrice,
        kalshiPrice: d.kalshiPrice,
        spread: d.spread,
        polymarketVolume: parseVolStr(d.polyVol),
        kalshiVolume: parseVolStr(d.kalshiVol),
        daysToResolution: d.daysLeft > 0 ? d.daysLeft : null,
        spreadAgeHours: null,
        convergenceVelocity: null,
        category: d.category,
        resolutionCriteriaDiffer: null,
      });
      map[d.marketId] = getCausationLabel(analysis.primaryCause);
    }
    return map;
  }, [disagreements]);

  function handleSearchChange(val: string) {
    setSearchInput(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(val);
      setDisplayCount(60);
    }, 250);
  }

  function clearSearch() {
    setSearchInput("");
    setSearchQuery("");
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
  }

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let result = markets;
    if (category !== "All" && category !== "Trending") result = result.filter((m) => m.category === category);
    if (category === "Trending") result = result.filter((m) => m.trending);
    if (platform !== "All") result = result.filter((m) => m.platform === platform);
    if (searchQuery) result = result.filter((m) => m.question.toLowerCase().includes(searchQuery.toLowerCase()));

    // Advanced filters
    if (minPrice) result = result.filter((m) => m.price >= parseInt(minPrice));
    if (maxPrice) result = result.filter((m) => m.price <= parseInt(maxPrice));
    if (minVolume) result = result.filter((m) => m.volNum >= parseInt(minVolume));
    if (spreadOnly) result = result.filter((m) => (spreadMap[m.id] || 0) >= 10);
    if (resolvingSoon) result = result.filter((m) => m.daysLeft <= 30);
    // When sorting by biggest movers, exclude zero-change markets
    if (sortBy === "change") result = result.filter((m) => Math.abs(m.change) > 0.05);

    return [...result].sort((a, b) => {
      let av: number, bv: number;
      if (sortBy === "volume") { av = a.volNum; bv = b.volNum; }
      else if (sortBy === "change") { av = Math.abs(a.change); bv = Math.abs(b.change); }
      else if (sortBy === "spread") { av = spreadMap[a.id] || 0; bv = spreadMap[b.id] || 0; }
      else if (sortBy === "resolution") { av = a.daysLeft; bv = b.daysLeft; }
      else if (sortBy === "liquidity") { av = parseFloat(a.liquidity.replace(/[$MK,]/g, "")) * (a.liquidity.includes("M") ? 1000 : 1); bv = parseFloat(b.liquidity.replace(/[$MK,]/g, "")) * (b.liquidity.includes("M") ? 1000 : 1); }
      else { av = a.price; bv = b.price; }
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [markets, category, platform, searchQuery, sortBy, sortDir, minPrice, maxPrice, minVolume, spreadOnly, resolvingSoon, spreadMap]);

  const activeFilterCount = [minPrice, maxPrice, minVolume, spreadOnly, resolvingSoon].filter(Boolean).length;

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
            <BarChart3 className="size-7 text-[#57D7BA]" />
            Markets
          </h1>
          <p className="text-sm text-[#8892b0] mt-1 flex items-center gap-2">
            Advanced filtering across {markets.length.toLocaleString()} prediction markets
            {source === "live"
              ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">LIVE</span>
              : <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20">MOCK</span>
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated lastFetched={lastFetched} refreshing={refreshing} error={error} onRetry={retry} />
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#57D7BA]/10 text-[#57D7BA] text-[10px] font-bold tabular-nums">{filtered.length} results</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#8892b0] pointer-events-none" />
        <input
          type="text"
          placeholder="Search markets…"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full h-11 pl-11 pr-10 rounded-xl bg-[#222638] border border-[#2f374f] text-sm text-[#e2e8f0] placeholder:text-[#8892b0]/60 focus:outline-none focus:ring-2 focus:ring-[#57D7BA]/40 transition-all shadow-lg shadow-black/20"
        />
        {searchInput && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8892b0] hover:text-[#e2e8f0] transition-colors"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-2">
        {/* Row 1: Categories — horizontal scroll on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.slice(0, 10).map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${category === cat ? "bg-[#57D7BA] text-[#0f1119]" : "bg-[#222638] text-[#8892b0] hover:text-[#e2e8f0] border border-[#2f374f]"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Row 2: Platform + Sort + Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Platform */}
          <div className="flex items-center gap-1">
            {PLATFORMS.map((p) => (
              <button key={p} onClick={() => setPlatform(p)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border ${platform === p ? "bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/30" : "bg-[#222638] text-[#8892b0] border-[#2f374f]"}`}>
                {p}
              </button>
            ))}
          </div>

          <span className="text-[10px] text-[#2f374f]">|</span>

          {/* Sort */}
          <div className="flex items-center gap-1 flex-wrap">
            {sortOptions.map((opt) => (
              <button key={opt.key} onClick={() => handleSort(opt.key)}
                className={`shrink-0 px-2 py-1 rounded-lg text-[9px] font-medium transition-all border ${sortBy === opt.key ? "bg-[#57D7BA]/10 text-[#57D7BA] border-[#57D7BA]/30" : "bg-[#222638] text-[#8892b0] border-[#2f374f]"}`}>
                {opt.label}{sortBy === opt.key && (sortDir === "desc" ? " ↓" : " ↑")}
              </button>
            ))}
          </div>

          {/* Advanced + View toggle */}
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border ${showAdvanced ? "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30" : "bg-[#222638] text-[#8892b0] border-[#2f374f]"}`}>
              <SlidersHorizontal className="size-3" />
              <span className="hidden sm:inline">Advanced</span>
              {activeFilterCount > 0 && <span className="size-4 rounded-full bg-[#f59e0b] text-[#0f1119] text-[8px] font-bold flex items-center justify-center">{activeFilterCount}</span>}
            </button>
            <div className="flex items-center gap-0.5 bg-[#222638] rounded-lg p-0.5 border border-[#2f374f]">
              <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-[#57D7BA] text-[#0f1119]" : "text-[#8892b0]"}`}><LayoutGrid className="size-3.5" /></button>
              <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-[#57D7BA] text-[#0f1119]" : "text-[#8892b0]"}`}><List className="size-3.5" /></button>
            </div>
          </div>
        </div>

        {/* Advanced filter panel */}
        {showAdvanced && (
          <Card className="bg-[#222638] border-[#f59e0b]/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold flex items-center gap-1.5"><SlidersHorizontal className="size-3.5 text-[#f59e0b]" />Advanced Filters <ProBadge /></span>
                <button onClick={() => { setMinPrice(""); setMaxPrice(""); setMinVolume(""); setSpreadOnly(false); setResolvingSoon(false); }} className="text-[9px] text-[#8892b0] hover:text-[#ef4444] transition-colors">Clear all</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[9px] text-[#8892b0] uppercase tracking-wider mb-1">Min Price</label>
                  <div className="relative">
                    <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0"
                      className="w-full h-8 px-3 rounded-lg bg-[#1a1e2e] border border-[#2f374f] text-xs text-[#e2e8f0] font-mono focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 transition-all" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#8892b0]">¢</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] text-[#8892b0] uppercase tracking-wider mb-1">Max Price</label>
                  <div className="relative">
                    <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="100"
                      className="w-full h-8 px-3 rounded-lg bg-[#1a1e2e] border border-[#2f374f] text-xs text-[#e2e8f0] font-mono focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 transition-all" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#8892b0]">¢</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] text-[#8892b0] uppercase tracking-wider mb-1">Min Volume</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-[#8892b0]">$</span>
                    <input type="number" value={minVolume} onChange={(e) => setMinVolume(e.target.value)} placeholder="0"
                      className="w-full h-8 pl-5 pr-3 rounded-lg bg-[#1a1e2e] border border-[#2f374f] text-xs text-[#e2e8f0] font-mono focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] text-[#8892b0] uppercase tracking-wider mb-1">Spread ≥ 10pt</label>
                  <button onClick={() => setSpreadOnly(!spreadOnly)}
                    className={`w-full h-8 rounded-lg text-xs font-semibold transition-all ${spreadOnly ? "bg-[#f59e0b] text-[#0f1119]" : "bg-[#1a1e2e] border border-[#2f374f] text-[#8892b0]"}`}>
                    {spreadOnly ? "ON" : "OFF"}
                  </button>
                </div>
                <div>
                  <label className="block text-[9px] text-[#8892b0] uppercase tracking-wider mb-1">Resolves ≤ 30d</label>
                  <button onClick={() => setResolvingSoon(!resolvingSoon)}
                    className={`w-full h-8 rounded-lg text-xs font-semibold transition-all ${resolvingSoon ? "bg-[#ef4444] text-white" : "bg-[#1a1e2e] border border-[#2f374f] text-[#8892b0]"}`}>
                    {resolvingSoon ? "ON" : "OFF"}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Grid */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.slice(0, displayCount).map((m) => <ScreenerCard key={m.id} m={m} spread={spreadMap[m.id] ?? null} insight={insightsMap.get(m.id)} causeType={causationLabelMap[m.id] ?? null} />)}
        </div>
      )}

      {/* Table */}
      {viewMode === "table" && (
        <Card className="bg-[#222638] border-[#2f374f]">
          <CardContent className="px-0 py-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2f374f] hover:bg-transparent">
                  <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">MARKET</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium hidden sm:table-cell">TREND</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handleSort("price")}>
                    <span className="flex items-center gap-0.5">PRICE <SortIcon col="price" /></span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handleSort("change")}>
                    <span className="flex items-center gap-0.5">24H <SortIcon col="change" /></span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] hidden md:table-cell" onClick={() => handleSort("volume")}>
                    <span className="flex items-center gap-0.5">VOL <SortIcon col="volume" /></span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] hidden lg:table-cell" onClick={() => handleSort("spread")}>
                    <span className="flex items-center gap-0.5">SPREAD <SortIcon col="spread" /></span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] hidden lg:table-cell" onClick={() => handleSort("liquidity")}>
                    <span className="flex items-center gap-0.5">LIQ <SortIcon col="liquidity" /></span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] hidden sm:table-cell" onClick={() => handleSort("resolution")}>
                    <span className="flex items-center gap-0.5">RESOLVES <SortIcon col="resolution" /></span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium hidden md:table-cell">CAT</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4 hidden lg:table-cell">PLAT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, displayCount).map((m) => {
                  const spread = spreadMap[m.id] || 0;
                  return (
                    <TableRow key={m.id} className="border-[#2f374f]/50 hover:bg-[#57D7BA]/5 cursor-pointer transition-colors">
                      <TableCell className="pl-4 py-2.5 max-w-[200px]">
                        <Link href={`/markets/${m.id}`} className="text-xs font-medium text-[#e2e8f0] hover:text-[#57D7BA] transition-colors line-clamp-1 truncate block">{m.question}</Link>
                      </TableCell>
                      <TableCell className="py-2.5 hidden sm:table-cell"><MiniSparkline data={m.spark} positive={m.change >= 0} /></TableCell>
                      <TableCell className="py-2.5"><span className="font-mono text-xs font-semibold tabular-nums text-[#e2e8f0]">{formatCents(m.price)}</span></TableCell>
                      <TableCell className="py-2.5 whitespace-nowrap">
                        {Math.abs(m.change) > 0.05 ? (
                          <span className={`flex items-center gap-0.5 font-mono text-xs font-semibold tabular-nums ${m.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                            {m.change >= 0 ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}{formatPct(Math.abs(m.change))}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#8892b0]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 hidden md:table-cell"><span className="font-mono text-[11px] text-[#8892b0] tabular-nums">{m.volume}</span></TableCell>
                      <TableCell className="py-2.5 hidden lg:table-cell">
                        {spread >= 10 ? (
                          <span className="px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[9px] font-bold font-mono tabular-nums">{spread}pt</span>
                        ) : spread > 0 ? (
                          <span className="text-[10px] text-[#8892b0] font-mono tabular-nums">{spread}pt</span>
                        ) : (
                          <span className="text-[10px] text-[#8892b0]">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 hidden lg:table-cell"><span className="font-mono text-[10px] text-[#8892b0] tabular-nums">{m.liquidity}</span></TableCell>
                      <TableCell className="py-2.5 hidden sm:table-cell"><ResBadge days={m.daysLeft} /></TableCell>
                      <TableCell className="py-2.5 hidden md:table-cell"><span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#57D7BA]/10 text-[#57D7BA]">{m.category}</span></TableCell>
                      <TableCell className="pr-4 py-2.5 hidden lg:table-cell"><span className="text-[10px] text-[#8892b0]">{m.platform}</span></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {displayCount < filtered.length && (
        <div className="flex justify-center">
          <Button
            onClick={() => setDisplayCount((c) => c + 60)}
            className="bg-[#222638] border border-[#2f374f] text-[#e2e8f0] hover:bg-[#57D7BA]/10 hover:border-[#57D7BA]/30 px-8"
          >
            Load more ({filtered.length - displayCount} remaining)
          </Button>
        </div>
      )}

      {filtered.length === 0 && (
        <Card className="bg-[#222638] border-[#2f374f]">
          <CardContent className="py-16 text-center">
            <BarChart3 className="size-12 text-[#2f374f] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No markets match your filters</h3>
            <p className="text-sm text-[#8892b0]">Try adjusting your search, category, or advanced filters</p>
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
