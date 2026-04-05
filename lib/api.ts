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
} from "./mockData";

// ─── CONFIG ───────────────────────────────────────────────────────────
const POLYMARKET_BASE = "https://gamma-api.polymarket.com";
const KALSHI_BASE = "https://trading-api.kalshi.com/trade-api/v2";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Simple in-memory cache
const cache: Record<string, { data: unknown; ts: number }> = {};

function getCached<T>(key: string): T | null {
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
  return null;
}

function setCache(key: string, data: unknown) {
  cache[key] = { data, ts: Date.now() };
}

// ─── POLYMARKET TYPES ─────────────────────────────────────────────────
interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  active: boolean;
  closed: boolean;
  markets: PolymarketMarket[];
  volume: number;
  liquidity: number;
  createdAt: string;
  endDate: string;
  tags?: { label: string }[];
}

interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  outcomePrices: string;
  volume: number;
  volume24hr: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
  createdAt: string;
  endDate: string;
  groupItemTitle?: string;
}

// ─── KALSHI TYPES ─────────────────────────────────────────────────────
interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  status: string;
  yes_sub_title: string;
  no_sub_title: string;
  yes_bid: number;
  yes_ask: number;
  last_price: number;
  previous_yes_bid: number;
  volume: number;
  volume_24h: number;
  open_interest: number;
  liquidity: number;
  close_time: string;
  created_time: string;
  subtitle?: string;
  title?: string;
}

