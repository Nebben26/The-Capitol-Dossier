"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Star,
  Target,
  Users,
  Trash2,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Timer,
  Trophy,
  BadgeCheck,
  Wallet,
  Zap,
  TrendingUp,
  TrendingDown,
  Search,
} from "lucide-react";
import { useWatchlist } from "@/hooks/usePersistence";
import { useMarkets, useWhales } from "@/hooks/useData";
import { useAuth } from "@/components/layout/AuthContext";
import { LastUpdated } from "@/components/layout/LastUpdated";
import { supabase } from "@/lib/supabase";
import type { Market, Whale } from "@/lib/mockData";

interface WatchlistSignal {
  id: string;
  market_id: string;
  headline: string;
  type: string;
  detected_at: string;
}

function MarketWatchCard({ market, onRemove, signal }: { market: Market; onRemove: () => void; signal?: WatchlistSignal }) {
  const positive = market.change >= 0;
  return (
    <Card className="bg-[#222638] border-[#2f374f] hover:border-[#57D7BA]/30 hover:shadow-lg hover:shadow-[#57D7BA]/5 hover:scale-[1.02] transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#57D7BA]/10 text-[#57D7BA]">{market.category}</span>
          <span className="flex items-center gap-0.5 text-[8px] text-[#8892b0]"><Timer className="size-2.5" />{market.daysLeft}d</span>
          {market.trending && (
            <span className="px-1 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[8px] font-bold flex items-center gap-0.5"><Flame className="size-2" />HOT</span>
          )}
          <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-[#2a2f45] text-[#8892b0]">{market.platform}</span>
        </div>
        {signal && (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-[#57D7BA] bg-[#57D7BA]/10 mb-2 max-w-full truncate">
            <Zap className="size-2.5 shrink-0" />
            <span className="truncate">{signal.headline.slice(0, 42)}{signal.headline.length > 42 ? "…" : ""}</span>
          </div>
        )}
        <Link href={`/markets/${market.id}`} className="group block">
          <p className="text-xs font-semibold text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors leading-snug line-clamp-2 mb-3">
            {market.question}
          </p>
        </Link>
        {/* Sparkline */}
        <div className="h-10 w-full mb-2">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={market.spark}>
              <defs>
                <linearGradient id={`wl-${market.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={positive ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={positive ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={positive ? "#22c55e" : "#ef4444"} strokeWidth={1.5} fill={`url(#wl-${market.id})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* YES/NO bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[9px] font-mono font-semibold mb-1">
            <span className="text-[#22c55e] tabular-nums">YES {market.price}¢</span>
            <span className="text-[#ef4444] tabular-nums">NO {100 - market.price}¢</span>
          </div>
          <div className="h-2 rounded-full bg-[#1a1e2e] overflow-hidden flex">
            <div className="h-full bg-[#22c55e] rounded-l-full" style={{ width: `${market.price}%` }} />
            <div className="h-full bg-[#ef4444] rounded-r-full" style={{ width: `${100 - market.price}%` }} />
          </div>
        </div>
        {/* Stats + actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-0.5 font-mono text-xs font-semibold tabular-nums ${positive ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
              {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {Math.abs(market.change)}%
            </span>
            <span className="font-mono text-[10px] text-[#8892b0] tabular-nums">{market.volume}</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href={`/markets/${market.id}`}>
              <Button variant="ghost" size="icon-xs" className="text-[#8892b0] hover:text-[#57D7BA]"><Eye className="size-3" /></Button>
            </Link>
            <Button variant="ghost" size="icon-xs" onClick={onRemove} className="text-[#8892b0] hover:text-[#ef4444]"><Trash2 className="size-3" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WhaleWatchCard({ whale, onRemove }: { whale: Whale; onRemove: () => void }) {
  const positive = whale.totalPnlNum >= 0;
  return (
    <Card className="bg-[#222638] border-[#2f374f] hover:border-[#57D7BA]/30 hover:shadow-lg hover:shadow-[#57D7BA]/5 hover:scale-[1.02] transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="size-10 rounded-xl bg-gradient-to-br from-[#57D7BA] to-[#8b5cf6] flex items-center justify-center shrink-0 relative">
            <span className="text-xs font-bold text-[#0f1119]">#{whale.rank}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link href={`/whales/${whale.id}`} className="text-sm font-semibold text-[#e2e8f0] hover:text-[#57D7BA] transition-colors truncate">{whale.name}</Link>
              {whale.verified && <BadgeCheck className="size-3.5 text-[#57D7BA] shrink-0" />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {whale.smart && <span className="px-1 py-0.5 rounded bg-[#57D7BA]/10 text-[#57D7BA] text-[7px] font-bold">SMART MONEY</span>}
              {whale.streak >= 5 && <span className="px-1 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[7px] font-bold flex items-center gap-0.5"><Flame className="size-2" />{whale.streak}W</span>}
            </div>
          </div>
        </div>
        {/* Sparkline */}
        <div className="h-10 w-full mb-3">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={whale.spark}>
              <defs>
                <linearGradient id={`wlw-${whale.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={positive ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={positive ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={positive ? "#22c55e" : "#ef4444"} strokeWidth={1.5} fill={`url(#wlw-${whale.id})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div>
            <div className={`text-xs font-bold font-mono tabular-nums ${positive ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{whale.totalPnl}</div>
            <div className="text-[8px] text-[#8892b0]">P&L</div>
          </div>
          <div>
            <div className="text-xs font-bold font-mono tabular-nums text-[#e2e8f0]">{whale.accuracy}%</div>
            <div className="text-[8px] text-[#8892b0]">Accuracy</div>
          </div>
          <div>
            <div className="text-xs font-bold font-mono tabular-nums text-[#e2e8f0]">{whale.winRate}%</div>
            <div className="text-[8px] text-[#8892b0]">Win Rate</div>
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2f374f]">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold" style={{ backgroundColor: `${whale.bestCatColor}15`, color: whale.bestCatColor }}>
            <Trophy className="size-2.5" />{whale.bestCategory}
          </span>
          <div className="flex items-center gap-1">
            <Link href={`/whales/${whale.id}`}>
              <Button variant="ghost" size="icon-xs" className="text-[#8892b0] hover:text-[#57D7BA]"><Eye className="size-3" /></Button>
            </Link>
            <Button variant="ghost" size="icon-xs" onClick={onRemove} className="text-[#8892b0] hover:text-[#ef4444]"><Trash2 className="size-3" /></Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WatchlistPage() {
  const { items, loaded, toggleWatch } = useWatchlist();
  const { user, setShowLogin } = useAuth();
  const { markets, lastFetched, refreshing } = useMarkets();
  const { whales } = useWhales();
  const [signals, setSignals] = useState<WatchlistSignal[]>([]);

  const watchedMarkets = useMemo(() => {
    const marketIds = items.filter((i) => i.type === "market").map((i) => i.itemId);
    return markets.filter((m) => marketIds.includes(m.id));
  }, [items, markets]);

  const watchedWhales = useMemo(() => {
    const whaleIds = items.filter((i) => i.type === "whale").map((i) => i.itemId);
    return whales.filter((w) => whaleIds.includes(w.id));
  }, [items, whales]);

  const totalItems = watchedMarkets.length + watchedWhales.length;

  // Load signals for watched markets from last 24h
  useEffect(() => {
    const marketIds = watchedMarkets.map((m) => m.id);
    if (marketIds.length === 0) return;
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    supabase
      .from("signals")
      .select("id, market_id, headline, type, detected_at")
      .in("market_id", marketIds)
      .gte("detected_at", since)
      .order("detected_at", { ascending: false })
      .limit(50)
      .then(({ data }) => { if (data) setSignals(data as WatchlistSignal[]); });
  }, [watchedMarkets]);

  // Mini-brief: biggest mover from watched markets
  const biggestMover = useMemo(() => {
    if (watchedMarkets.length === 0) return null;
    return [...watchedMarkets].sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];
  }, [watchedMarkets]);

  // Latest signal per market for inline display
  const signalByMarket = useMemo(() => {
    const map = new Map<string, WatchlistSignal>();
    for (const s of signals) {
      if (!map.has(s.market_id)) map.set(s.market_id, s);
    }
    return map;
  }, [signals]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Star className="size-7 text-[#f59e0b]" />
            Your Watchlist
          </h1>
          <p className="text-sm text-[#8892b0] mt-1">
            {totalItems > 0 ? `${totalItems} item${totalItems !== 1 ? "s" : ""} tracked — live prices update automatically` : "Save markets and whales to track them here"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated lastFetched={lastFetched} refreshing={refreshing} />
          {totalItems > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] font-bold tabular-nums">
              <Star className="size-3 fill-[#f59e0b]" />{totalItems} watching
            </span>
          )}
        </div>
      </div>

      {/* Not signed in prompt */}
      {!user && loaded && (
        <Card className="bg-[#222638] border-[#6366f1]/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Wallet className="size-5 text-[#6366f1] shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#e2e8f0]">Sign in to sync your watchlist</p>
              <p className="text-[10px] text-[#8892b0]">Your watchlist is saved locally. Sign in to sync across devices.</p>
            </div>
            <Button onClick={() => setShowLogin(true)} size="sm" className="bg-[#6366f1] text-white hover:bg-[#6366f1]/80 shrink-0">Sign In</Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      {totalItems > 0 ? (
        <>
          {/* Mini-brief strip */}
          {(biggestMover || signals.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl bg-[#222638] border border-[#2f374f] text-xs text-[#8892b0]">
              <span className="font-semibold text-[#e2e8f0] text-[11px]">Since yesterday:</span>
              {biggestMover && (
                <Link href={`/markets/${biggestMover.id}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1a1e2e] border border-[#2f374f] hover:border-[#57D7BA]/30 transition-colors text-[10px]">
                  {biggestMover.change >= 0
                    ? <TrendingUp className="size-3 text-[#22c55e]" />
                    : <TrendingDown className="size-3 text-[#ef4444]" />}
                  <span className="truncate max-w-[140px]">{biggestMover.question.slice(0, 30)}…</span>
                  <span className={`font-mono font-semibold tabular-nums ${biggestMover.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {biggestMover.change >= 0 ? "+" : ""}{biggestMover.change}%
                  </span>
                </Link>
              )}
              {signals.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#57D7BA]/10 text-[#57D7BA] border border-[#57D7BA]/20 text-[10px] font-semibold">
                  <Zap className="size-3" />
                  {signals.length} new signal{signals.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}

        <Tabs defaultValue="markets">
          <div className="border-b border-[#2f374f] -mx-4 px-4">
            <TabsList variant="line" className="bg-transparent gap-0">
              <TabsTrigger value="markets" className="px-4 py-2.5 text-xs gap-1.5 data-active:text-[#57D7BA] text-[#8892b0] hover:text-[#e2e8f0]">
                <Target className="size-3.5" />
                Markets ({watchedMarkets.length})
              </TabsTrigger>
              <TabsTrigger value="whales" className="px-4 py-2.5 text-xs gap-1.5 data-active:text-[#57D7BA] text-[#8892b0] hover:text-[#e2e8f0]">
                <Users className="size-3.5" />
                Whales ({watchedWhales.length})
              </TabsTrigger>
              <TabsTrigger value="signals" className="px-4 py-2.5 text-xs gap-1.5 data-active:text-[#57D7BA] text-[#8892b0] hover:text-[#e2e8f0]">
                <Zap className="size-3.5" />
                Signals {signals.length > 0 && <span className="ml-0.5 px-1 rounded-full bg-[#57D7BA]/20 text-[#57D7BA] text-[9px] font-bold tabular-nums">{signals.length}</span>}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="markets" className="pt-5">
            {watchedMarkets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {watchedMarkets.map((m) => (
                  <MarketWatchCard key={m.id} market={m} onRemove={() => toggleWatch("market", m.id, m.question)} signal={signalByMarket.get(m.id)} />
                ))}
              </div>
            ) : (
              <Card className="bg-[#222638] border-[#2f374f]">
                <CardContent className="py-12 text-center">
                  <Target className="size-10 text-[#2f374f] mx-auto mb-3" />
                  <h3 className="text-base font-semibold mb-1">No markets watched yet</h3>
                  <p className="text-xs text-[#8892b0] mb-4">Click the star icon on any market to add it here.</p>
                  <Link href="/markets"><Button size="sm" className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80">Browse Markets</Button></Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="whales" className="pt-5">
            {watchedWhales.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {watchedWhales.map((w) => (
                  <WhaleWatchCard key={w.id} whale={w} onRemove={() => toggleWatch("whale", w.id, w.name)} />
                ))}
              </div>
            ) : (
              <Card className="bg-[#222638] border-[#2f374f]">
                <CardContent className="py-12 text-center">
                  <Users className="size-10 text-[#2f374f] mx-auto mb-3" />
                  <h3 className="text-base font-semibold mb-1">No whales watched yet</h3>
                  <p className="text-xs text-[#8892b0] mb-4">Click the star icon on any whale profile to track them here.</p>
                  <Link href="/whales"><Button size="sm" className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80">Browse Whales</Button></Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="signals" className="pt-5">
            {signals.length > 0 ? (
              <div className="space-y-2">
                {signals.map((s) => {
                  const market = watchedMarkets.find((m) => m.id === s.market_id);
                  const ageMs = Date.now() - new Date(s.detected_at).getTime();
                  const ageStr = ageMs < 3600000 ? `${Math.floor(ageMs / 60000)}m ago` : `${Math.floor(ageMs / 3600000)}h ago`;
                  return (
                    <Card key={s.id} className="bg-[#222638] border-[#2f374f] hover:border-[#57D7BA]/30 transition-all">
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className="size-7 rounded-full bg-[#57D7BA]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Zap className="size-3.5 text-[#57D7BA]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#e2e8f0] leading-snug">{s.headline}</p>
                          {market && (
                            <Link href={`/markets/${market.id}`} className="text-[10px] text-[#57D7BA] hover:underline truncate block mt-0.5">
                              {market.question.slice(0, 60)}{market.question.length > 60 ? "…" : ""}
                            </Link>
                          )}
                        </div>
                        <span className="text-[10px] text-[#8892b0] shrink-0 tabular-nums font-mono">{ageStr}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-[#222638] border-[#2f374f]">
                <CardContent className="py-12 text-center">
                  <Zap className="size-10 text-[#2f374f] mx-auto mb-3" />
                  <h3 className="text-base font-semibold mb-1">No signals in the last 24h</h3>
                  <p className="text-xs text-[#8892b0]">Signals appear when whale activity or price anomalies are detected on your watched markets.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        </>
      ) : (
        /* Full empty state */
        <Card className="bg-[#222638] border-[#2f374f]">
          <CardContent className="py-16 text-center space-y-5">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#f59e0b]/20 to-[#57D7BA]/20 animate-pulse" />
              <div className="relative flex items-center justify-center h-full">
                <Star className="size-10 text-[#f59e0b]" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Build your personal feed</h2>
              <p className="text-sm text-[#8892b0] max-w-md mx-auto leading-relaxed">
                Add markets from the screener to start building your personal feed — track price movements, follow whale signals, and get notified when spreads appear.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/screener">
                <Button className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 gap-1.5 h-10 px-5">
                  <Search className="size-4" /> Open Screener
                </Button>
              </Link>
              <Link href="/whales">
                <Button variant="outline" className="border-[#2f374f] text-[#8892b0] hover:text-[#57D7BA] hover:border-[#57D7BA]/30 gap-1.5 h-10 px-5">
                  <Users className="size-4" /> Browse Whales
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 text-[10px] text-[#8892b0] pt-2">
              <span className="flex items-center gap-1"><Star className="size-3 text-[#f59e0b]" />Click the star on any page</span>
              <span className="flex items-center gap-1"><Zap className="size-3 text-[#57D7BA]" />Get signal alerts</span>
              <span className="flex items-center gap-1"><Wallet className="size-3" />Syncs across devices</span>
            </div>
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
