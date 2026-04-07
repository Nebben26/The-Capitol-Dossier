"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Market, Whale, Strategy } from "@/lib/mockData";
import type { DataSource } from "@/lib/api";
import {
  markets as mockMarkets,
  marketById as mockMarketById,
  whales as mockWhales,
  whaleById as mockWhaleById,
  strategies as mockStrategies,
  initialWhaleAlerts,
  incomingAlerts,
  priceMovers as mockPriceMovers,
  resolutionNearing as mockResolution,
  whaleFlows,
  crossPlatformPrices,
  orderbookBids,
  orderbookAsks,
  resolutionHistory,
  currentPositions,
  historicalTrades,
  categoryPerformance,
  calibrationData,
  biggestWins,
  biggestLosses,
  pnlHistory,
  backtestEquity,
  backtestTrades,
  treemapData,
  breakingMarkets,
  homepageWhaleActivity,
  sparkGen,
  STRAT_CATEGORIES,
  disagreements as mockDisagreements,
  insights as mockInsights,
} from "@/lib/mockData";
import type { Disagreement, Insight } from "@/lib/mockData";

// ─── AUTO-REFRESH HOOK ────────────────────────────────────────────────
function useAutoRefresh(
  fetchFn: () => Promise<void>,
  intervalMs = 45000
) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date>(new Date());
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  const doFetch = useCallback(async () => {
    if (!mountedRef.current) return;
    setRefreshing(true);
    setError(false);
    try {
      await fetchFn();
      if (mountedRef.current) setLastFetched(new Date());
    } catch {
      if (mountedRef.current) setError(true);
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    mountedRef.current = true;
    doFetch();
    const interval = setInterval(doFetch, intervalMs);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [doFetch, intervalMs]);

  return { refreshing, lastFetched, error, retry: doFetch };
}

// ─── MARKETS HOOK (with auto-refresh) ─────────────────────────────────
export function useMarkets(autoRefreshMs = 45000) {
  const [markets, setMarkets] = useState<Market[]>(mockMarkets);
  const [source, setSource] = useState<DataSource>("mock");
  const [loading, setLoading] = useState(true);

  const fetchMarkets = useCallback(async () => {
    const { getAllMarkets } = await import("@/lib/api");
    const result = await getAllMarkets();
    setMarkets(result.data);
    setSource(result.source);
    setLoading(false);
  }, []);

  const { refreshing, lastFetched, error, retry } = useAutoRefresh(fetchMarkets, autoRefreshMs);

  return { markets, source, loading, refreshing, lastFetched, error, retry };
}

// ─── SINGLE MARKET HOOK ───────────────────────────────────────────────
export function useMarket(id: string) {
  const [market, setMarket] = useState<Market | undefined>(mockMarketById[id]);
  const [source, setSource] = useState<DataSource>("mock");

  const fetchMarket = useCallback(async () => {
    const { getMarketDetail } = await import("@/lib/api");
    const result = await getMarketDetail(id);
    if (result.data) {
      setMarket(result.data);
      setSource(result.source);
    }
  }, [id]);

  const { refreshing, lastFetched, error, retry } = useAutoRefresh(fetchMarket, 45000);

  return { market, source, refreshing, lastFetched, error, retry };
}

// ─── MARKET DETAIL HOOK ───────────────────────────────────────────────
export function useMarketDetail(id: string) {
  const { market, source, refreshing, lastFetched, error, retry } = useMarket(id);
  const { whales: liveWhales } = useWhales();

  // Derive whale flows from real whale data when available
  const liveWhaleFlows = liveWhales.length > 15
    ? liveWhales.slice(0, 8).map((w, i) => ({
        id: `wf-${w.id}-${i}`,
        wallet: w.name,
        walletId: w.id,
        rank: w.rank,
        side: (i % 3 === 0 ? "NO" : "YES") as "YES" | "NO",
        size: w.positionsValue || "$0",
        price: `${market?.price || 50}¢`,
        acc: w.accuracy,
        pnl: w.totalPnl,
        time: i === 0 ? "3m ago" : i < 3 ? `${i * 15}m ago` : `${i}h ago`,
      }))
    : whaleFlows;

  return {
    market,
    whaleFlows: liveWhaleFlows,
    crossPlatformPrices,
    orderbookBids,
    orderbookAsks,
    resolutionHistory,
    source,
    refreshing,
    lastFetched,
    error,
    retry,
  };
}

// ─── ALERTS HOOK (with auto-refresh) ──────────────────────────────────
export function useAlertData(autoRefreshMs = 45000) {
  const [whaleAlerts, setWhaleAlerts] = useState(initialWhaleAlerts);
  const [priceMovers, setPriceMovers] = useState(mockPriceMovers);
  const [resolution, setResolution] = useState(mockResolution);
  const [source, setSource] = useState<DataSource>("mock");

  const fetchAlerts = useCallback(async () => {
    const api = await import("@/lib/api");
    const [waRes, pmRes, rnRes] = await Promise.all([
      api.getWhaleActivity(),
      api.getPriceMovers(),
      api.getResolutionNearing(),
    ]);
    setWhaleAlerts(waRes.data);
    setPriceMovers(pmRes.data);
    setResolution(rnRes.data);
    if (waRes.source === "live" || pmRes.source === "live" || rnRes.source === "live") setSource("live");
  }, []);

  const { refreshing, lastFetched, error, retry } = useAutoRefresh(fetchAlerts, autoRefreshMs);

  return {
    initialWhaleAlerts: whaleAlerts,
    incomingAlerts,
    priceMovers,
    resolutionNearing: resolution,
    source,
    refreshing,
    lastFetched,
    error,
    retry,
  };
}

// ─── WHALES HOOKS (with auto-refresh) ─────────────────────────────────
export function useWhales(autoRefreshMs = 60000) {
  const [whales, setWhales] = useState(mockWhales);
  const [source, setSource] = useState<DataSource>("mock");

  const fetchWhales = useCallback(async () => {
    const { getAllWhales } = await import("@/lib/api");
    const result = await getAllWhales();
    setWhales(result.data);
    setSource(result.source);
  }, []);

  const { refreshing, lastFetched, error, retry } = useAutoRefresh(fetchWhales, autoRefreshMs);
  return { whales, source, refreshing, lastFetched, error, retry };
}

export function useWhale(id: string) {
  const { whales, source, refreshing, lastFetched } = useWhales();
  const [enrichedWhale, setEnrichedWhale] = useState<Whale | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getWhaleById } = await import("@/lib/api");
        const result = await getWhaleById(id);
        if (!cancelled && result.data) setEnrichedWhale(result.data);
      } catch { /* fallback handled below */ }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const whale = enrichedWhale ?? whales.find((w) => w.id === id) ?? mockWhaleById[id];
  return { whale, source, refreshing, lastFetched };
}

