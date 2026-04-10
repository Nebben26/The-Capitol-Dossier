/**
 * Quiver Markets — Correlation Computation Script
 *
 * Computes Pearson correlations between the top 500 markets by volume
 * over a 14-day price history window, then upserts results to the
 * correlations table.
 *
 *   npx tsx scripts/compute-correlations.ts
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

// ─── PEARSON ─────────────────────────────────────────────────────────
function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

// ─── ALIGN SERIES ────────────────────────────────────────────────────
function alignSeries(
  a: { t: number; p: number }[],
  b: { t: number; p: number }[],
): [number[], number[]] {
  // Collect union of all timestamps
  const tsSet = new Set<number>();
  for (const pt of a) tsSet.add(pt.t);
  for (const pt of b) tsSet.add(pt.t);
  const timestamps = Array.from(tsSet).sort((x, y) => x - y);

  const xs: number[] = [];
  const ys: number[] = [];

  for (const ts of timestamps) {
    // Find most recent price at-or-before ts in series A
    let pa: number | null = null;
    for (let i = a.length - 1; i >= 0; i--) {
      if (a[i].t <= ts) { pa = a[i].p; break; }
    }
    // Find most recent price at-or-before ts in series B
    let pb: number | null = null;
    for (let i = b.length - 1; i >= 0; i--) {
      if (b[i].t <= ts) { pb = b[i].p; break; }
    }
    if (pa === null || pb === null) continue;
    xs.push(pa);
    ys.push(pb);
  }

  return [xs, ys];
}

// ─── MAIN ─────────────────────────────────────────────────────────────
async function main() {
  console.log("\n=== Quiver Markets — Correlation Computation ===");

  // ── STEP 1: Schema reload ─────────────────────────────────────────
  try { await supabase.rpc("notify_pgrst_reload"); } catch { /* ignore */ }
  await new Promise((r) => setTimeout(r, 2000));

  // ── STEP 2: Fetch top 500 markets with price history ──────────────
  console.log("\n=== Fetching top 500 markets with price history ===");
  const { data: marketRows, error: marketsErr } = await supabase
    .from("markets")
    .select("id, question, volume, platform")
    .eq("resolved", false)
    .order("volume", { ascending: false })
    .limit(500);

  if (marketsErr || !marketRows?.length) {
    console.error("Failed to fetch markets:", marketsErr?.message);
    process.exit(1);
  }

  // Filter to only those that have price history
  const marketIds = marketRows.map((m) => m.id);
  const { data: historyMarketIds } = await supabase
    .from("price_history")
    .select("market_id")
    .in("market_id", marketIds);

  const withHistory = new Set((historyMarketIds || []).map((r: any) => r.market_id));
  const markets = marketRows.filter((m) => withHistory.has(m.id));

  console.log(`Loaded ${markets.length} markets with price history`);

  if (markets.length < 2) {
    console.log("Not enough markets with price history. Exiting.");
    process.exit(0);
  }

  // ── STEP 3: Fetch 14-day price history for each market ────────────
  console.log("\n=== Fetching 14-day price history ===");
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const historyMap = new Map<string, { t: number; p: number }[]>();

  for (let i = 0; i < markets.length; i++) {
    const m = markets[i];
    const { data: pts } = await supabase
      .from("price_history")
      .select("timestamp, price")
      .eq("market_id", m.id)
      .gte("timestamp", since)
      .order("timestamp", { ascending: true });

    if (pts?.length) {
      historyMap.set(
        m.id,
        pts.map((pt: any) => ({ t: new Date(pt.timestamp).getTime(), p: Number(pt.price) })),
      );
    }

    if ((i + 1) % 100 === 0) {
      console.log(`Fetched history for ${i + 1}/${markets.length} markets`);
    }
  }

  const marketsWithData = markets.filter((m) => historyMap.has(m.id));
  console.log(`${marketsWithData.length} markets have price data in the 14-day window`);

  // ── STEP 4-6: Compute Pearson for each pair ───────────────────────
  console.log("\n=== Computing Pearson correlations ===");

  const results: {
    market_a_id: string;
    market_b_id: string;
    correlation: number;
    sample_size: number;
  }[] = [];

  let totalPairs = 0;
  let enoughData = 0;
  let stored = 0;

  for (let i = 0; i < marketsWithData.length; i++) {
    for (let j = i + 1; j < marketsWithData.length; j++) {
      const a = marketsWithData[i];
      const b = marketsWithData[j];

      // Ensure lexicographic order for deduplication
      const [aId, bId] = a.id < b.id ? [a.id, b.id] : [b.id, a.id];

      const seriesA = historyMap.get(aId)!;
      const seriesB = historyMap.get(bId)!;

      totalPairs++;

      const [xs, ys] = alignSeries(seriesA, seriesB);
      if (xs.length < 10) continue;
      enoughData++;

      const r = pearson(xs, ys);
      if (Math.abs(r) < 0.5) continue;

      results.push({
        market_a_id: aId,
        market_b_id: bId,
        correlation: Number(r.toFixed(4)),
        sample_size: xs.length,
      });
      stored++;

      if (totalPairs % 5000 === 0) {
        console.log(`Processed ${totalPairs} pairs, ${stored} stored`);
      }
    }
  }

  // ── STEP 7: Summary ───────────────────────────────────────────────
  console.log("\n=== Summary ===");
  console.log(`Total pairs considered: ${totalPairs}`);
  console.log(`Pairs with enough data (>=10 aligned points): ${enoughData}`);
  console.log(`Pairs stored (|r| >= 0.5): ${stored}`);

  // Build a quick lookup for questions
  const questionMap = new Map(marketsWithData.map((m) => [m.id, m.question]));

  const sorted = [...results].sort((a, b) => b.correlation - a.correlation);
  const top10Pos = sorted.slice(0, 10);
  const top10Neg = sorted.slice(-10).reverse();

  console.log("\nTop 10 positive correlations:");
  for (const r of top10Pos) {
    const qa = questionMap.get(r.market_a_id) ?? r.market_a_id;
    const qb = questionMap.get(r.market_b_id) ?? r.market_b_id;
    console.log(`  +${r.correlation.toFixed(4)}  "${qa.slice(0, 50)}" ⇄ "${qb.slice(0, 50)}"`);
  }

  console.log("\nTop 10 negative correlations:");
  for (const r of top10Neg) {
    const qa = questionMap.get(r.market_a_id) ?? r.market_a_id;
    const qb = questionMap.get(r.market_b_id) ?? r.market_b_id;
    console.log(`  ${r.correlation.toFixed(4)}  "${qa.slice(0, 50)}" ⇄ "${qb.slice(0, 50)}"`);
  }

  // ── STEP 8: Clear and bulk insert ────────────────────────────────
  console.log("\n=== Writing to Supabase ===");
  const { error: deleteErr } = await supabase
    .from("correlations")
    .delete()
    .gte("id", 0);

  if (deleteErr) {
    console.error("Failed to clear correlations table:", deleteErr.message);
    process.exit(1);
  }
  console.log("Cleared existing correlations");

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < results.length; i += BATCH) {
    const chunk = results.slice(i, i + BATCH);
    const { error } = await supabase
      .from("correlations")
      .upsert(chunk, { onConflict: "market_a_id,market_b_id" });
    if (error) {
      console.error(`  Upsert error (batch ${i}):`, error.message);
    } else {
      inserted += chunk.length;
      console.log(`  Upserted batch ${i}–${i + chunk.length} (${inserted}/${results.length})`);
    }
  }

  // ── STEP 9: Done ─────────────────────────────────────────────────
  console.log("\n✓ Correlations computed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
