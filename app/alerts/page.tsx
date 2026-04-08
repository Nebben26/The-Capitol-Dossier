"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Target,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Eye,
  UserPlus,
  AlertTriangle,
  Timer,
  Flame,
  TrendingUp,
  TrendingDown,
  Calendar,
  Volume2,
  Radio,
  ChevronRight,
  CheckCircle,
  XCircle,
  Trophy,
  Copy,
  Check,
} from "lucide-react";
import { useAlertData } from "@/hooks/useData";
import type { WhaleAlert, PriceMover, ResolutionItem } from "@/lib/mockData";
import { recentlyResolved } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import { useDataSource } from "@/components/layout/DataSourceContext";
import { LastUpdated } from "@/components/layout/LastUpdated";
import { LeaderboardSkeleton } from "@/components/ui/skeleton-loaders";
import { CopyAlertButton } from "@/components/ui/copy-alert-button";
import { TrialBanner } from "@/components/ui/pro-gate";

// ─── SORT ─────────────────────────────────────────────────────────────
type PmSort = "change5m" | "change15m" | "change1h" | "price";
type SortDir = "asc" | "desc";

function MoverSparkline({ data, positive }: { data: { d: number; v: number }[]; positive: boolean }) {
  return (
    <div className="h-8 w-16">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={positive ? "#22c55e" : "#ef4444"} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Countdown({ days, hours }: { days: number; hours: number }) {
  const urgency = days <= 7 ? "text-[#ef4444]" : days <= 30 ? "text-[#f59e0b]" : "text-[#8892b0]";
  const bg = days <= 7 ? "bg-[#ef4444]/10" : days <= 30 ? "bg-[#f59e0b]/10" : "bg-[#2a2f45]";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${urgency} ${bg}`}>
      <Timer className="size-2.5" />{days}d {hours % 24}h
    </span>
  );
}

// ─── BROADCAST BUTTON ─────────────────────────────────────────────────
function BroadcastButton({ alerts }: { alerts: WhaleAlert[] }) {
  const [sent, setSent] = useState(false);

  const broadcastText = alerts.map((a, i) =>
    `${i + 1}. 🐋 ${a.wallet} → ${a.side} ${a.size} on "${a.market}" @ ${a.price}`
  ).join("\n") + "\n\n📡 Live from Quiver Markets";

  const handleBroadcast = () => {
    window.open(`https://t.me/share/url?text=${encodeURIComponent(broadcastText)}`, "_blank", "width=550,height=420");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(broadcastText);
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <Card className="bg-[#222638] border-[#2AABEE]/20">
      <CardContent className="p-3 flex items-center gap-3">
        <div className="size-8 rounded-lg bg-[#2AABEE]/10 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="size-4 text-[#2AABEE]" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-[#e2e8f0]">Broadcast top {alerts.length} alerts</p>
          <p className="text-[9px] text-[#8892b0]">Send the latest whale moves to your Telegram channel</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button onClick={handleCopy} variant="outline" size="xs" className="border-[#2f374f] text-[#8892b0] hover:text-[#57D7BA] gap-1">
            {sent ? <Check className="size-3 text-[#22c55e]" /> : <Copy className="size-3" />}
            Copy
          </Button>
          <Button onClick={handleBroadcast} size="xs" className="bg-[#2AABEE] text-white hover:bg-[#2AABEE]/80 gap-1">
            <Radio className="size-3" />
            Broadcast
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────
export default function AlertsPage() {
  const { initialWhaleAlerts, incomingAlerts, priceMovers, resolutionNearing, source, refreshing, lastFetched, error, retry } = useAlertData();
  const { setSource } = useDataSource();

  useEffect(() => { setSource(source); }, [source, setSource]);

  const [alerts, setAlerts] = useState<WhaleAlert[]>(initialWhaleAlerts);
  const [alertCount, setAlertCount] = useState(2847);
  const [pmSort, setPmSort] = useState<PmSort>("change1h");
  const [pmDir, setPmDir] = useState<SortDir>("desc");
  const [followedWhales, setFollowedWhales] = useState<Set<string>>(new Set());
  const [newAlertIdx, setNewAlertIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 1200); return () => clearTimeout(t); }, []);

  // Load real whale positions from Supabase
  useEffect(() => {
    supabase
      .from("whale_positions")
      .select("id, whale_address, market_id, outcome, value, pnl, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const mapped: WhaleAlert[] = data.map((row, i) => {
          const addr = row.whale_address as string;
          const val = Number(row.value) || 0;
          const outcome = (row.outcome as string)?.toUpperCase() === "NO" ? "NO" : "YES";
          const age = Math.floor((Date.now() - new Date(row.updated_at).getTime()) / 1000);
          const ageStr = age < 60 ? `${age}s ago` : age < 3600 ? `${Math.floor(age / 60)}m ago` : `${Math.floor(age / 3600)}h ago`;
          return {
            id: String(row.id ?? i),
            wallet: `${addr.slice(0, 6)}…${addr.slice(-4)}`,
            walletId: addr,
            rank: i + 1,
            accuracy: 0,
            market: String(row.market_id ?? ""),
            marketId: String(row.market_id ?? ""),
            side: outcome as "YES" | "NO",
            size: val >= 1_000_000 ? `$${(val / 1_000_000).toFixed(1)}M` : val >= 1_000 ? `$${(val / 1_000).toFixed(0)}K` : `$${Math.round(val)}`,
            price: "—",
            time: ageStr,
            seconds: age,
            isNew: age < 300,
          };
        });
        setAlerts(mapped);
        setAlertCount(mapped.length);
      });
  }, []);

  // Alerts update when the data refreshes via the hook, not via fake injection

  const toggleFollow = (id: string) => {
    setFollowedWhales((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const handlePmSort = (key: PmSort) => {
    if (pmSort === key) setPmDir(pmDir === "asc" ? "desc" : "asc");
    else { setPmSort(key); setPmDir("desc"); }
  };

  const sortedMovers = [...priceMovers].sort((a, b) => {
    const av = a[pmSort]; const bv = b[pmSort];
    return pmDir === "desc" ? Math.abs(bv) - Math.abs(av) : Math.abs(av) - Math.abs(bv);
  });

  const sortedResolutions = [...resolutionNearing].sort((a, b) => a.daysLeft - b.daysLeft);

  const PmSortIcon = ({ col }: { col: PmSort }) => {
    if (pmSort !== col) return <ChevronDown className="size-3 opacity-30" />;
    return pmDir === "desc" ? <ChevronDown className="size-3 text-[#57D7BA]" /> : <ChevronUp className="size-3 text-[#57D7BA]" />;
  };

  const whaleAlertText = (a: WhaleAlert) =>
    `🐋 Whale Alert: ${a.wallet} (${a.accuracy}% acc) just went ${a.side} ${a.size} on "${a.market}" @ ${a.price}\n\nvia Quiver Markets`;
  const moverText = (m: PriceMover) =>
    `📈 Price Alert: "${m.market}" moved ${m.change1h >= 0 ? "+" : ""}${m.change1h}% in 1h → ${m.price}¢ (Vol: ${m.volume})\n\nvia Quiver Markets`;
  const resText = (r: ResolutionItem) =>
    `⏰ Resolution Alert: "${r.market}" resolves in ${r.daysLeft} days — currently ${r.price}¢ YES (${r.volume} volume)\n\nvia Quiver Markets`;
  const resolvedText = (r: typeof recentlyResolved[0]) =>
    `${r.correct ? "✅" : "❌"} ${r.correct ? "The Market Was Right" : "The Market Was Wrong"}: "${r.question}" resolved ${r.resolved} (market had it at ${r.marketPrice}¢)\n\nvia Quiver Markets`;

  if (loading) return <LeaderboardSkeleton />;

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Radio className="size-7 text-[#ef4444]" />
            Live Signals
          </h1>
          <p className="text-sm text-[#8892b0] mt-1">Real-time whale movements, price spikes, resolutions & outcomes</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ef4444]/10 text-[#ef4444] text-[10px] font-bold animate-pulse">
            <span className="size-1.5 rounded-full bg-[#ef4444]" />LIVE
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#222638] border border-[#2f374f] text-[10px] text-[#8892b0] font-mono tabular-nums">
            {alertCount.toLocaleString()} alerts today
          </span>
          <LastUpdated lastFetched={lastFetched} refreshing={refreshing} error={error} onRetry={retry} />
        </div>
      </div>

      {/* Broadcast */}
      <BroadcastButton alerts={alerts.slice(0, 3)} />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Whale Alerts", val: String(alerts.length), icon: Wallet, color: "#8b5cf6", sub: "Last 24h" },
          { label: "Price Spikes", val: String(sortedMovers.filter((m) => Math.abs(m.change1h) > 5).length), icon: TrendingUp, color: "#22c55e", sub: ">5% in 1h" },
          { label: "Vol Spikes", val: String(sortedMovers.filter((m) => m.volSpike).length), icon: Volume2, color: "#f59e0b", sub: ">3x avg" },
          { label: "Resolving Soon", val: String(sortedResolutions.filter((r) => r.daysLeft <= 30).length), icon: Timer, color: "#ef4444", sub: "Within 30d" },
          { label: "Resolved Today", val: String(recentlyResolved.length), icon: CheckCircle, color: "#57D7BA", sub: "Final outcomes" },
        ].map((s) => (
          <Card key={s.label} className="bg-[#222638] border-[#2f374f]">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}15` }}>
                <s.icon className="size-4" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-sm font-bold font-mono tabular-nums">{s.val}</div>
                <div className="text-[10px] text-[#8892b0]">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TrialBanner />

      {/* ─── TABS ──────────────────────────────────────────── */}
      <Tabs defaultValue="whales">
        <div className="border-b border-[#2f374f] -mx-4 px-4 overflow-x-auto scrollbar-none">
          <TabsList variant="line" className="bg-transparent gap-0">
            <TabsTrigger value="whales" className="px-3 py-2.5 text-xs gap-1.5 data-active:text-[#57D7BA] text-[#8892b0] hover:text-[#e2e8f0] shrink-0">
              <Wallet className="size-3.5" />Whale Alerts
            </TabsTrigger>
            <TabsTrigger value="movers" className="px-3 py-2.5 text-xs gap-1.5 data-active:text-[#57D7BA] text-[#8892b0] hover:text-[#e2e8f0] shrink-0">
              <TrendingUp className="size-3.5" />Price Movers
            </TabsTrigger>
            <TabsTrigger value="resolution" className="px-3 py-2.5 text-xs gap-1.5 data-active:text-[#57D7BA] text-[#8892b0] hover:text-[#e2e8f0] shrink-0">
              <Calendar className="size-3.5" />Resolution Nearing
            </TabsTrigger>
            <TabsTrigger value="resolved" className="px-3 py-2.5 text-xs gap-1.5 data-active:text-[#57D7BA] text-[#8892b0] hover:text-[#e2e8f0] shrink-0">
              <Trophy className="size-3.5" />Resolution Alerts
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ═══ WHALE ALERTS TAB ═══════════════════════════════ */}
        <TabsContent value="whales" className="pt-5 space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className={`rounded-lg border transition-all duration-500 ${a.isNew ? "bg-[#57D7BA]/5 border-[#57D7BA]/20 shadow-lg shadow-[#57D7BA]/5 animate-in slide-in-from-top-2 fade-in-0 duration-500" : "bg-[#222638] border-[#2f374f] hover:border-[#57D7BA]/10"}`}>
              <div className="flex items-center gap-3 p-3 sm:p-4">
                <div className="shrink-0">
                  {a.isNew ? (
                    <span className="relative flex size-3"><span className="absolute inline-flex size-full rounded-full bg-[#57D7BA] opacity-75 animate-ping" /><span className="relative inline-flex size-3 rounded-full bg-[#57D7BA]" /></span>
                  ) : <span className="size-3 rounded-full bg-[#2f374f]" />}
                </div>
                <div className="size-8 rounded-full bg-gradient-to-br from-[#57D7BA] to-[#8b5cf6] flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-[#0f1119]">#{a.rank}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <Link href={`/whales/${a.walletId}`} className="text-xs font-semibold hover:text-[#57D7BA] transition-colors">{a.wallet}</Link>
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${a.side === "YES" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
                      {a.side === "YES" ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}{a.side} {a.size}
                    </span>
                    <span className="text-[10px] text-[#8892b0]">@ {a.price}</span>
                  </div>
                  <Link href={`/markets/${a.marketId}`} className="text-[11px] text-[#8892b0] hover:text-[#57D7BA] transition-colors line-clamp-1">{a.market}</Link>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <Tooltip><TooltipTrigger>
                    <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#57D7BA]/10">
                      <Target className="size-2.5 text-[#57D7BA]" /><span className="text-[9px] font-mono font-bold text-[#57D7BA]">{a.accuracy}%</span>
                    </div>
                  </TooltipTrigger><TooltipContent className="bg-[#222638] border-[#2f374f] text-[#e2e8f0] text-xs">Historical accuracy: {a.accuracy}%</TooltipContent></Tooltip>
                  <span className="text-[9px] text-[#8892b0] font-mono w-14 text-right shrink-0">{a.time}</span>
                  <CopyAlertButton text={whaleAlertText(a)} compact />
                  <div className="hidden sm:flex items-center gap-1">
                    <Link href={`/markets/${a.marketId}`}><Button variant="ghost" size="icon-xs" className="text-[#8892b0] hover:text-[#57D7BA]"><Eye className="size-3" /></Button></Link>
                    <Button variant="ghost" size="icon-xs" onClick={() => toggleFollow(a.walletId)} className={followedWhales.has(a.walletId) ? "text-[#57D7BA]" : "text-[#8892b0] hover:text-[#57D7BA]"}><UserPlus className="size-3" /></Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ═══ PRICE MOVERS TAB ═══════════════════════════════ */}
        <TabsContent value="movers" className="pt-5">
          <Card className="bg-[#222638] border-[#2f374f]">
            <CardContent className="px-0 py-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2f374f] hover:bg-transparent">
                    <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">CONTRACT</TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium">TREND</TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handlePmSort("price")}><span className="flex items-center gap-0.5">PRICE <PmSortIcon col="price" /></span></TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handlePmSort("change5m")}><span className="flex items-center gap-0.5">5M <PmSortIcon col="change5m" /></span></TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handlePmSort("change15m")}><span className="flex items-center gap-0.5">15M <PmSortIcon col="change15m" /></span></TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handlePmSort("change1h")}><span className="flex items-center gap-0.5">1H <PmSortIcon col="change1h" /></span></TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium">VOLUME</TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4">SHARE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMovers.map((m) => (
                    <TableRow key={m.id} className="border-[#2f374f]/50 hover:bg-[#57D7BA]/5 transition-colors">
                      <TableCell className="pl-4 py-2.5"><Link href={`/markets/${m.marketId}`} className="text-xs font-medium hover:text-[#57D7BA] transition-colors line-clamp-1">{m.market}</Link></TableCell>
                      <TableCell className="py-2.5"><MoverSparkline data={m.spark} positive={m.change1h >= 0} /></TableCell>
                      <TableCell className="py-2.5"><span className="font-mono text-xs font-semibold tabular-nums">{m.price}¢</span></TableCell>
                      {([m.change5m, m.change15m, m.change1h] as number[]).map((ch, i) => (
                        <TableCell key={i} className="py-2.5">
                          <span className={`flex items-center gap-0.5 font-mono text-xs font-semibold tabular-nums ${ch >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                            {ch >= 0 ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}{Math.abs(ch)}%
                          </span>
                        </TableCell>
                      ))}
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-[#8892b0] tabular-nums">{m.volume}</span>
                          {m.volSpike && <span className="px-1 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[7px] font-bold flex items-center gap-0.5"><Volume2 className="size-2" />SPIKE</span>}
                        </div>
                      </TableCell>
                      <TableCell className="pr-4 py-2.5"><CopyAlertButton text={moverText(m)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ RESOLUTION NEARING TAB ═════════════════════════ */}
        <TabsContent value="resolution" className="pt-5 space-y-3">
          {sortedResolutions.map((r) => (
            <Card key={r.id} className={`bg-[#222638] border-[#2f374f] hover:border-[#57D7BA]/10 transition-all ${r.daysLeft <= 7 ? "ring-1 ring-[#ef4444]/20" : ""}`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="shrink-0 flex flex-col items-center justify-center w-20">
                    <Countdown days={r.daysLeft} hours={r.hoursLeft} />
                    {r.daysLeft <= 7 && <span className="text-[8px] text-[#ef4444] font-bold uppercase mt-1 flex items-center gap-0.5"><AlertTriangle className="size-2" />Urgent</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link href={`/markets/${r.marketId}`} className="text-sm font-semibold hover:text-[#57D7BA] transition-colors">{r.market}</Link>
                      {r.highConviction && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[8px] font-bold"><Flame className="size-2.5" />HIGH CONVICTION</span>}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-[#8892b0]">
                      <span>Resolves: {r.resolves}</span><span>{r.whaleCount} whales</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-[#1a1e2e] overflow-hidden flex">
                        <div className="h-full bg-[#22c55e] rounded-l-full" style={{ width: `${r.yesPercent}%` }} />
                        <div className="h-full bg-[#ef4444] rounded-r-full" style={{ width: `${100 - r.yesPercent}%` }} />
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-mono shrink-0">
                        <span className="text-[#22c55e] font-semibold tabular-nums">Y {r.yesPercent}%</span>
                        <span className="text-[#ef4444] font-semibold tabular-nums">N {100 - r.yesPercent}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-sm font-bold font-mono text-[#e2e8f0] tabular-nums">{r.price}¢</div>
                      <div className="text-[8px] text-[#8892b0]">Price</div>
                    </div>
                    <CopyAlertButton text={resText(r)} />
                    <Link href={`/markets/${r.marketId}`}>
                      <Button size="xs" className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80">View <ChevronRight className="size-3" /></Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ═══ RESOLUTION ALERTS TAB (NEW) ════════════════════ */}
        <TabsContent value="resolved" className="pt-5 space-y-3">
          <Card className="bg-[#222638] border-[#57D7BA]/20">
            <CardContent className="p-4 flex items-start gap-3">
              <Trophy className="size-5 text-[#57D7BA] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#e2e8f0] mb-1">Recently Resolved Markets</p>
                <p className="text-[11px] text-[#8892b0] leading-relaxed">
                  These markets have reached their resolution date. See whether the crowd got it right or wrong — and who profited.
                </p>
              </div>
            </CardContent>
          </Card>

          {recentlyResolved.map((r) => (
            <Card key={r.id} className={`bg-[#222638] border-[#2f374f] hover:border-[#57D7BA]/10 transition-all ${r.correct ? "" : "ring-1 ring-[#ef4444]/15"}`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="shrink-0">
                    <div className={`size-12 rounded-xl flex items-center justify-center ${r.correct ? "bg-[#22c55e]/10" : "bg-[#ef4444]/10"}`}>
                      {r.correct ? <CheckCircle className="size-6 text-[#22c55e]" /> : <XCircle className="size-6 text-[#ef4444]" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${r.correct ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
                        {r.correct ? "The Market Was Right" : "The Market Was Wrong"}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#57D7BA]/10 text-[#57D7BA]">{r.category}</span>
                      <span className="text-[9px] text-[#8892b0]">{r.resolvedDate}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#e2e8f0] leading-snug mb-2">{r.question}</p>
                    <div className="flex items-center gap-4 text-[10px]">
                      <div>
                        <span className="text-[#8892b0]">Resolved: </span>
                        <span className={`font-bold ${r.resolved === "YES" ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{r.resolved}</span>
                      </div>
                      <div>
                        <span className="text-[#8892b0]">Market price: </span>
                        <span className="font-mono font-bold text-[#e2e8f0] tabular-nums">{r.marketPrice}¢</span>
                      </div>
                      <div>
                        <span className="text-[#8892b0]">Final: </span>
                        <span className="font-mono font-bold text-[#e2e8f0] tabular-nums">{r.finalPrice}¢</span>
                      </div>
                      <div className="hidden sm:block">
                        <span className="text-[#8892b0]">{r.traders.toLocaleString()} traders</span>
                      </div>
                      <div className="hidden sm:block">
                        <span className="text-[#8892b0]">Vol: {r.volume}</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <CopyAlertButton text={resolvedText(r)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

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
