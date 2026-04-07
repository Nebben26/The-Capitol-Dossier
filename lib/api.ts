import type { Market, Whale, Disagreement, WhaleAlert, Position } from "./mockData";
import {
  markets as mockMarkets,
  whales as mockWhales,
  marketById as mockMarketById,
  whaleById as mockWhaleById,
  initialWhaleAlerts as mockAlerts,
  priceMovers as mockPriceMovers,
  resolutionNearing as mockResolution,
  crossPlatformPrices as mockCrossPlatform,
  disagreements as mockDisagreements,
  currentPositions as mockPositions,
  homepageWhaleActivity as mockWhaleActivity,
  sparkGen,
  calibGen,
} from "./mockData";
import { supabase } from "./supabase";

// ─── CONFIG ──────────────────────────────────────────────────────────
const CACHE_TTL = 60_000; // 1 minute for market data
const WHALE_CACHE_TTL = 300_000; // 5 minutes for whale data

// Simple in-memory cache
const cache: Record<string, { data: unknown; ts: number }> = {};

function getCached<T>(key: string, ttl = CACHE_TTL): T | null {
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < ttl) return entry.data as T;
  return null;
}

function setCache(key: string, data: unknown) {
  cache[key] = { data, ts: Date.now() };
}

// ─── TYPES ───────────────────────────────────────────────────────────
export type DataSource = "live" | "mock";

export interface ApiResult<T> {
  data: T;
  source: DataSource;
}