export function useWhaleProfile(id: string) {
  const { whale, source, refreshing, lastFetched } = useWhale(id);
  const [onChainPositions, setOnChainPositions] = useState(currentPositions);
  const [posSource, setPosSource] = useState<DataSource>("mock");

  const fetchPositions = useCallback(async () => {
    const { getOnChainPositions } = await import("@/lib/api");
    const result = await getOnChainPositions(id);
    setOnChainPositions(result.data);
    setPosSource(result.source);
  }, [id]);

  const { refreshing: posRefreshing, lastFetched: posLastFetched } = useAutoRefresh(fetchPositions, 45000);

  return {
    whale,
    pnlHistory,
    currentPositions: onChainPositions,
    historicalTrades,
    categoryPerformance,
    calibrationData,
    biggestWins,
    biggestLosses,
    source: posSource === "live" ? "live" as DataSource : source,
    refreshing: refreshing || posRefreshing,
    lastFetched: posLastFetched > lastFetched ? posLastFetched : lastFetched,
  };
}

// ─── SMART MONEY MOVES HOOK ───────────────────────────────────────────
export function useSmartMoneyMoves(autoRefreshMs = 45000) {
  const [moves, setMoves] = useState<{
    wallet: string; walletId: string; rank: number; accuracy: number;
    market: string; marketId: string; side: "YES" | "NO";
    size: string; accImpact: string; time: string;
  }[]>([]);
  const [source, setSource] = useState<DataSource>("mock");

  const fetchMoves = useCallback(async () => {
    const { getSmartMoneyMoves } = await import("@/lib/api");
    const result = await getSmartMoneyMoves();
    setMoves(result.data);
    setSource(result.source);
  }, []);

  const { refreshing, lastFetched } = useAutoRefresh(fetchMoves, autoRefreshMs);
  return { moves, source, refreshing, lastFetched };
}

