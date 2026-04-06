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

function safeParse<T>(json: string, fallback: T): T {
  try { return JSON.parse(json); } catch { return fallback; }
}

// ─── 1. FETCH POLYMARKET ─────────────────────────────────────────────
interface PolyEvent {
  id: string; slug: string; title: string; description: string;
  volume: number; liquidity: number; endDate: string; createdAt: string;
  tags?: { label: string }[];
  markets: {
    id: string; question: string; slug: string;
    outcomePrices: string; outcomes?: string; clobTokenIds?: string;
    volume: number; volume24hr: number; liquidity: number;
    active: boolean; closed: boolean; endDate: string; createdAt: string;
  }[];
}

async function fetchPolymarketEvents(): Promise<PolyEvent[]> {
  const all: PolyEvent[] = [];
  for (let offset = 0; offset < 500; offset += 100) {
    const url = `${POLYMARKET_BASE}/events?active=true&closed=false&limit=100&offset=${offset}&order=volume&ascending=false`;
    console.log(`  Polymarket page offset=${offset}...`);
    const res = await fetch(url);
    if (!res.ok) { console.error(`  Polymarket API ${res.status}`); break; }
    const page: PolyEvent[] = await res.json();
    if (page.length === 0) break;
    all.push(...page);
  }
  return all;
}

// ─── 2. FETCH KALSHI ─────────────────────────────────────────────────
interface KalshiMarketRaw {
  ticker: string; event_ticker: string; title?: string; subtitle?: string;
  yes_sub_title: string; no_sub_title: string;
  yes_bid: number; yes_ask: number; last_price: number; previous_yes_bid: number;
  volume: number; volume_24h: number; open_interest: number; liquidity: number;
  close_time: string; created_time: string; status: string;
}

async function fetchKalshiMarkets(): Promise<KalshiMarketRaw[]> {
  const all: KalshiMarketRaw[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 5; page++) {
    const url = `${KALSHI_BASE}/markets?status=open&limit=200${cursor ? `&cursor=${cursor}` : ""}`;
    console.log(`  Kalshi page ${page + 1}...`);
    const res = await fetch(url);
    if (!res.ok) { console.error(`  Kalshi API ${res.status}`); break; }
    const data = await res.json();
    const markets: KalshiMarketRaw[] = data.markets || [];
    all.push(...markets);
    cursor = data.cursor;
    if (!cursor || markets.length === 0) break;
  }
  return all;
}

