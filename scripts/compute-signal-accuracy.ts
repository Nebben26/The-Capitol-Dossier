/**
 * Session 31 — Compute Historical Signal Accuracy
 *
 * For each signal type, computes historical win rate using resolved markets
 * and whale positions, then updates all signals rows with the result.
 *
 * Run: npx tsx scripts/compute-signal-accuracy.ts
 *
 * NOTE: Apply scripts/migrations/session31_signal_accuracy.sql first.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

interface ResolvedMarket {
  id: string;
  resolution: string; // "Yes" | "No"
}

interface WhalePosition {
  whale_id: string;
  market_id: string;
  outcome: string; // "YES" | "NO"
  current_value: number;
  pnl: number;
}

interface WhaleRow {
  id: string;
  accuracy: number;
  rank: number;
}

interface AccuracyResult {
  accuracy_pct: number | null;
  sample_size: number;
}

// ─── LOAD BASE DATA ───────────────────────────────────────────────────────────

async function loadResolvedMarkets(): Promise<ResolvedMarket[]> {
  const { data, error } = await supabase
    .from("markets")
    .select("id, resolution")
    .eq("resolved", true)
    .not("resolution", "is", null);

  if (error) {
    console.error("Failed to load resolved markets:", error.message);
    return [];
  }
  return (data || []).filter(
    (m) => m.resolution === "Yes" || m.resolution === "No"
  ) as ResolvedMarket[];
}

async function loadPositionsForMarkets(
  marketIds: string[]
): Promise<WhalePosition[]> {
  if (marketIds.length === 0) return [];

  const { data, error } = await supabase
    .from("whale_positions")
    .select("whale_id, market_id, outcome, current_value, pnl")
    .in("market_id", marketIds);

  if (error) {
    console.error("Failed to load whale positions:", error.message);
    return [];
  }
  return (data || []) as WhalePosition[];
}

async function loadTopWhales(topN = 20): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("whales")
    .select("id, accuracy, rank")
    .order("accuracy", { ascending: false })
    .limit(topN);

  if (error) {
    console.error("Failed to load whales:", error.message);
    return new Set();
  }
  return new Set((data || []).map((w: WhaleRow) => w.id));
}

// ─── ACCURACY COMPUTATIONS ───────────────────────────────────────────────────

/**
 * consensus: when 3+ tracked whales took the same side, did that side win?
 * Groups positions by market, finds markets where 3+ whales were on the same side.
 */
function computeConsensusAccuracy(
  resolved: ResolvedMarket[],
  positions: WhalePosition[]
): AccuracyResult {
  const resolvedMap = new Map(resolved.map((m) => [m.id, m.resolution]));
  const byMarket = new Map<string, WhalePosition[]>();

  for (const p of positions) {
    if (!resolvedMap.has(p.market_id)) continue;
    if (!byMarket.has(p.market_id)) byMarket.set(p.market_id, []);
    byMarket.get(p.market_id)!.push(p);
  }

  let wins = 0;
  let total = 0;

  for (const [marketId, mPositions] of byMarket) {
    const resolution = resolvedMap.get(marketId)!;
    const yesSide = mPositions.filter((p) => p.outcome?.toUpperCase() === "YES");
    const noSide = mPositions.filter((p) => p.outcome?.toUpperCase() === "NO");

    if (yesSide.length >= 3) {
      total++;
      if (resolution === "Yes") wins++;
    }
    if (noSide.length >= 3) {
      total++;
      if (resolution === "No") wins++;
    }
  }

  if (total < 5) return { accuracy_pct: null, sample_size: total };
  return { accuracy_pct: Math.round((wins / total) * 100), sample_size: total };
}

/**
 * concentration: when 70%+ of whale capital was on one side, did that side win?
 */
function computeConcentrationAccuracy(
  resolved: ResolvedMarket[],
  positions: WhalePosition[]
): AccuracyResult {
  const resolvedMap = new Map(resolved.map((m) => [m.id, m.resolution]));
  const byMarket = new Map<string, WhalePosition[]>();

  for (const p of positions) {
    if (!resolvedMap.has(p.market_id)) continue;
    if (!byMarket.has(p.market_id)) byMarket.set(p.market_id, []);
    byMarket.get(p.market_id)!.push(p);
  }

  let wins = 0;
  let total = 0;

  for (const [marketId, mPositions] of byMarket) {
    const resolution = resolvedMap.get(marketId)!;
    const yesVal = mPositions
      .filter((p) => p.outcome?.toUpperCase() === "YES")
      .reduce((s, p) => s + (p.current_value || 0), 0);
    const noVal = mPositions
      .filter((p) => p.outcome?.toUpperCase() === "NO")
      .reduce((s, p) => s + (p.current_value || 0), 0);
    const totalVal = yesVal + noVal;
    if (totalVal === 0) continue;

    const yesPct = yesVal / totalVal;
    const noPct = noVal / totalVal;

    if (yesPct >= 0.7) {
      total++;
      if (resolution === "Yes") wins++;
    } else if (noPct >= 0.7) {
      total++;
      if (resolution === "No") wins++;
    }
  }

  if (total < 5) return { accuracy_pct: null, sample_size: total };
  return { accuracy_pct: Math.round((wins / total) * 100), sample_size: total };
}

/**
 * size_spike: when a whale placed an unusually large bet (top 10% by pnl magnitude),
 * did the bet win? (positive pnl = win)
 */