// ─── LEADERBOARD HOOK (with auto-refresh) ─────────────────────────────
export function useLeaderboard(autoRefreshMs = 60000) {
  const { whales, source, refreshing, lastFetched, error, retry } = useWhales(autoRefreshMs);
  return { whales, source, refreshing, lastFetched, error, retry };
}

// ─── STRATEGIES HOOK ──────────────────────────────────────────────────
export function useStrategies() {
  return { strategies: mockStrategies, source: "mock" as DataSource, refreshing: false, lastFetched: new Date() };
}

export function useBacktestData() {
  return { backtestEquity, backtestTrades };
}

// ─── HOMEPAGE HOOK (with auto-refresh) ────────────────────────────────
export function useHomepageData(autoRefreshMs = 45000) {
  const { markets, source, refreshing, lastFetched, error, retry } = useMarkets(autoRefreshMs);
  const { whales: liveWhaleList } = useWhales();

  const biggestMovers = [...markets]
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

  // Build treemap from real market data — filter blanks, dedup by name
  // Build treemap — show biggest MOVERS (by abs change), sized by volume
  const liveTreemap = (() => {
    if (markets.length <= 24) return treemapData;
    const seen = new Set<string>();
    return [...markets]
      .filter((m) => m.question && m.question.trim().length > 3 && m.volNum > 1000 && Math.abs(m.change) >= 1)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 40)
      .reduce<{ name: string; size: number; change: number }[]>((acc, m) => {
        const name = m.question.length > 30 ? m.question.slice(0, 28) + "…" : m.question;
        const size = Math.max(100, Math.round(m.volNum / 1000));
        if (seen.has(name) || acc.length >= 20) return acc;
        seen.add(name);
        acc.push({ name, size, change: m.change });
        return acc;
      }, []);
  })();

  // "Someone Just Bet Big" — derive from top markets by volume
  const liveBreaking = markets.length > 24
    ? markets
        .filter((m) => m.question && m.volNum > 100000)
        .slice(0, 6)
        .map((m, i) => ({
          id: m.id,
          title: m.question,
          price: m.price,
          vol: m.volume.replace("$", ""),
          time: i === 0 ? "just now" : i < 3 ? `${i * 5}m ago` : `${i * 12}m ago`,
          hot: m.volNum > 1000000,
        }))
    : breakingMarkets;

  // "Top Whales by P&L" — sorted by totalPnlNum descending, re-ranked 1-5
  const liveWhaleActivity = markets.length > 24 && liveWhaleList.length > 5
    ? [...liveWhaleList]
        .sort((a, b) => b.totalPnlNum - a.totalPnlNum)
        .slice(0, 5)
        .map((whale, i) => ({
          id: whale.id,
          name: whale.name,
          rank: i + 1,
          acc: whale.accuracy,
          pos: `${whale.totalPnl} P&L`,
          market: "",
          marketId: "",
          time: "",
          side: "long" as const,
        }))
    : homepageWhaleActivity;

  return {
    markets,
    biggestMovers,
    breakingMarkets: liveBreaking,
    whaleActivity: liveWhaleActivity,
    treemapData: liveTreemap,
    source,
    refreshing,
    lastFetched,
    error,
    retry,
  };
}

// ─── DISAGREES HOOK (with auto-refresh) ──────────────────────────────
export function useDisagreements(autoRefreshMs = 45000) {
  const [disagreements, setDisagreements] = useState(mockDisagreements);
  const [source, setSource] = useState<DataSource>("mock");

  const fetchDisagreements = useCallback(async () => {
    const { getDisagreements } = await import("@/lib/api");
    const result = await getDisagreements();
    setDisagreements(result.data);
    setSource(result.source);
  }, []);

  const { refreshing, lastFetched, error, retry } = useAutoRefresh(fetchDisagreements, autoRefreshMs);

  return {
    disagreements,
    count: disagreements.length,
    source,
    refreshing,
    lastFetched,
    error,
    retry,
  };
}

// ─── INSIGHTS HOOK ────────────────────────────────────────────────────
export function useInsights() {
  // Structured for future RSS/API integration
  return {
    insights: mockInsights,
    source: "mock" as DataSource,
    refreshing: false,
    lastFetched: new Date(),
  };
}

// ─── RE-EXPORTS ───────────────────────────────────────────────────────
export { sparkGen, STRAT_CATEGORIES };
export type { Market, Whale, Strategy, Disagreement, Insight, DataSource };
