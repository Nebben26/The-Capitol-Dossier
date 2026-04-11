"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ReferenceLine,
  Cell,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Activity,
  BarChart3,
  Users,
  Wallet,
  Target,
  Trophy,
  TrendingUp,
  TrendingDown,
  Shield,
  Flame,
  Zap,
  Brain,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Crown,
  Star,
  Award,
  Crosshair,
} from "lucide-react";
import { useWhaleProfile } from "@/hooks/useData";
import { markets, whaleById } from "@/lib/mockData";
import { ShareCardButton } from "@/components/ui/share-card-button";
import { WatchlistButton } from "@/components/ui/watchlist-button";
import { getWhaleAccuracy, type WhaleAccuracyProfile } from "@/lib/api";

// ─── SORT HELPERS ────────────────────────────────────────────────────
type HistSortKey = "size" | "pnl" | "date";
type HistSortDir = "asc" | "desc";

function parseDollar(s: string): number {
  const clean = s.replace(/[^0-9.\-+KM]/g, "");
  let num = parseFloat(clean.replace(/[KM]/g, ""));
  if (clean.includes("M")) num *= 1000000;
  if (clean.includes("K")) num *= 1000;
  return num;
}

// ─── HOLDINGS TAB (real Supabase data) ───────────────────────────────
function HoldingsTab({ whaleId }: { whaleId: string }) {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { getWhalePositions } = await import("@/lib/api");
      const { data } = await getWhalePositions(whaleId);
      setPositions(data);
      setLoading(false);
    })();
  }, [whaleId]);

  if (loading) return <div className="py-12 text-center text-sm text-[#8892b0]">Loading holdings...</div>;
  if (positions.length === 0) return <div className="py-12 text-center text-sm text-[#8892b0]">No active positions found.</div>;

  return (
    <Card className="bg-[#161b27] border-[#2a2f45]">
      <CardContent className="px-0 pb-2">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2a2f45] hover:bg-transparent">
              <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">Market</TableHead>
              <TableHead className="text-[10px] text-[#8892b0] font-medium">Outcome</TableHead>
              <TableHead className="text-[10px] text-[#8892b0] font-medium">Shares</TableHead>
              <TableHead className="text-[10px] text-[#8892b0] font-medium">Avg Price</TableHead>
              <TableHead className="text-[10px] text-[#8892b0] font-medium">Value</TableHead>
              <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4">P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positions.map((p, i) => (
              <TableRow key={i} className="border-[#2a2f45]/50 hover:bg-[#57D7BA]/5 transition-colors">
                <TableCell className="pl-4 py-2 max-w-[200px]">
                  <Link href={`/markets/${p.market_id}`} className="text-xs font-medium hover:text-[#57D7BA] transition-colors truncate block" title={p.question || p.market_id}>
                    {p.question || p.market_id}
                  </Link>
                </TableCell>
                <TableCell className="py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${p.outcome === "Yes" || p.outcome === "YES" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
                    {p.outcome}
                  </span>
                </TableCell>
                <TableCell className="py-2"><span className="font-mono text-xs text-[#8892b0]">{Math.round(p.size).toLocaleString()}</span></TableCell>
                <TableCell className="py-2"><span className="font-mono text-xs text-[#8892b0]">{Math.round(p.avg_price * 100)}¢</span></TableCell>
                <TableCell className="py-2"><span className="font-mono text-xs text-[#e2e8f0]">${Math.abs(p.current_value) >= 1000 ? `${(p.current_value / 1000).toFixed(1)}K` : p.current_value.toFixed(0)}</span></TableCell>
                <TableCell className="pr-4 py-2">
                  <span className={`font-mono text-xs font-semibold ${p.pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {p.pnl >= 0 ? "+" : ""}{Math.abs(p.pnl) >= 1000 ? `$${(p.pnl / 1000).toFixed(1)}K` : `$${p.pnl.toFixed(0)}`}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── TRADES TAB (real Supabase data) ─────────────────────────────────
function TradesTab({ whaleId }: { whaleId: string }) {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { getWhaleTrades } = await import("@/lib/api");
      const { data } = await getWhaleTrades(whaleId);
      setTrades(data);
      setLoading(false);
    })();
  }, [whaleId]);

  if (loading) return <div className="py-12 text-center text-sm text-[#8892b0]">Loading trades...</div>;
  if (trades.length === 0) return <div className="py-12 text-center text-sm text-[#8892b0]">No recent trades found.</div>;

  const relTime = (ts: string) => {
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <Card className="bg-[#161b27] border-[#2a2f45]">
      <CardContent className="px-0 pb-2">
        <Table>
          <TableHeader>
            <TableRow className="border-[#2a2f45] hover:bg-transparent">
              <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">Time</TableHead>
              <TableHead className="text-[10px] text-[#8892b0] font-medium">Side</TableHead>
              <TableHead className="text-[10px] text-[#8892b0] font-medium">Market</TableHead>
              <TableHead className="text-[10px] text-[#8892b0] font-medium">Outcome</TableHead>
              <TableHead className="text-[10px] text-[#8892b0] font-medium">Size</TableHead>
              <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((t, i) => (
              <TableRow key={i} className="border-[#2a2f45]/50 hover:bg-[#57D7BA]/5 transition-colors">
                <TableCell className="pl-4 py-2"><span className="text-[10px] text-[#8892b0]">{relTime(t.timestamp)}</span></TableCell>
                <TableCell className="py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${t.side === "BUY" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
                    {t.side}
                  </span>
                </TableCell>
                <TableCell className="py-2 max-w-[180px]">
                  <Link href={`/markets/${t.market_id}`} className="text-xs font-medium hover:text-[#57D7BA] transition-colors truncate block" title={t.market_id}>
                    {t.market_id}
                  </Link>
                </TableCell>
                <TableCell className="py-2"><span className="text-[10px] text-[#8892b0]">{t.outcome}</span></TableCell>
                <TableCell className="py-2"><span className="font-mono text-xs text-[#e2e8f0]">${t.size_usd >= 1000 ? `${(t.size_usd / 1000).toFixed(1)}K` : t.size_usd.toFixed(0)}</span></TableCell>
                <TableCell className="pr-4 py-2"><span className="font-mono text-xs text-[#8892b0]">{Math.round(t.price * 100)}¢</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────
export default function WhaleProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const { whale: loadedWhale, pnlHistory, currentPositions, historicalTrades, categoryPerformance, calibrationData, biggestWins, biggestLosses } = useWhaleProfile(id);
  const whale = loadedWhale ?? null;
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!loadedWhale) {
      const timer = setTimeout(() => { if (!loadedWhale) setNotFound(true); }, 3000);
      return () => clearTimeout(timer);
    }
    if (loadedWhale) setNotFound(false);
  }, [loadedWhale, id]);

  const [loading, setLoading] = useState(true);
  const [histSort, setHistSort] = useState<HistSortKey>("pnl");
  const [histDir, setHistDir] = useState<HistSortDir>("desc");
  const [accuracyProfile, setAccuracyProfile] = useState<WhaleAccuracyProfile | null>(null);

  useEffect(() => {
    if (!id) return;
    getWhaleAccuracy(id).then((res) => {
      if (res.data) setAccuracyProfile(res.data);
    });
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleHistSort = (key: HistSortKey) => {
    if (histSort === key) setHistDir(histDir === "asc" ? "desc" : "asc");
    else { setHistSort(key); setHistDir("desc"); }
  };

  const sortedHistory = useMemo(() => {
    return [...historicalTrades].sort((a, b) => {
      let aVal: number, bVal: number;
      if (histSort === "size") { aVal = parseDollar(a.size); bVal = parseDollar(b.size); }
      else if (histSort === "pnl") { aVal = parseDollar(a.realizedPnl); bVal = parseDollar(b.realizedPnl); }
      else { aVal = new Date(a.date).getTime(); bVal = new Date(b.date).getTime(); }
      return histDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [histSort, histDir]);

  const SortIcon = ({ col }: { col: HistSortKey }) => {
    if (histSort !== col) return <ChevronDown className="size-3 opacity-30" />;
    return histDir === "desc" ? <ChevronDown className="size-3 text-[#57D7BA]" /> : <ChevronUp className="size-3 text-[#57D7BA]" />;
  };

  const perfectLine = Array.from({ length: 11 }, (_, i) => ({ predicted: i * 10, actual: i * 10 }));

  if (notFound || !whale) return (
    <div className="max-w-[1440px] mx-auto px-4 py-20 text-center">
      <div className="text-6xl font-bold font-mono text-[#21262d] mb-4">404</div>
      <h1 className="text-xl font-bold mb-2">Whale Not Found</h1>
      <p className="text-sm text-[#8892b0] mb-6">The wallet &quot;{id}&quot; isn&apos;t in our leaderboard yet.</p>
      <Link href="/whales" className="text-sm text-[#57D7BA] hover:underline">Browse all whales →</Link>
    </div>
  );

  if (loading) return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      <div className="flex gap-5">
        <div className="size-20 rounded-2xl bg-[#21262d] animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="h-8 w-48 bg-[#21262d] rounded animate-pulse" />
          <div className="h-4 w-96 bg-[#21262d] rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({length: 4}, (_, i) => <div key={i} className="h-20 bg-[#161b27] border border-[#21262d] rounded-xl animate-pulse" />)}
      </div>
      <div className="h-64 bg-[#161b27] border border-[#21262d] rounded-xl animate-pulse" />
    </div>
  );

  return (
    <>
      {/* ─── TOP NAV ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 h-12 bg-[#0d1117]/95 backdrop-blur-md border-b border-[#2a2f45] flex items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-1.5 text-[#8892b0] hover:text-[#57D7BA] transition-colors text-sm">
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        <ChevronRight className="size-3 text-[#2a2f45]" />
        <Link href="/whales" className="text-xs text-[#8892b0] hover:text-[#57D7BA] transition-colors">Whales</Link>
        <ChevronRight className="size-3 text-[#2a2f45]" />
        <span className="text-xs text-[#57D7BA] font-medium truncate">{whale.name}</span>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
        {/* ─── WHALE HEADER ────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="shrink-0 size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-[#57D7BA] via-[#6366f1] to-[#8b5cf6] flex items-center justify-center relative">
                <Wallet className="size-8 sm:size-10 text-[#0f1119]" />
                {/* Rank badge */}
                <div className="absolute -top-2 -right-2 size-7 rounded-full bg-[#f59e0b] flex items-center justify-center shadow-lg shadow-[#f59e0b]/30">
                  <span className="text-[10px] font-black text-[#0f1119]">#{whale.rank}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{whale.name}</h1>
                  {whale.rank <= 3 && (
                    <Crown className="size-5 text-[#f59e0b]" />
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-[#57D7BA]/10 text-[#57D7BA] text-[10px] font-semibold">
                    Rank #{whale.rank}
                  </span>
                  {whale.streak >= 5 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-[10px] font-semibold flex items-center gap-1">
                      <Flame className="size-2.5" />
                      {whale.streak}-trade win streak
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-[#161b27] text-[#8892b0] text-[10px] font-medium border border-[#2a2f45] flex items-center gap-1">
                    <Clock className="size-2.5" />
                    Since {whale.memberSince}
                  </span>
                </div>
                <p className="text-sm text-[#8892b0] leading-relaxed max-w-2xl">{whale.bio}</p>
                <div className="mt-3 flex items-center gap-2">
                  <ShareCardButton title={`${whale.name} — Rank #${whale.rank}`} />
                  <WatchlistButton type="whale" itemId={whale.id} name={whale.name} />
                </div>
              </div>
            </div>
          </div>

          {/* Key Stats */}
          <Card className="bg-[#161b27] border-[#2a2f45] lg:min-w-[260px] shrink-0">
            <CardContent className="p-5 flex flex-col items-center">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
                <div className="text-center">
                  <div className="text-[10px] text-[#8892b0] uppercase tracking-wider">Accuracy</div>
                  <div className="text-lg font-bold font-mono text-[#57D7BA]">
                    {accuracyProfile ? `${accuracyProfile.overallAccuracy}%` : whale.accuracy > 0 ? `${whale.accuracy}%` : "—"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-[#8892b0] uppercase tracking-wider">Win Rate</div>
                  <div className="text-lg font-bold font-mono text-[#22c55e]">
                    {accuracyProfile ? `${accuracyProfile.overallAccuracy}%` : whale.winRate > 0 ? `${whale.winRate}%` : "—"}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-[#8892b0] uppercase tracking-wider">Total P&L</div>
                  <div className={`text-lg font-bold font-mono ${whale.totalPnlNum >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {whale.totalPnl}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-[#8892b0] uppercase tracking-wider">Trades</div>
                  <div className="text-lg font-bold font-mono text-[#e2e8f0]">{whale.totalTrades}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── TOP STATS BAR ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Positions Value", val: whale.positionsValue, icon: Wallet, color: "#57D7BA" },
            { label: "Volume Traded", val: whale.totalVolume, icon: BarChart3, color: "#6366f1" },
            { label: "Best Category", val: whale.bestCategory, icon: Trophy, color: "#22c55e" },
            { label: "Worst Category", val: whale.worstCategory, icon: Target, color: "#ef4444" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-[#161b27] border-[#2a2f45]">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${stat.color}15` }}>
                  <stat.icon className="size-4" style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-[10px] text-[#8892b0] uppercase tracking-wider">{stat.label}</div>
                  <div className="text-sm font-bold font-mono">{stat.val}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── ACCURACY BY CATEGORY ───────────────────────────────── */}
        {accuracyProfile && accuracyProfile.totalResolved >= 3 && (
          <Card className="bg-[#161b27] border-[#2a2f45]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-[#e2e8f0]">Accuracy by Category</div>
                  <div className="text-[11px] text-[#8892b0] mt-0.5">
                    Based on {accuracyProfile.totalResolved} resolved positions
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-mono font-bold" style={{ color: accuracyProfile.overallAccuracy >= 55 ? "#22c55e" : accuracyProfile.overallAccuracy >= 45 ? "#f59e0b" : "#ef4444" }}>
                    {accuracyProfile.overallAccuracy}%
                  </div>
                  <div className="text-[10px] text-[#8892b0]">Overall</div>
                </div>
              </div>
              <div className="space-y-2">
                {accuracyProfile.byCategory.map((cat) => (
                  <div key={cat.category} className="flex items-center gap-3">
                    <div className="w-20 text-[11px] text-[#8892b0] truncate shrink-0">{cat.category}</div>
                    <div className="flex-1 h-2 bg-[#0d1117] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${cat.accuracy}%`,
                          backgroundColor: cat.accuracy >= 55 ? "#22c55e" : cat.accuracy >= 45 ? "#f59e0b" : "#ef4444",
                        }}
                      />
                    </div>
                    <div className="text-[11px] font-mono w-10 text-right tabular-nums" style={{ color: cat.accuracy >= 55 ? "#22c55e" : cat.accuracy >= 45 ? "#f59e0b" : "#ef4444" }}>
                      {cat.accuracy}%
                    </div>
                    <div className="text-[10px] text-[#8892b0] w-12 text-right tabular-nums shrink-0">
                      {cat.wins}W/{cat.losses}L
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── TABS ────────────────────────────────────────────────── */}
        <Tabs defaultValue="holdings">
          <div className="border-b border-[#2a2f45] -mx-4 px-4 overflow-x-auto scrollbar-none">
            <TabsList variant="line" className="bg-transparent gap-0">
              {[
                { val: "holdings", icon: Wallet, label: "Holdings" },
                { val: "trades", icon: Zap, label: "Recent Trades" },
                { val: "positions", icon: Activity, label: "Legacy Positions" },
                { val: "history", icon: Clock, label: "Historical Trades" },
                { val: "categories", icon: BarChart3, label: "Category Performance" },
                { val: "calibration", icon: Crosshair, label: "Calibration" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.val}
                  value={tab.val}
                  className="px-3 py-2.5 text-xs gap-1.5 data-active:text-[#57D7BA] text-[#8892b0] hover:text-[#e2e8f0] shrink-0"
                >
                  <tab.icon className="size-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ─── HOLDINGS TAB (real Supabase data) ─────────────────── */}
          <TabsContent value="holdings" className="pt-5">
            <HoldingsTab whaleId={id} />
          </TabsContent>

          {/* ─── RECENT TRADES TAB (real Supabase data) ────────────── */}
          <TabsContent value="trades" className="pt-5">
            <TradesTab whaleId={id} />
          </TabsContent>

          {/* ─── ON-CHAIN POSITIONS TAB ──────────────────────────── */}
          <TabsContent value="onchain" className="pt-5 space-y-4">
            <Card className="bg-[#161b27] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="size-4 text-[#f59e0b]" />
                    Live On-Chain Positions
                  </CardTitle>
                  <span className="text-[10px] text-[#8892b0] flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[#22c55e] animate-pulse" /> Live
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2a2f45] hover:bg-transparent">
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">MARKET</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">SIDE</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">SIZE</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">ENTRY</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">LIVE</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">P&L</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPositions.map((p) => (
                      <TableRow key={`oc-${p.id}`} className="border-[#2a2f45]/50 hover:bg-[#57D7BA]/5 transition-colors">
                        <TableCell className="pl-4 py-2.5">
                          <Link href={`/markets/${p.marketId}`} className="text-xs font-medium hover:text-[#57D7BA] transition-colors line-clamp-1">{p.market}</Link>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${p.side === "YES" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
                            {p.side === "YES" ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}{p.side}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5"><span className="font-mono text-xs font-semibold tabular-nums">{p.size}</span></TableCell>
                        <TableCell className="py-2.5"><span className="font-mono text-xs text-[#8892b0] tabular-nums">{p.entry}</span></TableCell>
                        <TableCell className="py-2.5"><span className="font-mono text-xs font-semibold text-[#57D7BA] tabular-nums">{p.current}</span></TableCell>
                        <TableCell className="py-2.5">
                          <span className={`font-mono text-xs font-semibold tabular-nums ${p.unrealizedPnl.startsWith("+") ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{p.unrealizedPnl}</span>
                        </TableCell>
                        <TableCell className="pr-4 py-2.5">
                          <span className={`font-mono text-xs font-semibold tabular-nums ${p.pnlPct.startsWith("+") ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{p.pnlPct}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="bg-[#161b27] border-[#2a2f45]"><CardContent className="p-3 text-center"><div className="text-lg font-bold font-mono tabular-nums text-[#57D7BA]">{whale.positionsValue}</div><div className="text-[9px] text-[#8892b0] uppercase tracking-wider mt-0.5">Total Value</div></CardContent></Card>
              <Card className="bg-[#161b27] border-[#2a2f45]"><CardContent className="p-3 text-center"><div className="text-lg font-bold font-mono tabular-nums text-[#6366f1]">{currentPositions.length}</div><div className="text-[9px] text-[#8892b0] uppercase tracking-wider mt-0.5">Open Positions</div></CardContent></Card>
              <Card className="bg-[#161b27] border-[#2a2f45]"><CardContent className="p-3 text-center"><div className="text-lg font-bold font-mono tabular-nums text-[#f59e0b]">{whale.accuracy}%</div><div className="text-[9px] text-[#8892b0] uppercase tracking-wider mt-0.5">Accuracy</div></CardContent></Card>
              <Card className="bg-[#161b27] border-[#2a2f45]"><CardContent className="p-3 text-center"><div className="text-lg font-bold font-mono tabular-nums text-[#22c55e]">{whale.totalPnl}</div><div className="text-[9px] text-[#8892b0] uppercase tracking-wider mt-0.5">Total P&L</div></CardContent></Card>
            </div>
          </TabsContent>

          {/* ─── CURRENT POSITIONS TAB ─────────────────────────────── */}
          <TabsContent value="positions" className="pt-5">
            <Card className="bg-[#161b27] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wallet className="size-4 text-[#57D7BA]" />
                    Open Positions ({currentPositions.length})
                  </CardTitle>
                  <span className="text-[10px] text-[#8892b0] flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[#22c55e] animate-pulse" /> Live
                  </span>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2a2f45] hover:bg-transparent">
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">MARKET</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">SIDE</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">SIZE</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">ENTRY</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">CURRENT</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">UNREALIZED P&L</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4">RETURN</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPositions.map((p) => (
                      <TableRow key={p.id} className="border-[#2a2f45]/50 hover:bg-[#57D7BA]/5 transition-colors">
                        <TableCell className="pl-4 py-2.5">
                          <Link href={`/markets/${p.marketId}`} className="text-xs font-medium hover:text-[#57D7BA] transition-colors leading-snug line-clamp-2">
                            {p.market}
                          </Link>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            p.side === "YES" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"
                          }`}>
                            {p.side === "YES" ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                            {p.side}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono text-xs font-semibold">{p.size}</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono text-xs text-[#8892b0]">{p.entry}</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono text-xs font-semibold text-[#57D7BA]">{p.current}</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className={`font-mono text-xs font-semibold ${
                            p.unrealizedPnl.startsWith("+") ? "text-[#22c55e]" : "text-[#ef4444]"
                          }`}>
                            {p.unrealizedPnl}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 py-2.5">
                          <span className={`font-mono text-xs font-semibold ${
                            p.pnlPct.startsWith("+") ? "text-[#22c55e]" : "text-[#ef4444]"
                          }`}>
                            {p.pnlPct}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── HISTORICAL TRADES TAB ─────────────────────────────── */}
          <TabsContent value="history" className="pt-5">
            <Card className="bg-[#161b27] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="size-4 text-[#6366f1]" />
                    Trade History ({historicalTrades.length} trades)
                  </CardTitle>
                  <span className="text-[10px] text-[#8892b0]">Click headers to sort</span>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2a2f45] hover:bg-transparent">
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">MARKET</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">SIDE</TableHead>
                      <TableHead
                        className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] transition-colors"
                        onClick={() => handleHistSort("size")}
                      >
                        <span className="flex items-center gap-0.5">SIZE <SortIcon col="size" /></span>
                      </TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">ENTRY</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">EXIT</TableHead>
                      <TableHead
                        className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] transition-colors"
                        onClick={() => handleHistSort("pnl")}
                      >
                        <span className="flex items-center gap-0.5">P&L <SortIcon col="pnl" /></span>
                      </TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">ACC IMPACT</TableHead>
                      <TableHead
                        className="text-[10px] text-[#8892b0] font-medium pr-4 cursor-pointer hover:text-[#57D7BA] transition-colors"
                        onClick={() => handleHistSort("date")}
                      >
                        <span className="flex items-center gap-0.5">DATE <SortIcon col="date" /></span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedHistory.map((t) => (
                      <TableRow key={t.id} className="border-[#2a2f45]/50 hover:bg-[#57D7BA]/5 transition-colors">
                        <TableCell className="pl-4 py-2.5">
                          <Link href={`/markets/${t.marketId}`} className="text-xs font-medium hover:text-[#57D7BA] transition-colors leading-snug line-clamp-2">
                            {t.market}
                          </Link>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            t.side === "YES" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"
                          }`}>
                            {t.side === "YES" ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                            {t.side}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono text-xs font-semibold">{t.size}</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono text-xs text-[#8892b0]">{t.entry}</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono text-xs text-[#8892b0]">{t.exit}</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className={`font-mono text-xs font-semibold ${
                            t.realizedPnl.startsWith("+") ? "text-[#22c55e]" : "text-[#ef4444]"
                          }`}>
                            {t.realizedPnl}
                          </span>
                          <span className={`block text-[9px] font-mono ${
                            t.pnlPct.startsWith("+") ? "text-[#22c55e]/60" : "text-[#ef4444]/60"
                          }`}>
                            {t.pnlPct}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className={`font-mono text-[10px] font-semibold ${
                            t.accImpact.startsWith("+") ? "text-[#57D7BA]" : "text-[#ef4444]"
                          }`}>
                            {t.accImpact}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 py-2.5">
                          <span className="text-[10px] text-[#8892b0]">{t.date}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── CATEGORY PERFORMANCE TAB ──────────────────────────── */}
          <TabsContent value="categories" className="pt-5 space-y-4">
            <Card className="bg-[#161b27] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="size-4 text-[#57D7BA]" />
                  Win Rate by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart
                      data={categoryPerformance}
                      layout="vertical"
                      margin={{ top: 5, right: 40, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: "#8892b0", fontSize: 10 }} axisLine={{ stroke: "#2a2f45" }} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="category" tick={{ fill: "#e2e8f0", fontSize: 11 }} axisLine={{ stroke: "#2a2f45" }} width={75} />
                      <ReferenceLine x={50} stroke="#8892b0" strokeDasharray="4 4" strokeOpacity={0.4} />
                      <Bar dataKey="winRate" radius={[0, 4, 4, 0]} barSize={18}>
                        {categoryPerformance.map((entry, index) => (
                          <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Detailed breakdown table */}
            <Card className="bg-[#161b27] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="size-4 text-[#6366f1]" />
                  Category Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2a2f45] hover:bg-transparent">
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">CATEGORY</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">WIN RATE</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">TRADES</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4">P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryPerformance.map((c) => (
                      <TableRow key={c.category} className="border-[#2a2f45]/50 hover:bg-[#57D7BA]/5 transition-colors">
                        <TableCell className="pl-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                            <span className="text-xs font-medium">{c.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-[#0d1117] overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${c.winRate}%`, backgroundColor: c.color }} />
                            </div>
                            <span className="font-mono text-xs font-semibold" style={{ color: c.color }}>{c.winRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono text-xs text-[#8892b0]">{c.trades}</span>
                        </TableCell>
                        <TableCell className="pr-4 py-2.5">
                          <span className={`font-mono text-xs font-semibold ${
                            c.pnl.startsWith("+") ? "text-[#22c55e]" : "text-[#ef4444]"
                          }`}>
                            {c.pnl}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── CALIBRATION TAB ───────────────────────────────────── */}
          <TabsContent value="calibration" className="pt-5 space-y-4">
            <Card className="bg-[#161b27] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Crosshair className="size-4 text-[#57D7BA]" />
                    Calibration Chart
                  </CardTitle>
                  <CardDescription className="text-[10px] text-[#8892b0]">
                    Dots on the 45° line = perfectly calibrated predictions
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="h-72 sm:h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <ScatterChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" />
                      <XAxis
                        type="number"
                        dataKey="predicted"
                        domain={[0, 100]}
                        tick={{ fill: "#8892b0", fontSize: 10 }}
                        axisLine={{ stroke: "#2a2f45" }}
                        label={{ value: "Predicted Probability (%)", position: "bottom", fill: "#8892b0", fontSize: 10, offset: 0 }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <YAxis
                        type="number"
                        dataKey="actual"
                        domain={[0, 100]}
                        tick={{ fill: "#8892b0", fontSize: 10 }}
                        axisLine={{ stroke: "#2a2f45" }}
                        label={{ value: "Actual Outcome (%)", angle: -90, position: "left", fill: "#8892b0", fontSize: 10, offset: 0 }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      {/* Perfect calibration line */}
                      <ReferenceLine
                        segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
                        stroke="#8892b0"
                        strokeDasharray="6 4"
                        strokeOpacity={0.4}
                      />
                      <Scatter data={calibrationData} fill="#57D7BA" fillOpacity={0.8}>
                        {calibrationData.map((entry, index) => {
                          const diff = Math.abs(entry.predicted - entry.actual);
                          const color = diff <= 5 ? "#57D7BA" : diff <= 10 ? "#f59e0b" : "#ef4444";
                          return <Cell key={index} fill={color} />;
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Calibration Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Brier Score", val: "0.14", color: "#57D7BA", desc: "Lower is better (0 = perfect)" },
                { label: "Avg Deviation", val: "4.2%", color: "#22c55e", desc: "From perfect calibration" },
                { label: "Overconfidence", val: "Slight", color: "#f59e0b", desc: "Tends to bid 3-5% too high" },
                { label: "Calibration Rank", val: "#8", color: "#6366f1", desc: "Out of 2,847 tracked wallets" },
              ].map((s) => (
                <Card key={s.label} className="bg-[#161b27] border-[#2a2f45]">
                  <CardContent className="p-4 text-center">
                    <div className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.val}</div>
                    <div className="text-[10px] text-[#8892b0] uppercase tracking-wider mt-1">{s.label}</div>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="text-[9px] text-[#8892b0]/60 mt-1 underline decoration-dotted cursor-help">{s.desc}</div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#161b27] border-[#2a2f45] text-[#e2e8f0] text-xs">
                        {s.desc}
                      </TooltipContent>
                    </Tooltip>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Legend */}
            <Card className="bg-[#161b27] border-[#2a2f45]">
              <CardContent className="p-4">
                <div className="flex items-center justify-center gap-6 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#57D7BA]" />
                    <span className="text-[#8892b0]">Well calibrated (±5%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#f59e0b]" />
                    <span className="text-[#8892b0]">Slightly off (±10%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-[#ef4444]" />
                    <span className="text-[#8892b0]">Poorly calibrated (&gt;10%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 border-t border-dashed border-[#8892b0]" />
                    <span className="text-[#8892b0]">Perfect calibration</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
