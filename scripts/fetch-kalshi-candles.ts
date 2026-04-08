/**
 * Session 29 — Fetch Kalshi Candlestick Data
 * Pulls top 50 active Kalshi markets, resolves each event ticker → best sub-market ticker,
 * fetches 30d of 1h candles from the Kalshi public API, and upserts into market_candles table.
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

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Parse a Kalshi market ID to the event ticker.
 * "kalshi-kxnba-26" → "KXNBA-26"
 */
function parseEventTicker(marketId: string): string | null {
  const stripped = marketId.replace(/^kalshi-/i, "");
  if (!stripped || stripped === marketId) return null;
  return stripped.toUpperCase();
}

/**
 * Fetch the Kalshi event and return the best sub-market ticker and series ticker.
 * For binary events (1 market), market ticker = event markets[0].ticker.
 * For multi-outcome, pick highest volume sub-market.
 * Returns null on API error.
 */
async function fetchEventInfo(
  eventTicker: string
): Promise<{ series: string; marketTicker: string } | null> {
  const url = `${KALSHI_BASE}/events/${eventTicker}?with_nested_markets=true`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const event = json.event;
    if (!event) return null;

    const series: string =
      event.series_ticker || eventTicker.split("-")[0];

    const markets: Array<{ ticker: string; volume: number }> = (
      event.markets || []
    ).map((m: any) => ({
      ticker: m.ticker as string,
      volume:
        parseFloat(m.volume_fp || "") || Number(m.volume) || 0,
    }));

    if (markets.length === 0) return null;

    // Pick highest-volume sub-market (same logic as ingest.ts bestTicker)
    let best = markets[0];
    for (const m of markets) {
      if (m.volume > best.volume) best = m;
    }

    return { series, marketTicker: best.ticker };
  } catch {
    return null;
  }
}

/**
 * Fetch candlestick data for a specific market ticker.
 * Handles both old API shape (yes_price cents) and new shape (price.*_dollars strings).
 */
async function fetchCandles(
  series: string,
  marketTicker: string,
  startTs: number,
  endTs: number,
  periodMinutes = 60
): Promise<
  Array<{
    ts: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>
> {
  const url =
    `${KALSHI_BASE}/series/${series}/markets/${marketTicker}/candlesticks` +
    `?start_ts=${startTs}&end_ts=${endTs}&period_interval=${periodMinutes}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return [];
  }

  if (res.status === 429) {
    // Rate limited — wait 2s and retry once
    await delay(2_000);
    try {
      res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      return [];
    }
  }

  if (res.status === 404) return [];
  if (!res.ok) {
    console.warn(`    Kalshi ${res.status} for ${marketTicker}`);
    return [];
  }

  const json = await res.json();
  const items: any[] = json?.candlesticks ?? json?.candles ?? json?.data ?? [];
  if (!Array.isArray(items) || items.length === 0) return [];

  return items
    .map((c: any) => {
      // New API shape: price.{open,high,low,close}_dollars (decimal strings)
      const newShape = c.price && typeof c.price.close_dollars === "string";
      const open = newShape
        ? parseFloat(c.price.open_dollars || "0")
        : Number(c.yes_price?.open ?? c.open ?? 0) / 100;
      const high = newShape
        ? parseFloat(c.price.high_dollars || "0")
        : Number(c.yes_price?.high ?? c.high ?? 0) / 100;
      const low = newShape
        ? parseFloat(c.price.low_dollars || "0")
        : Number(c.yes_price?.low ?? c.low ?? 0) / 100;
      const close = newShape
        ? parseFloat(c.price.close_dollars || "0")
        : Number(c.yes_price?.close ?? c.close ?? 0) / 100;

      // Timestamp: prefer end_period_ts (new shape), then ts
      const ts =
        typeof c.end_period_ts === "number"
          ? c.end_period_ts
          : typeof c.ts === "number"
          ? c.ts
          : Math.floor(
              new Date(c.end_period_ts ?? c.ts ?? 0).getTime() / 1000
            );

      const volume =
        parseFloat(c.volume_fp || "") || Number(c.volume ?? c.yes_volume ?? 0);

      return { ts, open, high, low, close, volume };
    })
    .filter((c) => c.open > 0 || c.close > 0);
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
    const eventTicker = parseEventTicker(m.id);
    if (!eventTicker) {
      console.log(`  skip ${m.id} (not a Kalshi ID)`);
      skipCount++;
      continue;
    }

    process.stdout.write(`  ${eventTicker} ... `);

    // Step 1: resolve event → series + best sub-market ticker
    const info = await fetchEventInfo(eventTicker);
    await delay(400); // polite gap between event lookup and candle fetch

    if (!info) {
      console.log("event not found");
      skipCount++;
      continue;
    }

    const { series, marketTicker } = info;

    // Step 2: fetch candles for the resolved market ticker
    let candles: Awaited<ReturnType<typeof fetchCandles>>;
    try {
      candles = await fetchCandles(series, marketTicker, startTs, endTs, 60);
    } catch (err: any) {
      console.log(`fetch error: ${err.message}`);
      errorCount++;
      await delay(500);
      continue;
    }

    if (candles.length === 0) {
      console.log(`no data (${marketTicker})`);
      skipCount++;
      await delay(500);
      continue;
    }

    // Upsert in batches of 200
    try {
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
          .upsert(rows.slice(i, i + BATCH), {
            onConflict: "market_id,timestamp,period_minutes",
          });
        if (error) throw error;
      }

      totalCandles += candles.length;
      console.log(`${candles.length} candles (${marketTicker})`);
      successCount++;
    } catch (err: any) {
      console.log(`upsert error: ${err.message}`);
      errorCount++;
    }

    // Polite delay between markets (events API + candles API = ~2 calls/market)
    await delay(500);
  }

  console.log(
    `\nDone: ${successCount} markets, ${totalCandles} candles upserted, ${skipCount} skipped, ${errorCount} errors`
  );
}

main().catch(console.error);