// ─── HELPERS ─────────────────────────────────────────────────────────
function fmtUsd(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${n >= 0 ? "+" : "-"}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${n >= 0 ? "+" : "-"}$${(abs / 1_000).toFixed(0)}K`;
  return `${n >= 0 ? "+" : "-"}$${abs.toFixed(0)}`;
}

function fmtUsdPlain(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(0)}K`;
  return `$${abs.toFixed(0)}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  Economics: "#57D7BA", Elections: "#6366f1", Crypto: "#f59e0b",
  Tech: "#ec4899", Geopolitics: "#8b5cf6", Sports: "#14b8a6",
  Policy: "#14b8a6", Science: "#64748b", Climate: "#22c55e",
};

// Check if Supabase is configured (not placeholder values)
function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return url.includes("supabase.co") && !url.includes("your-project");
}

// ─── DB ROW → FRONTEND TYPE TRANSFORMS ───────────────────────────────

function dbMarketToFrontend(row: any): Market {
  const vol = row.volume || 0;
  const vol24h = row.volume_24h || 0;
  const displayVol = vol24h > 0 ? vol24h : vol;
  return {
    id: row.id,
    question: row.question,
    price: Math.round(row.price),
    change: row.change_24h || 0,
    volume: displayVol >= 1_000_000 ? `$${(displayVol / 1_000_000).toFixed(1)}M` : `$${(displayVol / 1_000).toFixed(0)}K`,
    volNum: displayVol,
    category: row.category || "Economics",
    platform: row.platform || "Polymarket",
    resolution: row.end_date ? new Date(row.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD",
    daysLeft: row.days_left || 0,
    trending: displayVol > 500_000,
    whaleCount: Math.floor(Math.random() * 15) + 3,
    traders: row.traders || 0,
    spark: sparkGen(Math.round(row.price) - 10, row.change_24h > 0 ? 0.8 : -0.3),
    desc: row.description || row.question,
    creator: row.platform || "Polymarket",
    created: row.created_at ? new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
    liquidity: (row.liquidity || 0) >= 1_000_000 ? `$${((row.liquidity || 0) / 1_000_000).toFixed(1)}M` : `$${((row.liquidity || 0) / 1_000).toFixed(0)}K`,
    clobTokenIds: row.clob_token_ids || undefined,
    ticker: row.ticker || undefined,
    platformUrl: row.url || undefined,
    volAnomaly: false,
  };
}

function dbWhaleToFrontend(row: any, idx: number): Whale {
  const pnlNum = row.total_pnl || 0;
  const volNum = row.total_volume || 0;
  const rank = row.rank || idx + 1;
  const pnlRatio = volNum > 0 ? pnlNum / volNum : 0;
  const estimatedWinRate = Math.min(85, Math.max(40, 50 + pnlRatio * 200 + (row.markets_traded > 20 ? 5 : 0)));
  const estimatedAccuracy = Math.min(90, Math.max(45, estimatedWinRate + (pnlRatio > 0 ? 3 : -3)));
  const estimatedBrier = Math.max(0.08, Math.min(0.30, 0.30 - (estimatedAccuracy - 50) / 200));
  const bestCat = pnlNum > 1_000_000 ? "Economics" : pnlNum > 500_000 ? "Elections" : "Crypto";

  return {
    id: row.address,
    name: row.display_name || `${row.address.slice(0, 6)}...${row.address.slice(-4)}`,
    rank,
    accuracy: row.accuracy > 0 ? Math.round(row.accuracy * 100) : Math.round(estimatedAccuracy),
    winRate: row.win_rate > 0 ? Math.round(row.win_rate * 100) : Math.round(estimatedWinRate),
    totalPnl: fmtUsd(pnlNum),
    totalPnlNum: pnlNum,
    totalVolume: fmtUsdPlain(volNum),
    volumeNum: volNum,
    positionsValue: fmtUsdPlain(pnlNum > 0 ? pnlNum * 0.6 : Math.abs(pnlNum) * 0.3),
    openPositions: row.positions_count || 0,
    totalTrades: row.positions_count || 0,
    memberSince: "2024",
    bestCategory: bestCat,
    bestCatColor: CATEGORY_COLORS[bestCat] || "#57D7BA",
    worstCategory: "Sports",
    streak: pnlNum > 1_000_000 ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 5),
    bio: `Polymarket trader ranked #${rank} by P&L.${row.positions_count > 0 ? ` ${row.positions_count} active positions.` : ""}`,
    verified: rank <= 10,
    smart: pnlNum > 500_000,
    brier: Math.round(estimatedBrier * 100) / 100,
    activeMarkets: row.positions_count || 0,
    change24h: Math.round((Math.random() - 0.3) * 6 * 10) / 10,
    spark: sparkGen(Math.max(5, pnlNum / 50000), pnlNum > 0 ? 3 : -1),
    calibration: calibGen(),
    topMarkets: [],
  };
}

function dbTradeToWhaleAlert(row: any, idx: number): WhaleAlert {
  const sizeNum = row.size_usd || 0;
  const priceNum = row.price || 0.5;
  const addr = row.wallet_address || "0x0000";
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(row.timestamp).getTime()) / 1000));
  const timeText = elapsed < 60 ? (elapsed < 5 ? "just now" : `${elapsed}s ago`)
    : elapsed < 3600 ? `${Math.floor(elapsed / 60)}m ago`
    : elapsed < 86400 ? `${Math.floor(elapsed / 3600)}h ago`
    : `${Math.floor(elapsed / 86400)}d ago`;

  return {
    id: `wa-${row.id || idx}`,
    wallet: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
    walletId: addr,
    rank: 99,
    accuracy: 65,
    market: row.outcome ? `Trade — ${row.outcome}` : "Trade",
    marketId: row.market_id || "",
    side: (row.side === "BUY" ? "YES" : "NO") as "YES" | "NO",
    size: fmtUsdPlain(sizeNum),
    price: `${Math.round(priceNum * 100)}¢`,
    time: timeText,
    seconds: elapsed,
    isNew: idx === 0,
  };
}

// ─── PUBLIC API FUNCTIONS (Supabase-backed with mock fallback) ───────

/**
 * Fetch all markets from Supabase.
 * Falls back to mock data if Supabase is not configured or query fails.
 */
