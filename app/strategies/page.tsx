"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
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
  Search,
  BarChart3,
  Users,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock,
  Play,
  Copy,
  Brain,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Flame,
  ChevronDown,
  Star,
  Lock,
  FlaskConical,
  Gauge,
  LineChart as LineChartIcon,
} from "lucide-react";

import { useStrategies, useBacktestData, STRAT_CATEGORIES } from "@/hooks/useData";
import type { Strategy } from "@/lib/mockData";
import { LastUpdated } from "@/components/layout/LastUpdated";

// ─── MINI SPARKLINE ───────────────────────────────────────────────────
function StratSparkline({ data, color }: { data: { d: number; v: number }[]; color: string }) {
  const gradId = `strat-${color.replace("#", "")}`;
  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────
export default function StrategiesPage() {
  const { strategies } = useStrategies();
  const { backtestEquity, backtestTrades } = useBacktestData();
  const [searchQuery, setSearchQuery] = useState("");
  const [stratCategory, setStratCategory] = useState("All");
  const [backtestRun, setBacktestRun] = useState(false);
  const [backtestLoading, setBacktestLoading] = useState(false);

  // Backtest form state
  const [btRule, setBtRule] = useState("whale-follow");
  const [btAccuracy, setBtAccuracy] = useState("70");
  const [btMinVol, setBtMinVol] = useState("500000");
  const [btTimeframe, setBtTimeframe] = useState("30d");
  const [btTakeProfit, setBtTakeProfit] = useState("15");
  const [btStopLoss, setBtStopLoss] = useState("10");

  const filteredStrats = useMemo(() => {
    let result = strategies;
    if (stratCategory !== "All") result = result.filter((s) => s.category === stratCategory || s.category === "All");
    if (searchQuery) result = result.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [stratCategory, searchQuery]);

  const runBacktest = () => {
    setBacktestLoading(true);
    setTimeout(() => {
      setBacktestLoading(false);
      setBacktestRun(true);
    }, 1500);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
            {/* Title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                  <Zap className="size-7 text-[#f59e0b]" />
                  Strategies That Actually Work
                </h1>
                <p className="text-sm text-[#8892b0] mt-1">Curated alpha strategies + build and backtest your own</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] font-bold">
                  <Sparkles className="size-3" />Premium
                </span>
                <LastUpdated />
              </div>
            </div>

            {/* ─── TABS ──────────────────────────────────────────── */}
            <Tabs defaultValue="curated">
              <div className="border-b border-[#2a2f45] -mx-4 px-4 overflow-x-auto scrollbar-none">
                <TabsList variant="line" className="bg-transparent gap-0">
                  <TabsTrigger value="curated" className="px-4 py-2.5 text-xs gap-1.5 data-active:text-[#57D7BA] text-[#8892b0] hover:text-[#e2e8f0]">
                    <Star className="size-3.5" />Curated Strategies
                  </TabsTrigger>
                  <TabsTrigger value="backtest" className="px-4 py-2.5 text-xs gap-1.5 data-active:text-[#57D7BA] text-[#8892b0] hover:text-[#e2e8f0]">
                    <FlaskConical className="size-3.5" />Backtester
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ═══ CURATED STRATEGIES TAB ═══════════════════════════ */}
              <TabsContent value="curated" className="pt-5 space-y-5">
                {/* Filter pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {STRAT_CATEGORIES.map((cat) => (
                    <button key={cat} onClick={() => setStratCategory(cat)}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full text-[10px] font-medium transition-all ${stratCategory === cat ? "bg-[#57D7BA] text-[#0f1119] shadow-lg shadow-[#57D7BA]/20" : "bg-[#222638] text-[#8892b0] hover:text-[#e2e8f0] border border-[#2a2f45] hover:border-[#57D7BA]/30"}`}>
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Avg CAGR", val: "103%", icon: TrendingUp, color: "#22c55e" },
                    { label: "Best Sharpe", val: "3.2", icon: Gauge, color: "#57D7BA" },
                    { label: "Avg Win Rate", val: "66%", icon: Target, color: "#f59e0b" },
                    { label: "Total Followers", val: "17.4K", icon: Users, color: "#6366f1" },
                  ].map((s) => (
                    <Card key={s.label} className="bg-[#222638] border-[#2a2f45]">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="size-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}15` }}>
                          <s.icon className="size-4" style={{ color: s.color }} />
                        </div>
                        <div>
                          <div className="text-sm font-bold font-mono">{s.val}</div>
                          <div className="text-[10px] text-[#8892b0]">{s.label}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Strategy grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredStrats.map((s) => (
                    <Card key={s.id} className="bg-[#222638] border-[#2a2f45] group hover:border-[#57D7BA]/20 transition-all relative overflow-hidden">
                      {s.premium && (
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[8px] font-bold">
                          <Lock className="size-2.5" />PRO
                        </div>
                      )}
                      <CardHeader className="pb-1">
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}15` }}>
                            <Zap className="size-4" style={{ color: s.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm truncate">{s.name}</CardTitle>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Link href={`/whales/${s.authorId}`} className="text-[9px] text-[#8892b0] hover:text-[#57D7BA] transition-colors">
                                by {s.author}
                              </Link>
                              <span className="text-[9px] text-[#8892b0]">·</span>
                              <span className="text-[9px] text-[#8892b0]">{s.followers.toLocaleString()} followers</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4 space-y-3">
                        <p className="text-[11px] text-[#8892b0] leading-relaxed line-clamp-2">{s.desc}</p>

                        {/* Sparkline */}
                        <StratSparkline data={s.spark} color={s.color} />

                        {/* Stats grid */}
                        <div className="grid grid-cols-4 gap-2">
                          <div className="text-center">
                            <div className="text-xs font-bold font-mono text-[#22c55e]">{s.cagr}%</div>
                            <div className="text-[8px] text-[#8892b0] uppercase tracking-wider">CAGR</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-bold font-mono" style={{ color: s.color }}>{s.sharpe.toFixed(1)}</div>
                            <div className="text-[8px] text-[#8892b0] uppercase tracking-wider">Sharpe</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-bold font-mono text-[#e2e8f0]">{s.winRate}%</div>
                            <div className="text-[8px] text-[#8892b0] uppercase tracking-wider">Win</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-bold font-mono text-[#ef4444]">{s.maxDD}%</div>
                            <div className="text-[8px] text-[#8892b0] uppercase tracking-wider">Max DD</div>
                          </div>
                        </div>

                        {/* Footer row */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#2a2f45]">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#2a2f45] text-[#8892b0]">{s.timeframe}</span>
                            <span className="text-[9px] text-[#8892b0]">{s.trades} trades</span>
                          </div>
                          <Button
                            size="xs"
                            className={s.premium ? "bg-[#f59e0b] text-[#0f1119] hover:bg-[#f59e0b]/80" : "bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80"}
                          >
                            <Copy className="size-3" />
                            {s.premium ? "Unlock" : "Copy"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* ═══ BACKTESTER TAB ═══════════════════════════════════ */}
              <TabsContent value="backtest" className="pt-5 space-y-5">
                {/* Builder form */}
                <Card className="bg-[#222638] border-[#2a2f45]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FlaskConical className="size-4 text-[#57D7BA]" />
                      Strategy Rules Builder
                    </CardTitle>
                    <CardDescription className="text-xs text-[#8892b0]">
                      Configure your strategy rules and run a historical backtest
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Rule type */}
                      <div>
                        <label className="block text-[10px] text-[#8892b0] uppercase tracking-wider mb-1.5">Strategy Type</label>
                        <div className="relative">
                          <select value={btRule} onChange={(e) => setBtRule(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg bg-[#1a1e2e] border border-[#2a2f45] text-sm text-[#e2e8f0] appearance-none focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 focus:border-[#57D7BA]/50 transition-all">
                            <option value="whale-follow">Follow Whale Positions</option>
                            <option value="dip-buy">Buy the Dip</option>
                            <option value="momentum">Momentum / Trend</option>
                            <option value="arbitrage">Cross-Platform Arbitrage</option>
                            <option value="mean-revert">Mean Reversion</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8892b0] pointer-events-none" />
                        </div>
                      </div>

                      {/* Accuracy threshold */}
                      <div>
                        <label className="block text-[10px] text-[#8892b0] uppercase tracking-wider mb-1.5">Min Whale Accuracy</label>
                        <div className="relative">
                          <input type="number" value={btAccuracy} onChange={(e) => setBtAccuracy(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg bg-[#1a1e2e] border border-[#2a2f45] text-sm text-[#e2e8f0] font-mono focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 focus:border-[#57D7BA]/50 transition-all" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8892b0]">%</span>
                        </div>
                      </div>

                      {/* Min volume */}
                      <div>
                        <label className="block text-[10px] text-[#8892b0] uppercase tracking-wider mb-1.5">Min Market Volume</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8892b0]">$</span>
                          <input type="text" value={btMinVol} onChange={(e) => setBtMinVol(e.target.value)}
                            className="w-full h-9 pl-6 pr-3 rounded-lg bg-[#1a1e2e] border border-[#2a2f45] text-sm text-[#e2e8f0] font-mono focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 focus:border-[#57D7BA]/50 transition-all" />
                        </div>
                      </div>

                      {/* Timeframe */}
                      <div>
                        <label className="block text-[10px] text-[#8892b0] uppercase tracking-wider mb-1.5">Backtest Period</label>
                        <div className="relative">
                          <select value={btTimeframe} onChange={(e) => setBtTimeframe(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg bg-[#1a1e2e] border border-[#2a2f45] text-sm text-[#e2e8f0] appearance-none focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 focus:border-[#57D7BA]/50 transition-all">
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="180d">Last 6 Months</option>
                            <option value="365d">Last 12 Months</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8892b0] pointer-events-none" />
                        </div>
                      </div>

                      {/* Take profit */}
                      <div>
                        <label className="block text-[10px] text-[#8892b0] uppercase tracking-wider mb-1.5">Take Profit</label>
                        <div className="relative">
                          <input type="number" value={btTakeProfit} onChange={(e) => setBtTakeProfit(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg bg-[#1a1e2e] border border-[#2a2f45] text-sm text-[#e2e8f0] font-mono focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 focus:border-[#57D7BA]/50 transition-all" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8892b0]">%</span>
                        </div>
                      </div>

                      {/* Stop loss */}
                      <div>
                        <label className="block text-[10px] text-[#8892b0] uppercase tracking-wider mb-1.5">Stop Loss</label>
                        <div className="relative">
                          <input type="number" value={btStopLoss} onChange={(e) => setBtStopLoss(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg bg-[#1a1e2e] border border-[#2a2f45] text-sm text-[#e2e8f0] font-mono focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 focus:border-[#57D7BA]/50 transition-all" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8892b0]">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                      <Button onClick={runBacktest} disabled={backtestLoading}
                        className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 h-10 px-6 font-semibold">
                        {backtestLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="size-4 border-2 border-[#0f1119] border-t-transparent rounded-full animate-spin" />
                            Running...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2"><Play className="size-4" />Run Backtest</span>
                        )}
                      </Button>
                      <span className="text-[10px] text-[#8892b0]">
                        Uses historical data from all tracked platforms
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* ─── BACKTEST RESULTS (coming soon) ──────────────────── */}
                {backtestRun && (
                  <Card className="bg-[#222638] border-[#2a2f45]">
                    <CardContent className="py-16 text-center">
                      <TrendingUp className="size-12 text-[#2a2f45] mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Backtest not yet available</h3>
                      <p className="text-sm text-[#8892b0] max-w-md mx-auto">
                        We&apos;re building the backtesting engine to run against 36,000+ real historical price points. Coming soon.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Empty state before running */}
                {!backtestRun && !backtestLoading && (
                  <Card className="bg-[#222638] border-[#2a2f45]">
                    <CardContent className="py-16 text-center">
                      <FlaskConical className="size-12 text-[#2a2f45] mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Configure & Run Your Backtest</h3>
                      <p className="text-sm text-[#8892b0] max-w-md mx-auto">
                        Set your strategy parameters above, then hit &quot;Run Backtest&quot; to see how it would have performed on historical prediction market data.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Footer */}
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
