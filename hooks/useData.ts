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
} from "@/lib/mockData";
import type { Disagreement } from "@/lib/mockData";

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
  return {
    market,
    whaleFlows,
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
  const [priceMovers, setPriceMovers] = useState(mockPriceMovers);
  const [resolution, setResolution] = useState(mockResolution);
  const [source, setSource] = useState<DataSource>("mock");

  const fetchAlerts = useCallback(async () => {
    const api = await import("@/lib/api");
    const [pmRes, rnRes] = await Promise.all([
      api.getPriceMovers(),
      api.getResolutionNearing(),
    ]);
    setPriceMovers(pmRes.data);
    setResolution(rnRes.data);
    if (pmRes.source === "live" || rnRes.source === "live") setSource("live");
  }, []);

  const { refreshing, lastFetched, error, retry } = useAutoRefresh(fetchAlerts, autoRefreshMs);

  return {
    initialWhaleAlerts,
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
  const whale = whales.find((w) => w.id === id) ?? mockWhaleById[id];
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

  return {
    markets,
    biggestMovers,
    breakingMarkets,
    whaleActivity: homepageWhaleActivity,
    treemapData,
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

// ─── RE-EXPORTS ───────────────────────────────────────────────────────
export { sparkGen, STRAT_CATEGORIES };
export type { Market, Whale, Strategy, Disagreement, DataSource };
