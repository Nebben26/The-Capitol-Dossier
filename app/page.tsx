"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  Treemap,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
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
import {
  TrendingUp,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Trophy,
  ExternalLink,
  AlertTriangle,
  GitCompareArrows,
  Clock,
  Database,
  Users,
  Activity,
  Send,
  Wallet,
  Code,
} from "lucide-react";
import { useHomepageData, useDisagreements } from "@/hooks/useData";
import { HOMEPAGE_CATEGORIES as categories, sparkGen } from "@/lib/mockData";
import { getLastIngestTimestamp, getWaitlistCount, getSystemStats } from "@/lib/api";
import { DisagreeShareButton } from "@/components/ui/disagree-share";
import { EmbedButton } from "@/components/ui/embed-button";
import { useDataSource } from "@/components/layout/DataSourceContext";
import { LastUpdated } from "@/components/layout/LastUpdated";
import { HomepageSkeleton } from "@/components/ui/skeleton-loaders";
import { MorningBriefCard } from "@/components/ui/morning-brief";
import { FirstVisitHero } from "@/components/ui/first-visit-hero";
import { formatSignedPct, formatPct, formatCents, formatSignedPt, formatPt } from "@/lib/format";
import { WaitlistForm } from "@/components/ui/waitlist-form";
import { SearchBox } from "@/components/ui/search-box";
import { SinceLastVisit } from "@/components/ui/since-last-visit";
import { CountUp } from "@/components/ui/count-up";
import { computeMarketPulse, pulseColor, pulseLabel, type MarketPulse } from "@/lib/market-pulse";
import { useRecentMarkets } from "@/hooks/useRecentMarkets";
import { supabase } from "@/lib/supabase";

// ─── MINI SPARKLINE ───────────────────────────────────────────────────
function Sparkline({ data, positive }: { data: { d: number; v: number }[]; positive: boolean }) {
  return (
    <div className="h-8 w-16">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={positive ? "#22c55e" : "#ef4444"} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── TREEMAP CUSTOM CONTENT ───────────────────────────────────────────
function CustomTreemapContent(props: { x?: number; y?: number; width?: number; height?: number; name?: string; change?: number; size?: number }) {
  const { x = 0, y = 0, width = 0, height = 0, name, change, size = 0 } = props;
  if (width < 50 || height < 30 || !name || size < 100 || change === undefined || change === null) return null;
  const color = change >= 0 ? "#22c55e" : "#ef4444";
  const bgOpacity = Math.max(0.15, Math.min(Math.abs(change) / 8, 0.85));
  return (
    <g className="cursor-pointer" style={{ filter: "brightness(1)" }}>
      <rect x={x} y={y} width={width} height={height} fill={color} fillOpacity={bgOpacity} stroke="#0d1117" strokeWidth={2} rx={6} />
      {width > 70 && height > 40 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - (width > 100 && height > 55 ? 8 : 2)} textAnchor="middle" fill="#ffffff" fontSize={width > 140 ? 11 : 9} fontWeight={600} opacity={0.9}>
            {name.length > Math.floor(width / 7) ? name.slice(0, Math.floor(width / 7) - 1) + "…" : name}
          </text>
          {width > 80 && height > 40 && (
            <text x={x + width / 2} y={y + height / 2 + (width > 100 && height > 55 ? 8 : 12)} textAnchor="middle" fill="#ffffff" fontSize={12} fontWeight={700} opacity={0.95}>
              {formatSignedPt(change)}
            </text>
          )}
          {width > 110 && height > 60 && (
            <text x={x + width / 2} y={y + height / 2 + 24} textAnchor="middle" fill="#ffffff" fontSize={8} opacity={0.7}>
              ${(size / 1000).toFixed(1)}M vol
            </text>
          )}
        </>
      )}
    </g>
  );
}

