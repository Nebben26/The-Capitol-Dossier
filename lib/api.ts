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
  // If volume is 0 but P&L is positive, estimate volume as P&L * 5 (rough lower bound)
  const effectiveVol = volNum > 0 ? volNum : (pnlNum > 0 ? Math.abs(pnlNum) * 5 : 0);
  const rank = row.rank || idx + 1;
  const bestCat = pnlNum > 1_000_000 ? "Economics" : pnlNum > 500_000 ? "Elections" : "Crypto";

  // Only use real values from DB — 0 means "not computed" (rendered as "—" in UI)
  const realWinRate = row.win_rate > 0 ? Math.round(row.win_rate * 100) : 0;
  const realAccuracy = row.accuracy > 0 ? Math.round(row.accuracy * 100) : 0;
  const realBrier = row.win_rate > 0 || row.accuracy > 0 ? Math.max(0.05, 0.30 - (realAccuracy || 50) / 200) : 0;

  return {
    id: row.address,
    name: row.display_name || `${row.address.slice(0, 6)}...${row.address.slice(-4)}`,
    rank,
    accuracy: realAccuracy,
    winRate: realWinRate,
    totalPnl: fmtUsd(pnlNum),
    totalPnlNum: pnlNum,
    totalVolume: fmtUsdPlain(effectiveVol),
    volumeNum: effectiveVol,
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
    brier: Math.round(realBrier * 100) / 100,
    activeMarkets: (row.markets_traded > 1 ? row.markets_traded : null) || row.positions_count || 0,
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
    // Paginate until empty — NO HEAD count query (Supabase returns 503 on HEAD count)
    const allRows: any[] = [];
    const PAGE_SIZE = 1000;
    const MAX_PAGES = 20; // safety ceiling — 20,000 markets max

    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("markets")
        .select("*")
        .order("id", { ascending: true })
        .range(from, to);

      if (error) {
        console.error(`[getAllMarkets] page ${page} error:`, error.message);
        if (page === 0) throw error; // first page fail → fall back to mock
        break; // partial load is better than nothing
      }
      if (!data || data.length === 0) break;
      allRows.push(...data);
      if (data.length < PAGE_SIZE) break; // last page — no need to fetch further
    }

    if (allRows.length === 0) {
      console.error("[getAllMarkets] returned 0 rows — falling back to mock");
      return { data: mockMarkets, source: "mock" };
    }

    // Sort by volume descending in JS
    allRows.sort((a, b) => (b.volume || 0) - (a.volume || 0));

    const markets = allRows.map(dbMarketToFrontend);
    console.log(`[getAllMarkets] success: ${markets.length} markets loaded`);

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
    console.error("[getAllMarkets] failed:", err);
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
      .limit(500);

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
 * Batch-fetch spread history for multiple disagreements keyed by poly_market_id.
 * Returns a map: poly_market_id → [{t (ms), spread}] sorted ascending.
 */
export async function getSpreadHistory(
  polyMarketIds: string[]
): Promise<Record<string, Array<{ t: number; spread: number }>>> {
  if (!isSupabaseConfigured() || polyMarketIds.length === 0) return {};
  try {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("disagreement_snapshots")
      .select("poly_market_id, spread, captured_at")
      .in("poly_market_id", polyMarketIds)
      .gte("captured_at", since)
      .order("captured_at", { ascending: true });
    if (error) throw error;
    const byId: Record<string, Array<{ t: number; spread: number }>> = {};
    for (const row of data || []) {
      if (!byId[row.poly_market_id]) byId[row.poly_market_id] = [];
      byId[row.poly_market_id].push({
        t: new Date(row.captured_at).getTime(),
        spread: Number(row.spread),
      });
    }
    return byId;
  } catch (err) {
    console.error("[getSpreadHistory] failed:", err);
    return {};
  }
}

/**
 * @deprecated Use getSpreadHistory(polyMarketIds[]) instead.
 */
async function _getSpreadHistoryPair(polyId: string, kalshiId: string): Promise<{
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
    return { data: [], source: "mock" };
  }

  try {
    const { data, error } = await supabase
      .from("disagreements")
      .select("*")
      .order("spread", { ascending: false })
      .limit(500);

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], source: "live" };

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
    } catch (enrichErr) {
      console.error("[getDisagreements] enrichment failed (non-blocking):", enrichErr);
    }

    const result: ApiResult<Disagreement[]> = { data: disagreements, source: "live" };
    setCache("disagreements", result);
    return result;
  } catch (err) {
    console.error("[getDisagreements] Supabase query failed:", err);
    return { data: [], source: "mock" };
  }
}

// ─── SMART MONEY FLOW ─────────────────────────────────────────────────────────

