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
  Zap,
  ChevronUp,
  ChevronDown,
  Flame,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react";
import { useHomepageData, useDisagreements, useSmartMoneyMoves, useInsights } from "@/hooks/useData";
import { Newspaper, ExternalLink } from "lucide-react";
import { Brain, Target as TargetIcon } from "lucide-react";
import { HOMEPAGE_CATEGORIES as categories, sparkGen } from "@/lib/mockData";
import { AlertTriangle, GitCompareArrows } from "lucide-react";
import { DisagreeShareButton } from "@/components/ui/disagree-share";
import { EmbedButton } from "@/components/ui/embed-button";
import { useDataSource } from "@/components/layout/DataSourceContext";
import { LastUpdated } from "@/components/layout/LastUpdated";
import { HomepageSkeleton } from "@/components/ui/skeleton-loaders";

// ─── MINI SPARKLINE ───────────────────────────────────────────────────
function Sparkline({ data, positive }: { data: { d: number; v: number }[]; positive: boolean }) {
  return (
    <div className="h-8 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={positive ? "#22c55e" : "#ef4444"} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── TREEMAP CUSTOM CONTENT ───────────────────────────────────────────
function CustomTreemapContent(props: { x?: number; y?: number; width?: number; height?: number; name?: string; change?: number; size?: number }) {
  const { x = 0, y = 0, width = 0, height = 0, name, change = 0, size = 0 } = props;
  if (width < 50 || height < 30) return null;
  const color = change >= 0 ? "#22c55e" : "#ef4444";
  const bgOpacity = Math.min(Math.abs(change) / 12, 0.85);
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} fillOpacity={bgOpacity} stroke="#1a1e2e" strokeWidth={2} rx={4} />
      {width > 70 && height > 40 && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#e2e8f0" fontSize={width > 120 ? 11 : 9} fontWeight={600}>{name}</text>
          <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill={color} fontSize={10} fontWeight={700}>{change >= 0 ? "+" : ""}{change.toFixed(1)}%</text>
          {width > 100 && height > 55 && (
            <text x={x + width / 2} y={y + height / 2 + 24} textAnchor="middle" fill="#8892b0" fontSize={8}>${(size / 100).toFixed(1)}M vol</text>
          )}
        </>
      )}
    </g>
  );
}