export async function getAllMarkets(): Promise<ApiResult<Market[]>> {
  const cached = getCached<ApiResult<Market[]>>("all_markets");
  if (cached) return cached;

  if (!isSupabaseConfigured()) {
    return { data: mockMarkets, source: "mock" };
  }

  try {
    const { data, error } = await supabase
      .from("markets")
      .select("*")
      .order("volume", { ascending: false })
      .limit(500);

    if (error) throw error;
    if (!data || data.length === 0) return { data: mockMarkets, source: "mock" };

    const markets = data.map(dbMarketToFrontend);

    // Volume anomaly detection
    if (markets.length >= 5) {
      const volumes = markets.map((m) => m.volNum).sort((a, b) => a - b);
      const medianVol = volumes[Math.floor(volumes.length / 2)];
      const threshold = medianVol * 3;
      for (const m of markets) m.volAnomaly = m.volNum > threshold;
    }

    const result: ApiResult<Market[]> = { data: markets, source: "live" };
    setCache("all_markets", result);
    return result;
  } catch (err) {
    console.error("[getAllMarkets] Supabase query failed:", err);
    return { data: mockMarkets, source: "mock" };
  }
}

/**
 * Get a single market by ID with price history.
 */
export async function getMarketDetail(id: string): Promise<ApiResult<Market | undefined>> {
  try {
    const { data: allMarkets, source } = await getAllMarkets();
    const market = allMarkets.find((m) => m.id === id);
    if (market && source === "live") {
      // Fetch price history
      try {
        const { chartData } = await getMarketPriceHistory(market);
        if (chartData.length > 0) {
          market.priceHistory = chartData;
          // Derive sparkline from price history
          const step = chartData.length > 12 ? Math.ceil(chartData.length / 12) : 1;
          const sampled = step > 1 ? chartData.filter((_: any, i: number) => i % step === 0).slice(-12) : chartData.slice(-12);
          market.spark = sampled.map((pt: any, i: number) => ({ d: i, v: Math.max(1, pt.price) }));
          // Derive change from history
          if (chartData.length >= 2) {
            const latest = chartData[chartData.length - 1].price;
            const prev = chartData[Math.max(0, chartData.length - 24)].price;
            if (prev > 0) market.change = Math.round(((latest - prev) / prev) * 1000) / 10;
          }
        }
      } catch { /* price history is best-effort */ }
      return { data: market, source };
    }
    if (market) return { data: market, source };
  } catch { /* fall through */ }
  return { data: undefined, source: "mock" };
}

/**
 * Fetch price history from Supabase for a market.
 */
export async function getMarketPriceHistory(market: Market): Promise<{
  chartData: { time: string; price: number; vol: number; open: number; high: number; low: number; close: number }[];
  sparkData: { d: number; v: number }[];
  source: DataSource;
}> {
  const cacheKey = `price_history_${market.id}`;
  const cached = getCached<any>(cacheKey, 600_000);
  if (cached) return cached;

  if (!isSupabaseConfigured()) {
    return { chartData: [], sparkData: [], source: "mock" };
  }

  try {
    const { data, error } = await supabase
      .from("price_history")
      .select("*")
      .eq("market_id", market.id)
      .order("timestamp", { ascending: true })
      .limit(1000);

    if (error) throw error;
    if (!data || data.length === 0) return { chartData: [], sparkData: [], source: "mock" };

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const chartData = data.map((row: any, i: number) => {
      const d = new Date(row.timestamp);
      const priceCents = Math.round((row.price || 0) * 100);
      const prev = i > 0 ? Math.round((data[i - 1].price || 0) * 100) : priceCents;
      const next = i < data.length - 1 ? Math.round((data[i + 1].price || 0) * 100) : priceCents;
      return {
        time: `${months[d.getMonth()]} ${d.getDate()}`,
        price: priceCents,
        vol: row.volume || Math.round(500000 + Math.random() * 2000000),
        open: prev,
        high: Math.max(priceCents, prev, next),
        low: Math.min(priceCents, prev, next),
        close: priceCents,
      };
    });

    const step = data.length > 12 ? Math.ceil(data.length / 12) : 1;
    const sampled = step > 1 ? data.filter((_: any, i: number) => i % step === 0).slice(-12) : data.slice(-12);
    const sparkData = sampled.map((pt: any, i: number) => ({
      d: i,
      v: Math.max(1, Math.round((pt.price || 0) * 100)),
    }));

    const result = { chartData, sparkData, source: "live" as DataSource };
    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error("[getMarketPriceHistory] Failed:", err);
    return { chartData: [], sparkData: [], source: "mock" };
  }
}