export interface SmartMoneyFlowByCategory {
  category: string;
  netFlowUsd: number;      // yesValueUsd - noValueUsd
  yesValueUsd: number;
  noValueUsd: number;
  positionCount: number;
  uniqueWhales: number;
  topMarkets: Array<{ id: string; question: string; flowUsd: number }>;
}

/**
 * Aggregate whale positions by market category.
 * Fields confirmed by schema inspection:
 *   current_value (USD), outcome ("Yes"/"No"), whale_id, market_id
 */
export async function getSmartMoneyFlow(): Promise<{
  data: SmartMoneyFlowByCategory[];
  source: DataSource;
}> {
  const cacheKey = "smart_money_flow";
  const cached = getCached<{ data: SmartMoneyFlowByCategory[]; source: DataSource }>(cacheKey, 300_000);
  if (cached) return cached;

  if (!isSupabaseConfigured()) return { data: [], source: "mock" };

  try {
    // 1. Paginate all whale_positions (count-free — no HEAD query)
    const allPositions: any[] = [];
    const PAGE_SIZE = 1000;
    for (let page = 0; page < 20; page++) {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("whale_positions")
        .select("whale_id, market_id, outcome, current_value")
        .order("id", { ascending: true })
        .range(from, to);
      if (error) { if (page === 0) throw error; break; }
      if (!data || data.length === 0) break;
      allPositions.push(...data);
      if (data.length < PAGE_SIZE) break;
    }

    if (allPositions.length === 0) return { data: [], source: "live" };

    // 2. Collect unique market_ids and batch-fetch category+question
    const marketIds = [...new Set(allPositions.map((p) => p.market_id).filter(Boolean))];
    const marketMeta: Record<string, { category: string; question: string }> = {};
    const CHUNK = 200;
    for (let i = 0; i < marketIds.length; i += CHUNK) {
      const slice = marketIds.slice(i, i + CHUNK);
      const { data: mData, error: mErr } = await supabase
        .from("markets")
        .select("id, category, question")
        .in("id", slice);
      if (mErr) throw mErr;
      for (const m of mData || []) {
        marketMeta[m.id] = {
          category: m.category || "Other",
          question: m.question || m.id,
        };
      }
    }

    // 3. Aggregate by category
    const byCategory: Record<string, {
      yesValueUsd: number;
      noValueUsd: number;
      positionCount: number;
      whaleSet: Set<string>;
      marketFlows: Record<string, { question: string; flowUsd: number }>;
    }> = {};

    for (const pos of allPositions) {
      const meta = marketMeta[pos.market_id];
      if (!meta) continue;

      const value = Number(pos.current_value ?? 0);
      if (!value || isNaN(value) || value <= 0) continue;

      // outcome is "Yes" or "No" (mixed case)
      const isYes = String(pos.outcome || "").toLowerCase().startsWith("y");

      const cat = meta.category;
      if (!byCategory[cat]) {
        byCategory[cat] = {
          yesValueUsd: 0,
          noValueUsd: 0,
          positionCount: 0,
          whaleSet: new Set(),
          marketFlows: {},
        };
      }
      const bucket = byCategory[cat];
      if (isYes) bucket.yesValueUsd += value;
      else bucket.noValueUsd += value;
      bucket.positionCount += 1;
      if (pos.whale_id) bucket.whaleSet.add(pos.whale_id);

      if (!bucket.marketFlows[pos.market_id]) {
        bucket.marketFlows[pos.market_id] = { question: meta.question, flowUsd: 0 };
      }
      bucket.marketFlows[pos.market_id].flowUsd += isYes ? value : -value;
    }

    // 4. Shape result
    const result: SmartMoneyFlowByCategory[] = Object.entries(byCategory).map(([category, b]) => ({
      category,
      netFlowUsd: b.yesValueUsd - b.noValueUsd,
      yesValueUsd: b.yesValueUsd,
      noValueUsd: b.noValueUsd,
      positionCount: b.positionCount,
      uniqueWhales: b.whaleSet.size,
      topMarkets: Object.entries(b.marketFlows)
        .map(([id, m]) => ({ id, question: m.question, flowUsd: m.flowUsd }))
        .sort((a, b) => Math.abs(b.flowUsd) - Math.abs(a.flowUsd))
        .slice(0, 5),
    }));

    result.sort((a, b) => Math.abs(b.netFlowUsd) - Math.abs(a.netFlowUsd));

    console.log(
      `[getSmartMoneyFlow] ${result.length} categories, ${allPositions.length} positions, ` +
      `${Object.keys(marketMeta).length}/${marketIds.length} markets matched`
    );

    const out = { data: result, source: "live" as DataSource };
    setCache(cacheKey, out);
    return out;
  } catch (err) {
    console.error("[getSmartMoneyFlow] failed:", err);
    return { data: [], source: "mock" };
  }
}