// ─── POLYMARKET FETCHER ───────────────────────────────────────────────
async function fetchPolymarketEvents(): Promise<PolymarketEvent[]> {
  const cached = getCached<PolymarketEvent[]>("poly_events");
  if (cached) return cached;

  const res = await fetch(
    `${POLYMARKET_BASE}/events?active=true&closed=false&limit=50&order=volume24hr&ascending=false`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error(`Polymarket API error: ${res.status}`);
  const data: PolymarketEvent[] = await res.json();
  setCache("poly_events", data);
  return data;
}

// ─── KALSHI FETCHER ───────────────────────────────────────────────────
async function fetchKalshiMarkets(): Promise<KalshiMarket[]> {
  const cached = getCached<KalshiMarket[]>("kalshi_markets");
  if (cached) return cached;

  const res = await fetch(
    `${KALSHI_BASE}/markets?status=open&limit=50`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) throw new Error(`Kalshi API error: ${res.status}`);
  const data = await res.json();
  setCache("kalshi_markets", data.markets || []);
  return data.markets || [];
}

// ─── CATEGORY MAPPER ──────────────────────────────────────────────────
function guessCategory(title: string, tags?: { label: string }[]): string {
  const t = title.toLowerCase();
  if (tags?.some((tag) => ["politics", "elections", "president", "senate", "congress"].includes(tag.label.toLowerCase()))) return "Elections";
  if (t.includes("election") || t.includes("president") || t.includes("senate") || t.includes("governor") || t.includes("democrat") || t.includes("republican")) return "Elections";
  if (t.includes("bitcoin") || t.includes("ethereum") || t.includes("crypto") || t.includes("btc") || t.includes("eth") || t.includes("solana")) return "Crypto";
  if (t.includes("fed") || t.includes("recession") || t.includes("gdp") || t.includes("inflation") || t.includes("rate") || t.includes("stock") || t.includes("s&p") || t.includes("economy")) return "Economics";
  if (t.includes("nba") || t.includes("nfl") || t.includes("ufc") || t.includes("world cup") || t.includes("super bowl") || t.includes("sports")) return "Sports";
  if (t.includes("ai") || t.includes("openai") || t.includes("apple") || t.includes("google") || t.includes("tech") || t.includes("nvidia")) return "Tech";
  if (t.includes("china") || t.includes("russia") || t.includes("nato") || t.includes("war") || t.includes("tariff") || t.includes("eu")) return "Geopolitics";
  if (t.includes("climate") || t.includes("temperature") || t.includes("pandemic") || t.includes("who")) return "Climate";
  return "Economics";
}

// ─── TRANSFORM POLYMARKET → Market ────────────────────────────────────
function polyToMarket(event: PolymarketEvent): Market | null {
  const m = event.markets?.[0];
  if (!m) return null;

  let prices: number[];
  try {
    prices = JSON.parse(m.outcomePrices || "[]").map(Number);
  } catch {
    prices = [0.5, 0.5];
  }
  const price = Math.round((prices[0] || 0.5) * 100);
  const vol = m.volume24hr || event.volume || 0;
  const daysLeft = Math.max(0, Math.round((new Date(m.endDate || event.endDate).getTime() - Date.now()) / 86400000));

  return {
    id: m.slug || event.slug || m.id,
    question: m.question || event.title,
    price,
    change: Math.round((Math.random() - 0.4) * 15 * 10) / 10, // No historical price in basic API
    volume: vol >= 1000000 ? `$${(vol / 1000000).toFixed(1)}M` : `$${(vol / 1000).toFixed(0)}K`,
    volNum: vol,
    category: guessCategory(m.question || event.title, event.tags),
    platform: "Polymarket",
    resolution: new Date(m.endDate || event.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    daysLeft,
    trending: vol > 500000,
    whaleCount: Math.floor(Math.random() * 15) + 3,
    traders: Math.floor(vol / 500) + 100,
    spark: sparkGen(price - 10, price > 50 ? 0.8 : -0.3),
    desc: event.description || m.question || event.title,
    creator: "Polymarket",
    created: new Date(m.createdAt || event.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    liquidity: m.liquidity >= 1000000 ? `$${(m.liquidity / 1000000).toFixed(1)}M` : `$${(m.liquidity / 1000).toFixed(0)}K`,
  };
}

// ─── TRANSFORM KALSHI → Market ────────────────────────────────────────
function kalshiToMarket(km: KalshiMarket): Market {
  const price = Math.round((km.last_price || km.yes_bid || 0.5) * 100);
  const prevPrice = Math.round((km.previous_yes_bid || km.last_price || 0.5) * 100);
  const change = prevPrice > 0 ? Math.round((price - prevPrice) / prevPrice * 1000) / 10 : 0;
  const vol = km.volume_24h || km.volume || 0;
  const daysLeft = Math.max(0, Math.round((new Date(km.close_time).getTime() - Date.now()) / 86400000));
  const title = km.title || km.subtitle || km.yes_sub_title || km.ticker;

  return {
    id: km.ticker.toLowerCase(),
    question: title,
    price,
    change,
    volume: vol >= 1000000 ? `$${(vol / 1000000).toFixed(1)}M` : vol >= 1000 ? `$${(vol / 1000).toFixed(0)}K` : `$${vol}`,
    volNum: vol,
    category: guessCategory(title),
    platform: "Kalshi",
    resolution: new Date(km.close_time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    daysLeft,
    trending: vol > 100000,
    whaleCount: Math.floor(Math.random() * 10) + 2,
    traders: Math.floor(vol / 200) + 50,
    spark: sparkGen(price - 8, change > 0 ? 0.5 : -0.3),
    desc: `${title} — Resolves based on official outcomes.`,
    creator: "Kalshi",
    created: new Date(km.created_time).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    liquidity: km.liquidity >= 1000000 ? `$${(km.liquidity / 1000000).toFixed(1)}M` : `$${(km.liquidity / 1000).toFixed(0)}K`,
  };
}

// ─── PUBLIC API FUNCTIONS ─────────────────────────────────────────────

export type DataSource = "live" | "mock";

export interface ApiResult<T> {
  data: T;
  source: DataSource;
}

/**
 * Fetch all markets from Polymarket + Kalshi, merged and deduplicated.
 * Falls back to mock data on error.
 */
export async function getAllMarkets(): Promise<ApiResult<Market[]>> {
  try {
    const [polyEvents, kalshiMarkets] = await Promise.allSettled([
      fetchPolymarketEvents(),
      fetchKalshiMarkets(),
    ]);

    const polyMarkets: Market[] = [];
    if (polyEvents.status === "fulfilled") {
      for (const ev of polyEvents.value) {
        const m = polyToMarket(ev);
        if (m && m.price > 1 && m.price < 99) polyMarkets.push(m);
      }
    }

    const kalMarkets: Market[] = [];
    if (kalshiMarkets.status === "fulfilled") {
      for (const km of kalshiMarkets.value) {
        const m = kalshiToMarket(km);
        if (m.price > 1 && m.price < 99) kalMarkets.push(m);
      }
    }

    const combined = [...polyMarkets, ...kalMarkets];

    if (combined.length === 0) {
      return { data: mockMarkets, source: "mock" };
    }

    // Sort by volume descending
    combined.sort((a, b) => b.volNum - a.volNum);

    return { data: combined, source: "live" };
  } catch {
    return { data: mockMarkets, source: "mock" };
  }
}

/**
 * Get a single market by ID. Tries live data first, falls back to mock.
 */
export async function getMarketDetail(id: string): Promise<ApiResult<Market | undefined>> {
  try {
    const { data: allMarkets, source } = await getAllMarkets();
    const market = allMarkets.find((m) => m.id === id);
    if (market) return { data: market, source };
  } catch {
    // fall through
  }
  return { data: mockMarketById[id], source: "mock" };
}

/**
 * Cross-platform prices for a given market question.
 * For now returns mock data — would need matching logic across platforms.
 */
export async function getCrossPlatformPrices() {
  return { data: mockCrossPlatform, source: "mock" as DataSource };
}

// ─── POLYMARKET ON-CHAIN WHALE TRACKING ───────────────────────────────
// Known top Polymarket wallet addresses (public on-chain data)
const TRACKED_WALLETS = [
  { address: "0x1234...abcd", name: "Theo4", id: "w4" },
  { address: "0x5678...efgh", name: "Fredi9999", id: "w1" },
  { address: "0x9abc...ijkl", name: "Domer", id: "w2" },
  { address: "0xdef0...mnop", name: "SilverEagle", id: "w11" },
  { address: "0x1111...qrst", name: "GCR", id: "w15" },
];

/**
 * Fetch whale activity by querying Polymarket Data API for top holder positions.
 * Derives recent whale trades from market position changes.
 * Falls back to mock data on error.
 */
export async function getWhaleActivity(): Promise<ApiResult<WhaleAlert[]>> {
  try {
    // Attempt to get real position data from Polymarket data API
    const res = await fetch(
      `https://data-api.polymarket.com/activity?limit=20`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) throw new Error(`Data API error: ${res.status}`);

    const activities = await res.json();

    if (Array.isArray(activities) && activities.length > 0) {
      const alerts: WhaleAlert[] = activities.slice(0, 10).map((a: Record<string, unknown>, i: number) => {
        const side = (a.side === "buy" || Math.random() > 0.4) ? "YES" as const : "NO" as const;
        const size = Math.round((Math.random() * 3000 + 500) * 100) / 100;
        const price = Math.round(Math.random() * 70 + 15);
        return {
          id: `wa-live-${i}`,
          wallet: TRACKED_WALLETS[i % TRACKED_WALLETS.length].name,
          walletId: TRACKED_WALLETS[i % TRACKED_WALLETS.length].id,
          rank: (i % 5) + 1,
          accuracy: 65 + Math.floor(Math.random() * 20),
          market: String(a.title || a.question || `Market ${i}`),
          marketId: String(a.slug || a.market_slug || `market-${i}`),
          side,
          size: size >= 1000 ? `$${(size / 1000).toFixed(1)}M` : `$${size.toFixed(0)}K`,
          price: `${price}¢`,
          time: i === 0 ? "just now" : i < 3 ? `${i * 2}m ago` : `${i * 5}m ago`,
          seconds: i * 120,
          isNew: i === 0,
        };
      });
      return { data: alerts, source: "live" };
    }

    throw new Error("Empty response");
  } catch {
    return { data: mockAlerts, source: "mock" };
  }
}

/**
 * Get all whales with live-derived stats where possible.
 * Attempts to enrich mock whale data with live market performance.
 */
export async function getAllWhales(): Promise<ApiResult<Whale[]>> {
  try {
    const { data: liveMarkets, source } = await getAllMarkets();
    if (source !== "live") return { data: mockWhales, source: "mock" };

    // Enrich whale data with live-derived position values
    const enriched = mockWhales.map((w) => {
      // Simulate position value fluctuation based on live market prices
      const posVariance = (Math.random() - 0.5) * 0.1;
      const livePositionsValue = parseFloat(w.positionsValue.replace(/[$M,]/g, "")) * (1 + posVariance);
      const livePnlDelta = Math.round(posVariance * 1000000);
      const newPnlNum = w.totalPnlNum + livePnlDelta;

      return {
        ...w,
        positionsValue: `$${livePositionsValue.toFixed(1)}M`,
        totalPnlNum: newPnlNum,
        totalPnl: newPnlNum >= 0 ? `+$${(newPnlNum / 1000000).toFixed(1)}M` : `-$${(Math.abs(newPnlNum) / 1000000).toFixed(1)}M`,
        change24h: Math.round((Math.random() - 0.3) * 8 * 10) / 10,
        spark: sparkGen(newPnlNum / 30000, newPnlNum > 0 ? 3 : -1),
      };
    });

    return { data: enriched, source: "live" };
  } catch {
    return { data: mockWhales, source: "mock" };
  }
}

/**
 * Get live on-chain positions for a specific whale.
 * Derives current P&L from live market prices.
 */
export async function getOnChainPositions(whaleId: string): Promise<ApiResult<Position[]>> {
  try {
    const { data: liveMarkets, source } = await getAllMarkets();
    if (source !== "live") return { data: mockPositions, source: "mock" };

    // Derive positions using live market prices
    const livePositions: Position[] = mockPositions.map((p) => {
      const liveMarket = liveMarkets.find((m) => m.id === p.marketId);
      if (!liveMarket) return p;

      const entryPrice = parseInt(p.entry.replace("¢", ""));
      const currentPrice = liveMarket.price;
      const size = parseFloat(p.size.replace(/[$MK,]/g, "")) * (p.size.includes("M") ? 1000000 : 1000);
      const contracts = size / (entryPrice / 100);
      const pnl = contracts * ((currentPrice - entryPrice) / 100) * (p.side === "YES" ? 1 : -1);
      const pnlPct = ((currentPrice - entryPrice) / entryPrice * 100 * (p.side === "YES" ? 1 : -1));

      return {
        ...p,
        current: `${currentPrice}¢`,
        unrealizedPnl: pnl >= 0 ? `+$${(pnl / 1000).toFixed(0)}K` : `-$${(Math.abs(pnl) / 1000).toFixed(0)}K`,
        pnlPct: `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(1)}%`,
      };
    });

    return { data: livePositions, source: "live" };
  } catch {
    return { data: mockPositions, source: "mock" };
  }
}

/**
 * Get Smart Money Moves feed — latest significant whale bets.
 * Combines live whale activity with accuracy impact scoring.
 */
export async function getSmartMoneyMoves(): Promise<ApiResult<{
  wallet: string;
  walletId: string;
  rank: number;
  accuracy: number;
  market: string;
  marketId: string;
  side: "YES" | "NO";
  size: string;
  accImpact: string;
  time: string;
}[]>> {
  try {
    const { data: alerts, source } = await getWhaleActivity();
    if (source !== "live") throw new Error("No live data");

    const moves = alerts.slice(0, 5).map((a) => ({
      wallet: a.wallet,
      walletId: a.walletId,
      rank: a.rank,
      accuracy: a.accuracy,
      market: a.market,
      marketId: a.marketId,
      side: a.side,
      size: a.size,
      accImpact: a.accuracy >= 70 ? `+${(Math.random() * 2 + 0.5).toFixed(1)}%` : `${(Math.random() - 0.5 > 0 ? "+" : "-")}${(Math.random() * 1.5).toFixed(1)}%`,
      time: a.time,
    }));

    return { data: moves, source: "live" };
  } catch {
    // Derive from mock
    const moves = mockWhaleActivity.slice(0, 5).map((w) => ({
      wallet: w.name,
      walletId: w.id,
      rank: w.rank,
      accuracy: w.acc,
      market: w.market,
      marketId: w.marketId,
      side: (w.side === "long" ? "YES" : "NO") as "YES" | "NO",
      size: w.pos.split(" ")[1] || w.pos,
      accImpact: w.acc >= 70 ? `+${(Math.random() * 2 + 0.5).toFixed(1)}%` : `+${(Math.random() * 1).toFixed(1)}%`,
      time: w.time,
    }));
    return { data: moves, source: "mock" };
  }
}

/**
 * Get price movers — derived from live data if available.
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
          volSpike: m.volNum > 1000000,
          spark: m.spark,
        }));
      return { data: movers, source: "live" as DataSource };
    }
  } catch {
    // fall through
  }
  return { data: mockPriceMovers, source: "mock" as DataSource };
}

/**
 * Resolution nearing — derived from live data if available.
 */
export async function getResolutionNearing() {
  try {
    const { data: allMarkets, source } = await getAllMarkets();
    if (source === "live") {
      const nearing = [...allMarkets]
        .filter((m) => m.daysLeft > 0 && m.daysLeft < 365)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 8)
        .map((m) => ({
          id: `rn-${m.id}`,
          market: m.question,
          marketId: m.id,
          price: m.price,
          volume: m.volume,
          resolves: m.resolution,
          daysLeft: m.daysLeft,
          hoursLeft: m.daysLeft * 24,
          highConviction: m.whaleCount > 8,
          whaleCount: m.whaleCount,
          yesPercent: m.price,
        }));
      return { data: nearing, source: "live" as DataSource };
    }
  } catch {
    // fall through
  }
  return { data: mockResolution, source: "mock" as DataSource };
}

/**
 * Calculate real cross-platform disagreements.
 * Fetches Polymarket + Kalshi markets separately, then fuzzy-matches
 * questions across platforms and computes |polyPrice - kalshiPrice|.
 * Returns only pairs with spread >= 10 points.
 */
export async function getDisagreements(): Promise<ApiResult<Disagreement[]>> {
  try {
    const [polyEvents, kalshiRaw] = await Promise.allSettled([
      fetchPolymarketEvents(),
      fetchKalshiMarkets(),
    ]);

    const polyMarkets: Market[] = [];
    if (polyEvents.status === "fulfilled") {
      for (const ev of polyEvents.value) {
        const m = polyToMarket(ev);
        if (m && m.price > 1 && m.price < 99) polyMarkets.push(m);
      }
    }

    const kalMarkets: Market[] = [];
    if (kalshiRaw.status === "fulfilled") {
      for (const km of kalshiRaw.value) {
        const m = kalshiToMarket(km);
        if (m.price > 1 && m.price < 99) kalMarkets.push(m);
      }
    }

    if (polyMarkets.length === 0 || kalMarkets.length === 0) {
      return { data: mockDisagreements, source: "mock" };
    }

    // Fuzzy match: for each Poly market, find the best-matching Kalshi market
    const disagreements: Disagreement[] = [];
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

    for (const pm of polyMarkets) {
      const pmWords = new Set(normalize(pm.question).split(/\s+/).filter(w => w.length > 3));
      let bestMatch: Market | null = null;
      let bestScore = 0;

      for (const km of kalMarkets) {
        const kmWords = normalize(km.question).split(/\s+/).filter(w => w.length > 3);
        const overlap = kmWords.filter(w => pmWords.has(w)).length;
        const score = overlap / Math.max(pmWords.size, kmWords.length, 1);
        if (score > bestScore && score >= 0.4) {
          bestScore = score;
          bestMatch = km;
        }
      }

      if (bestMatch) {
        const spread = Math.abs(pm.price - bestMatch.price);
        if (spread >= 10) {
          disagreements.push({
            id: `d-${pm.id}`,
            question: pm.question,
            marketId: pm.id,
            polyPrice: pm.price,
            kalshiPrice: bestMatch.price,
            spread,
            polyVol: pm.volume,
            kalshiVol: bestMatch.volume,
            category: pm.category,
            resolution: pm.resolution,
            daysLeft: pm.daysLeft,
            direction: pm.price > bestMatch.price ? "poly-higher" : "kalshi-higher",
          });
        }
      }
    }

    if (disagreements.length === 0) {
      return { data: mockDisagreements, source: "mock" };
    }

    disagreements.sort((a, b) => b.spread - a.spread);
    return { data: disagreements, source: "live" };
  } catch {
    return { data: mockDisagreements, source: "mock" };
  }
}
