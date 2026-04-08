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
import { supabase } from "@/lib/supabase";
import { Sparkline } from "@/components/ui/sparkline";
import { getSpreadHistory, getMarketThesis, getMarketCandles, type MarketThesis, type Candle } from "@/lib/api";
import { CandlestickChartComponent } from "@/components/ui/candlestick-chart";
import { formatSignedPct, formatCents } from "@/lib/format";
import { genPriceHistory } from "@/lib/mockData";
import type { OrderbookLevel, Market } from "@/lib/mockData";
import { useDataSource } from "@/components/layout/DataSourceContext";
import { ShareCardButton } from "@/components/ui/share-card-button";
import { WatchlistButton } from "@/components/ui/watchlist-button";
import { EmbedButton } from "@/components/ui/embed-button";
import { TradeButton } from "@/components/ui/trade-button";
import { ChartSkeleton } from "@/components/ui/skeleton-loaders";


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

  // ─── Real data for tabs ───────────────────────────────────────────────
  const [marketWhales, setMarketWhales] = useState<any[]>([]);
  const [marketDisagreement, setMarketDisagreement] = useState<any | null>(null);
  const [marketNews, setMarketNews] = useState<any[]>([]);
  const [spreadHistory, setSpreadHistory] = useState<Array<{ t: number; spread: number }>>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [thesis, setThesis] = useState<MarketThesis | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [crossPlatformPrice, setCrossPlatformPrice] = useState<number | null>(null);
  const [crossPlatformLabel, setCrossPlatformLabel] = useState<string>("Counterpart");

  // Auto-switch to candle mode when real candlestick data is available
  useEffect(() => {
    if (candles.length > 0) setChartMode("candle");
  }, [candles.length]);

  useEffect(() => {
    if (!market?.id || market.question === "Loading...") return;
    (async () => {
      try {
        const [whalesRes, disagreeRes, newsRes, thesisData, candleData] = await Promise.all([
          supabase.from("whale_positions").select("whale_id, outcome, current_value, pnl, updated_at").eq("market_id", market.id).order("current_value", { ascending: false }).limit(50),
          supabase.from("disagreements").select("*").or(`poly_market_id.eq.${market.id},kalshi_market_id.eq.${market.id}`).limit(1),
          supabase.from("news_market_tags").select("market_id, score, news_articles(id, title, url, source, published_at)").eq("market_id", market.id).order("score", { ascending: false }).limit(3),
          getMarketThesis(market.id),
          getMarketCandles(market.id, 30),
        ]);
        setMarketWhales(whalesRes.data || []);
        const d = disagreeRes.data?.[0] || null;
        setMarketDisagreement(d);
        setMarketNews(newsRes.data || []);
        setThesis(thesisData);
        setCandles(candleData);

        // Cross-platform overlay price from disagreement data
        if (d) {
          const isKalshi = market.id.startsWith("kalshi-");
          if (isKalshi && d.poly_price != null) {
            setCrossPlatformPrice(Number(d.poly_price));
            setCrossPlatformLabel("Polymarket");
          } else if (!isKalshi && d.kalshi_price != null) {
            setCrossPlatformPrice(Number(d.kalshi_price));
            setCrossPlatformLabel("Kalshi");
          }
        }

        if (d?.poly_market_id) {
          const hist = await getSpreadHistory([d.poly_market_id]);
          setSpreadHistory(hist[d.poly_market_id] || []);
        }
      } catch (err) {
        console.error("[market detail] fetch failed:", err);
      } finally {
        setDataLoading(false);
      }
    })();
  }, [market?.id, market.question]);

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
                  {formatCents(market.price)}
                </div>
                <div className={`flex items-center justify-center lg:justify-end gap-1 mt-2 text-sm font-semibold ${market.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {market.change >= 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                  {formatSignedPct(market.change)} (24h)
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
                { val: "analysis", icon: Brain, label: "Analysis" },
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

          {/* ─── ANALYSIS TAB ─────────────────────────────────────── */}
          <TabsContent value="analysis" className="pt-5">
            {dataLoading ? (
              <div className="flex items-center gap-2 text-[#8892b0] text-xs py-8 justify-center">
                <Brain className="size-4 animate-pulse text-[#57D7BA]" />
                Loading analysis…
              </div>
            ) : !thesis ? (
              <Card className="bg-[#222638] border-[#2a2f45]">
                <CardContent className="py-12 text-center">
                  <Brain className="size-10 text-[#2f374f] mx-auto mb-4" />
                  <p className="text-sm text-[#8892b0]">Analysis not yet generated for this market.</p>
                  <p className="text-xs text-[#8892b0]/60 mt-1">Theses are generated weekly for the top 25 highest-volume markets.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Brain className="size-4 text-[#57D7BA]" />
                      <span className="text-sm font-semibold text-[#e2e8f0]">AI Analysis</span>
                      <span className="text-[10px] text-[#8892b0]">
                        · Generated {(() => {
                          const diff = Math.floor((Date.now() - new Date(thesis.generated_at).getTime()) / 1000);
                          if (diff < 60) return `${diff}s ago`;
                          if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                          if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                          return `${Math.floor(diff / 86400)}d ago`;
                        })()}
                      </span>
                      {/* Stale thesis badge */}
                      {(() => {
                        const ageMs = Date.now() - new Date(thesis.generated_at).getTime();
                        const ageDays = ageMs / 86_400_000;
                        if (ageDays > 7) {
                          return (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#ef4444]/15 text-[#ef4444]">
                              Stale — {Math.floor(ageDays)}d old
                            </span>
                          );
                        }
                        if (ageDays > 1) {
                          return (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#f59e0b]/15 text-[#f59e0b]">
                              {Math.floor(ageDays)}d old
                            </span>
                          );
                        }
                        return (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#22c55e]/15 text-[#22c55e]">
                            Fresh
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-[10px] text-[#8892b0]/70">Generated by Claude Sonnet 4.6 from real-time market, whale, and catalyst data</p>
                  </div>
                  {/* Confidence meter */}
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[#8892b0] whitespace-nowrap">Confidence: {thesis.confidence}/10</span>
                    <div className="w-32 h-2 bg-[#1a1e2e] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${thesis.confidence * 10}%`,
                          backgroundColor: thesis.confidence >= 7 ? "#22c55e" : thesis.confidence >= 5 ? "#f59e0b" : "#ef4444",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bull case — always visible */}
                <Card className="bg-[#222638] border-[#2a2f45]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="size-4 text-[#22c55e]" />
                      <span className="text-xs font-semibold text-[#22c55e] uppercase tracking-wide">Bull Case</span>
                    </div>
                    <p className="text-sm text-[#e2e8f0] leading-relaxed">{thesis.bull_case}</p>
                  </CardContent>
                </Card>

                {/* Bear case + catalysts + whale read + historical — blurred with Pro gate */}
                <div className="relative">
                  <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none" }} className="space-y-3">
                    <Card className="bg-[#222638] border-[#2a2f45]">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown className="size-4 text-[#ef4444]" />
                          <span className="text-xs font-semibold text-[#ef4444] uppercase tracking-wide">Bear Case</span>
                        </div>
                        <p className="text-sm text-[#e2e8f0] leading-relaxed">{thesis.bear_case}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-[#222638] border-[#2a2f45]">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="size-4 text-[#f59e0b]" />
                          <span className="text-xs font-semibold text-[#f59e0b] uppercase tracking-wide">Catalysts to Watch</span>
                        </div>
                        <p className="text-sm text-[#e2e8f0] leading-relaxed">{thesis.catalysts}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-[#222638] border-[#2a2f45]">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="size-4 text-[#8b5cf6]" />
                          <span className="text-xs font-semibold text-[#8b5cf6] uppercase tracking-wide">Whale Consensus</span>
                        </div>
                        <p className="text-sm text-[#e2e8f0] leading-relaxed">{thesis.whale_read}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-[#222638] border-[#2a2f45]">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="size-4 text-[#6366f1]" />
                          <span className="text-xs font-semibold text-[#6366f1] uppercase tracking-wide">Historical Context</span>
                        </div>
                        <p className="text-sm text-[#e2e8f0] leading-relaxed">{thesis.historical_context}</p>
                      </CardContent>
                    </Card>
                  </div>
                  {/* Pro gate overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-[#1a1e2e]/95 backdrop-blur-sm rounded-xl border border-[#2f374f] px-6 py-4 text-center shadow-xl">
                      <Brain className="size-6 text-[#57D7BA] mx-auto mb-2" />
                      <p className="text-sm font-semibold text-[#e2e8f0] mb-1">Full analysis is Pro-only</p>
                      <p className="text-[11px] text-[#8892b0] mb-3">Unlock bear case, catalysts, whale read &amp; historical context</p>
                      <Link href="/pricing" className="inline-block px-4 py-2 rounded-lg bg-[#57D7BA] text-[#0f1119] text-xs font-bold hover:bg-[#57D7BA]/90 transition-colors">
                        Unlock full analysis with Pro
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ─── OVERVIEW TAB ──────────────────────────────────────── */}
          <TabsContent value="overview" className="pt-5 space-y-4">
            {/* Whale position summary */}
            {(() => {
              const totalVal = marketWhales.reduce((s, w) => s + Number(w.current_value || 0), 0);
              const yesVal = marketWhales.filter(w => w.outcome?.toLowerCase().startsWith("y")).reduce((s, w) => s + Number(w.current_value || 0), 0);
              const noVal = totalVal - yesVal;
              const fmtUsd = (n: number) => n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : n >= 1000 ? `$${(n/1000).toFixed(1)}K` : `$${n.toFixed(0)}`;
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Whale Holders", val: dataLoading ? "—" : String(marketWhales.length), color: "#8b5cf6" },
                    { label: "Total Whale Capital", val: dataLoading ? "—" : fmtUsd(totalVal), color: "#57D7BA" },
                    { label: "YES Whale Capital", val: dataLoading ? "—" : fmtUsd(yesVal), color: "#22c55e" },
                    { label: "NO Whale Capital", val: dataLoading ? "—" : fmtUsd(noVal), color: "#ef4444" },
                  ].map((s) => (
                    <Card key={s.label} className="bg-[#222638] border-[#2a2f45]">
                      <CardContent className="p-4 text-center">
                        <div className="text-lg font-bold font-mono tabular-nums" style={{ color: s.color }}>{s.val}</div>
                        <div className="text-[9px] text-[#8892b0] uppercase tracking-wider mt-0.5">{s.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            })()}
            {/* Tagged news */}
            {marketNews.length > 0 && (
              <Card className="bg-[#222638] border-[#2a2f45]">
                <CardContent className="p-4 space-y-2">
                  <div className="text-[10px] text-[#8892b0] uppercase tracking-wider mb-3">Related News</div>
                  {marketNews.map((tag: any) => {
                    const art = tag.news_articles;
                    if (!art) return null;
                    return (
                      <a key={art.id} href={art.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-[#1a1e2e] border border-[#2f374f] hover:border-[#57D7BA]/30 transition-colors group">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors leading-snug line-clamp-2">{art.title}</div>
                          <div className="text-[10px] text-[#8892b0] mt-0.5">{art.source}</div>
                        </div>
                        <ExternalLink className="size-3.5 text-[#8892b0] shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    );
                  })}
                </CardContent>
              </Card>
            )}
            {!dataLoading && marketWhales.length === 0 && marketNews.length === 0 && (
              <div className="flex items-center justify-center py-12 text-[#8892b0] text-sm">
                No whale activity or news found for this market yet.
              </div>
            )}
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
                {chartMode === "area" ? (
                  <>
                    <div className="h-72 sm:h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
                  </>
                ) : candles.length > 0 ? (
                  <>
                    {/* Legend */}
                    <div className="flex items-center gap-4 mb-2 text-[10px] text-[#8892b0]">
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[#22c55e]" />Bullish candle</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-[#ef4444]" />Bearish candle</span>
                      {crossPlatformPrice !== null && (
                        <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-[#57D7BA]" />{crossPlatformLabel} price ({crossPlatformPrice}¢)</span>
                      )}
                    </div>
                    <CandlestickChartComponent
                      candles={candles}
                      overlayLine={
                        crossPlatformPrice !== null && candles.length > 0
                          ? [
                              { timestamp: candles[0].timestamp, value: crossPlatformPrice / 100 },
                              { timestamp: candles[candles.length - 1].timestamp, value: crossPlatformPrice / 100 },
                            ]
                          : undefined
                      }
                      overlayLabel={crossPlatformLabel}
                      height={384}
                    />
                  </>
                ) : (
                  /* Fallback: no candle data yet */
                  <div className="flex flex-col items-center justify-center h-72 sm:h-96 text-center space-y-3">
                    <div className="size-12 rounded-xl bg-[#57D7BA]/10 flex items-center justify-center">
                      <CandlestickChart className="size-6 text-[#57D7BA]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#e2e8f0]">
                        Historical price data not yet available
                      </p>
                      <p className="text-[11px] text-[#8892b0] mt-1 max-w-xs mx-auto leading-relaxed">
                        Charts populate hourly for active Kalshi markets. Switch to the area chart view to see the simulated price curve, or check back after the next data refresh.
                      </p>
                    </div>
                    <button
                      onClick={() => setChartMode("area")}
                      className="px-3 py-1.5 rounded-lg bg-[#57D7BA]/10 text-[#57D7BA] text-xs font-semibold hover:bg-[#57D7BA]/20 transition-colors"
                    >
                      Switch to area chart
                    </button>
                  </div>
                )}
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
                    Whale Positions in This Market
                  </CardTitle>
                  <span className="text-[10px] text-[#8892b0]">{marketWhales.length} positions</span>
                </div>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                {dataLoading ? (
                  <div className="py-8 text-center text-sm text-[#8892b0]">Loading…</div>
                ) : marketWhales.length === 0 ? (
                  <div className="py-8 text-center text-sm text-[#8892b0]">No whale positions found for this market.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2a2f45] hover:bg-transparent">
                        <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">WALLET</TableHead>
                        <TableHead className="text-[10px] text-[#8892b0] font-medium">OUTCOME</TableHead>
                        <TableHead className="text-[10px] text-[#8892b0] font-medium">VALUE</TableHead>
                        <TableHead className="text-[10px] text-[#8892b0] font-medium">P&L</TableHead>
                        <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4">UPDATED</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {marketWhales.map((w: any, i: number) => {
                        const val = Number(w.current_value || 0);
                        const pnl = Number(w.pnl || 0);
                        const fmtV = (n: number) => n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : n >= 1000 ? `$${(n/1000).toFixed(1)}K` : `$${n.toFixed(0)}`;
                        const isYes = w.outcome?.toLowerCase().startsWith("y");
                        const elapsed = w.updated_at ? Math.floor((Date.now() - new Date(w.updated_at).getTime()) / 1000) : 0;
                        const timeStr = elapsed < 3600 ? `${Math.floor(elapsed/60)}m ago` : elapsed < 86400 ? `${Math.floor(elapsed/3600)}h ago` : `${Math.floor(elapsed/86400)}d ago`;
                        const short = `${w.whale_id?.slice(0,6)}…${w.whale_id?.slice(-4)}`;
                        return (
                          <TableRow key={i} className="border-[#2a2f45]/50 hover:bg-[#57D7BA]/5 transition-colors">
                            <TableCell className="pl-4 py-2.5">
                              <Link href={`/whales/${w.whale_id}`} className="font-mono text-xs text-[#ccd6f6] hover:text-[#57D7BA] transition-colors">{short}</Link>
                            </TableCell>
                            <TableCell className="py-2.5">
                              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${isYes ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
                                {isYes ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                                {w.outcome}
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5"><span className="font-mono text-xs font-semibold">{fmtV(val)}</span></TableCell>
                            <TableCell className="py-2.5">
                              <span className={`font-mono text-xs font-semibold ${pnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                                {pnl >= 0 ? "+" : ""}{fmtV(pnl)}
                              </span>
                            </TableCell>
                            <TableCell className="pr-4 py-2.5"><span className="text-[10px] text-[#8892b0]">{timeStr}</span></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── CROSS-PLATFORM TAB ────────────────────────────────── */}
          <TabsContent value="cross" className="pt-5">
            <Card className="bg-[#222638] border-[#2a2f45]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="size-4 text-[#57D7BA]" />
                  Cross-Platform Comparison
                </CardTitle>
                <CardDescription className="text-xs text-[#8892b0]">
                  Price differences across Polymarket and Kalshi
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                {dataLoading ? (
                  <div className="py-8 text-center text-sm text-[#8892b0]">Loading…</div>
                ) : !marketDisagreement ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#8892b0]">
                    <Layers className="size-8 opacity-20" />
                    <p className="text-sm">This market is only on one platform — no cross-platform data available.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Spread header */}
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-[#f59e0b]" />
                      <span className="text-sm font-semibold text-[#e2e8f0]">{Math.round(marketDisagreement.spread)}pt spread</span>
                      {marketDisagreement.spread >= 10 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">ARBITRAGE</span>
                      )}
                      {marketDisagreement.opportunityScore > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#57D7BA]/10 text-[#57D7BA] border border-[#57D7BA]/20">
                          Score: {Math.round(marketDisagreement.spread * 1)}
                        </span>
                      )}
                    </div>
                    {/* Platform comparison */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Polymarket", price: Math.round(marketDisagreement.poly_price), color: "#6366f1" },
                        { label: "Kalshi", price: Math.round(marketDisagreement.kalshi_price), color: "#22c55e" },
                      ].map((p) => (
                        <div key={p.label} className="p-4 rounded-lg bg-[#1a1e2e] border border-[#2f374f] text-center">
                          <div className="text-[10px] text-[#8892b0] mb-1">{p.label}</div>
                          <div className="text-2xl font-mono font-bold tabular-nums" style={{ color: p.color }}>{p.price}¢</div>
                        </div>
                      ))}
                    </div>
                    {/* Direction + trend */}
                    <div className="flex items-center gap-3 text-xs text-[#8892b0]">
                      <span className={`font-semibold ${marketDisagreement.direction === "poly-higher" ? "text-[#6366f1]" : "text-[#22c55e]"}`}>
                        {marketDisagreement.direction === "poly-higher" ? "Poly prices higher" : "Kalshi prices higher"}
                      </span>
                      {marketDisagreement.spread_trend && marketDisagreement.spread_trend !== "stable" && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${marketDisagreement.spread_trend === "converging" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
                          {marketDisagreement.spread_trend === "converging" ? "Converging" : "Diverging"}
                        </span>
                      )}
                    </div>
                    {/* Sparkline */}
                    {spreadHistory.length >= 2 && (
                      <div className="pt-2 border-t border-[#2f374f]">
                        <div className="text-[10px] text-[#8892b0] mb-2 uppercase tracking-wide">48h Spread History</div>
                        <Sparkline data={spreadHistory} width={300} height={48} strokeColor="#f59e0b" />
                      </div>
                    )}
                  </div>
                )}
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
