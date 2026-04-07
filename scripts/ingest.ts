/**
 * Quiver Markets — Data Ingestion Script
 *
 * Fetches prediction market data from Polymarket + Kalshi APIs (server-side, no CORS),
 * then upserts into Supabase. Run manually or on a cron:
 *
 *   npx tsx scripts/ingest.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

// ─── CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const POLYMARKET_BASE = "https://gamma-api.polymarket.com";
const KALSHI_BASE = "https://api.elections.kalshi.com/trade-api/v2";
const DATA_API_BASE = "https://data-api.polymarket.com";
const CLOB_BASE = "https://clob.polymarket.com";

// ─── HELPERS ─────────────────────────────────────────────────────────
// Map Polymarket/Kalshi API categories to our display categories
const API_CATEGORY_MAP: Record<string, string> = {
  "politics": "Elections", "elections": "Elections",
  "sports": "Sports", "soccer": "Sports", "f1": "Sports", "golf": "Sports",
  "tennis": "Sports", "nba": "Sports", "nfl": "Sports", "mlb": "Sports",
  "nhl": "Sports", "mma": "Sports", "boxing": "Sports", "cricket": "Sports",
  "racing": "Sports", "esports": "Sports",
  "crypto": "Crypto", "cryptocurrency": "Crypto",
  "science": "Science", "technology": "Tech",
  "world": "Geopolitics", "culture": "Culture",
  "economics": "Economics", "finance": "Economics",
};

const SPORTS_KEYWORDS = [
  "league", "championship", "cup", "playoff", "champion", "match", "game",
  "tournament", "winner", "mvp", "finals", "bowl", "masters", "open",
  "grand slam", "f1", "race", "premier league", "la liga", "champions league",
  "nba", "nfl", "mlb", "nhl", "ufc", "fifa", "tennis", "golf", "soccer",
  "basketball", "football", "baseball", "hockey", "boxing", "mma",
  "division", "conference", "seeding", "draft", "win the",
  "eurovision", "sport",
];

function guessCategory(title: string, tags?: { label: string }[]): string {
  const t = title.toLowerCase();
  // Check tags first — map known tag labels to categories
  if (tags?.length) {
    for (const tag of tags) {
      const mapped = API_CATEGORY_MAP[tag.label.toLowerCase()];
      if (mapped) return mapped;
    }
  }
  // Elections
  if (t.includes("election") || t.includes("president") || t.includes("senate") || t.includes("governor") || t.includes("democrat") || t.includes("republican") || t.includes("nominee")) return "Elections";
  // Sports — broad keyword check
  if (SPORTS_KEYWORDS.some((kw) => t.includes(kw))) return "Sports";
  // Crypto
  if (t.includes("bitcoin") || t.includes("ethereum") || t.includes("crypto") || t.includes("btc") || t.includes("eth") || t.includes("solana")) return "Crypto";
  // Economics
  if (t.includes("fed") || t.includes("recession") || t.includes("gdp") || t.includes("inflation") || t.includes("rate cut") || t.includes("stock") || t.includes("s&p") || t.includes("economy") || t.includes("layoff") || t.includes("tariff")) return "Economics";
  // Tech
  if (t.includes("ai") || t.includes("openai") || t.includes("apple") || t.includes("google") || t.includes("tech") || t.includes("nvidia")) return "Tech";
  // Geopolitics
  if (t.includes("china") || t.includes("russia") || t.includes("nato") || t.includes("war") || t.includes("iran") || t.includes("eu ") || t.includes("ceasefire") || t.includes("regime")) return "Geopolitics";
  // Climate
  if (t.includes("climate") || t.includes("temperature") || t.includes("pandemic")) return "Climate";
  return "Economics";
}

function mapApiCategory(apiCat: string | undefined, title: string, tags?: { label: string }[]): string {
  if (apiCat) {
    const mapped = API_CATEGORY_MAP[apiCat.toLowerCase()];
    if (mapped) return mapped;
  }
  return guessCategory(title, tags);
}

function safeParse<T>(json: string, fallback: T): T {
  try { return JSON.parse(json); } catch { return fallback; }
}

// ─── 1. FETCH POLYMARKET EVENTS ──────────────────────────────────────
interface PolyEvent {
  id: string; slug: string; title: string; description: string;
  volume: number; liquidity: number; endDate: string; startDate?: string; createdAt: string;
  category?: string; numTraders?: number;
  tags?: { label: string }[];
  markets: {
    id: string; question: string; slug: string; groupItemTitle?: string;
    outcomePrices: string; outcomes?: string; clobTokenIds?: string;
    volume: number; volume24hr: number; liquidity: number;
    active: boolean; closed: boolean; endDate: string; createdAt: string;
  }[];
}

async function fetchPolymarketEvents(): Promise<PolyEvent[]> {
  const all: PolyEvent[] = [];
  for (let offset = 0; offset < 5000; offset += 100) {
    const url = `${POLYMARKET_BASE}/events?active=true&closed=false&limit=100&offset=${offset}&order=volume&ascending=false`;
    if (offset % 500 === 0) console.log(`  Polymarket events offset=${offset}...`);
    const res = await fetch(url);
    if (!res.ok) { console.error(`  Polymarket API ${res.status}`); break; }
    const page: PolyEvent[] = await res.json();
    if (page.length === 0) break;
    all.push(...page);
  }
  return all;
}

// ─── 2. FETCH KALSHI EVENTS ─────────────────────────────────────────
interface KalshiEvent {
  event_ticker: string; title: string; category: string; status: string;
  sub_title?: string;
  markets: {
    ticker: string; title?: string; subtitle?: string;
    yes_sub_title: string; no_sub_title: string;
    yes_bid_dollars?: string; yes_ask_dollars?: string;
    last_price_dollars?: string; previous_yes_bid_dollars?: string;
    // Legacy numeric fields (some API versions)
    yes_bid?: number; last_price?: number; previous_yes_bid?: number;
    volume_fp?: string; volume?: number;
    volume_24h_fp?: string; volume_24h?: number;
    open_interest_fp?: string; liquidity_dollars?: string; liquidity?: number;
    close_time: string; created_time: string; status: string;
  }[];
}

async function fetchKalshiEvents(): Promise<KalshiEvent[]> {
  const all: KalshiEvent[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 25; page++) {
    const url = `${KALSHI_BASE}/events?status=open&limit=200&with_nested_markets=true${cursor ? `&cursor=${cursor}` : ""}`;
    if (page % 5 === 0) console.log(`  Kalshi events page ${page + 1}...`);
    const res = await fetch(url);
    if (!res.ok) { console.error(`  Kalshi API ${res.status}`); break; }
    const data = await res.json();
    const events: KalshiEvent[] = data.events || [];
    all.push(...events);
    cursor = data.cursor;
    if (!cursor || events.length === 0) break;
  }
  return all;
}

// ─── 3. FETCH LEADERBOARD ────────────────────────────────────────────
interface LeaderboardEntry {
  rank: number;
  proxyWallet: string;
  userName: string;
  vol: number;
  pnl: number;
  profileImage?: string;
  xUsername?: string;
  verifiedBadge?: boolean;
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    console.log("  Fetching leaderboard from /v1/leaderboard...");
    const res = await fetch(`${DATA_API_BASE}/v1/leaderboard?limit=500`);
    if (!res.ok) { console.error(`  Leaderboard API ${res.status}`); return []; }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("  Leaderboard fetch error:", err);
    return [];
  }
}

// ─── 4. FETCH ACTIVITY (whale trade detection) ──────────────────────
async function fetchRecentActivity(): Promise<any[]> {
  try {
    console.log("  Fetching activity from /v1/activity...");
    const res = await fetch(`${DATA_API_BASE}/v1/activity?limit=200`);
    if (!res.ok) { console.error(`  Activity API ${res.status}`); return []; }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("  Activity fetch error:", err);
    return [];
  }
}

// ─── 5. FETCH PRICE HISTORY ──────────────────────────────────────────
async function fetchPriceHistory(tokenId: string): Promise<{ t: number; p: number }[]> {
  try {
    const res = await fetch(`${CLOB_BASE}/prices-history?market=${encodeURIComponent(tokenId)}&interval=max&fidelity=360`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.history || []).map((h: { t: number; p: string }) => ({
      t: h.t,
      p: parseFloat(h.p) || 0,
    }));
  } catch { return []; }
}

// ─── 6. UPSERT MARKETS ──────────────────────────────────────────────
async function ingestMarkets() {
  console.log("\n=== Fetching Polymarket events ===");
  const polyEvents = await fetchPolymarketEvents();
  console.log(`  Got ${polyEvents.length} events`);

  console.log("\n=== Fetching Kalshi events ===");
  const kalshiEvents = await fetchKalshiEvents();
  console.log(`  Got ${kalshiEvents.length} events`);

  // Fetch existing prices to compute real change_24h
  console.log("  Loading existing prices for change computation...");
  const { data: existingRows } = await supabase.from("markets").select("id, price");
  const oldPrices = new Map<string, number>();
  if (existingRows) {
    for (const r of existingRows) oldPrices.set(r.id, r.price);
  }
  console.log(`  Got ${oldPrices.size} existing prices`);

  const rows: any[] = [];

  // Transform Polymarket — one row per EVENT (parent question), not per outcome
  for (const ev of polyEvents) {
    if (!ev.markets?.length) continue;
    if ((ev.volume || 0) < 5000) continue; // skip low-volume noise

    const isBinary = ev.markets.length === 1;
    let price = 50;
    let tokenIds: string[] | null = null;
    let allOutcomes: string[] = ["Yes", "No"];
    let allPrices: number[] = [0.5, 0.5];

    if (isBinary) {
      const m = ev.markets[0];
      const rawPrices = safeParse<string[]>(m.outcomePrices || "[]", ["0.5", "0.5"]);
      const parsed = rawPrices.map((p: any) => parseFloat(String(p)) || 0);
      price = Math.round((parsed[0] || 0.5) * 100);
      tokenIds = m.clobTokenIds ? safeParse<string[]>(m.clobTokenIds, []) : null;
      allOutcomes = safeParse<string[]>(m.outcomes || '["Yes","No"]', ["Yes", "No"]);
      allPrices = parsed;
    } else {
      // Multi-outcome: use the highest-priced outcome as representative
      let maxPrice = 0;
      allOutcomes = [];
      allPrices = [];
      for (const m of ev.markets) {
        const rawPrices = safeParse<string[]>(m.outcomePrices || "[]", ["0"]);
        const p = parseFloat(String(rawPrices[0])) || 0;
        const label = m.groupItemTitle || m.question || "Option";
        allOutcomes.push(label);
        allPrices.push(p);
        if (p > maxPrice) {
          maxPrice = p;
          tokenIds = m.clobTokenIds ? safeParse<string[]>(m.clobTokenIds, []) : null;
        }
      }
      price = Math.round(maxPrice * 100);
    }

    if (price <= 1 || price >= 99) continue;

    const eventId = ev.slug || ev.id;
    const oldPrice = oldPrices.get(eventId);
    const change24h = oldPrice && oldPrice > 0 ? Math.round(((price - oldPrice) / oldPrice) * 1000) / 10 : 0;
    const daysLeft = Math.max(0, Math.round((new Date(ev.endDate).getTime() - Date.now()) / 86400000));
    const traders = ev.numTraders || Math.floor((ev.volume || 0) / 500);

    rows.push({
      id: eventId,
      question: ev.title,
      slug: ev.slug,
      platform: "Polymarket",
      category: mapApiCategory(ev.category, ev.title, ev.tags),
      price,
      previous_price: oldPrice ?? null,
      change_24h: change24h,
      volume: ev.volume || 0,
      volume_24h: 0,
      liquidity: ev.liquidity || 0,
      traders,
      end_date: ev.endDate || null,
      days_left: daysLeft,
      outcomes: allOutcomes,
      outcome_prices: allPrices,
      clob_token_ids: tokenIds,
      ticker: null,
      url: `https://polymarket.com/event/${ev.slug}`,
      description: ev.description || ev.title,
      resolved: false,
      resolution: null,
    });
  }

  // Transform Kalshi — one row per EVENT (parent question), not per market outcome
  for (const kev of kalshiEvents) {
    if (!kev.markets?.length) continue;

    // Helper: parse Kalshi dollar strings like "0.0800" or fallback to numeric fields
    const kPrice = (m: any) => parseFloat(m.last_price_dollars || "") || Number(m.last_price) || 0;
    const kBid = (m: any) => parseFloat(m.yes_bid_dollars || "") || Number(m.yes_bid) || 0;
    const kVol = (m: any) => parseFloat(m.volume_fp || "") || Number(m.volume) || 0;
    const kLiq = (m: any) => parseFloat(m.liquidity_dollars || "") || Number(m.liquidity) || 0;

    // Aggregate volume across all markets in this event
    const totalVol = kev.markets.reduce((s, m) => s + kVol(m), 0);
    const totalLiq = kev.markets.reduce((s, m) => s + kLiq(m), 0);
    if (totalVol < 100) continue; // skip very low volume

    const isBinary = kev.markets.length === 1;
    let price = 50;
    let bestTicker = kev.markets[0]?.ticker || kev.event_ticker;
    let closeTime = kev.markets[0]?.close_time;

    if (isBinary) {
      const m = kev.markets[0];
      price = Math.round((kPrice(m) || kBid(m) || 0.5) * 100);
      bestTicker = m.ticker;
      closeTime = m.close_time;
    } else {
      // Multi-outcome: find the highest-volume market
      let maxVol = 0;
      for (const m of kev.markets) {
        const v = kVol(m);
        if (v > maxVol) {
          maxVol = v;
          price = Math.round((kPrice(m) || kBid(m) || 0.5) * 100);
          bestTicker = m.ticker;
          closeTime = m.close_time;
        }
      }
    }

    if (price <= 1 || price >= 99) continue;

    const kalshiId = `kalshi-${kev.event_ticker.toLowerCase()}`;
    const oldKalshiPrice = oldPrices.get(kalshiId);
    const prevPrice = oldKalshiPrice ?? price;
    const change = prevPrice > 0 && prevPrice !== price ? Math.round(((price - prevPrice) / prevPrice) * 1000) / 10 : 0;
    const title = kev.title || kev.event_ticker;
    const daysLeft = closeTime ? Math.max(0, Math.round((new Date(closeTime).getTime() - Date.now()) / 86400000)) : 0;

    rows.push({
      id: kalshiId,
      question: title,
      slug: kev.event_ticker.toLowerCase(),
      platform: "Kalshi",
      category: mapApiCategory(kev.category, title),
      price,
      previous_price: oldKalshiPrice ?? null,
      change_24h: change,
      volume: totalVol,
      volume_24h: 0,
      liquidity: totalLiq,
      traders: Math.floor(totalVol / 200),
      end_date: closeTime || null,
      days_left: daysLeft,
      outcomes: kev.markets.map((m) => m.yes_sub_title || m.title || m.ticker),
      outcome_prices: kev.markets.map((m) => kPrice(m)),
      clob_token_ids: null,
      ticker: bestTicker,
      url: `https://kalshi.com/markets/${bestTicker}`,
      description: `${title} — Resolves based on official outcomes.`,
      resolved: kev.status === "settled",
      resolution: null,
    });
  }

  console.log(`\n=== Upserting ${rows.length} markets ===`);
  // Batch upsert in chunks of 500
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await supabase.from("markets").upsert(chunk, { onConflict: "id" });
    if (error) console.error(`  Upsert error (batch ${i}):`, error.message);
    else console.log(`  Upserted batch ${i}-${i + chunk.length}`);
  }

  return rows;
}

// ─── 7. INGEST PRICE HISTORY ─────────────────────────────────────────
async function ingestPriceHistory(markets: any[]) {
  // ALL Polymarket markets with clobTokenIds, sorted by volume
  const polyMarkets = markets
    .filter((m: any) => m.platform === "Polymarket" && m.clob_token_ids?.length > 0)
    .sort((a: any, b: any) => (b.volume || 0) - (a.volume || 0));

  console.log(`\n=== Fetching price history for ${polyMarkets.length} markets (all with CLOB tokens) ===`);

  let fetched = 0;
  let skipped = 0;
  for (const m of polyMarkets) {
    const tokenId = m.clob_token_ids[0];
    try {
      const points = await fetchPriceHistory(tokenId);
      if (points.length === 0) { skipped++; continue; }

      const rows = points.map((pt: { t: number; p: number }) => ({
        market_id: m.id,
        timestamp: new Date(pt.t * 1000).toISOString(),
        price: pt.p,
        volume: 0,
      }));

      // Delete old history for this market, then insert fresh
      await supabase.from("price_history").delete().eq("market_id", m.id);
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error } = await supabase.from("price_history").insert(chunk);
        if (error) console.error(`    ${m.id} insert error:`, error.message);
      }
      fetched++;
      if (fetched % 50 === 0) console.log(`  Progress: ${fetched}/${polyMarkets.length} markets (${skipped} skipped)`);
    } catch (err) {
      console.error(`  ${m.id}: fetch failed, skipping`);
      skipped++;
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(`  Done: ${fetched} markets with history, ${skipped} skipped`);
}

// ─── 8. INGEST WHALE LEADERBOARD ─────────────────────────────────────
async function ingestWhaleLeaderboard() {
  console.log("\n=== Fetching whale leaderboard ===");
  const entries = await fetchLeaderboard();
  console.log(`  Got ${entries.length} leaderboard entries`);

  if (entries.length === 0) return;

  const whaleRows = entries.map((e: any) => {
    // Clean display name: strip trailing "-<digits>" timestamp artifacts, fallback to truncated wallet
    let name = e.userName || "";
    if (!name || /^0x[a-fA-F0-9]/.test(name)) {
      name = name.replace(/-\d{5,}$/, ""); // strip "-1774116788380" style suffixes
      if (!name || /^0x[a-fA-F0-9]/.test(name)) {
        const wallet = e.proxyWallet || "";
        name = wallet.length > 10 ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : wallet;
      }
    }
    const vol = e.vol || 0;
    const marketsTraded = e.numTrades || e.marketsTraded || (vol > 0 ? Math.round(vol / 500) : 0);

    return {
      address: e.proxyWallet,
      display_name: name,
      total_pnl: e.pnl || 0,
      total_volume: vol,
      win_rate: 0,
      accuracy: 0,
      positions_count: 0,
      markets_traded: marketsTraded,
      rank: e.rank || 0,
    };
  });

  // Enrich top 25 with real position counts
  console.log("  Enriching top 25 wallets with position data...");
  for (let i = 0; i < Math.min(25, whaleRows.length); i++) {
    const wallet = whaleRows[i].address;
    try {
      const res = await fetch(`${DATA_API_BASE}/v1/positions?user=${wallet}`);
      if (res.ok) {
        const positions = await res.json();
        if (Array.isArray(positions) && positions.length > 0) {
          const uniqueMarkets = new Set(positions.map((p: any) => p.eventSlug || p.slug || p.conditionId || "unknown"));
          whaleRows[i].positions_count = positions.length;
          whaleRows[i].markets_traded = Math.max(uniqueMarkets.size, 1);
          console.log(`    ${whaleRows[i].display_name}: ${positions.length} positions, ${uniqueMarkets.size} markets`);
        }
      }
    } catch {
      // Skip this wallet, keep estimates
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const { error } = await supabase.from("whales").upsert(whaleRows, { onConflict: "address" });
  if (error) console.error("  Whales upsert error:", error.message);
  else console.log(`  Upserted ${whaleRows.length} whale profiles from leaderboard`);
}

// ─── 9. INGEST WHALE TRADES (from activity) ─────────────────────────
async function ingestWhaleTrades() {
  console.log("\n=== Fetching activity for whale trade detection ===");
  const activities = await fetchRecentActivity();
  console.log(`  Got ${activities.length} activity entries`);

  // Filter for whale-sized trades (>$10K)
  const whaleTrades = activities.filter((t: any) => {
    const size = parseFloat(t.size || t.amount || "0");
    return size > 10_000;
  });
  console.log(`  ${whaleTrades.length} whale trades (>$10K)`);

  if (whaleTrades.length === 0) return;

  const rows = whaleTrades.map((t: any, i: number) => ({
    id: t.id || t.transactionHash || `trade-${Date.now()}-${i}`,
    wallet_address: t.proxyWallet || t.owner || t.maker_address || "unknown",
    market_id: null,
    side: (t.side || t.type || "BUY").toUpperCase(),
    size_usd: parseFloat(t.size || t.amount || "0"),
    price: parseFloat(t.price || "0.5"),
    outcome: t.outcome || t.title || null,
    timestamp: t.timestamp || t.match_time || t.createdAt || new Date().toISOString(),
    transaction_hash: t.transactionHash || t.transaction_hash || null,
  }));

  const { error } = await supabase.from("whale_trades").upsert(rows, { onConflict: "id" });
  if (error) console.error("  Whale trades upsert error:", error.message);
  else console.log(`  Upserted ${rows.length} whale trades`);
}

// ─── 10. COMPUTE DISAGREEMENTS ───────────────────────────────────────
const STOPWORDS = new Set([
  "will", "what", "when", "where", "which", "have", "been", "before",
  "after", "than", "they", "this", "that", "with", "from", "into",
  "does", "much", "many", "more", "most", "about", "would", "could",
  "should", "their", "there", "these", "those", "being", "other",
  "some", "only", "also", "over", "under", "between", "through",
  "during", "2024", "2025", "2026", "2027", "2028", "2029", "2030",
  "year", "next", "first", "last",
]);

async function ingestDisagreements(markets: any[]) {
  console.log("\n=== Computing cross-platform disagreements ===");

  const polyMarkets = markets.filter((m: any) => m.platform === "Polymarket");
  const kalshiMarkets = markets.filter((m: any) => {
    if (m.platform !== "Kalshi") return false;
    const q = m.question || "";
    if (/^yes\s/i.test(q)) return false;
    if ((q.match(/yes\s/gi) || []).length >= 2) return false;
    return true;
  });
  console.log(`  Polymarket: ${polyMarkets.length}, Kalshi (filtered): ${kalshiMarkets.length}`);

  if (polyMarkets.length === 0 || kalshiMarkets.length === 0) {
    console.log("  Skipping — need markets from both platforms");
    return;
  }

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const contentWords = (s: string) =>
    normalize(s).split(/\s+/).filter((w: string) => w.length > 3 && !STOPWORDS.has(w));

  const rows: any[] = [];

  for (const pm of polyMarkets) {
    const pmWords = new Set(contentWords(pm.question));
    if (pmWords.size < 2) continue;
    let bestMatch: any = null;
    let bestScore = 0;
    let bestOverlap = 0;

    for (const km of kalshiMarkets) {
      const kmWords = contentWords(km.question);
      if (kmWords.length < 2) continue;
      const overlap = kmWords.filter((w: string) => pmWords.has(w)).length;
      if (overlap < 3) continue;
      const score = overlap / Math.max(pmWords.size, kmWords.length, 1);
      if (score > bestScore && score >= 0.4) {
        bestScore = score;
        bestOverlap = overlap;
        bestMatch = km;
      }
    }

    if (bestMatch) {
      const spread = Math.abs(pm.price - bestMatch.price);
      const priceSum = pm.price + bestMatch.price;

      // Filter 1C: Question length sanity — very different lengths = different questions
      if (Math.abs((pm.question || "").length - (bestMatch.question || "").length) > 35) continue;

      // Filter 1B: Inverse pricing detection — prices summing to ~100 are YES/NO mirrors
      if (priceSum >= 92 && priceSum <= 108) {
        console.log(`  SKIP inverse (sum=${priceSum}): "${pm.question}" ↔ "${bestMatch.question}"`);
        continue;
      }

      // Filter 1A: Spread ceiling — real disagreements don't exceed 50pt
      if (spread > 50) {
        console.log(`  SKIP spread>${50} (${spread}pt): "${pm.question}" ↔ "${bestMatch.question}"`);
        continue;
      }

      console.log(`  Match (score=${bestScore.toFixed(2)}, overlap=${bestOverlap}, spread=${spread}): "${pm.question}" ↔ "${bestMatch.question}"`);
      if (spread >= 3) {
        rows.push({
          id: `d-${pm.id}`,
          question: pm.question,
          poly_market_id: pm.id,
          kalshi_market_id: bestMatch.id,
          poly_price: pm.price,
          kalshi_price: bestMatch.price,
          spread,
          direction: pm.price > bestMatch.price ? "poly-higher" : "kalshi-higher",
          category: pm.category,
          spread_trend: "stable",
          convergence_rate: 0,
        });
      }
    }
  }

  console.log(`  Found ${rows.length} disagreements (spread >= 3pts)`);

  if (rows.length > 0) {
    // Clear old and insert fresh
    await supabase.from("disagreements").delete().neq("id", "");
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase.from("disagreements").upsert(chunk, { onConflict: "id" });
      if (error) console.error(`  Disagreements upsert error (batch ${i}):`, error.message);
      else console.log(`  Upserted batch ${i}-${i + chunk.length}`);
    }
  } else {
    console.log("  No disagreements found — clearing table");
    await supabase.from("disagreements").delete().neq("id", "");
  }
}

// ─── 11. INGEST WHALE POSITIONS ──────────────────────────────────────
async function ingestWhalePositions() {
  console.log("\n=== Fetching whale positions ===");
  const { data: whales } = await supabase.from("whales").select("address, display_name").order("total_pnl", { ascending: false });
  if (!whales?.length) { console.log("  No whales to fetch positions for"); return; }

  let total = 0;
  for (let i = 0; i < whales.length; i++) {
    const w = whales[i];
    try {
      const res = await fetch(`${DATA_API_BASE}/v1/positions?user=${w.address}`);
      if (!res.ok) continue;
      const positions = await res.json();
      if (!Array.isArray(positions) || positions.length === 0) continue;

      // Deduplicate by (whale_id, market_id, outcome) before upserting
      const seen = new Set<string>();
      const rows = [];
      for (const p of positions.slice(0, 100)) {
        const key = `${w.address}|${p.eventSlug || p.conditionId || "unknown"}|${p.outcome || "YES"}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({
          whale_id: w.address,
          market_id: p.eventSlug || p.conditionId || "unknown",
          outcome: p.outcome || "YES",
          size: p.size || 0,
          avg_price: p.avgPrice || 0,
          current_value: p.currentValue || 0,
          pnl: p.cashPnl || 0,
        });
      }

      const { error } = await supabase.from("whale_positions").upsert(rows, { onConflict: "whale_id,market_id,outcome" });
      if (error) console.error(`  ${w.display_name}: upsert error:`, error.message);
      else total += rows.length;

      if ((i + 1) % 10 === 0) console.log(`  Progress: ${i + 1}/${whales.length} whales, ${total} positions`);
    } catch {
      // skip this whale
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(`  Done: ${total} positions from ${whales.length} whales`);
}

// ─── 12. INGEST WHALE TRADES (from /v1/activity) ────────────────────
async function ingestWhaleTradesV2() {
  console.log("\n=== Fetching whale trade history ===");
  const { data: whales } = await supabase.from("whales").select("address, display_name").order("total_pnl", { ascending: false });
  if (!whales?.length) { console.log("  No whales to fetch trades for"); return; }

  let total = 0;
  for (let i = 0; i < whales.length; i++) {
    const w = whales[i];
    try {
      const res = await fetch(`${DATA_API_BASE}/v1/activity?user=${w.address}&limit=50`);
      if (!res.ok) continue;
      const activities = await res.json();
      if (!Array.isArray(activities) || activities.length === 0) continue;

      // Filter for TRADE type only
      const trades = activities.filter((a: any) => a.type === "TRADE");
      if (trades.length === 0) continue;

      const rows = trades.map((t: any) => ({
        id: t.transactionHash || `${w.address}-${t.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
        wallet_address: w.address,
        market_id: t.eventSlug || t.slug || null,
        side: t.side || "BUY",
        outcome: t.outcome || "YES",
        size_usd: t.usdcSize || (t.size * t.price) || 0,
        price: t.price || 0,
        timestamp: t.timestamp ? new Date(t.timestamp * 1000).toISOString() : new Date().toISOString(),
        transaction_hash: t.transactionHash || null,
      }));

      // Upsert on id (tx hash), ignore duplicates
      const { error } = await supabase.from("whale_trades").upsert(rows, {
        onConflict: "id",
        ignoreDuplicates: true,
      });
      if (error && !error.message.includes("duplicate")) {
        console.error(`  ${w.display_name}: trade upsert error:`, error.message);
      } else {
        total += rows.length;
      }

      if ((i + 1) % 10 === 0) console.log(`  Progress: ${i + 1}/${whales.length} whales, ${total} trades`);
    } catch {
      // skip this whale
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(`  Done: ${total} trades from ${whales.length} whales`);
}

// ─── 13. SNAPSHOT DISAGREEMENTS ──────────────────────────────────────
async function snapshotDisagreements() {
  console.log("\n=== Snapshotting disagreements ===");
  // Re-read from the table (may have just been upserted)
  const { data: disagreements } = await supabase.from("disagreements").select("*").order("spread", { ascending: false });
  if (!disagreements?.length) {
    console.log("  No disagreements to snapshot — table may be empty");
    return;
  }

  const snapshots = disagreements.map((d: any) => ({
    poly_market_id: d.poly_market_id,
    kalshi_market_id: d.kalshi_market_id,
    question: d.question,
    poly_price: d.poly_price,
    kalshi_price: d.kalshi_price,
    spread: d.spread,
    poly_volume: null,
    kalshi_volume: null,
  }));

  const { error } = await supabase.from("disagreement_snapshots").insert(snapshots);
  if (error) console.error("  Snapshot insert error:", error.message);
  else console.log(`  Inserted ${snapshots.length} disagreement snapshots`);
}

// ─── MAIN ────────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║  Quiver Markets — Data Ingestion         ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log(`  Supabase: ${SUPABASE_URL}`);

  const markets = await ingestMarkets();
  await ingestPriceHistory(markets);
  await ingestWhaleLeaderboard();
  await ingestWhaleTrades();
  await ingestWhalePositions();
  await ingestWhaleTradesV2();
  await ingestDisagreements(markets);
  await snapshotDisagreements();

  console.log("\n✓ Ingestion complete!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
