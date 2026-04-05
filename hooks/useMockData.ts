import {
  markets,
  marketById,
  whales,
  whaleById,
  strategies,
  initialWhaleAlerts,
  incomingAlerts,
  priceMovers,
  resolutionNearing,
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
  biggestMovers,
  breakingMarkets,
  homepageWhaleActivity,
  type Market,
  type Whale,
  type Strategy,
  type WhaleAlert,
  type PriceMover,
  type ResolutionItem,
} from "@/lib/mockData";

// ─── MARKET HOOKS ─────────────────────────────────────────────────────
export function useMarkets() {
  return markets;
}

export function useMarket(id: string): Market | undefined {
  return marketById[id];
}

export function useMarketDetail(id: string) {
  const market = marketById[id];
  return {
    market,
    whaleFlows,
    crossPlatformPrices,
    orderbookBids,
    orderbookAsks,
    resolutionHistory,
  };
}

// ─── WHALE HOOKS ──────────────────────────────────────────────────────
export function useWhales() {
  return whales;
}

export function useWhale(id: string): Whale | undefined {
  return whaleById[id];
}

export function useWhaleProfile(id: string) {
  const whale = whaleById[id];
  return {
    whale,
    pnlHistory,
    currentPositions,
    historicalTrades,
    categoryPerformance,
    calibrationData,
    biggestWins,
    biggestLosses,
  };
}

// ─── STRATEGY HOOKS ───────────────────────────────────────────────────
export function useStrategies() {
  return strategies;
}

export function useBacktestData() {
  return { backtestEquity, backtestTrades };
}

// ─── ALERT HOOKS ──────────────────────────────────────────────────────
export function useAlertData() {
  return {
    initialWhaleAlerts,
    incomingAlerts,
    priceMovers,
    resolutionNearing,
  };
}

// ─── HOMEPAGE HOOKS ───────────────────────────────────────────────────
export function useHomepageData() {
  return {
    biggestMovers,
    breakingMarkets,
    whaleActivity: homepageWhaleActivity,
    treemapData,
  };
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────
export function useLeaderboard() {
  return whales;
}
