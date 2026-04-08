/**
 * Session 29 — Fetch Kalshi Candlestick Data
 * Pulls top 50 active Kalshi markets, fetches 30d of 1h candles from the
 * Kalshi public API, and upserts into market_candles table.
 *
 * Run: npx tsx scripts/fetch-kalshi-candles.ts
 *
 * NOTE: Apply scripts/migrations/session29_candles.sql before running.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const KALSHI_BASE = "https://api.elections.kalshi.com/trade-api/v2";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Parse a Kalshi market ID to (series_ticker, market_ticker).
 *
 * Market IDs are stored as:  "kalshi-kxnyaibill-27jan01"
 * Kalshi ticker format:       "KXNYAIBILL-27JAN01"
 * Series ticker:              "KXNYAIBILL"  (everything before the first dash in the ticker)
 *
 * Steps:
 *   1. Strip "kalshi-" prefix          → "kxnyaibill-27jan01"
 *   2. Uppercase                        → "KXNYAIBILL-27JAN01"
 *   3. series = everything before first dash → "KXNYAIBILL"
 *   4. market = full uppercased ticker  → "KXNYAIBILL-27JAN01"
 */
function parseKalshiId(marketId: string): { series: string; ticker: string } | null {
  const stripped = marketId.replace(/^kalshi-/i, "");
  if (!stripped || stripped === marketId) return null; // not a kalshi ID
  const upper = stripped.toUpperCase();
  const dashIdx = upper.indexOf("-");
  const series = dashIdx > 0 ? upper.slice(0, dashIdx) : upper;
  return { series, ticker: upper };
}

async function fetchCandles(
  series: string,
  ticker: string,
  startTs: number,
  endTs: number,
  periodMinutes = 60
): Promise<Array<{ ts: number; open: number; high: number; low: number; close: number; volume: number }>> {
  const url =
    `${KALSHI_BASE}/series/${series}/markets/${ticker}/candlesticks` +
    `?start_ts=${startTs}&end_ts=${endTs}&period_interval=${periodMinutes}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });

  if (res.status === 404) return []; // market has no candle data yet
  if (!res.ok) {
    console.warn(`    Kalshi ${res.status} for ${ticker}`);
    return [];
  }

  const json = await res.json();
  const items: any[] = json?.candlesticks ?? json?.candles ?? json?.data ?? [];
  if (!Array.isArray(items) || items.length === 0) return [];

  return items.map((c: any) => ({
    ts: typeof c.ts === "number" ? c.ts : Math.floor(new Date(c.ts ?? c.end_period_ts).getTime() / 1000),
    open: Number(c.yes_price?.open ?? c.open ?? 0) / 100,    // Kalshi prices are cents
    high: Number(c.yes_price?.high ?? c.high ?? 0) / 100,
    low: Number(c.yes_price?.low ?? c.low ?? 0) / 100,
    close: Number(c.yes_price?.close ?? c.close ?? 0) / 100,
    volume: Number(c.volume ?? c.yes_volume ?? 0),
  })).filter((c) => c.open > 0 || c.close > 0);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  // Verify table exists
  const { error: pingErr } = await supabase.from("market_candles").select("id").limit(1);
  if (pingErr) {
    if (pingErr.message.includes("does not exist") || pingErr.code === "42P01") {
      console.error(
        "❌ market_candles table not found.\n" +
        "   Apply scripts/migrations/session29_candles.sql in Supabase SQL Editor first."
      );
      process.exit(1);
    }
    console.warn("Ping warning (continuing):", pingErr.message);
  }

  // Fetch top 50 active Kalshi markets by volume
  const { data: markets, error: mErr } = await supabase
    .from("markets")
    .select("id, volume")
    .ilike("id", "kalshi-%")
    .eq("resolved", false)
    .order("volume", { ascending: false, nullsFirst: false })
    .limit(50);

  if (mErr || !markets?.length) {
    console.error("Failed to load Kalshi markets:", mErr?.message ?? "no results");
    process.exit(1);
  }

  console.log(`Found ${markets.length} active Kalshi markets to process`);

  const endTs = Math.floor(Date.now() / 1000);
  const startTs = endTs - 30 * 24 * 60 * 60; // 30 days ago

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let totalCandles = 0;

  for (const m of markets) {
    const parsed = parseKalshiId(m.id);
    if (!parsed) { console.log(`  skip ${m.id} (not a Kalshi ID)`); skipCount++; continue; }

    const { series, ticker } = parsed;
    process.stdout.write(`  ${ticker} ... `);

    try {
      const candles = await fetchCandles(series, ticker, startTs, endTs, 60);

      if (candles.length === 0) {
        console.log("no data");
        skipCount++;
        continue;
      }

      // Upsert in batches of 200
      const rows = candles.map((c) => ({
        market_id: m.id,
        timestamp: new Date(c.ts * 1000).toISOString(),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        period_minutes: 60,
        source: "kalshi",
      }));

      const BATCH = 200;
      for (let i = 0; i < rows.length; i += BATCH) {
        const { error } = await supabase
          .from("market_candles")
          .upsert(rows.slice(i, i + BATCH), { onConflict: "market_id,timestamp,period_minutes" });
        if (error) throw error;
      }

      totalCandles += candles.length;
      console.log(`${candles.length} candles`);
      successCount++;
    } catch (err: any) {
      console.log(`error: ${err.message}`);
      errorCount++;
    }

    // Polite rate limiting — Kalshi public API allows ~10 req/sec
    await new Promise((r) => setTimeout(r, 120));
  }

  console.log(`\nDone: ${successCount} markets, ${totalCandles} candles upserted, ${skipCount} skipped, ${errorCount} errors`);
}

main().catch(console.error);
