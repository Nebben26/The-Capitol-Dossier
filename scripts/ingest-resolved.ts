/**
 * Quiver Markets — Resolved Market Ingestion
 *
 * Fetches CLOSED/SETTLED markets from Polymarket + Kalshi and upserts them
 * into the markets table with resolved=true and an outcome field.
 *
 * Run manually (separate from main ingest):
 *   npx tsx scripts/ingest-resolved.ts
 *
 * NOTE: If either platform's API shape doesn't match expectations, the script
 * logs the actual shape and skips that platform — it never breaks the live data.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const POLYMARKET_BASE = "https://gamma-api.polymarket.com";
const KALSHI_BASE = "https://api.elections.kalshi.com/trade-api/v2";

function safeParse<T>(json: string, fallback: T): T {
  try { return JSON.parse(json); } catch { return fallback; }
}

// ─── POLYMARKET RESOLVED ─────────────────────────────────────────────────────

async function ingestPolymarketResolved(): Promise<number> {
  console.log("\n=== Polymarket resolved markets ===");
  const rows: any[] = [];
  let offset = 0;
  const limit = 500;
  let pageCount = 0;

  while (pageCount < 10) { // max 5,000 records
    const url = `${POLYMARKET_BASE}/markets?closed=true&limit=${limit}&offset=${offset}`;
    let res: Response;
    try {
      res = await fetch(url);
    } catch (err) {
      console.error("  Polymarket fetch error:", err);
      break;
    }

    if (!res.ok) {
      console.error(`  Polymarket HTTP ${res.status} at offset=${offset}`);
      break;
    }

    let data: any;
    try {
      data = await res.json();
    } catch (err) {
      console.error("  Polymarket JSON parse error:", err);
      break;
    }

    // Validate shape — Polymarket returns an array directly
    if (!Array.isArray(data)) {
      console.warn("  Unexpected Polymarket shape (expected array):", JSON.stringify(data).slice(0, 300));
      // TODO: Polymarket closed markets endpoint may return a different shape than expected.
      //       Log above shows actual shape. Update parsing below once confirmed.
      break;
    }

    if (data.length === 0) {
      console.log(`  Polymarket: no more results at offset=${offset}`);
      break;
    }

    for (const m of data) {
      // Determine outcome from outcomePrices: the winning outcome has price ≈ 1.0
      const outcomePrices: number[] = safeParse(m.outcomePrices ?? "[]", []);
      const outcomes: string[] = safeParse(m.outcomes ?? '["YES","NO"]', ["YES", "NO"]);
      let outcome = "";
      if (outcomePrices.length > 0 && outcomes.length > 0) {
        const winIdx = outcomePrices.findIndex((p: number) => parseFloat(String(p)) >= 0.95);
        if (winIdx >= 0) outcome = outcomes[winIdx] ?? "";
      }

      const price = parseFloat(String(outcomePrices[0] ?? 0)) * 100;

      rows.push({
        id: String(m.id ?? m.conditionId),
        question: m.question ?? m.title ?? "",
        platform: "Polymarket",
        price: Math.round(price),
        volume: typeof m.volume === "number" ? m.volume : parseFloat(m.volume ?? "0"),
        change_24h: 0,
        category: "Economics",
        resolved: true,
        outcome,
        end_date: m.endDate ?? m.end_date_iso ?? null,
        days_left: 0,
        resolution: outcome || "Resolved",
        created_at: m.createdAt ?? new Date().toISOString(),
      });
    }

    console.log(`  Polymarket page ${pageCount + 1}: ${data.length} markets (offset=${offset})`);
    offset += limit;
    pageCount++;

    if (data.length < limit) break; // last page
  }

  if (rows.length === 0) {
    console.log("  No Polymarket resolved markets to upsert.");
    return 0;
  }

  let upserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const { error } = await supabase
      .from("markets")
      .upsert(chunk, { onConflict: "id" });
    if (error) console.error(`  Upsert error (batch ${i}):`, error.message);
    else upserted += chunk.length;
  }

  console.log(`  Upserted ${upserted} Polymarket resolved markets.`);
  return upserted;
}

// ─── KALSHI RESOLVED ─────────────────────────────────────────────────────────

async function ingestKalshiResolved(): Promise<number> {
  console.log("\n=== Kalshi settled markets ===");
  const rows: any[] = [];
  let cursor: string | null = null;
  let pageCount = 0;

  while (pageCount < 20) { // max 2,000 records (Kalshi cursor paginates 100/page)
    const params = new URLSearchParams({ status: "settled", limit: "100" });
    if (cursor) params.set("cursor", cursor);
    const url = `${KALSHI_BASE}/markets?${params}`;

    let res: Response;
    try {
      res = await fetch(url);
    } catch (err) {
      console.error("  Kalshi fetch error:", err);
      break;
    }

    if (!res.ok) {
      console.error(`  Kalshi HTTP ${res.status}`);
      break;
    }

    let data: any;
    try {
      data = await res.json();
    } catch (err) {
      console.error("  Kalshi JSON parse error:", err);
      break;
    }

    // Validate shape
    if (!data || !Array.isArray(data.markets)) {
      console.warn("  Unexpected Kalshi shape (expected {markets, cursor}):", JSON.stringify(data).slice(0, 300));
      // TODO: Kalshi settled markets endpoint may return a different shape.
      //       Inspect log above for actual shape and update parsing accordingly.
      break;
    }

    if (data.markets.length === 0) {
      console.log(`  Kalshi: no more results at page ${pageCount}`);
      break;
    }

    for (const m of data.markets) {
      // Kalshi result field: "yes" | "no" | null
      const rawOutcome = m.result ?? "";
      const outcome = rawOutcome.toLowerCase() === "yes" ? "YES" : rawOutcome.toLowerCase() === "no" ? "NO" : "";
      const price = outcome === "YES" ? 100 : outcome === "NO" ? 0 : parseFloat(m.last_price ?? "50");

      rows.push({
        id: m.ticker ?? m.id,
        question: m.title ?? m.ticker ?? "",
        platform: "Kalshi",
        price: Math.round(price),
        volume: parseFloat(m.dollar_volume ?? m.volume ?? "0"),
        change_24h: 0,
        category: "Economics",
        resolved: true,
        outcome,
        end_date: m.close_time ?? m.expected_expiration_time ?? null,
        days_left: 0,
        resolution: outcome || "Settled",
        created_at: m.open_time ?? new Date().toISOString(),
      });
    }

    console.log(`  Kalshi page ${pageCount + 1}: ${data.markets.length} markets`);
    cursor = data.cursor ?? null;
    pageCount++;

    if (!cursor || data.markets.length < 100) break;
  }

  if (rows.length === 0) {
    console.log("  No Kalshi settled markets to upsert.");
    return 0;
  }

  let upserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const { error } = await supabase
      .from("markets")
      .upsert(chunk, { onConflict: "id" });
    if (error) console.error(`  Upsert error (batch ${i}):`, error.message);
    else upserted += chunk.length;
  }

  console.log(`  Upserted ${upserted} Kalshi settled markets.`);
  return upserted;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Quiver Markets — Resolved Market Ingestion");
  console.log("==========================================");

  const polyCount = await ingestPolymarketResolved().catch((err) => {
    console.error("Polymarket resolved ingestion crashed:", err);
    return 0;
  });

  const kalshiCount = await ingestKalshiResolved().catch((err) => {
    console.error("Kalshi resolved ingestion crashed:", err);
    return 0;
  });

  console.log("\n=== Done ===");
  console.log(`  Polymarket resolved: ${polyCount}`);
  console.log(`  Kalshi settled:      ${kalshiCount}`);
  console.log(`  Total upserted:      ${polyCount + kalshiCount}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