// ─── GAUGE COMPONENT ──────────────────────────────────────────────────
function PulseGauge({ pulse }: { pulse: MarketPulse | null }) {
  const value = pulse?.score ?? -1;
  const displayValue = value < 0 ? "—" : String(value);
  const color = pulseColor(value);
  const arcValue = value < 0 ? 50 : value;

  // Arc dot position: center=(100,95), radius=80
  const angle = ((arcValue / 100) * Math.PI) - (Math.PI / 2);
  const dotX = 100 + 80 * Math.sin(angle);
  const dotY = 95 - 80 * Math.cos(angle);

  return (
    <div className="relative group flex flex-col items-center cursor-default">
      <svg viewBox="0 0 200 115" className="w-48 h-auto">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3fb950" />
            <stop offset="50%" stopColor="#d29922" />
            <stop offset="100%" stopColor="#f85149" />
          </linearGradient>
        </defs>
        <path d="M 20 95 A 80 80 0 0 1 180 95" fill="none" stroke="#2a2f45" strokeWidth="12" strokeLinecap="round" />
        {value >= 0 && (
          <path d="M 20 95 A 80 80 0 0 1 180 95" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(arcValue / 100) * 251} 251`} />
        )}
        <circle cx={dotX} cy={dotY} r={6} fill="#fff" stroke={value < 0 ? "#484f58" : color} strokeWidth={2} />
        <text x="100" y="85" textAnchor="middle" fill={value < 0 ? "#484f58" : "#f0f6fc"} fontSize="22" fontWeight="700">{displayValue}</text>
      </svg>
      <span className="text-xs text-[#8892b0] mt-1 tracking-wide uppercase">
        {pulse ? pulseLabel(pulse.label) : "Loading…"}
      </span>

      {/* Breakdown tooltip */}
      {pulse && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-[#0d1117] border border-[#21262d] rounded-lg p-3 shadow-card opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-30">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#8d96a0] mb-2">Market Pulse Components</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#8d96a0]">Spread health</span>
              <span className="text-[#f0f6fc] tabular-nums font-mono">{pulse.components.spreadScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8d96a0]">Volume</span>
              <span className="text-[#f0f6fc] tabular-nums font-mono">{pulse.components.volumeScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8d96a0]">Whale activity</span>
              <span className="text-[#f0f6fc] tabular-nums font-mono">{pulse.components.whaleScore}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8d96a0]">Price movement</span>
              <span className="text-[#f0f6fc] tabular-nums font-mono">{pulse.components.movementScore}</span>
            </div>
          </div>
          <div className="pt-1.5 mt-1.5 border-t border-[#21262d] text-[9px] text-[#484f58]">
            Computed from live Supabase data
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SORT HELPER ──────────────────────────────────────────────────────
type SortKey = "price" | "change" | "vol";
type SortDir = "asc" | "desc";

// ─── MAIN PAGE ────────────────────────────────────────────────────────
export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [dataPointsDaily, setDataPointsDaily] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("change");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const [priceOffsets, setPriceOffsets] = useState<Record<string, number>>({});
  const [moversFallbackCategory, setMoversFallbackCategory] = useState<string | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const [lastIngestAt, setLastIngestAt] = useState<string | null>(null);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const [sysStats, setSysStats] = useState<{ marketsCount: number; signalsCount: number; disagreementsCount: number; whalesCount: number } | null>(null);
  const [pulse, setPulse] = useState<MarketPulse | null>(null);

  const { recents } = useRecentMarkets();
  const { markets: allMarkets, biggestMovers: defaultMovers, breakingMarkets, whaleActivity, treemapData, source, refreshing, lastFetched, error, retry } = useHomepageData();
  const { disagreements: rawDisagreements } = useDisagreements();
  const { setSource } = useDataSource();

  useEffect(() => { setSource(source); }, [source, setSource]);

  // Enrich disagreements with market volumes from loaded markets
  const disagreements = useMemo(() => {
    if (!allMarkets.length) return rawDisagreements;
    const marketMap = new Map(allMarkets.map((m) => [m.id, m]));
    return rawDisagreements.map((d) => {
      const polyM = marketMap.get(d.marketId);
      return {
        ...d,
        polyVol: (d.polyVol && d.polyVol !== "$0") ? d.polyVol : (polyM?.volume || d.polyVol),
        kalshiVol: (d.kalshiVol && d.kalshiVol !== "$0") ? d.kalshiVol : d.kalshiVol,
      };
    });
  }, [rawDisagreements, allMarkets]);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 1200); return () => clearTimeout(t); }, []);

  useEffect(() => {
    getLastIngestTimestamp().then(setLastIngestAt);
    getWaitlistCount().then(setWaitlistCount);
    getSystemStats().then((s) => setSysStats({ marketsCount: s.marketsCount, signalsCount: s.signalsCount, disagreementsCount: s.disagreementsCount, whalesCount: s.whalesCount }));
    computeMarketPulse().then(setPulse).catch(() => {/* leave null */});
    // Data points ingested in last 24h
    supabase
      .from("price_history")
      .select("id", { count: "exact", head: true })
      .gte("timestamp", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .then(({ count }) => { if (count && count > 0) setDataPointsDaily(count); });
  }, []);

  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  // Derive biggest movers from centralized markets, filtered by active category
  const filteredMovers = useMemo(() => {
    let filtered = allMarkets;
    let fallback: string | null = null;
    if (activeCategory === "All") {
      // no category filter
    } else {
      const catFiltered = allMarkets.filter((m) => m.category === activeCategory);
      if (catFiltered.length >= 3) { filtered = catFiltered; }
      else if (allMarkets.length > 0) { filtered = allMarkets; fallback = activeCategory; }
    }
    setMoversFallbackCategory(fallback);
    return [...filtered]
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 8)
      .map((m) => ({
        id: m.id,
        q: m.question,
        price: m.price,
        change: m.change,
        vol: m.volume.replace("$", ""),
        spark: m.spark,
        cat: m.category,
      }));
  }, [allMarkets, activeCategory]);

  const sortedMovers = useMemo(() => {
    const parseVol = (v: string) => parseFloat(v.replace("M", ""));
    return [...filteredMovers].sort((a, b) => {
      let aVal: number, bVal: number;
      if (sortKey === "vol") { aVal = parseVol(a.vol); bVal = parseVol(b.vol); }
      else { aVal = Math.abs(a[sortKey]); bVal = Math.abs(b[sortKey]); }
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [filteredMovers, sortKey, sortDir]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (filteredMovers.length === 0) return;
      const idx = Math.floor(Math.random() * filteredMovers.length);
      const m = filteredMovers[idx];
      setPriceOffsets(prev => ({
        ...prev,
        [m.id]: (prev[m.id] || 0) + (Math.random() > 0.5 ? 1 : -1),
      }));
    }, 25000);
    return () => clearInterval(interval);
  }, [filteredMovers]);

  // Filter breaking markets by category
  const filteredBreaking = useMemo(() => {
    if (activeCategory === "All") return breakingMarkets;
    const catMarketIds = allMarkets.filter((m) => m.category === activeCategory).map((m) => m.id);
    const filtered = breakingMarkets.filter((b) => catMarketIds.includes(b.id));
    return filtered.length > 0 ? filtered : breakingMarkets;
  }, [allMarkets, breakingMarkets, activeCategory]);

  // Filter whale activity by category
  const filteredWhales = useMemo(() => {
    if (activeCategory === "All") return whaleActivity;
    const catMarketIds = allMarkets.filter((m) => m.category === activeCategory).map((m) => m.id);
    const filtered = whaleActivity.filter((w) => catMarketIds.includes(w.marketId));
    return filtered.length > 0 ? filtered : whaleActivity;
  }, [allMarkets, whaleActivity, activeCategory]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="size-3 opacity-30" />;
    return sortDir === "desc" ? <ChevronDown className="size-3 text-[#57D7BA]" /> : <ChevronUp className="size-3 text-[#57D7BA]" />;
  };

  if (loading) return <HomepageSkeleton />;

  const marketCount = sysStats?.marketsCount ?? 0;
  const disagreeCount = sysStats?.disagreementsCount ?? 0;
  const whaleCount = sysStats?.whalesCount ?? 0;

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* ─── MARKETING HERO ──────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-[#21262d] bg-gradient-to-br from-[#161b27] via-[#0d1117] to-[#0d1117] p-8 lg:p-12 mb-6">
        {/* Ambient glows */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#57D7BA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#388bfd]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2 bg-[#57D7BA]/10 border border-[#57D7BA]/20 rounded-full px-3 py-1 text-[11px] font-bold text-[#57D7BA] uppercase tracking-widest mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#57D7BA] animate-pulse" />
            Live Intelligence
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f0f6fc] leading-[1.1] tracking-tight mb-4">
            Prediction market intelligence
            <br />
            <span className="bg-gradient-to-r from-[#57D7BA] to-[#388bfd] bg-clip-text text-transparent">you can&apos;t get anywhere else.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-[#8d96a0] leading-relaxed mb-6 max-w-2xl">
            Track whale positions, detect cross-platform arbitrage, and see the smart money moves on Polymarket and Kalshi — updated every 30 minutes.
          </p>

          {/* Stat strip */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-10 mb-6">
            <div>
              {marketCount > 0
                ? <CountUp end={marketCount} className="text-2xl font-bold text-[#f0f6fc] tabular-nums font-mono" />
                : <span className="text-2xl font-bold text-[#f0f6fc] tabular-nums font-mono">—</span>}
              <div className="text-xs text-[#8d96a0] uppercase tracking-wide mt-0.5">Markets Tracked</div>
            </div>
            <div>
              {disagreeCount > 0
                ? <CountUp end={disagreeCount} className="text-2xl font-bold text-[#57D7BA] tabular-nums font-mono" />
                : <span className="text-2xl font-bold text-[#57D7BA] tabular-nums font-mono">—</span>}
              <div className="text-xs text-[#8d96a0] uppercase tracking-wide mt-0.5">Active Disagreements</div>
            </div>
            <div>
              {whaleCount > 0
                ? <CountUp end={whaleCount} className="text-2xl font-bold text-[#f0f6fc] tabular-nums font-mono" />
                : <span className="text-2xl font-bold text-[#f0f6fc] tabular-nums font-mono">—</span>}
              <div className="text-xs text-[#8d96a0] uppercase tracking-wide mt-0.5">Whales Tracked</div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/disagrees" className="inline-flex items-center gap-2 bg-[#57D7BA] text-[#0d1117] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#57D7BA]/90 transition-all duration-150 active:scale-[0.97] shadow-glow-brand">
              See Live Opportunities
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 bg-[#161b27] text-[#f0f6fc] font-semibold text-sm px-5 py-2.5 rounded-lg border border-[#21262d] hover:border-[#57D7BA]/40 transition-all duration-150 active:scale-[0.97]">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ─── SOCIAL PROOF STRIP ──────────────────────────────── */}
      {(sysStats || dataPointsDaily) && (
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-4 px-6 rounded-2xl bg-[#161b27] border border-[#21262d]">
          {sysStats && sysStats.marketsCount > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-[#57D7BA]/10 flex items-center justify-center">
                <Activity className="size-4 text-[#57D7BA]" />
              </div>
              <div>
                <div className="text-base font-bold tabular-nums font-mono text-[#f0f6fc]">{sysStats.marketsCount.toLocaleString()}</div>
                <div className="text-[10px] text-[#8d96a0] uppercase tracking-wide">Markets</div>
              </div>
            </div>
          )}
          {sysStats && sysStats.whalesCount > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                <Users className="size-4 text-[#8b5cf6]" />
              </div>
              <div>
                <div className="text-base font-bold tabular-nums font-mono text-[#f0f6fc]">{sysStats.whalesCount.toLocaleString()}</div>
                <div className="text-[10px] text-[#8d96a0] uppercase tracking-wide">Whales Tracked</div>
              </div>
            </div>
          )}
          {dataPointsDaily && dataPointsDaily > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-[#388bfd]/10 flex items-center justify-center">
                <Database className="size-4 text-[#388bfd]" />
              </div>
              <div>
                <div className="text-base font-bold tabular-nums font-mono text-[#f0f6fc]">{dataPointsDaily.toLocaleString()}</div>
                <div className="text-[10px] text-[#8d96a0] uppercase tracking-wide">Data Points Today</div>
              </div>
            </div>
          )}
          {sysStats && sysStats.disagreementsCount > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
                <GitCompareArrows className="size-4 text-[#f59e0b]" />
              </div>
              <div>
                <div className="text-base font-bold tabular-nums font-mono text-[#f0f6fc]">{sysStats.disagreementsCount.toLocaleString()}</div>
                <div className="text-[10px] text-[#8d96a0] uppercase tracking-wide">Spreads Found</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── FIRST-VISIT HERO ────────────────────────────────── */}
      <FirstVisitHero />

      {/* ─── SEARCH BOX ──────────────────────────────────────── */}
      <SearchBox />

      {/* ─── SINCE LAST VISIT ────────────────────────────────── */}
      <SinceLastVisit />

      {/* ─── DASHBOARD ANCHOR ────────────────────────────────── */}
      <div id="dashboard-content" />

      {/* ─── INGEST FRESHNESS ────────────────────────────────── */}
      {lastIngestAt && (() => {
        const ageMs = Date.now() - new Date(lastIngestAt).getTime();
        const ageStr = ageMs < 60_000 ? "just now"
          : ageMs < 3_600_000 ? `${Math.floor(ageMs / 60_000)}m ago`
          : `${Math.floor(ageMs / 3_600_000)}h ago`;
        const color = ageMs < 3_600_000 ? "#22c55e" : ageMs < 7_200_000 ? "#f59e0b" : "#ef4444";
        return (
          <div className="flex items-center gap-1.5 text-[10px] font-mono tabular-nums" style={{ color }}>
            <span className="size-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
            Live data — last ingested {ageStr}
          </div>
        );
      })()}

      {/* ─── MORNING BRIEF ───────────────────────────────────── */}
      <MorningBriefCard />

      {/* ─── SIGNAL DESK CALLOUT ─────────────────────────────── */}
      <div className="rounded-xl border border-[#d29922]/30 bg-gradient-to-r from-[#d29922]/8 to-[#161b27] p-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#d29922]/15 flex items-center justify-center shrink-0">
            <Send className="w-3.5 h-3.5 text-[#d29922]" />
          </div>
          <span className="text-xs font-bold text-[#d29922]">Signal Desk</span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-[#d29922] bg-[#d29922]/10 border border-[#d29922]/20 px-1.5 py-0.5 rounded-full">NEW · $199/mo</span>
        </div>
        <p className="text-[11px] text-[#8d96a0] leading-relaxed">
          Get a Telegram push the instant an arb spread opens or a whale takes a $50K+ position. Set your own thresholds. First 25 spots: $149/mo locked for life.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-[11px] text-[#d29922] font-semibold hover:text-[#d29922]/80 transition-colors"
        >
          Learn about Signal Desk →
        </Link>
      </div>

      {/* ─── BACKTESTER CALLOUT ──────────────────────────────── */}
      <div className="rounded-xl border border-[#3fb950]/30 bg-gradient-to-r from-[#3fb950]/8 to-[#161b27] p-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#3fb950]/15 flex items-center justify-center shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-[#3fb950]" />
          </div>
          <span className="text-xs font-bold text-[#3fb950]">Arb Backtester</span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-[#3fb950] bg-[#3fb950]/10 border border-[#3fb950]/20 px-1.5 py-0.5 rounded-full">NEW</span>
        </div>
        <p className="text-[11px] text-[#8d96a0] leading-relaxed">
          What would you have made following Quiver&apos;s arb signals? Simulated P&amp;L, win rate, equity curve, and per-signal breakdown across all historical data.
        </p>
        <Link
          href="/backtest"
          className="inline-flex items-center gap-1.5 text-[11px] text-[#3fb950] font-semibold hover:text-[#3fb950]/80 transition-colors"
        >
          Run a backtest →
        </Link>
      </div>

      {/* ─── EMBED CALLOUT ───────────────────────────────────── */}
      <div className="rounded-xl border border-[#388bfd]/30 bg-gradient-to-r from-[#388bfd]/8 to-[#161b27] p-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#388bfd]/15 flex items-center justify-center shrink-0">
            <Code className="w-3.5 h-3.5 text-[#388bfd]" />
          </div>
          <span className="text-xs font-bold text-[#388bfd]">Embed Widgets</span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-[#388bfd] bg-[#388bfd]/10 border border-[#388bfd]/20 px-1.5 py-0.5 rounded-full">FREE</span>
        </div>
        <p className="text-[11px] text-[#8d96a0] leading-relaxed">
          Drop live prediction market data into any blog, newsletter, or news site. One script tag. Auto-refreshes every 60 seconds. No React required.
        </p>
        <Link
          href="/embed/builder"
          className="inline-flex items-center gap-1.5 text-[11px] text-[#388bfd] font-semibold hover:text-[#388bfd]/80 transition-colors"
        >
          Build your embed →
        </Link>
      </div>

      {/* ─── MY QUIVER CALLOUT ───────────────────────────────── */}
      <div className="rounded-xl border border-[#57D7BA]/30 bg-gradient-to-r from-[#57D7BA]/8 to-[#161b27] p-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#57D7BA]/15 flex items-center justify-center shrink-0">
            <Wallet className="w-3.5 h-3.5 text-[#57D7BA]" />
          </div>
          <span className="text-xs font-bold text-[#57D7BA]">My Quiver</span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-[#57D7BA] bg-[#57D7BA]/10 border border-[#57D7BA]/20 px-1.5 py-0.5 rounded-full">NEW · Free</span>
        </div>
        <p className="text-[11px] text-[#8d96a0] leading-relaxed">
          Connect your Polymarket wallet to see your own positions, P&amp;L, and apply Quiver&apos;s intelligence to your real trades. Free for all users.
        </p>
        <Link
          href="/my"
          className="inline-flex items-center gap-1.5 text-[11px] text-[#57D7BA] font-semibold hover:text-[#57D7BA]/80 transition-colors"
        >
          Connect your wallet →
        </Link>
      </div>

      {/* ─── WAITLIST ────────────────────────────────────────── */}
      <Card className="bg-[#161b27] border-[#21262d]">
        <CardContent className="p-5">
          <p className="text-xs font-semibold text-[#57D7BA] uppercase tracking-widest mb-1">Founder cohort</p>
          <p className="text-sm text-[#8892b0] mb-3">
            {waitlistCount !== null && waitlistCount >= 10
              ? `Join ${waitlistCount.toLocaleString()} others who've locked in founder pricing.`
              : "Lock in Pro at $39/mo or Signal Desk at $149/mo — founder pricing, for life."}
          </p>
          <WaitlistForm source="homepage" />
        </CardContent>
      </Card>

      {/* ─── HERO: MARKET PULSE ──────────────────────────────── */}
      <Card className="bg-[#161b27] border-[#21262d] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#57D7BA]/5 via-transparent to-[#ef4444]/5 pointer-events-none" />
        <CardContent className="p-5 relative">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <PulseGauge pulse={pulse} />
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ef4444]/10 text-[#ef4444] text-xs font-semibold">
                  <Flame className="size-3" /> Alert
                </span>
                <LastUpdated lastFetched={lastFetched} refreshing={refreshing} error={error} onRetry={retry} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#ef4444] mb-1">Market Intelligence</p>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight mb-2">
                {allMarkets.length > 24 ? (
                  <>Tracking <span className="text-[#57D7BA]">{allMarkets.length.toLocaleString()} markets</span> across Polymarket &amp; Kalshi</>
                ) : (
                  <>Prediction markets are pricing in a <span className="text-[#57D7BA]">68% chance of recession</span> by Dec</>
                )}
              </h1>
              <p className="text-sm text-[#8892b0] max-w-2xl">
                {allMarkets.length > 24
                  ? `Top market: "${allMarkets[0]?.question}" at ${allMarkets[0]?.price}¢. ${allMarkets.filter(m => Math.abs(m.change) > 5).length} markets moved >5% today.`
                  : "Whale wallets moved $14.2M into recession YES contracts in the last 24h."}
              </p>
            </div>
            <div className="hidden xl:block w-64 h-24">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <AreaChart data={sparkGen(40, 4)}>
                  <defs>
                    <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#57D7BA" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#57D7BA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#57D7BA" strokeWidth={2} fill="url(#heroGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── MARKET DISAGREES ──────────────────────────────────── */}
      {disagreements.length > 0 && (
        <Card className="bg-[#161b27] border-[#21262d]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <GitCompareArrows className="size-4 text-[#f59e0b]" />
                The Market Disagrees
              </CardTitle>
              <Link href="/disagrees" className="text-[10px] text-[#57D7BA] hover:underline">View all →</Link>
            </div>
            <CardDescription className="text-[10px] text-[#8892b0]">
              Cross-platform spreads ≥ 10pts — potential arbitrage opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {disagreements.slice(0, 3).map((d) => (
                <div key={d.id} className="p-3 rounded-lg border border-[#21262d] hover:border-[#f59e0b]/30 transition-all">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[8px] font-bold flex items-center gap-0.5">
                      <AlertTriangle className="size-2.5" /> ARBITRAGE
                    </span>
                    <span className="text-[8px] text-[#8892b0]">{d.category}</span>
                  </div>
                  <Link href={`/markets/${d.marketId}`} className="block group">
                    <p className="text-xs font-medium text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors leading-snug line-clamp-2 mb-3">
                      {d.question}
                    </p>
                  </Link>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 text-center p-1.5 rounded bg-[#0d1117]">
                      <div className="text-[8px] text-[#8892b0] mb-0.5">Polymarket</div>
                      <div className="font-mono text-sm font-bold tabular-nums text-[#e2e8f0]">{d.polyPrice}¢</div>
                    </div>
                    <div className="shrink-0 px-2 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-bold font-mono tabular-nums">
                      {d.spread}pt
                    </div>
                    <div className="flex-1 text-center p-1.5 rounded bg-[#0d1117]">
                      <div className="text-[8px] text-[#8892b0] mb-0.5">Kalshi</div>
                      <div className="font-mono text-sm font-bold tabular-nums text-[#e2e8f0]">{d.kalshiPrice}¢</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[#8892b0]">Vol: {d.polyVol} / {d.kalshiVol}</span>
                    <div className="flex items-center gap-1.5">
                      <EmbedButton type="disagree" id={d.id} label="Embed" />
                      <DisagreeShareButton d={d} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── PILL FILTERS ────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === cat
                ? "bg-[#57D7BA] text-[#0f1119] shadow-lg shadow-[#57D7BA]/20"
                : "bg-[#161b27] text-[#8892b0] hover:text-[#e2e8f0] border border-[#21262d] hover:border-[#57D7BA]/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ─── RECENTLY VIEWED ─────────────────────────────────── */}
      {recents.length > 0 && (
        <Card className="bg-[#161b27] border-[#21262d]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-[#8d96a0]" />
              Recently Viewed
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex flex-wrap gap-2">
              {recents.map((r) => (
                <Link
                  key={r.id}
                  href={`/markets/${r.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0d1117] border border-[#21262d] hover:border-[#57D7BA]/30 hover:bg-[#57D7BA]/5 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors max-w-[200px] truncate">{r.question}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-[#8d96a0]">{r.category}</span>
                      <span className="font-mono text-[9px] text-[#8d96a0] tabular-nums">{r.price}¢</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── THREE COLUMN LAYOUT ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ─── LEFT: BIGGEST MOVERS TABLE ────────────────────── */}
        <div className="lg:col-span-5">
          <Card className="bg-[#161b27] border-[#21262d]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="size-4 text-[#57D7BA]" />
                  Biggest Movers Right Now
                </CardTitle>
                <span className="text-[10px] text-[#8892b0] font-mono">24H</span>
              </div>
              {moversFallbackCategory && (
                <p className="text-[10px] text-[#f59e0b] mt-1">Showing all categories (no {moversFallbackCategory} movers in 24h)</p>
              )}
            </CardHeader>
            <CardContent className="px-0 pb-2 overflow-x-hidden">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow className="border-[#21262d] hover:bg-transparent">
                    <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">CONTRACT</TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium w-16 hidden sm:table-cell">TREND</TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] transition-colors w-14" onClick={() => handleSort("price")}>
                      <span className="flex items-center gap-0.5">PRICE <SortIcon col="price" /></span>
                    </TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] transition-colors w-16" onClick={() => handleSort("change")}>
                      <span className="flex items-center gap-0.5">24H <SortIcon col="change" /></span>
                    </TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] transition-colors w-16 pr-4 hidden md:table-cell" onClick={() => handleSort("vol")}>
                      <span className="flex items-center gap-0.5">VOL <SortIcon col="vol" /></span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMovers.map((m, i) => (
                    <TableRow key={m.id} className="border-[#21262d]/50 hover:bg-[#57D7BA]/5 cursor-pointer transition-colors">
                      <TableCell className="pl-4 py-2.5 max-w-[180px]">
                        <Tooltip>
                          <TooltipTrigger>
                            <Link href={`/markets/${m.id}`} className="text-xs font-medium text-[#e2e8f0] hover:text-[#57D7BA] transition-colors leading-tight text-left block truncate max-w-[220px]" title={m.q}>
                              {m.q}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-[#161b27] border-[#21262d] text-[#e2e8f0] p-3 max-w-xs">
                            <div className="space-y-2">
                              <p className="text-xs font-medium">{m.q}</p>
                              <div className="h-12 w-40">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                  <AreaChart data={m.spark}>
                                    <defs>
                                      <linearGradient id={`tip-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={m.change >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={m.change >= 0 ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                                      </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="v" stroke={m.change >= 0 ? "#22c55e" : "#ef4444"} fill={`url(#tip-${m.id})`} strokeWidth={1.5} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span className="text-[#8892b0]">Bid: {Math.max(m.price - 2, 1)}¢</span>
                                <span className="text-[#8892b0]">Ask: {m.price + 2}¢</span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                        <span className="block text-[10px] text-[#8892b0] mt-0.5">{m.cat}</span>
                      </TableCell>
                      <TableCell className="py-2.5 hidden sm:table-cell">
                        <Sparkline data={m.spark} positive={m.change >= 0} />
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className="font-mono text-xs font-semibold tabular-nums text-[#e2e8f0]">{formatCents(m.price + (priceOffsets[m.id] || 0))}</span>
                      </TableCell>
                      <TableCell className="py-2.5 whitespace-nowrap">
                        <span className={`flex items-center gap-0.5 font-mono text-xs font-semibold tabular-nums ${(m.change + (priceOffsets[m.id] || 0)) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                          {(m.change + (priceOffsets[m.id] || 0)) >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          {formatPt(Math.abs(m.change + (priceOffsets[m.id] || 0)))}
                        </span>
                      </TableCell>
                      <TableCell className="pr-4 py-2.5 hidden md:table-cell">
                        <span className="font-mono text-[11px] text-[#8892b0] tabular-nums">${m.vol}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedMovers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-xs text-[#8892b0]">
                        Loading market data…
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* ─── CENTER: HIGHEST VOLUME MARKETS ────────────────── */}
        <div className="lg:col-span-4">
          <Card className="bg-[#161b27] border-[#21262d]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="size-4 text-[#f59e0b]" />
                Highest Volume Markets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-3">
              {filteredBreaking.map((m, i) => (
                <Link key={m.id} href={`/markets/${m.id}`} className="group block">
                  <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#57D7BA]/5 transition-all border border-transparent hover:border-[#57D7BA]/10">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors leading-snug">{m.title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="font-mono text-xs font-semibold tabular-nums text-[#e2e8f0]">{m.price}¢</span>
                        <span className="text-[10px] text-[#8892b0]">${m.vol} traded</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ─── RIGHT: TOP WHALES BY P&L ───────────────────── */}
        <div className="lg:col-span-3">
          <Card className="bg-[#161b27] border-[#21262d]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Trophy className="size-4 text-[#f59e0b]" />
                  Top Whales by P&L
                </CardTitle>
                <Link href="/whales" className="text-[10px] text-[#57D7BA] hover:underline">View all →</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pb-3">
              {filteredWhales.map((w, i) => (
                <Link key={`${w.id}-${i}`} href={`/whales/${w.id}`} className="group block">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-[#21262d] hover:border-[#57D7BA]/20 transition-all">
                    <div className="size-6 rounded-full bg-gradient-to-br from-[#57D7BA] to-[#8b5cf6] flex items-center justify-center text-[8px] font-bold text-[#0f1119] shrink-0">#{w.rank}</div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors">{w.name}</span>
                      <div className="mt-0.5">
                        <span className="text-[10px] font-mono font-semibold text-[#22c55e]">{w.pos}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── TREEMAP / MOBILE LIST: MARKET VOLUME HEATMAP ───── */}
      <Card className="bg-[#161b27] border-[#21262d]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="size-4 text-[#57D7BA]" />
              Market Volume Heatmap
            </CardTitle>
            <CardDescription className="text-[10px] flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-[#22c55e]" /> Positive 24h</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-[#ef4444]" /> Negative 24h</span>
              <span className="text-[#8892b0]">Size = Volume</span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          {isNarrow ? (
            /* Mobile fallback: simple top-10 list */
            <div className="space-y-1">
              {[...treemapData]
                .filter(t => t.name && t.size >= 100 && typeof t.change === "number")
                .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
                .slice(0, 10)
                .map((t) => (
                  <div key={t.name} className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[#57D7BA]/5">
                    <div className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: t.change >= 0 ? "#22c55e" : "#ef4444" }} />
                    <span className="flex-1 text-xs text-[#e2e8f0] truncate">{t.name}</span>
                    <span className={`font-mono text-xs font-bold tabular-nums whitespace-nowrap ${t.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {formatSignedPt(t.change)}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="h-64 sm:h-80 w-full rounded-lg border border-[#21262d] overflow-hidden">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <Treemap data={treemapData.filter(t => t.name && t.size >= 100 && typeof t.change === "number")} dataKey="size" aspectRatio={4 / 3} content={<CustomTreemapContent />} />
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>


      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="py-4 border-t border-[#21262d] text-[10px] text-[#8892b0] space-y-3">
        {/* Platform track record */}
        {sysStats && (sysStats.marketsCount > 0 || sysStats.signalsCount > 0) && (
          <div className="flex flex-wrap items-center justify-center gap-3 py-2 px-4 rounded-lg bg-[#57D7BA]/5 border border-[#57D7BA]/10 text-[10px] font-mono tabular-nums">
            <span className="text-[#8892b0]">Platform track record:</span>
            {sysStats.marketsCount > 0 && <span className="text-[#57D7BA] font-semibold">{sysStats.marketsCount.toLocaleString()} markets tracked</span>}
            {sysStats.signalsCount > 0 && <span className="text-[#f59e0b] font-semibold">{sysStats.signalsCount.toLocaleString()} signals generated</span>}
            {sysStats.disagreementsCount > 0 && <span className="text-[#ef4444] font-semibold">{sysStats.disagreementsCount.toLocaleString()} spreads identified</span>}
          </div>
        )}
        {/* Trust signals */}
        <div className="text-center text-[#8892b0]/70">
          <span className="font-mono tabular-nums">
            {allMarkets.length > 0 ? allMarkets.length.toLocaleString() : "6,500"} markets
            {" · "}
            {allMarkets.filter(m => Math.abs(m.change) > 0).length > 0
              ? `${allMarkets.filter(m => Math.abs(m.change) > 0).length.toLocaleString()} movers today`
              : "Live data"}
            {" · updated every 30 min"}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>© 2026 Quiver Markets. Not financial advice. Data from Polymarket &amp; Kalshi.</span>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/about" className="hover:text-[#57D7BA] transition-colors">About</Link>
            <Link href="/roadmap" className="hover:text-[#57D7BA] transition-colors">Roadmap</Link>
            <Link href="/api-docs" className="hover:text-[#57D7BA] transition-colors">API</Link>
            <Link href="/pricing" className="hover:text-[#57D7BA] transition-colors">Pricing</Link>
            <a href="mailto:hello@quivermarkets.com" className="hover:text-[#57D7BA] transition-colors">Contact</a>
            <Link href="/blog" className="hover:text-[#57D7BA] transition-colors">Blog</Link>
            <Link href="/changelog" className="hover:text-[#57D7BA] transition-colors">Changelog</Link>
            <Link href="/status" className="hover:text-[#57D7BA] transition-colors">Status</Link>
            <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
            <button
              onClick={() => {
                localStorage.removeItem("qm_seen_hero");
                window.location.reload();
              }}
              className="hover:text-[#57D7BA] transition-colors"
            >
              Show intro
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
