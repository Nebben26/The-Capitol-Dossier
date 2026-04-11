"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLeaderboard } from "@/hooks/useData";
import { getAllWhaleAccuracies } from "@/lib/api";
import { TIME_FILTERS as timeFilters, CATEGORIES as categories } from "@/lib/mockData";
import type { Whale } from "@/lib/mockData";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  Cell,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  TrendingUp,
  BarChart3,
  Users,
  Trophy,
  Target,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock,
  Crown,
  Medal,
  Star,
  UserPlus,
  BadgeCheck,
  Flame,
  Inbox,
  Download,
} from "lucide-react";
import { useUserTier } from "@/hooks/useUserTier";
import { canAccess } from "@/lib/tiers";
import { getWhaleGradientStyle } from "@/lib/whale-colors";
import { LastUpdated } from "@/components/layout/LastUpdated";
import { LeaderboardSkeleton } from "@/components/ui/skeleton-loaders";
import { DataFreshness } from "@/components/ui/data-freshness";


type SortKey = "rank" | "pnl" | "winRate" | "accuracy" | "volume" | "activeMarkets" | "brier";
type SortDir = "asc" | "desc";

// ─── SPARKLINE ────────────────────────────────────────────────────────
function PnlSparkline({ data, positive }: { data: { d: number; v: number }[]; positive: boolean }) {
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={positive ? "sparkGreen" : "sparkRed"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={positive ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
              <stop offset="95%" stopColor={positive ? "#22c55e" : "#ef4444"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={positive ? "#22c55e" : "#ef4444"} strokeWidth={1.5} fill={`url(#${positive ? "sparkGreen" : "sparkRed"})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── RANK BADGE ───────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="size-8 rounded-full bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-[#f59e0b]/30">
        <Crown className="size-4 text-[#0f1119]" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="size-8 rounded-full bg-gradient-to-br from-[#d1d5db] to-[#9ca3af] flex items-center justify-center shadow-lg shadow-[#9ca3af]/20">
        <Medal className="size-4 text-[#0f1119]" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="size-8 rounded-full bg-gradient-to-br from-[#d97706] to-[#92400e] flex items-center justify-center shadow-lg shadow-[#92400e]/20">
        <Medal className="size-4 text-[#0f1119]" />
      </div>
    );
  return (
    <div className="size-8 rounded-full bg-[#2a2f45] flex items-center justify-center">
      <span className="text-xs font-bold font-mono text-[#8892b0]">{rank}</span>
    </div>
  );
}

// ─── MINI CALIBRATION (for tooltip) ──────────────────────────────────
function MiniCalibration({ data }: { data: { predicted: number; actual: number }[] }) {
  return (
    <div className="h-20 w-28">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <ScatterChart margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <XAxis type="number" dataKey="predicted" domain={[0, 100]} tick={false} axisLine={{ stroke: "#2a2f45" }} />
          <YAxis type="number" dataKey="actual" domain={[0, 100]} tick={false} axisLine={{ stroke: "#2a2f45" }} />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke="#8892b0" strokeDasharray="3 3" strokeOpacity={0.3} />
          <Scatter data={data} fill="#57D7BA" fillOpacity={0.8}>
            {data.map((entry, i) => {
              const diff = Math.abs(entry.predicted - entry.actual);
              return <Cell key={i} fill={diff <= 5 ? "#57D7BA" : diff <= 10 ? "#f59e0b" : "#ef4444"} r={3} />;
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── MOBILE CARD ──────────────────────────────────────────────────────
function TraderCard({ t, followed, onFollow, liveAccuracy }: { t: Whale; followed: boolean; onFollow: () => void; liveAccuracy?: { accuracy: number; total: number } }) {
  return (
    <Card className="bg-[#161b27] border-[#21262d] shadow-card hover:shadow-card-hover transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <RankBadge rank={t.rank} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Link href={`/whales/${t.id}`} className="text-sm font-semibold hover:text-[#57D7BA] transition-colors truncate">
                {t.name}
              </Link>
              {t.verified && <BadgeCheck className="size-3.5 text-[#57D7BA] shrink-0" />}
              {t.smart && (
                <span className="px-1 py-0.5 rounded bg-[#57D7BA]/10 text-[#57D7BA] text-[8px] font-bold shrink-0">
                  SMART
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <span className="text-[#8892b0] block">P&L</span>
                <span className={`font-mono font-bold ${t.totalPnlNum >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{t.totalPnl}</span>
              </div>
              <div>
                <span className="text-[#8892b0] block">Accuracy</span>
                <span className="font-mono font-bold">{liveAccuracy && liveAccuracy.total >= 1 ? `${liveAccuracy.accuracy}%` : t.accuracy > 0 ? `${t.accuracy}%` : "—"}</span>
              </div>
              <div>
                <span className="text-[#8892b0] block">Volume</span>
                <span className="font-mono font-bold text-[#57D7BA]">{t.totalVolume}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ backgroundColor: `${t.bestCatColor}15`, color: t.bestCatColor }}>
                <Trophy className="size-2.5" />
                {t.bestCategory}
              </span>
              <PnlSparkline data={t.spark} positive={t.totalPnlNum >= 0} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const { whales: traders, lastFetched: leaderboardFetched } = useLeaderboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<typeof timeFilters[number]>("All Time");
  const [category, setCategory] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [accuracyMap, setAccuracyMap] = useState<Record<string, { accuracy: number; total: number }>>({});
  const { tier } = useUserTier();

  useEffect(() => { const t = setTimeout(() => setLoading(false), 1200); return () => clearTimeout(t); }, []);

  useEffect(() => {
    getAllWhaleAccuracies().then((res) => {
      if (Object.keys(res.data).length > 0) setAccuracyMap(res.data);
    });
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir(key === "rank" || key === "brier" ? "asc" : "desc");
    }
  };

  const toggleFollow = (id: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sorted = useMemo(() => {
    const filtered = category === "All" ? traders : traders.filter((t) => t.bestCategory === category);
    const searched = searchQuery
      ? filtered.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : filtered;
    return [...searched].sort((a, b) => {
      const valMap: Record<SortKey, (t: Whale) => number> = {
        rank: (t) => t.rank,
        pnl: (t) => t.totalPnlNum,
        winRate: (t) => t.winRate,
        accuracy: (t) => t.accuracy,
        volume: (t) => t.volumeNum,
        activeMarkets: (t) => t.activeMarkets,
        brier: (t) => t.brier,
      };
      const av = valMap[sortKey](a);
      const bv = valMap[sortKey](b);
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [traders, sortKey, sortDir, category, searchQuery]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="size-3 opacity-30" />;
    return sortDir === "desc" ? <ChevronDown className="size-3 text-[#57D7BA]" /> : <ChevronUp className="size-3 text-[#57D7BA]" />;
  };

  if (loading) return <LeaderboardSkeleton />;

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
            {/* ─── PAGE TITLE ──────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                  <Trophy className="size-7 text-[#f59e0b]" />
                  Who's Making Money
                </h1>
                <p className="text-sm text-[#8892b0] mt-1">Top Prediction Market Traders — ranked by performance</p>
              </div>
              <div className="flex items-center gap-2">
                <DataFreshness timestamp={leaderboardFetched} />
                <LastUpdated />
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#57D7BA]/10 text-[#57D7BA] text-[10px] font-semibold">
                  <Users className="size-3" />
                  {traders.length} tracked
                </span>
                <button
                  onClick={() => {
                    if (!canAccess(tier, "pro")) { window.location.href = "/pricing"; return; }
                    const rows = [
                      ["Rank", "Name", "P&L", "Win Rate", "Volume", "Brier", "Best Category"],
                      ...sorted.map((t) => {
                        const la = accuracyMap[t.id];
                        return [t.rank, `"${t.name}"`, t.totalPnl, la && la.total >= 1 ? `${la.accuracy}%` : t.winRate > 0 ? `${t.winRate}%` : "—", t.totalVolume, t.brier > 0 ? t.brier.toFixed(2) : "—", t.bestCategory];
                      }),
                    ];
                    const csv = rows.map((r) => r.join(",")).join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `quiver-leaderboard-${new Date().toISOString().split("T")[0]}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  title={canAccess(tier, "pro") ? "Export CSV" : "Export CSV (Pro+)"}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${canAccess(tier, "pro") ? "bg-[#161b27] text-[#8d96a0] border-[#21262d] hover:text-[#57D7BA] hover:border-[#57D7BA]/30" : "bg-[#161b27] text-[#484f58] border-[#21262d]"}`}
                >
                  <Download className="size-3" />
                  Export
                  {!canAccess(tier, "pro") && <span className="text-[8px] text-[#d29922]">PRO</span>}
                </button>
              </div>
            </div>

            {/* ─── FILTER BAR ──────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
              {/* Row 1: Time range + search */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-0.5 bg-[#161b27] rounded-lg p-0.5 border border-[#2a2f45]">
                  {timeFilters.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeFilter(tf)}
                      className={`px-2.5 py-1.5 rounded-md text-[10px] font-semibold transition-all whitespace-nowrap ${
                        timeFilter === tf
                          ? "bg-[#57D7BA] text-[#0f1119] shadow-lg shadow-[#57D7BA]/20"
                          : "text-[#8892b0] hover:text-[#e2e8f0]"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
                {/* Trader search */}
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8892b0]" />
                  <input
                    type="text"
                    placeholder="Search traders…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-8 pr-3 rounded-lg bg-[#161b27] shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 border border-[#2a2f45] text-xs text-[#e2e8f0] placeholder:text-[#8892b0]/60 focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 focus:border-[#57D7BA]/50 transition-all w-full sm:w-44"
                  />
                </div>
              </div>
              {/* Row 2: Category pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${
                      category === cat
                        ? "bg-[#57D7BA] text-[#0f1119] shadow-lg shadow-[#57D7BA]/20"
                        : "bg-[#161b27] text-[#8892b0] hover:text-[#e2e8f0] border border-[#2a2f45] hover:border-[#57D7BA]/30"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── SUMMARY CARDS (computed from real data) ──────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(() => {
                const totalVol = traders.reduce((s, w) => s + w.volumeNum, 0);
                const tradersWithWR = traders.filter(w => {
                  const live = accuracyMap[w.id];
                  return (live && live.total >= 1) || w.winRate > 0;
                });
                const avgWR = tradersWithWR.length > 0 ? Math.round(tradersWithWR.reduce((s, w) => {
                  const live = accuracyMap[w.id];
                  return s + (live && live.total >= 1 ? live.accuracy : w.winRate);
                }, 0) / tradersWithWR.length) : 0;
                const topWhale = traders[0];
                const mostActive = [...traders].sort((a, b) => b.totalTrades - a.totalTrades)[0];
                return [
                  { label: "Total Volume", val: totalVol >= 1e9 ? `$${(totalVol / 1e9).toFixed(1)}B` : `$${(totalVol / 1e6).toFixed(0)}M`, icon: BarChart3, color: "#57D7BA", sub: `${traders.length} whales` },
                  { label: "Avg Win Rate", val: `${avgWR}%`, icon: Target, color: "#22c55e", sub: `Top ${traders.length} traders` },
                  { label: "Top P&L", val: topWhale?.totalPnl || "$0", icon: Trophy, color: "#f59e0b", sub: topWhale?.name || "—" },
                  { label: "Most Positions", val: `${mostActive?.totalTrades || 0}`, icon: Flame, color: "#ec4899", sub: mostActive?.name || "—" },
                ];
              })().map((s) => (
                <Card key={s.label} className="bg-[#161b27] border-[#2a2f45]">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}15` }}>
                      <s.icon className="size-4" style={{ color: s.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-bold font-mono">{s.val}</div>
                      <div className="text-[10px] text-[#8892b0]">{s.label}</div>
                      <div className="text-[9px] text-[#8892b0]/60">{s.sub}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ─── DESKTOP TABLE ────────────────────────────────────── */}
            <Card className="bg-[#161b27] border-[#2a2f45] hidden lg:block">
              <CardContent className="px-0 py-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2a2f45] hover:bg-transparent">
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4 w-14 cursor-pointer hover:text-[#57D7BA]" onClick={() => handleSort("rank")}>
                        <span className="flex items-center gap-0.5">RANK <SortIcon col="rank" /></span>
                      </TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">TRADER</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handleSort("pnl")}>
                        <span className="flex items-center gap-0.5">P&L <SortIcon col="pnl" /></span>
                      </TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium hidden xl:table-cell">P&L TREND</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handleSort("accuracy")}>
                        <span className="flex items-center gap-0.5">ACCURACY <SortIcon col="accuracy" /></span>
                      </TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] hidden xl:table-cell" onClick={() => handleSort("brier")}>
                        <span className="flex items-center gap-0.5">BRIER <SortIcon col="brier" /></span>
                      </TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] hidden xl:table-cell" onClick={() => handleSort("volume")}>
                        <span className="flex items-center gap-0.5">VOLUME <SortIcon col="volume" /></span>
                      </TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] hidden xl:table-cell" onClick={() => handleSort("activeMarkets")}>
                        <span className="flex items-center gap-0.5">MARKETS <SortIcon col="activeMarkets" /></span>
                      </TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">BEST</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4 text-right">ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((t) => (
                      <TableRow key={t.id} className="border-[#2a2f45]/50 hover:bg-[#57D7BA]/5 cursor-pointer transition-colors">
                        <TableCell className="pl-4 py-3">
                          <RankBadge rank={t.rank} />
                        </TableCell>
                        <TableCell className="py-3">
                          <Tooltip>
                            <TooltipTrigger>
                              <Link href={`/whales/${t.id}`} className="flex items-center gap-2 hover:text-[#57D7BA] transition-colors max-w-[140px]">
                                <div
                                  className="size-7 rounded-full flex items-center justify-center shrink-0"
                                  style={getWhaleGradientStyle(t.id)}
                                >
                                  <span className="text-[9px] font-bold text-[#0d1117]">{t.name[0]}</span>
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs font-semibold truncate">{t.name}</span>
                                    {t.verified && <BadgeCheck className="size-3 text-[#57D7BA] shrink-0" />}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {t.smart && (
                                      <span className="px-1 py-0 rounded bg-[#57D7BA]/10 text-[#57D7BA] text-[7px] font-bold leading-tight">SMART MONEY</span>
                                    )}
                                    {t.streak >= 5 && (
                                      <span className="px-1 py-0 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[7px] font-bold leading-tight flex items-center gap-0.5">
                                        <Flame className="size-2" />{t.streak}W
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-[#161b27] border-[#2a2f45] text-[#e2e8f0] p-3 max-w-xs">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold">{t.name}</span>
                                  <span className="text-[9px] text-[#8892b0]">#{t.rank}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <MiniCalibration data={t.calibration} />
                                  <div className="space-y-1.5 flex-1">
                                    <div className="text-[9px] text-[#8892b0] uppercase tracking-wider mb-1">Top Markets</div>
                                    {t.topMarkets.map((m, i) => (
                                      <div key={i} className="flex items-center justify-between text-[10px]">
                                        <span className="text-[#e2e8f0] truncate mr-2">{m.name}</span>
                                        <span className="text-[#22c55e] font-mono font-semibold shrink-0">{m.pnl}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-[9px] text-[#8892b0] pt-1 border-t border-[#2a2f45]">
                                  {t.totalTrades} trades{t.brier > 0 ? ` · Brier ${t.brier.toFixed(2)}` : ""} · {t.totalVolume} volume
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="py-3">
                          <div>
                            <span className={`font-mono text-sm font-bold ${t.totalPnlNum >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                              {t.totalPnl}
                            </span>
                            {t.change24h !== 0 && (
                              <span className={`block text-[9px] font-mono ${t.change24h >= 0 ? "text-[#22c55e]/60" : "text-[#ef4444]/60"}`}>
                                {t.change24h >= 0 ? "+" : ""}{t.change24h}pt 24h
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 hidden xl:table-cell">
                          <PnlSparkline data={t.spark} positive={t.totalPnlNum >= 0} />
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="font-mono text-xs font-semibold">{(() => { const la = accuracyMap[t.id]; return la && la.total >= 1 ? `${la.accuracy}%` : t.accuracy > 0 ? `${t.accuracy}%` : "—"; })()}</span>
                        </TableCell>
                        <TableCell className="py-3 hidden xl:table-cell">
                          <span className={`font-mono text-xs font-semibold ${t.brier > 0 ? (t.brier <= 0.15 ? "text-[#22c55e]" : t.brier <= 0.20 ? "text-[#f59e0b]" : "text-[#8892b0]") : "text-[#8892b0]"}`}>
                            {t.brier > 0 ? t.brier.toFixed(2) : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 hidden xl:table-cell">
                          <span className="font-mono text-xs text-[#8892b0]">{t.totalVolume}</span>
                        </TableCell>
                        <TableCell className="py-3 hidden xl:table-cell">
                          <span className="font-mono text-xs text-[#8892b0]">{t.activeMarkets}</span>
                        </TableCell>
                        <TableCell className="py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap" style={{ backgroundColor: `${t.bestCatColor}15`, color: t.bestCatColor }}>
                            {t.bestCategory}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 py-3 text-right">
                          <Button
                            variant={followedIds.has(t.id) ? "outline" : "default"}
                            size="xs"
                            onClick={(e) => { e.stopPropagation(); toggleFollow(t.id); }}
                            className={followedIds.has(t.id) ? "border-[#57D7BA]/30 text-[#57D7BA] hover:bg-[#57D7BA]/10" : "bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80"}
                          >
                            <UserPlus className="size-3" />
                            {followedIds.has(t.id) ? "Following" : "Follow"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* ─── MOBILE CARDS ─────────────────────────────────────── */}
            <div className="lg:hidden space-y-3">
              {sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#161b27] border border-[#21262d] flex items-center justify-center mb-4">
                    <Inbox className="w-7 h-7 text-[#484f58]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#f0f6fc] mb-1">No traders match your filters</h3>
                  <p className="text-sm text-[#8d96a0] max-w-md">Try adjusting your search or category.</p>
                </div>
              ) : (
                sorted.map((t) => (
                  <TraderCard key={t.id} t={t} followed={followedIds.has(t.id)} onFollow={() => toggleFollow(t.id)} liveAccuracy={accuracyMap[t.id]} />
                ))
              )}
            </div>

            {/* ─── ACCURACY NOTE ───────────────────────────────────── */}
            <p className="text-[11px] text-[#4a5168] text-center py-2">
              * Accuracy scores reflect verified resolved markets only. Backfill in progress — scores improve as markets resolve.
            </p>

            {/* ─── FOOTER ──────────────────────────────────────────── */}
            <footer className="flex items-center justify-between py-4 border-t border-[#2a2f45] text-[10px] text-[#8892b0]">
              <span>© 2026 Quiver Markets. Not financial advice. Data from Polymarket &amp; Kalshi.</span>
              <div className="flex items-center gap-3">
                <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
                
              </div>
            </footer>
    </div>
  );
}