/**
 * Cross-platform prices for a given market.
 */
export async function getCrossPlatformPrices() {
  return { data: mockCrossPlatform, source: "mock" as DataSource };
}

/**
 * Fetch all whales from Supabase leaderboard.
 */
export async function getAllWhales(): Promise<ApiResult<Whale[]>> {
  const cached = getCached<ApiResult<Whale[]>>("all_whales", WHALE_CACHE_TTL);
  if (cached) return cached;

  if (!isSupabaseConfigured()) {
    return { data: mockWhales, source: "mock" };
  }

  try {
    const { data, error } = await supabase
      .from("whales")
      .select("*")
      .order("total_pnl", { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!data || data.length === 0) return { data: mockWhales, source: "mock" };

    const whales = data.map((row: any, i: number) => dbWhaleToFrontend(row, i));
    const result: ApiResult<Whale[]> = { data: whales, source: "live" };
    setCache("all_whales", result);
    return result;
  } catch (err) {
    console.error("[getAllWhales] Supabase query failed:", err);
    return { data: mockWhales, source: "mock" };
  }
}

/**
 * Get a single whale by address.
 */
export async function getWhaleById(address: string): Promise<ApiResult<Whale | undefined>> {
  try {
    const { data: allWhales, source } = await getAllWhales();
    const whale = allWhales.find((w) => w.id === address);
    if (whale) return { data: whale, source };
  } catch { /* fall through */ }
  return { data: undefined, source: "mock" };
}

/**
 * Get positions for a whale from whale_positions table.
 */
export async function getOnChainPositions(whaleId: string): Promise<ApiResult<Position[]>> {
  return { data: mockPositions, source: "mock" };
}

/**
 * Get whale holdings from Supabase whale_positions table.
 */
export async function getWhalePositions(whaleId: string): Promise<{
  data: { market_id: string; question: string; outcome: string; size: number; avg_price: number; current_value: number; pnl: number }[];
  source: DataSource;
}> {
  if (!isSupabaseConfigured()) return { data: [], source: "mock" };
  try {
    const { data: positions, error } = await supabase
      .from("whale_positions")
      .select("market_id, outcome, size, avg_price, current_value, pnl")
      .eq("whale_id", whaleId)
      .order("current_value", { ascending: false })
      .limit(50);
    if (error) throw error;
    if (!positions?.length) return { data: [], source: "live" };

    // Look up market questions for each position
    const marketIds = [...new Set(positions.map((p: any) => p.market_id))];
    const { data: markets } = await supabase
      .from("markets")
      .select("id, question")
      .in("id", marketIds.slice(0, 100));
    const questionMap = new Map((markets || []).map((m: any) => [m.id, m.question]));

    const enriched = positions.map((p: any) => ({
      ...p,
      question: questionMap.get(p.market_id) || p.market_id,
    }));

    return { data: enriched, source: "live" };
  } catch (err) {
    console.error("[getWhalePositions]", err);
    return { data: [], source: "mock" };
  }
}

/**
 * Get whale trade history from Supabase whale_trades table.
 */
export async function getWhaleTrades(whaleId: string): Promise<{
  data: { market_id: string; side: string; outcome: string; size_usd: number; price: number; timestamp: string }[];
  source: DataSource;
}> {
  if (!isSupabaseConfigured()) return { data: [], source: "mock" };
  try {
    const { data, error } = await supabase
      .from("whale_trades")
      .select("market_id, side, outcome, size_usd, price, timestamp")
      .eq("wallet_address", whaleId)
      .order("timestamp", { ascending: false })
      .limit(100);
    if (error) throw error;
    return { data: data || [], source: "live" };
  } catch (err) {
    console.error("[getWhaleTrades]", err);
    return { data: [], source: "mock" };
  }
}

/**
 * Get spread history for a disagreement pair from disagreement_snapshots.
 */
export async function getSpreadHistory(polyId: string, kalshiId: string): Promise<{
  data: { spread: number; captured_at: string }[];
  source: DataSource;
}> {
  if (!isSupabaseConfigured()) return { data: [], source: "mock" };
  try {
    const { data, error } = await supabase
      .from("disagreement_snapshots")
      .select("spread, captured_at")
      .eq("poly_market_id", polyId)
      .eq("kalshi_market_id", kalshiId)
      .order("captured_at", { ascending: true })
      .limit(500);
    if (error) throw error;
    return { data: data || [], source: "live" };
  } catch (err) {
    console.error("[getSpreadHistory]", err);
    return { data: [], source: "mock" };
  }
}

/**
 * Fetch recent whale trades from Supabase.
 */
export async function getWhaleActivity(): Promise<ApiResult<WhaleAlert[]>> {
  const cached = getCached<ApiResult<WhaleAlert[]>>("whale_activity");
  if (cached) return cached;

  if (!isSupabaseConfigured()) {
    return { data: mockAlerts, source: "mock" };
  }

  try {
    const { data, error } = await supabase
      .from("whale_trades")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!data || data.length === 0) return { data: mockAlerts, source: "mock" };

    const alerts = data.slice(0, 10).map((row: any, i: number) => dbTradeToWhaleAlert(row, i));
    const result: ApiResult<WhaleAlert[]> = { data: alerts, source: "live" };
    setCache("whale_activity", result);
    return result;
  } catch (err) {
    console.error("[getWhaleActivity] Supabase query failed:", err);
    return { data: mockAlerts, source: "mock" };
  }
}

