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
  ReferenceLine,
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
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Users,
  Clock,
  Calendar,
  Zap,
  Shield,
  ExternalLink,
  ChevronRight,
  Eye,
  Wallet,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Brain,
  Layers,
  BookOpen,
  CandlestickChart,
  LineChart as LineChartIcon,
} from "lucide-react";
import { useMarketDetail } from "@/hooks/useData";
import { genPriceHistory } from "@/lib/mockData";
import type { OrderbookLevel, Market } from "@/lib/mockData";
import { useDataSource } from "@/components/layout/DataSourceContext";
import { ShareCardButton } from "@/components/ui/share-card-button";
import { WatchlistButton } from "@/components/ui/watchlist-button";
import { EmbedButton } from "@/components/ui/embed-button";
import { TradeButton } from "@/components/ui/trade-button";
import { ChartSkeleton } from "@/components/ui/skeleton-loaders";


const relatedMarkets = [
  { id: "fed-rate-cut", q: "Fed cuts rates before July?", price: 42, change: -8.2 },
  { id: "btc-150k", q: "Bitcoin above $150K by EOY?", price: 23, change: -3.1 },
  { id: "student-debt", q: "Student debt relief bill passes?", price: 37, change: -6.5 },
];

// ─── GAUGE COMPONENT ──────────────────────────────────────────────────
function SmartMoneyGauge({ value }: { value: number }) {
  const angle = (value / 100) * 180 - 90;
  const rad = (angle * Math.PI) / 180;
  const needleX = 100 + 60 * Math.cos(rad);
  const needleY = 90 + 60 * Math.sin(rad);
  const sentiment = value >= 70 ? "Strongly Bullish" : value >= 55 ? "Bullish" : value >= 45 ? "Neutral" : value >= 30 ? "Bearish" : "Strongly Bearish";
  const sentColor = value >= 55 ? "#22c55e" : value >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-36 h-auto">
        <defs>
          <linearGradient id="smartGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <path d="M 25 90 A 75 75 0 0 1 175 90" fill="none" stroke="#2a2f45" strokeWidth="10" strokeLinecap="round" />
        <path d="M 25 90 A 75 75 0 0 1 175 90" fill="none" stroke="url(#smartGaugeGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(value / 100) * 236} 236`} />
        <line x1="100" y1="90" x2={needleX} y2={needleY} stroke="#57D7BA" strokeWidth="2" strokeLinecap="round" />
        <circle cx="100" cy="90" r="3.5" fill="#57D7BA" />
        <text x="100" y="78" textAnchor="middle" fill="#e2e8f0" fontSize="20" fontWeight="700">{value}</text>
      </svg>
      <span className="text-xs font-semibold mt-0.5" style={{ color: sentColor }}>{sentiment}</span>
      <span className="text-[10px] text-[#8892b0] tracking-wide uppercase">Smart Money Score</span>
    </div>
  );
}