// ─── GAUGE COMPONENT ──────────────────────────────────────────────────
function PulseGauge({ value, label }: { value: number; label: string }) {
  const angle = (value / 100) * 180 - 90;
  const rad = (angle * Math.PI) / 180;
  const needleX = 100 + 65 * Math.cos(rad);
  const needleY = 95 + 65 * Math.sin(rad);
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 115" className="w-48 h-auto">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <path d="M 20 95 A 80 80 0 0 1 180 95" fill="none" stroke="#2a2f45" strokeWidth="12" strokeLinecap="round" />
        <path d="M 20 95 A 80 80 0 0 1 180 95" fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${(value / 100) * 251} 251`} />
        <line x1="100" y1="95" x2={needleX} y2={needleY} stroke="#57D7BA" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="100" cy="95" r="4" fill="#57D7BA" />
        <text x="100" y="82" textAnchor="middle" fill="#e2e8f0" fontSize="22" fontWeight="700">{value}</text>
      </svg>
      <span className="text-xs text-[#8892b0] mt-1 tracking-wide uppercase">{label}</span>
    </div>
  );
}

// ─── SORT HELPER ──────────────────────────────────────────────────────
type SortKey = "price" | "change" | "vol";
type SortDir = "asc" | "desc";

// ─── MAIN PAGE ────────────────────────────────────────────────────────
export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("Trending");
  const [sortKey, setSortKey] = useState<SortKey>("change");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const [priceOffsets, setPriceOffsets] = useState<Record<string, number>>({});

  const { markets: allMarkets, biggestMovers: defaultMovers, breakingMarkets, whaleActivity, treemapData, source, refreshing, lastFetched, error, retry } = useHomepageData();
  const { disagreements } = useDisagreements();
  const { moves: smartMoves } = useSmartMoneyMoves();
  const { insights } = useInsights();
  const { setSource } = useDataSource();

  useEffect(() => { setSource(source); }, [source, setSource]);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 1200); return () => clearTimeout(t); }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  // Derive biggest movers from centralized markets, filtered by active category
  const filteredMovers = useMemo(() => {
    let filtered = allMarkets;
    if (activeCategory === "Trending") {
      filtered = allMarkets.filter((m) => m.trending);
    } else {
      filtered = allMarkets.filter((m) => m.category === activeCategory);
    }
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
    if (activeCategory === "Trending") return breakingMarkets;
    const catMarketIds = allMarkets.filter((m) => m.category === activeCategory).map((m) => m.id);
    const filtered = breakingMarkets.filter((b) => catMarketIds.includes(b.id));
    return filtered.length > 0 ? filtered : breakingMarkets;
  }, [allMarkets, breakingMarkets, activeCategory]);

  // Filter whale activity by category
  const filteredWhales = useMemo(() => {
    if (activeCategory === "Trending") return whaleActivity;
    const catMarketIds = allMarkets.filter((m) => m.category === activeCategory).map((m) => m.id);
    const filtered = whaleActivity.filter((w) => catMarketIds.includes(w.marketId));
    return filtered.length > 0 ? filtered : whaleActivity;
  }, [allMarkets, whaleActivity, activeCategory]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="size-3 opacity-30" />;
    return sortDir === "desc" ? <ChevronDown className="size-3 text-[#57D7BA]" /> : <ChevronUp className="size-3 text-[#57D7BA]" />;
  };

  if (loading) return <HomepageSkeleton />;

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* ─── HERO: MARKET PULSE ──────────────────────────────── */}
      <Card className="bg-[#222638] border-[#2f374f] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#57D7BA]/5 via-transparent to-[#ef4444]/5 pointer-events-none" />
        <CardContent className="p-5 relative">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <PulseGauge value={68} label="Fear & Greed" />
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ef4444]/10 text-[#ef4444] text-xs font-semibold">
                  <Flame className="size-3" /> Alert
                </span>
                <LastUpdated lastFetched={lastFetched} refreshing={refreshing} error={error} onRetry={retry} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#ef4444] mb-1">The Market Disagrees</p>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight mb-2">
                Prediction markets are pricing in a{" "}
                <span className="text-[#57D7BA]">68% chance of recession</span>{" "}
                by Dec — biggest jump in 3 months
              </h1>
              <p className="text-sm text-[#8892b0] max-w-2xl">
                Whale wallets moved $14.2M into recession YES contracts in the last 24h.
                Polymarket volume up 340% on economic markets. Kalshi odds diverge by 8 points.
              </p>
            </div>
            <div className="hidden xl:block w-64 h-24">
              <ResponsiveContainer width="100%" height="100%">
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
        <Card className="bg-[#222638] border-[#2f374f]">
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
                <div key={d.id} className="p-3 rounded-lg border border-[#2f374f] hover:border-[#f59e0b]/30 transition-all">
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
                    <div className="flex-1 text-center p-1.5 rounded bg-[#1a1e2e]">
                      <div className="text-[8px] text-[#8892b0] mb-0.5">Polymarket</div>
                      <div className="font-mono text-sm font-bold tabular-nums text-[#e2e8f0]">{d.polyPrice}¢</div>
                    </div>
                    <div className="shrink-0 px-2 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-bold font-mono tabular-nums">
                      {d.spread}pt
                    </div>
                    <div className="flex-1 text-center p-1.5 rounded bg-[#1a1e2e]">
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
                : "bg-[#222638] text-[#8892b0] hover:text-[#e2e8f0] border border-[#2f374f] hover:border-[#57D7BA]/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ─── THREE COLUMN LAYOUT ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ─── LEFT: BIGGEST MOVERS TABLE ────────────────────── */}
        <div className="lg:col-span-5">
          <Card className="bg-[#222638] border-[#2f374f]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="size-4 text-[#57D7BA]" />
                  Biggest Movers Right Now
                </CardTitle>
                <span className="text-[10px] text-[#8892b0] font-mono">24H</span>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2f374f] hover:bg-transparent">
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
                    <TableRow key={m.id} className="border-[#2f374f]/50 hover:bg-[#57D7BA]/5 cursor-pointer transition-colors">
                      <TableCell className="pl-4 py-2.5 max-w-[180px]">
                        <Tooltip>
                          <TooltipTrigger>
                            <Link href={`/markets/${m.id}`} className="text-xs font-medium text-[#e2e8f0] hover:text-[#57D7BA] transition-colors leading-tight line-clamp-1 text-left block truncate">
                              {m.q}
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="bg-[#222638] border-[#2f374f] text-[#e2e8f0] p-3 max-w-xs">
                            <div className="space-y-2">
                              <p className="text-xs font-medium">{m.q}</p>
                              <div className="h-12 w-40">
                                <ResponsiveContainer width="100%" height="100%">
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
                        <span className="font-mono text-xs font-semibold tabular-nums text-[#e2e8f0]">{m.price + (priceOffsets[m.id] || 0)}¢</span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span className={`flex items-center gap-0.5 font-mono text-xs font-semibold tabular-nums ${(m.change + (priceOffsets[m.id] || 0)) >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                          {(m.change + (priceOffsets[m.id] || 0)) >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          {Math.abs(m.change + (priceOffsets[m.id] || 0))}%
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
                        No movers in this category
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* ─── CENTER: BREAKING MARKETS ──────────────────────── */}
        <div className="lg:col-span-4">
          <Card className="bg-[#222638] border-[#2f374f]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Zap className="size-4 text-[#f59e0b]" />
                  Someone Just Bet Big
                </CardTitle>
                <span className="text-[10px] text-[#8892b0] flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                  Live
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pb-3">
              {filteredBreaking.map((m, i) => (
                <Link key={m.id} href={`/markets/${m.id}`} className="group block animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#57D7BA]/5 transition-all border border-transparent hover:border-[#57D7BA]/10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {m.hot && <Flame className="size-3 text-[#f59e0b] shrink-0" />}
                        <span className="text-[10px] text-[#8892b0]">{m.time}</span>
                      </div>
                      <p className="text-xs font-medium text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors leading-snug">{m.title}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="font-mono text-xs font-semibold tabular-nums text-[#e2e8f0]">{m.price}¢</span>
                        <span className="text-[10px] text-[#8892b0]">Vol: ${m.vol}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-[#1a1e2e] border border-[#2f374f]">
                      <Eye className="size-3 text-[#8892b0]" />
                      <span className="text-[10px] text-[#8892b0] font-mono tabular-nums">{(parseFloat(m.vol) * 12.3).toFixed(0)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ─── RIGHT: WHALE ACTIVITY ─────────────────────────── */}
        <div className="lg:col-span-3">
          <Card className="bg-[#222638] border-[#2f374f]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Wallet className="size-4 text-[#8b5cf6]" />
                Whale Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-3">
              {filteredWhales.map((w, i) => (
                <div key={`${w.id}-${i}`} className="p-2.5 rounded-lg border border-[#2f374f] hover:border-[#57D7BA]/20 transition-all animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <Link href={`/whales/${w.id}`} className="flex items-center gap-1.5 hover:text-[#57D7BA] transition-colors">
                      <div className="size-5 rounded-full bg-gradient-to-br from-[#57D7BA] to-[#8b5cf6] flex items-center justify-center text-[8px] font-bold text-[#0f1119]">#{w.rank}</div>
                      <span className="text-xs font-medium text-[#e2e8f0]">{w.name}</span>
                    </Link>
                    <span className="text-[10px] text-[#8892b0]">{w.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${w.side === "long" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
                      {w.side === "long" ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                      {w.pos}
                    </span>
                  </div>
                  <Link href={`/markets/${w.marketId}`} className="text-[11px] text-[#8892b0] hover:text-[#57D7BA] transition-colors line-clamp-1">{w.market}</Link>
                  <div className="flex items-center gap-1 mt-1.5">
                    <div className="flex-1 h-1 rounded-full bg-[#1a1e2e] overflow-hidden">
                      <div className="h-full rounded-full bg-[#57D7BA]" style={{ width: `${w.acc}%` }} />
                    </div>
                    <span className="text-[9px] text-[#8892b0] font-mono font-medium tabular-nums">{w.acc}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ─── SMART MONEY MOVES ────────────────────────── */}
          {smartMoves.length > 0 && (
            <Card className="bg-[#222638] border-[#2f374f] mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Brain className="size-4 text-[#f59e0b]" />
                  Smart Money Moves
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 pb-3">
                {smartMoves.slice(0, 5).map((m, i) => (
                  <div key={`sm-${i}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#57D7BA]/5 transition-all">
                    <div className="size-5 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#ec4899] flex items-center justify-center text-[7px] font-bold text-[#0f1119] shrink-0">
                      #{m.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <Link href={`/whales/${m.walletId}`} className="text-[10px] font-semibold text-[#e2e8f0] hover:text-[#57D7BA] transition-colors truncate">
                          {m.wallet}
                        </Link>
                        <span className={`px-1 py-0.5 rounded text-[7px] font-bold ${m.side === "YES" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
                          {m.side} {m.size}
                        </span>
                      </div>
                      <Link href={`/markets/${m.marketId}`} className="text-[9px] text-[#8892b0] hover:text-[#57D7BA] transition-colors truncate block">
                        {m.market}
                      </Link>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="flex items-center gap-0.5">
                        <TargetIcon className="size-2.5 text-[#57D7BA]" />
                        <span className="text-[9px] font-mono font-semibold text-[#8892b0] tabular-nums">{m.accuracy}%</span>
                      </div>
                      <span className={`text-[8px] font-mono font-bold tabular-nums ${m.accImpact.startsWith("+") ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                        {m.accImpact}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ─── TREEMAP: MARKET VOLUME HEATMAP ──────────────────── */}
      <Card className="bg-[#222638] border-[#2f374f]">
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
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap data={treemapData} dataKey="size" aspectRatio={4 / 3} content={<CustomTreemapContent />} />
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ─── LATEST INSIGHTS ──────────────────────────────────── */}
      <Card className="bg-[#222638] border-[#2f374f]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Newspaper className="size-4 text-[#6366f1]" />
              Latest Insights
            </CardTitle>
            <Link href="/insights" className="text-[10px] text-[#57D7BA] hover:underline">View all →</Link>
          </div>
          <CardDescription className="text-[10px] text-[#8892b0]">News and catalysts moving prediction markets right now</CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {insights.slice(0, 5).map((ins) => (
              <Link key={ins.id} href={`/markets/${ins.marketId}`} className="group block">
                <div className="p-3 rounded-lg border border-[#2f374f] hover:border-[#6366f1]/30 transition-all h-full flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`size-1.5 rounded-full shrink-0 ${ins.impact === "bullish" ? "bg-[#22c55e]" : ins.impact === "bearish" ? "bg-[#ef4444]" : "bg-[#8892b0]"}`} />
                    <span className="text-[8px] text-[#8892b0] truncate">{ins.source}</span>
                    <span className="text-[8px] text-[#8892b0] shrink-0 ml-auto">{ins.time}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors leading-snug line-clamp-3 flex-1 mb-2">
                    {ins.headline}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="px-1.5 py-0.5 rounded text-[7px] font-semibold bg-[#57D7BA]/10 text-[#57D7BA]">{ins.category}</span>
                    <span className={`font-mono text-[10px] font-bold tabular-nums ${ins.impact === "bullish" ? "text-[#22c55e]" : ins.impact === "bearish" ? "text-[#ef4444]" : "text-[#8892b0]"}`}>
                      {ins.priceMove}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ─── FOOTER ──────────────────────────────────────────── */}
      <footer className="flex items-center justify-between py-4 border-t border-[#2f374f] text-[10px] text-[#8892b0]">
        <span>© 2026 Quiver Markets. Not financial advice. Data from Polymarket &amp; Kalshi.</span>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
          <Link href="/api-docs" className="hover:text-[#57D7BA] transition-colors">API</Link>
        </div>
      </footer>
    </div>
  );
}