function computeSizeSpikeAccuracy(
  resolved: ResolvedMarket[],
  positions: WhalePosition[]
): AccuracyResult {
  const resolvedMap = new Map(resolved.map((m) => [m.id, m.resolution]));
  const resolvedPositions = positions.filter((p) => resolvedMap.has(p.market_id));

  if (resolvedPositions.length === 0) return { accuracy_pct: null, sample_size: 0 };

  // Find the 90th percentile current_value as the "spike" threshold
  const values = resolvedPositions
    .map((p) => p.current_value || 0)
    .sort((a, b) => a - b);
  const p90Idx = Math.floor(values.length * 0.9);
  const threshold = values[p90Idx] || 0;

  if (threshold === 0) return { accuracy_pct: null, sample_size: 0 };

  const spikes = resolvedPositions.filter(
    (p) => (p.current_value || 0) >= threshold
  );

  let wins = 0;
  for (const p of spikes) {
    const resolution = resolvedMap.get(p.market_id)!;
    const positionSide = p.outcome?.toUpperCase();
    if (
      (positionSide === "YES" && resolution === "Yes") ||
      (positionSide === "NO" && resolution === "No")
    ) {
      wins++;
    }
  }

  if (spikes.length < 5) return { accuracy_pct: null, sample_size: spikes.length };
  return {
    accuracy_pct: Math.round((wins / spikes.length) * 100),
    sample_size: spikes.length,
  };
}

/**
 * divergence: when top-20 accurate whales went against the majority,
 * did the top whales' side win?
 */
function computeDivergenceAccuracy(
  resolved: ResolvedMarket[],
  positions: WhalePosition[],
  topWhaleIds: Set<string>
): AccuracyResult {
  const resolvedMap = new Map(resolved.map((m) => [m.id, m.resolution]));
  const byMarket = new Map<string, WhalePosition[]>();

  for (const p of positions) {
    if (!resolvedMap.has(p.market_id)) continue;
    if (!byMarket.has(p.market_id)) byMarket.set(p.market_id, []);
    byMarket.get(p.market_id)!.push(p);
  }

  let wins = 0;
  let total = 0;

  for (const [marketId, mPositions] of byMarket) {
    const resolution = resolvedMap.get(marketId)!;

    const allYes = mPositions.filter((p) => p.outcome?.toUpperCase() === "YES").length;
    const allNo = mPositions.filter((p) => p.outcome?.toUpperCase() === "NO").length;
    if (allYes + allNo < 4) continue; // not enough data

    const majorityYes = allYes > allNo;
    const topYes = mPositions.filter(
      (p) => topWhaleIds.has(p.whale_id) && p.outcome?.toUpperCase() === "YES"
    ).length;
    const topNo = mPositions.filter(
      (p) => topWhaleIds.has(p.whale_id) && p.outcome?.toUpperCase() === "NO"
    ).length;

    // Divergence: top whales favour the minority side
    const topFadesYes = !majorityYes && topNo > topYes;
    const topFadesNo = majorityYes && topYes > topNo;

    if (topFadesYes || topFadesNo) {
      total++;
      const topSide = topFadesYes ? "No" : "Yes";
      if (resolution === topSide) wins++;
    }
  }

  if (total < 5) return { accuracy_pct: null, sample_size: total };
  return { accuracy_pct: Math.round((wins / total) * 100), sample_size: total };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Loading resolved markets...");
  const resolvedMarkets = await loadResolvedMarkets();
  console.log(`  ${resolvedMarkets.length} resolved markets`);

  if (resolvedMarkets.length === 0) {
    console.log("No resolved markets found — nothing to compute.");
    process.exit(0);
  }

  console.log("Loading whale positions for resolved markets...");
  const marketIds = resolvedMarkets.map((m) => m.id);
  const positions = await loadPositionsForMarkets(marketIds);
  console.log(`  ${positions.length} positions across resolved markets`);

  console.log("Loading top-20 whales by accuracy...");
  const topWhaleIds = await loadTopWhales(20);
  console.log(`  ${topWhaleIds.size} top whales loaded`);

  // Compute per-type accuracy
  const results: Record<string, AccuracyResult> = {
    whale_consensus: computeConsensusAccuracy(resolvedMarkets, positions),
    smart_money_concentration: computeConcentrationAccuracy(resolvedMarkets, positions),
    size_spike: computeSizeSpikeAccuracy(resolvedMarkets, positions),
    whale_divergence: computeDivergenceAccuracy(resolvedMarkets, positions, topWhaleIds),
  };

  console.log("\nComputed accuracy by type:");
  for (const [type, result] of Object.entries(results)) {
    const pct = result.accuracy_pct !== null ? `${result.accuracy_pct}%` : "null (insufficient data)";
    console.log(`  ${type}: ${pct} (n=${result.sample_size})`);
  }

  // Update all signal rows by type
  console.log("\nUpdating signals table...");
  let updated = 0;
  let skipped = 0;

  for (const [type, result] of Object.entries(results)) {
    const { error } = await supabase
      .from("signals")
      .update({
        historical_accuracy_pct: result.accuracy_pct,
        historical_sample_size: result.sample_size,
      })
      .eq("type", type);

    if (error) {
      console.error(`  Error updating ${type}:`, error.message);
      skipped++;
    } else {
      console.log(`  Updated ${type} → accuracy=${result.accuracy_pct ?? "null"}, n=${result.sample_size}`);
      updated++;
    }
  }

  console.log(`\nDone: ${updated} types updated, ${skipped} failed`);
}

main().catch(console.error);