// ─── DEPTH CHART ──────────────────────────────────────────────────────
function DepthChart({ bids, asks }: { bids: OrderbookLevel[]; asks: OrderbookLevel[] }) {
  const bidData = bids.map((b) => ({ price: b.price, bids: b.total, asks: 0 }));
  const askData = asks.map((a) => ({ price: a.price, bids: 0, asks: a.total }));
  const combined = [...bidData.reverse(), ...askData];

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <AreaChart data={combined} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" />
        <XAxis dataKey="price" tick={{ fill: "#8892b0", fontSize: 10 }} tickFormatter={(v) => `${v}¢`} />
        <YAxis tick={{ fill: "#8892b0", fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
        <defs>
          <linearGradient id="bidGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="askGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="stepAfter" dataKey="bids" stroke="#22c55e" fill="url(#bidGrad)" strokeWidth={2} />
        <Area type="stepAfter" dataKey="asks" stroke="#ef4444" fill="url(#askGrad)" strokeWidth={2} />
        <ReferenceLine x={68} stroke="#57D7BA" strokeDasharray="4 4" label={{ value: "Mid 68¢", fill: "#57D7BA", fontSize: 10, position: "top" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────
export default function MarketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { market: loadedMarket, whaleFlows, crossPlatformPrices, orderbookBids, orderbookAsks, resolutionHistory, source, refreshing, lastFetched } = useMarketDetail(id);
  const [notFound, setNotFound] = useState(false);
  const placeholder: Market = { id, question: "Loading...", price: 50, change: 0, volume: "$0", volNum: 0, category: "Economics", platform: "Polymarket", resolution: "TBD", daysLeft: 0, trending: false, whaleCount: 0, traders: 0, spark: [], desc: "", creator: "", created: "", liquidity: "$0" };
  const market = loadedMarket ?? placeholder;
  const { setSource } = useDataSource();
  useEffect(() => { setSource(source); }, [source, setSource]);
  const [timeRange, setTimeRange] = useState<"1D" | "7D" | "30D" | "90D" | "ALL">("30D");
  const [chartMode, setChartMode] = useState<"area" | "candle">("area");

  // If market not found after data loads, show not-found state
  useEffect(() => {
    if (!loadedMarket && source !== "mock") {
      const timer = setTimeout(() => { if (!loadedMarket) setNotFound(true); }, 3000);
      return () => clearTimeout(timer);
    }
    if (loadedMarket) setNotFound(false);
  }, [loadedMarket, source]);

  const priceData = useMemo(() => {
    const points = { "1D": 24, "7D": 48, "30D": 90, "90D": 180, ALL: 365 }[timeRange];
    if (market.priceHistory && market.priceHistory.length > 0) {
      const history = market.priceHistory;
      return history.slice(Math.max(0, history.length - points));
    }
    return genPriceHistory(market.price - 15, points, 6);
  }, [timeRange, market.price, market.priceHistory]);

  const maxBidTotal = Math.max(...orderbookBids.map((b) => b.total));
  const maxAskTotal = Math.max(...orderbookAsks.map((a) => a.total));

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (notFound) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-20 text-center">
        <div className="text-6xl font-bold font-mono text-[#2f374f] mb-4">404</div>
        <h1 className="text-xl font-bold mb-2">Market Not Found</h1>
        <p className="text-sm text-[#8892b0] mb-6">The market &quot;{id}&quot; doesn&apos;t exist or hasn&apos;t been indexed yet.</p>
        <Link href="/markets" className="text-sm text-[#57D7BA] hover:underline">Browse all markets →</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
        <div className="h-12 rounded-lg bg-[#222638] animate-pulse" />
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1 space-y-3">
            <div className="h-4 w-24 rounded bg-[#222638] animate-pulse" />
            <div className="h-8 w-3/4 rounded bg-[#222638] animate-pulse" />
            <div className="h-4 w-full rounded bg-[#222638] animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-[#222638] animate-pulse" />
          </div>
          <div className="lg:min-w-[280px] h-48 rounded-xl bg-[#222638] animate-pulse" />
        </div>
        <ChartSkeleton height="h-96" />
      </div>
    );
  }

  return (
    <>
      {/* ─── TOP NAV BAR ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 h-12 bg-[#1a1e2e]/95 backdrop-blur-md border-b border-[#2a2f45] flex items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-1.5 text-[#8892b0] hover:text-[#57D7BA] transition-colors text-sm">
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        <ChevronRight className="size-3 text-[#2a2f45]" />
        <span className="text-xs text-[#8892b0]">Markets</span>
        <ChevronRight className="size-3 text-[#2a2f45]" />
        <span className="text-xs text-[#57D7BA] font-medium truncate">{market.category}</span>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
        {/* ─── CONTRACT HEADER ─────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-[#57D7BA]/10 text-[#57D7BA] text-[10px] font-semibold uppercase tracking-wider">
                {market.category}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] font-semibold flex items-center gap-1">
                <Clock className="size-2.5" />
                Resolves {market.resolution}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#222638] text-[#8892b0] text-[10px] font-medium border border-[#2a2f45]">
                {market.creator}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-3">
              {market.question}
            </h1>
            <p className="text-sm text-[#8892b0] leading-relaxed max-w-3xl">
              {market.desc}
            </p>
          </div>

          {/* ─── PRICE BLOCK ───────────────────────────────────────── */}
          <Card className="bg-[#222638] border-[#2a2f45] lg:min-w-[280px] shrink-0">
            <CardContent className="p-5">
              <div className="text-center lg:text-right">
                <div className="text-xs text-[#8892b0] mb-1 uppercase tracking-wider">Current Price</div>
                <div className="text-5xl font-bold font-mono tracking-tighter text-[#e2e8f0]">
                  {market.price}<span className="text-2xl text-[#8892b0]">¢</span>
                </div>
                <div className={`flex items-center justify-center lg:justify-end gap-1 mt-2 text-sm font-semibold ${market.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {market.change >= 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                  {market.change >= 0 ? "+" : ""}{market.change}% (24h)
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#2a2f45]">
                <div>
                  <div className="text-[10px] text-[#8892b0] uppercase tracking-wider">Volume</div>
                  <div className="text-sm font-semibold font-mono">{market.volume}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8892b0] uppercase tracking-wider">Liquidity</div>
                  <div className="text-sm font-semibold font-mono">{market.liquidity}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8892b0] uppercase tracking-wider">Traders</div>
                  <div className="text-sm font-semibold font-mono">{market.traders.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8892b0] uppercase tracking-wider">Created</div>
                  <div className="text-sm font-semibold font-mono">{market.created}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <TradeButton side="YES" price={market.price} url={market.platformUrl} />
                <TradeButton side="NO" price={market.price} url={market.platformUrl} />
              </div>
              <div className="mt-3 flex justify-center gap-2">
                <ShareCardButton title={market.question} price={market.price} change={market.change} />
                <WatchlistButton type="market" itemId={market.id} name={market.question} />
                <EmbedButton type="market" id={market.id} label="Embed" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── TABS ────────────────────────────────────────────────── */}
        <Tabs defaultValue="overview">
          <div className="border-b border-[#2a2f45] -mx-4 px-4 overflow-x-auto scrollbar-none">
            <TabsList variant="line" className="bg-transparent gap-0">
              {[
                { val: "overview", icon: Activity, label: "Overview" },
                { val: "price", icon: BarChart3, label: "Price Chart" },
                { val: "whales", icon: Users, label: "Whale Flows" },
                { val: "cross", icon: Layers, label: "Cross-Platform" },
                { val: "orderbook", icon: BookOpen, label: "Orderbook" },
                { val: "resolution", icon: CheckCircle, label: "Resolution History" },
                { val: "signals", icon: Brain, label: "Signals" },
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

          {/* ─── OVERVIEW TAB ──────────────────────────────────────── */}
          <TabsContent value="overview" className="pt-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Smart Money Gauge */}
              <Card className="bg-[#222638] border-[#2a2f45]">
                <CardContent className="p-5 flex flex-col items-center">
                  <SmartMoneyGauge value={72} />
                </CardContent>
              </Card>

              {/* Key Stats */}
              <Card className="bg-[#222638] border-[#2a2f45]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="size-4 text-[#57D7BA]" />
                    Key Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "7-Day Avg Price", val: "62¢", sub: "+9.7% from avg" },
                    { label: "All-Time High", val: "74¢", sub: "Mar 28, 2026" },
                    { label: "All-Time Low", val: "12¢", sub: "Jan 18, 2026" },
                    { label: "Implied Probability", val: "68%", sub: "Based on last trade" },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-xs text-[#8892b0]">{s.label}</span>
                      <div className="text-right">
                        <span className="text-xs font-semibold font-mono">{s.val}</span>
                        <span className="block text-[9px] text-[#8892b0]">{s.sub}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Market Sentiment */}
              <Card className="bg-[#222638] border-[#2a2f45]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="size-4 text-[#f59e0b]" />
                    Market Sentiment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#22c55e] font-medium">YES Holders</span>
                      <span className="font-mono text-[#22c55e]">72%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#1a1e2e] overflow-hidden">
                      <div className="h-full rounded-full bg-[#22c55e]" style={{ width: "72%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[#ef4444] font-medium">NO Holders</span>
                      <span className="font-mono text-[#ef4444]">28%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#1a1e2e] overflow-hidden">
                      <div className="h-full rounded-full bg-[#ef4444]" style={{ width: "28%" }} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#2a2f45] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8892b0]">Whale Concentration</span>
                      <span className="font-mono font-semibold text-[#f59e0b]">High</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8892b0]">Smart Money Direction</span>
                      <span className="font-mono font-semibold text-[#22c55e]">Bullish YES</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8892b0]">Volume Trend (7D)</span>
                      <span className="font-mono font-semibold text-[#57D7BA]">+340%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Whales in this Market */}
            <Card className="bg-[#222638] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wallet className="size-4 text-[#8b5cf6]" />
                  Top Whales in This Market
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2a2f45] hover:bg-transparent">
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">WHALE</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">SIDE</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">SIZE</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">ACCURACY</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whaleFlows.slice(0, 4).map((w) => (
                      <TableRow key={w.id} className="border-[#2a2f45]/50 hover:bg-[#57D7BA]/5 transition-colors">
                        <TableCell className="pl-4 py-2">
                          <Link href={`/whales/${w.id}`} className="flex items-center gap-2 hover:text-[#57D7BA] transition-colors">
                            <div className="size-6 rounded-full bg-gradient-to-br from-[#57D7BA] to-[#8b5cf6] flex items-center justify-center text-[8px] font-bold text-[#0f1119]">
                              #{w.rank}
                            </div>
                            <span className="text-xs font-medium">{w.wallet}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            w.side === "YES" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"
                          }`}>
                            {w.side === "YES" ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                            {w.side}
                          </span>
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="font-mono text-xs font-semibold">{w.size}</span>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1 rounded-full bg-[#1a1e2e] overflow-hidden">
                              <div className="h-full rounded-full bg-[#57D7BA]" style={{ width: `${w.acc}%` }} />
                            </div>
                            <span className="text-[10px] text-[#57D7BA] font-mono">{w.acc}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Related Markets */}
            <Card className="bg-[#222638] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="size-4 text-[#57D7BA]" />
                  Related Markets
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {relatedMarkets.map((rm) => (
                    <Link key={rm.id} href={`/markets/${rm.id}`} className="group">
                      <div className="p-3 rounded-lg border border-[#2a2f45] hover:border-[#57D7BA]/20 transition-all">
                        <p className="text-xs font-medium group-hover:text-[#57D7BA] transition-colors leading-snug mb-2">
                          {rm.q}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-semibold text-[#57D7BA]">{rm.price}¢</span>
                          <span className={`flex items-center gap-0.5 font-mono text-xs font-semibold ${rm.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                            {rm.change >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                            {Math.abs(rm.change)}%
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── PRICE CHART TAB ───────────────────────────────────── */}
          <TabsContent value="price" className="pt-5 space-y-4">
            <Card className="bg-[#222638] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="size-4 text-[#57D7BA]" />
                    Price History
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {/* Time range buttons */}
                    <div className="flex items-center gap-0.5 bg-[#1a1e2e] rounded-lg p-0.5 border border-[#2a2f45]">
                      {(["1D", "7D", "30D", "90D", "ALL"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setTimeRange(r)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                            timeRange === r
                              ? "bg-[#57D7BA] text-[#0f1119] shadow-lg shadow-[#57D7BA]/20"
                              : "text-[#8892b0] hover:text-[#e2e8f0]"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    {/* Chart mode toggle */}
                    <div className="flex items-center gap-0.5 bg-[#1a1e2e] rounded-lg p-0.5 border border-[#2a2f45]">
                      <button
                        onClick={() => setChartMode("area")}
                        className={`p-1.5 rounded-md transition-all ${chartMode === "area" ? "bg-[#57D7BA] text-[#0f1119]" : "text-[#8892b0] hover:text-[#e2e8f0]"}`}
                      >
                        <LineChartIcon className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setChartMode("candle")}
                        className={`p-1.5 rounded-md transition-all ${chartMode === "candle" ? "bg-[#57D7BA] text-[#0f1119]" : "text-[#8892b0] hover:text-[#e2e8f0]"}`}
                      >
                        <CandlestickChart className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                {/* Price Chart */}
                <div className="h-72 sm:h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    {chartMode === "area" ? (
                      <AreaChart data={priceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#57D7BA" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#57D7BA" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" />
                        <XAxis dataKey="time" tick={{ fill: "#8892b0", fontSize: 10 }} axisLine={{ stroke: "#2a2f45" }} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: "#8892b0", fontSize: 10 }} axisLine={{ stroke: "#2a2f45" }} tickFormatter={(v: number) => `${Math.round(v)}¢`} domain={[0, 100]} />
                        <Area type="monotone" dataKey="price" stroke="#57D7BA" strokeWidth={2} fill="url(#priceGradient)" />
                      </AreaChart>
                    ) : (
                      <BarChart data={priceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2f45" />
                        <XAxis dataKey="time" tick={{ fill: "#8892b0", fontSize: 10 }} axisLine={{ stroke: "#2a2f45" }} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: "#8892b0", fontSize: 10 }} axisLine={{ stroke: "#2a2f45" }} tickFormatter={(v: number) => `${Math.round(v)}¢`} domain={[0, 100]} />
                        <Bar dataKey="close" fill="#57D7BA" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* Volume Bars */}
                <div className="h-20 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={priceData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <XAxis dataKey="time" tick={false} axisLine={{ stroke: "#2a2f45" }} />
                      <Bar dataKey="vol" fill="#57D7BA" fillOpacity={0.2} radius={[1, 1, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── WHALE FLOWS TAB ───────────────────────────────────── */}
          <TabsContent value="whales" className="pt-5">
            <Card className="bg-[#222638] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="size-4 text-[#8b5cf6]" />
                    Recent Whale Trades
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
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">WALLET</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">SIDE</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">SIZE</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">ENTRY</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">ACCURACY</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">P&L IMPACT</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4">TIME</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whaleFlows.map((w) => (
                      <TableRow key={w.id} className="border-[#2a2f45]/50 hover:bg-[#57D7BA]/5 transition-colors">
                        <TableCell className="pl-4 py-2.5">
                          <Link href={`/whales/${w.id}`} className="flex items-center gap-2 hover:text-[#57D7BA] transition-colors">
                            <div className="size-6 rounded-full bg-gradient-to-br from-[#57D7BA] to-[#8b5cf6] flex items-center justify-center text-[8px] font-bold text-[#0f1119]">
                              #{w.rank}
                            </div>
                            <span className="text-xs font-medium">{w.wallet}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            w.side === "YES" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"
                          }`}>
                            {w.side === "YES" ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                            {w.side}
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono text-xs font-semibold">{w.size}</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono text-xs text-[#8892b0]">{w.price}</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1 rounded-full bg-[#1a1e2e] overflow-hidden">
                              <div className="h-full rounded-full bg-[#57D7BA]" style={{ width: `${w.acc}%` }} />
                            </div>
                            <span className="text-[10px] text-[#57D7BA] font-mono">{w.acc}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className={`font-mono text-xs font-semibold ${
                            w.pnl.startsWith("+") ? "text-[#22c55e]" : "text-[#ef4444]"
                          }`}>
                            {w.pnl}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 py-2.5">
                          <span className="text-[10px] text-[#8892b0]">{w.time}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── CROSS-PLATFORM TAB ────────────────────────────────── */}
          <TabsContent value="cross" className="pt-5">
            <Card className="bg-[#222638] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="size-4 text-[#57D7BA]" />
                    Cross-Platform Comparison
                  </CardTitle>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] font-semibold">
                    <AlertTriangle className="size-3" />
                    8pt divergence
                  </div>
                </div>
                <CardDescription className="text-xs text-[#8892b0]">
                  Price differences across platforms may indicate arbitrage opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#2a2f45] hover:bg-transparent">
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">PLATFORM</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">PRICE</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">24H CHANGE</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">VOLUME</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">LIQUIDITY</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">TRADERS</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4">DIVERGENCE</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {crossPlatformPrices.map((p) => {
                      const basePrice = 68;
                      const div = p.price - basePrice;
                      const divAbs = Math.abs(div);
                      return (
                        <TableRow key={p.platform} className="border-[#2a2f45]/50 hover:bg-[#57D7BA]/5 transition-colors">
                          <TableCell className="pl-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="size-6 rounded-md bg-[#1a1e2e] border border-[#2a2f45] flex items-center justify-center">
                                <ExternalLink className="size-3 text-[#8892b0]" />
                              </div>
                              <a href={p.link} className="text-xs font-medium hover:text-[#57D7BA] transition-colors">
                                {p.platform}
                              </a>
                            </div>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <span className="font-mono text-sm font-bold">{p.price}¢</span>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <span className={`flex items-center gap-0.5 font-mono text-xs font-semibold ${p.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                              {p.change >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                              {Math.abs(p.change)}%
                            </span>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <span className="font-mono text-xs text-[#8892b0]">{p.vol}</span>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <span className="font-mono text-xs text-[#8892b0]">{p.liquidity}</span>
                          </TableCell>
                          <TableCell className="py-2.5">
                            <span className="font-mono text-xs text-[#8892b0]">{p.traders}</span>
                          </TableCell>
                          <TableCell className="pr-4 py-2.5">
                            {divAbs === 0 ? (
                              <span className="text-xs text-[#8892b0] font-mono">—</span>
                            ) : (
                              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                                divAbs >= 5
                                  ? "bg-[#f59e0b]/10 text-[#f59e0b]"
                                  : "bg-[#2a2f45] text-[#8892b0]"
                              }`}>
                                {div > 0 ? "+" : ""}{div}pt
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── ORDERBOOK TAB ─────────────────────────────────────── */}
          <TabsContent value="orderbook" className="pt-5 space-y-4">
            {/* Depth Chart */}
            <Card className="bg-[#222638] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="size-4 text-[#57D7BA]" />
                  Depth Chart
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="h-64 sm:h-80 w-full">
                  <DepthChart bids={orderbookBids} asks={orderbookAsks} />
                </div>
              </CardContent>
            </Card>

            {/* Order Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bids */}
              <Card className="bg-[#222638] border-[#2a2f45]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#22c55e] flex items-center gap-2">
                    <ArrowUpRight className="size-4" />
                    Bids (Buy YES)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2a2f45] hover:bg-transparent">
                        <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">PRICE</TableHead>
                        <TableHead className="text-[10px] text-[#8892b0] font-medium">SIZE</TableHead>
                        <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4">TOTAL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderbookBids.map((b) => (
                        <TableRow key={b.price} className="border-[#2a2f45]/50 hover:bg-[#22c55e]/5 transition-colors relative">
                          <TableCell className="pl-4 py-1.5 relative z-10">
                            <span className="font-mono text-xs font-semibold text-[#22c55e]">{b.price}¢</span>
                          </TableCell>
                          <TableCell className="py-1.5 relative z-10">
                            <span className="font-mono text-xs text-[#8892b0]">${(b.size / 1000).toFixed(0)}K</span>
                          </TableCell>
                          <TableCell className="pr-4 py-1.5 relative z-10">
                            <span className="font-mono text-xs text-[#8892b0]">${(b.total / 1000).toFixed(0)}K</span>
                          </TableCell>
                          <td className="absolute inset-0 pointer-events-none">
                            <div
                              className="h-full bg-[#22c55e]/8 transition-all"
                              style={{ width: `${(b.total / maxBidTotal) * 100}%` }}
                            />
                          </td>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Asks */}
              <Card className="bg-[#222638] border-[#2a2f45]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-[#ef4444] flex items-center gap-2">
                    <ArrowDownRight className="size-4" />
                    Asks (Buy NO)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2a2f45] hover:bg-transparent">
                        <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">PRICE</TableHead>
                        <TableHead className="text-[10px] text-[#8892b0] font-medium">SIZE</TableHead>
                        <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4">TOTAL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderbookAsks.map((a) => (
                        <TableRow key={a.price} className="border-[#2a2f45]/50 hover:bg-[#ef4444]/5 transition-colors relative">
                          <TableCell className="pl-4 py-1.5 relative z-10">
                            <span className="font-mono text-xs font-semibold text-[#ef4444]">{a.price}¢</span>
                          </TableCell>
                          <TableCell className="py-1.5 relative z-10">
                            <span className="font-mono text-xs text-[#8892b0]">${(a.size / 1000).toFixed(0)}K</span>
                          </TableCell>
                          <TableCell className="pr-4 py-1.5 relative z-10">
                            <span className="font-mono text-xs text-[#8892b0]">${(a.total / 1000).toFixed(0)}K</span>
                          </TableCell>
                          <td className="absolute inset-0 pointer-events-none">
                            <div
                              className="h-full bg-[#ef4444]/8 transition-all ml-auto"
                              style={{ width: `${(a.total / maxAskTotal) * 100}%` }}
                            />
                          </td>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── RESOLUTION HISTORY TAB ─────────────────────────────── */}
          <TabsContent value="resolution" className="pt-5 space-y-4">
            <Card className="bg-[#222638] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle className="size-4 text-[#57D7BA]" />
                    Past Similar Markets
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-[10px] font-semibold">
                      3/4 Correct
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-[#57D7BA]/10 text-[#57D7BA] text-[10px] font-semibold">
                      75% Calibration
                    </div>
                  </div>
                </div>
                <CardDescription className="text-xs text-[#8892b0]">
                  Historical accuracy of similar prediction market questions
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3 space-y-3">
                {resolutionHistory.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg border border-[#2a2f45] hover:border-[#57D7BA]/20 transition-all"
                  >
                    <div className={`shrink-0 size-8 rounded-full flex items-center justify-center ${
                      r.resolved === "YES" ? "bg-[#22c55e]/10" : "bg-[#ef4444]/10"
                    }`}>
                      {r.resolved === "YES" ? (
                        <CheckCircle className="size-4 text-[#22c55e]" />
                      ) : (
                        <XCircle className="size-4 text-[#ef4444]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium">{r.q}</p>
                        <span className="text-[10px] text-[#8892b0] shrink-0 ml-2">{r.date}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          r.resolved === "YES" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"
                        }`}>
                          Resolved {r.resolved}
                        </span>
                        <span className="text-[10px] text-[#8892b0] font-mono">Final: {r.finalPrice}¢</span>
                        <span className="text-[10px] text-[#8892b0]">{r.accuracy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Calibration Breakdown */}
            <Card className="bg-[#222638] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="size-4 text-[#f59e0b]" />
                  Calibration Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Markets Resolved", val: "4", color: "#57D7BA" },
                    { label: "Correctly Priced", val: "3/4", color: "#22c55e" },
                    { label: "Avg Brier Score", val: "0.18", color: "#f59e0b" },
                    { label: "Calibration Error", val: "8.2%", color: "#ef4444" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-3 rounded-lg bg-[#1a1e2e] border border-[#2a2f45]">
                      <div className="text-xl font-bold font-mono" style={{ color: stat.color }}>
                        {stat.val}
                      </div>
                      <div className="text-[10px] text-[#8892b0] mt-1 uppercase tracking-wider">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── SIGNALS TAB ───────────────────────────────────────── */}
          <TabsContent value="signals" className="pt-5">
            <Card className="bg-[#222638] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="size-4 text-[#8b5cf6]" />
                  AI & Quantitative Signals
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3 space-y-3">
                {[
                  {
                    signal: "Whale Accumulation Pattern",
                    desc: "Top 10 wallets have increased YES positions by 34% in the last 7 days",
                    strength: 82,
                    direction: "Bullish" as const,
                    color: "#22c55e",
                  },
                  {
                    signal: "Cross-Platform Divergence",
                    desc: "8-point spread between Polymarket (68¢) and Kalshi (60¢) suggests mispricing",
                    strength: 71,
                    direction: "Neutral" as const,
                    color: "#f59e0b",
                  },
                  {
                    signal: "Volume Momentum",
                    desc: "24h volume up 340% vs 7-day average, historically correlated with continued moves",
                    strength: 88,
                    direction: "Bullish" as const,
                    color: "#22c55e",
                  },
                  {
                    signal: "News Sentiment (NLP)",
                    desc: "Negative economic headlines up 45% this week across major outlets",
                    strength: 76,
                    direction: "Bullish" as const,
                    color: "#22c55e",
                  },
                  {
                    signal: "Historical Pattern Match",
                    desc: "Current price action resembles pre-2020 recession market with 67% similarity",
                    strength: 67,
                    direction: "Bullish" as const,
                    color: "#22c55e",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-3 rounded-lg border border-[#2a2f45] hover:border-[#57D7BA]/20 transition-all"
                  >
                    <div className="shrink-0 w-12 text-center">
                      <div className="text-lg font-bold font-mono" style={{ color: s.color }}>
                        {s.strength}
                      </div>
                      <div className="text-[8px] text-[#8892b0] uppercase">strength</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">{s.signal}</span>
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold"
                          style={{
                            backgroundColor: `${s.color}15`,
                            color: s.color,
                          }}
                        >
                          {s.direction}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8892b0] leading-relaxed">{s.desc}</p>
                    </div>
                    <div className="shrink-0 w-16">
                      <div className="h-1.5 rounded-full bg-[#1a1e2e] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${s.strength}%`, backgroundColor: s.color }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