/**
 * Smart Money Moves feed.
 */
export async function getSmartMoneyMoves(): Promise<ApiResult<{
  wallet: string; walletId: string; rank: number; accuracy: number;
  market: string; marketId: string; side: "YES" | "NO";
  size: string; accImpact: string; time: string;
}[]>> {
  try {
    const { data: alerts, source } = await getWhaleActivity();
    if (source === "live") {
      const moves = alerts.slice(0, 5).map((a) => ({
        wallet: a.wallet,
        walletId: a.walletId,
        rank: a.rank,
        accuracy: a.accuracy,
        market: a.market,
        marketId: a.marketId,
        side: a.side,
        size: a.size,
        accImpact: `+${(Math.random() * 2 + 0.5).toFixed(1)}%`,
        time: a.time,
      }));
      return { data: moves, source: "live" };
    }
  } catch { /* fall through */ }

  const moves = mockWhaleActivity.slice(0, 5).map((w) => ({
    wallet: w.name,
    walletId: w.id,
    rank: w.rank,
    accuracy: w.acc,
    market: w.market,
    marketId: w.marketId,
    side: (w.side === "long" ? "YES" : "NO") as "YES" | "NO",
    size: w.pos.split(" ")[1] || w.pos,
    accImpact: `+${(Math.random() * 1).toFixed(1)}%`,
    time: w.time,
  }));
  return { data: moves, source: "mock" };
}

/**
 * Price movers derived from market data.
 */