// ─── 3. FETCH TRADES (whale detection) ───────────────────────────────
async function fetchRecentTrades(): Promise<any[]> {
  try {
    const res = await fetch(`${DATA_API_BASE}/trades?limit=100`);
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

// ─── 4. FETCH PRICE HISTORY ──────────────────────────────────────────
async function fetchPriceHistory(tokenId: string): Promise<{ t: number; p: number }[]> {
  try {
    const res = await fetch(`${CLOB_BASE}/prices-history?market=${encodeURIComponent(tokenId)}&interval=max&fidelity=100`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.history || []).map((h: { t: number; p: string }) => ({
      t: h.t,
      p: parseFloat(h.p) || 0,
    }));
  } catch { return []; }
}

// ─── 5. UPSERT MARKETS ──────────────────────────────────────────────
async function ingestMarkets() {
  console.log("\n=== Fetching Polymarket events ===");
  const polyEvents = await fetchPolymarketEvents();
  console.log(`  Got ${polyEvents.length} events`);

  console.log("\n=== Fetching Kalshi markets ===");
  const kalshiMarkets = await fetchKalshiMarkets();
  console.log(`  Got ${kalshiMarkets.length} markets`);

  const rows: any[] = [];

  // Transform Polymarket
  for (const ev of polyEvents) {
    const m = ev.markets?.[0];
    if (!m) continue;
    const prices = safeParse<number[]>(m.outcomePrices || "[]", [0.5, 0.5]).map(Number);
    const outcomes = safeParse<string[]>(m.outcomes || '["Yes","No"]', ["Yes", "No"]);
    const tokenIds = m.clobTokenIds ? safeParse<string[]>(m.clobTokenIds, []) : null;
    const price = Math.round((prices[0] || 0.5) * 100);
    if (price <= 1 || price >= 99) continue;

    const daysLeft = Math.max(0, Math.round((new Date(m.endDate || ev.endDate).getTime() - Date.now()) / 86400000));
    rows.push({
      id: m.slug || ev.slug || m.id,
      question: m.question || ev.title,
      slug: m.slug || ev.slug,
      platform: "Polymarket",
      category: guessCategory(m.question || ev.title, ev.tags),
      price,
      previous_price: null,
      change_24h: 0,
      volume: m.volume || ev.volume || 0,
      volume_24h: m.volume24hr || 0,
      liquidity: m.liquidity || 0,
      traders: Math.floor((m.volume || 0) / 500) + 100,
      end_date: m.endDate || ev.endDate || null,
      days_left: daysLeft,
      outcomes,
      outcome_prices: prices,
      clob_token_ids: tokenIds,
      ticker: null,
      url: `https://polymarket.com/event/${ev.slug}`,
      description: ev.description || m.question || ev.title,
      resolved: m.closed,
      resolution: null,
    });
  }

  // Transform Kalshi
  for (const km of kalshiMarkets) {
    const price = Math.round((km.last_price || km.yes_bid || 0.5) * 100);
    if (price <= 1 || price >= 99) continue;
    const prevPrice = Math.round((km.previous_yes_bid || km.last_price || 0.5) * 100);
    const change = prevPrice > 0 ? Math.round(((price - prevPrice) / prevPrice) * 1000) / 10 : 0;
    const title = km.title || km.subtitle || km.yes_sub_title || km.ticker;
    const daysLeft = Math.max(0, Math.round((new Date(km.close_time).getTime() - Date.now()) / 86400000));

    rows.push({
      id: km.ticker.toLowerCase(),
      question: title,
      slug: km.ticker.toLowerCase(),
      platform: "Kalshi",
      category: guessCategory(title),
      price,
      previous_price: prevPrice,
      change_24h: change,
      volume: km.volume || 0,
      volume_24h: km.volume_24h || 0,
      liquidity: km.liquidity || 0,
      traders: Math.floor((km.volume || 0) / 200) + 50,
      end_date: km.close_time || null,
      days_left: daysLeft,
      outcomes: ["Yes", "No"],
      outcome_prices: [km.last_price || 0.5, 1 - (km.last_price || 0.5)],
      clob_token_ids: null,
      ticker: km.ticker,
      url: `https://kalshi.com/markets/${km.ticker}`,
      description: `${title} — Resolves based on official outcomes.`,
      resolved: km.status === "settled",
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

// ─── 6. INGEST PRICE HISTORY ─────────────────────────────────────────
async function ingestPriceHistory(markets: any[]) {
  // Get top 20 Polymarket markets with clobTokenIds
  const polyMarkets = markets
    .filter((m: any) => m.platform === "Polymarket" && m.clob_token_ids?.length > 0)
    .sort((a: any, b: any) => (b.volume || 0) - (a.volume || 0))
    .slice(0, 20);

  console.log(`\n=== Fetching price history for ${polyMarkets.length} markets ===`);

  for (const m of polyMarkets) {
    const tokenId = m.clob_token_ids[0];
    console.log(`  ${m.id}: fetching CLOB history...`);
    const points = await fetchPriceHistory(tokenId);
    if (points.length === 0) { console.log(`    No data`); continue; }

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
      if (error) console.error(`    Insert error:`, error.message);
    }
    console.log(`    Inserted ${rows.length} points`);

    // Rate limit: small delay between markets
    await new Promise((r) => setTimeout(r, 200));
  }
}

// ─── 7. INGEST WHALE TRADES ─────────────────────────────────────────
async function ingestWhaleTrades() {
  console.log("\n=== Fetching recent trades (whale detection) ===");
  const trades = await fetchRecentTrades();
  console.log(`  Got ${trades.length} trades`);

  // Filter for whale-sized trades (>$10K)
  const whaleTrades = trades.filter((t: any) => parseFloat(t.size) > 10000);
  console.log(`  ${whaleTrades.length} whale trades (>$10K)`);

  if (whaleTrades.length === 0) return;

  const rows = whaleTrades.map((t: any) => ({
    id: t.id || `trade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    wallet_address: t.owner || t.maker_address || "unknown",
    market_id: null, // Can't reliably map condition IDs to our market slugs
    side: t.side || "BUY",
    size_usd: parseFloat(t.size) || 0,
    price: parseFloat(t.price) || 0,
    outcome: t.outcome || null,
    timestamp: t.match_time || new Date().toISOString(),
    transaction_hash: t.transaction_hash || null,
  }));

  const { error } = await supabase.from("whale_trades").upsert(rows, { onConflict: "id" });
  if (error) console.error("  Whale trades upsert error:", error.message);
  else console.log(`  Upserted ${rows.length} whale trades`);

  // Aggregate whale stats from trades
  const walletMap = new Map<string, { volume: number; count: number }>();
  for (const t of whaleTrades) {
    const addr = t.owner || t.maker_address;
    if (!addr) continue;
    const existing = walletMap.get(addr) || { volume: 0, count: 0 };
    existing.volume += parseFloat(t.size) || 0;
    existing.count += 1;
    walletMap.set(addr, existing);
  }

  const whaleRows = Array.from(walletMap.entries())
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 50)
    .map(([addr, stats], i) => ({
      address: addr,
      display_name: `${addr.slice(0, 6)}...${addr.slice(-4)}`,
      total_pnl: 0,
      total_volume: stats.volume,
      win_rate: 0,
      accuracy: 0,
      positions_count: stats.count,
      markets_traded: stats.count,
      rank: i + 1,
    }));

  if (whaleRows.length > 0) {
    const { error: wErr } = await supabase.from("whales").upsert(whaleRows, { onConflict: "address" });
    if (wErr) console.error("  Whales upsert error:", wErr.message);
    else console.log(`  Upserted ${whaleRows.length} whale profiles`);
  }
}

// ─── 8. COMPUTE DISAGREEMENTS ────────────────────────────────────────
async function ingestDisagreements(markets: any[]) {
  console.log("\n=== Computing cross-platform disagreements ===");

  const polyMarkets = markets.filter((m: any) => m.platform === "Polymarket");
  const kalshiMarkets = markets.filter((m: any) => m.platform === "Kalshi");

  if (polyMarkets.length === 0 || kalshiMarkets.length === 0) {
    console.log("  Skipping — need markets from both platforms");
    return;
  }

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const rows: any[] = [];

  for (const pm of polyMarkets) {
    const pmWords = new Set(normalize(pm.question).split(/\s+/).filter((w: string) => w.length > 3));
    let bestMatch: any = null;
    let bestScore = 0;

    for (const km of kalshiMarkets) {
      const kmWords = normalize(km.question).split(/\s+/).filter((w: string) => w.length > 3);
      const overlap = kmWords.filter((w: string) => pmWords.has(w)).length;
      const score = overlap / Math.max(pmWords.size, kmWords.length, 1);
      if (score > bestScore && score >= 0.4) {
        bestScore = score;
        bestMatch = km;
      }
    }

    if (bestMatch) {
      const spread = Math.abs(pm.price - bestMatch.price);
      if (spread >= 5) {
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

  console.log(`  Found ${rows.length} disagreements (spread >= 5pts)`);

  if (rows.length > 0) {
    // Clear old and insert fresh
    await supabase.from("disagreements").delete().neq("id", "");
    const { error } = await supabase.from("disagreements").upsert(rows, { onConflict: "id" });
    if (error) console.error("  Disagreements upsert error:", error.message);
    else console.log(`  Upserted ${rows.length} disagreements`);
  }
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
  await ingestWhaleTrades();
  await ingestDisagreements(markets);

  console.log("\n✓ Ingestion complete!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
