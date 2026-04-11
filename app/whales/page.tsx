"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
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
  Search,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  Wallet,
  Trophy,
  Crown,
  Medal,
  BadgeCheck,
  Flame,
  LayoutGrid,
  List,
  Target,
  Users,
  UserPlus,
  ChevronRight,
} from "lucide-react";
import { useWhales } from "@/hooks/useData";
import type { Whale } from "@/lib/mockData";
import { getAllWhaleAccuracies } from "@/lib/api";
import { LastUpdated } from "@/components/layout/LastUpdated";
import { MarketsBrowseSkeleton } from "@/components/ui/skeleton-loaders";

const catFilters = ["All", "Economics", "Elections", "Crypto", "Sports", "Tech", "Geopolitics"];

type SortKey = "rank" | "pnl" | "accuracy" | "winRate" | "volume";
type SortDir = "asc" | "desc";
type ViewMode = "grid" | "table";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="size-8 rounded-full bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] flex items-center justify-center shadow-lg shadow-[#f59e0b]/30"><Crown className="size-4 text-[#0f1119]" /></div>;
  if (rank === 2) return <div className="size-8 rounded-full bg-gradient-to-br from-[#d1d5db] to-[#9ca3af] flex items-center justify-center"><Medal className="size-4 text-[#0f1119]" /></div>;
  if (rank === 3) return <div className="size-8 rounded-full bg-gradient-to-br from-[#d97706] to-[#92400e] flex items-center justify-center"><Medal className="size-4 text-[#0f1119]" /></div>;
  return <div className="size-8 rounded-full bg-[#2a2f45] flex items-center justify-center"><span className="text-xs font-bold font-mono text-[#8892b0]">{rank}</span></div>;
}