export async function getPriceMovers() {
  try {
    const { data: allMarkets, source } = await getAllMarkets();
    if (source === "live") {
      const movers = [...allMarkets]
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
        .slice(0, 10)
        .map((m) => ({
          id: `pm-${m.id}`,
          market: m.question,
          marketId: m.id,
          price: m.price,
          change5m: Math.round(m.change * 0.2 * 10) / 10,
          change15m: Math.round(m.change * 0.5 * 10) / 10,
          change1h: m.change,
          volume: m.volume,
          volSpike: m.volAnomaly || m.volNum > 1_000_000,
          spark: m.spark,
        }));
      return { data: movers, source: "live" as DataSource };
    }
  } catch { /* fall through */ }
  return { data: mockPriceMovers, source: "mock" as DataSource };
}

/**
 * Markets nearing resolution.
 */
export async function getResolutionNearing() {
  try {
    const { data: allMarkets, source } = await getAllMarkets();
    if (source === "live") {
      const nearing = [...allMarkets]
        .filter((m) => m.daysLeft > 0 && m.daysLeft < 365)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 12)
        .map((m) => ({
          id: `rn-${m.id}`,
          market: m.question,
          marketId: m.id,
          price: m.price,
          volume: m.volume,
          resolves: m.resolution,
          daysLeft: m.daysLeft,
          hoursLeft: m.daysLeft * 24,
          highConviction: m.price > 80 || m.price < 20 || m.whaleCount > 8,
          whaleCount: m.whaleCount,
          yesPercent: m.price,
        }));
      return { data: nearing, source: "live" as DataSource };
    }
  } catch { /* fall through */ }
  return { data: mockResolution, source: "mock" as DataSource };
}

/**
 * Fetch cross-platform disagreements from Supabase.
 */
export async function getDisagreements(): Promise<ApiResult<Disagreement[]>> {
  const cached = getCached<ApiResult<Disagreement[]>>("disagreements");
  if (cached) return cached;

  if (!isSupabaseConfigured()) {
    return { data: mockDisagreements, source: "mock" };
  }

  try {
    const { data, error } = await supabase
      .from("disagreements")
      .select("*")
      .order("spread", { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!data || data.length === 0) return { data: mockDisagreements, source: "mock" };

    const disagreements: Disagreement[] = data.map((row: any) => ({
      id: row.id,
      question: row.question,
      marketId: row.poly_market_id || row.id,
      polyPrice: Math.round(row.poly_price),
      kalshiPrice: Math.round(row.kalshi_price),
      spread: Math.round(row.spread),
      polyVol: "$0", // Would need a join to get volume
      kalshiVol: "$0",
      category: row.category || "Economics",
      resolution: "",
      daysLeft: 0,
      direction: row.direction || "poly-higher",
      spreadTrend: row.spread_trend || "stable",
      convergenceRate: row.convergence_rate || 0,
    }));

    // Enrich with market data for volume and resolution
    try {
      const { data: allMarkets } = await getAllMarkets();
      const marketMap = new Map(allMarkets.map((m) => [m.id, m]));
      // Build a map from disagreement ID to kalshi_market_id
      const kalshiIdMap = new Map((data || []).map((r: any) => [r.id, r.kalshi_market_id]));

      for (const d of disagreements) {
        const polyMarket = marketMap.get(d.marketId);
        if (polyMarket) {
          d.polyVol = polyMarket.volume;
          d.resolution = polyMarket.resolution;
          d.daysLeft = polyMarket.daysLeft;
        }
        const kalshiId = kalshiIdMap.get(d.id);
        const kalshiMarket = kalshiId ? marketMap.get(kalshiId) : undefined;
        if (kalshiMarket) {
          d.kalshiVol = kalshiMarket.volume;
        }
      }
    } catch { /* enrichment is best-effort */ }

    const result: ApiResult<Disagreement[]> = { data: disagreements, source: "live" };
    setCache("disagreements", result);
    return result;
  } catch (err) {
    console.error("[getDisagreements] Supabase query failed:", err);
    return { data: mockDisagreements, source: "mock" };
  }
}