function PnlSparkline({ data, positive }: { data: { d: number; v: number }[]; positive: boolean }) {
  const color = positive ? "#22c55e" : "#ef4444";
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={data}>
          <defs><linearGradient id={positive ? "wsg" : "wsr"} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.3} /><stop offset="95%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${positive ? "wsg" : "wsr"})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function WhaleCard({ w, liveAccuracy }: { w: Whale; liveAccuracy?: { accuracy: number; total: number } }) {
  const hasLiveData = liveAccuracy && liveAccuracy.total >= 1;
  const isNew = liveAccuracy && liveAccuracy.total === 0;
  const displayAccuracy = hasLiveData
    ? `${liveAccuracy.accuracy}%`
    : isNew ? "New" : w.accuracy > 0 ? `${w.accuracy}%` : "—";

  return (
    <Link href={`/whales/${w.id}`} className="block group">
      <Card className="bg-[#161b27] border-[#21262d] hover:border-[#57D7BA]/20 transition-all h-full">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <RankBadge rank={w.rank} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors truncate">{w.name}</span>
                {w.verified && <BadgeCheck className="size-3.5 text-[#57D7BA] shrink-0" />}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {w.smart && <span className="px-1 py-0.5 rounded bg-[#57D7BA]/10 text-[#57D7BA] text-[7px] font-bold">SMART</span>}
                {w.streak >= 5 && <span className="px-1 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[7px] font-bold flex items-center gap-0.5"><Flame className="size-2" />{w.streak}W</span>}
              </div>
            </div>
          </div>
          <PnlSparkline data={w.spark} positive={w.totalPnlNum >= 0} />
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div><div className={`text-xs font-bold font-mono tabular-nums ${w.totalPnlNum >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{w.totalPnl}</div><div className="text-[8px] text-[#8892b0]">P&L</div></div>
            <div><div className="text-xs font-bold font-mono tabular-nums text-[#e2e8f0]">{displayAccuracy}</div><div className="text-[8px] text-[#8892b0]">Accuracy</div></div>
            <div><div className="text-xs font-bold font-mono tabular-nums text-[#e2e8f0]">{hasLiveData ? `${liveAccuracy.accuracy}%` : isNew ? "New" : w.winRate > 0 ? `${w.winRate}%` : "—"}</div><div className="text-[8px] text-[#8892b0]">Win Rate</div></div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#21262d]">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ backgroundColor: `${w.bestCatColor}15`, color: w.bestCatColor }}><Trophy className="size-2.5" />{w.bestCategory}</span>
            <span className="text-[9px] text-[#8892b0] font-mono tabular-nums">{w.totalTrades} trades</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function WhalesBrowsePage() {
  const { whales } = useWhales();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(true);
  const [accuracyMap, setAccuracyMap] = useState<Record<string, { accuracy: number; total: number }>>({});

  useEffect(() => { const t = setTimeout(() => setLoading(false), 1200); return () => clearTimeout(t); }, []);

  useEffect(() => {
    getAllWhaleAccuracies().then((res) => {
      if (Object.keys(res.data).length > 0) setAccuracyMap(res.data);
    });
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir(key === "rank" ? "asc" : "desc"); }
  };

  const filtered = useMemo(() => {
    let result = whales;
    if (category !== "All") result = result.filter((w) => w.bestCategory === category);
    if (searchQuery) result = result.filter((w) => w.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return [...result].sort((a, b) => {
      const valMap: Record<SortKey, (w: Whale) => number> = {
        rank: (w) => w.rank,
        pnl: (w) => w.totalPnlNum,
        accuracy: (w) => w.accuracy,
        winRate: (w) => w.winRate,
        volume: (w) => w.volumeNum,
      };
      const av = valMap[sortBy](a);
      const bv = valMap[sortBy](b);
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [whales, category, searchQuery, sortBy, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortBy !== col) return <ChevronDown className="size-3 opacity-30" />;
    return sortDir === "desc" ? <ChevronDown className="size-3 text-[#57D7BA]" /> : <ChevronUp className="size-3 text-[#57D7BA]" />;
  };

  if (loading) return <MarketsBrowseSkeleton />;

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="size-7 text-[#8b5cf6]" />
            Whale Tracker
          </h1>
          <p className="text-sm text-[#8892b0] mt-1">{whales.length} tracked wallets across all platforms</p>
        </div>
        <LastUpdated />
      </div>

      {/* Copy the Whales CTA */}
      <Link href="/copy" className="block">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#57D7BA]/8 border border-[#57D7BA]/25 hover:border-[#57D7BA]/50 transition-all">
          <div className="size-8 rounded-lg bg-[#57D7BA]/15 flex items-center justify-center shrink-0">
            <UserPlus className="size-4 text-[#57D7BA]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-[#e2e8f0]">
              Want to track multiple whales at once?
            </span>
            <span className="text-sm text-[#57D7BA] font-semibold ml-2">→ Smart Money Watch</span>
          </div>
          <ChevronRight className="size-4 text-[#57D7BA] shrink-0" />
        </div>
      </Link>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8892b0]" />
          <input type="text" placeholder="Search whales..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#161b27] shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 border border-[#21262d] text-sm text-[#e2e8f0] placeholder:text-[#8892b0]/60 focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 transition-all" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {catFilters.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${category === cat ? "bg-[#57D7BA] text-[#0f1119]" : "bg-[#161b27] text-[#8892b0] hover:text-[#e2e8f0] border border-[#21262d]"}`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#8892b0] font-mono">{filtered.length} results</span>
          <div className="flex items-center gap-0.5 bg-[#161b27] rounded-lg p-0.5 border border-[#21262d]">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-[#57D7BA] text-[#0f1119]" : "text-[#8892b0]"}`}><LayoutGrid className="size-3.5" /></button>
            <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-[#57D7BA] text-[#0f1119]" : "text-[#8892b0]"}`}><List className="size-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Grid view */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((w) => <WhaleCard key={w.id} w={w} liveAccuracy={accuracyMap[w.id]} />)}
        </div>
      )}

      {/* Table view */}
      {viewMode === "table" && (
        <Card className="bg-[#161b27] border-[#21262d]">
          <CardContent className="px-0 py-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#21262d] hover:bg-transparent">
                  <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4 cursor-pointer hover:text-[#57D7BA]" onClick={() => handleSort("rank")}><span className="flex items-center gap-0.5">RANK <SortIcon col="rank" /></span></TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium">TRADER</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handleSort("pnl")}><span className="flex items-center gap-0.5">P&L <SortIcon col="pnl" /></span></TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium">TREND</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handleSort("accuracy")}><span className="flex items-center gap-0.5">ACC <SortIcon col="accuracy" /></span></TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handleSort("winRate")}><span className="flex items-center gap-0.5">WIN <SortIcon col="winRate" /></span></TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handleSort("volume")}><span className="flex items-center gap-0.5">VOLUME <SortIcon col="volume" /></span></TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4">BEST CAT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((w) => (
                  <TableRow key={w.id} className="border-[#21262d]/50 hover:bg-[#57D7BA]/5 transition-colors">
                    <TableCell className="pl-4 py-3"><RankBadge rank={w.rank} /></TableCell>
                    <TableCell className="py-3">
                      <Link href={`/whales/${w.id}`} className="flex items-center gap-2 hover:text-[#57D7BA] transition-colors">
                        <div className="size-7 rounded-full bg-gradient-to-br from-[#57D7BA] to-[#8b5cf6] flex items-center justify-center shrink-0"><span className="text-[9px] font-bold text-[#0f1119]">{w.name[0]}</span></div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1"><span className="text-xs font-semibold truncate text-[#e2e8f0]">{w.name}</span>{w.verified && <BadgeCheck className="size-3 text-[#57D7BA] shrink-0" />}</div>
                          {w.smart && <span className="px-1 py-0 rounded bg-[#57D7BA]/10 text-[#57D7BA] text-[7px] font-bold">SMART MONEY</span>}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="py-3"><span className={`font-mono text-sm font-bold tabular-nums ${w.totalPnlNum >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{w.totalPnl}</span></TableCell>
                    <TableCell className="py-3"><PnlSparkline data={w.spark} positive={w.totalPnlNum >= 0} /></TableCell>
                    <TableCell className="py-3">
                      {(() => {
                        const live = accuracyMap[w.id];
                        const acc = live && live.total >= 1 ? live.accuracy : w.accuracy > 0 ? w.accuracy : null;
                        return acc !== null ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-10 h-1.5 rounded-full bg-[#0d1117] overflow-hidden"><div className="h-full rounded-full bg-[#57D7BA]" style={{ width: `${acc}%` }} /></div>
                            <span className="font-mono text-xs font-semibold tabular-nums text-[#e2e8f0]">{acc}%</span>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-[#8892b0]">—</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="py-3"><span className="font-mono text-xs font-semibold tabular-nums text-[#e2e8f0]">{(() => { const la = accuracyMap[w.id]; return la && la.total >= 1 ? `${la.accuracy}%` : la && la.total === 0 ? "New" : w.winRate > 0 ? `${w.winRate}%` : "—"; })()}</span></TableCell>
                    <TableCell className="py-3"><span className="font-mono text-xs text-[#8892b0] tabular-nums">{w.totalVolume}</span></TableCell>
                    <TableCell className="pr-4 py-3"><span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ backgroundColor: `${w.bestCatColor}15`, color: w.bestCatColor }}>{w.bestCategory}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 && (
        <Card className="bg-[#161b27] border-[#21262d]">
          <CardContent className="py-16 text-center">
            <Wallet className="size-12 text-[#21262d] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No whales found</h3>
            <p className="text-sm text-[#8892b0]">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}

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
