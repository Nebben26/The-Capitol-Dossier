/**
 * compute-source-accuracy.ts
 * Scans resolved markets and computes per-source Brier scores.
 * Writes results to source_accuracy_history.
 * Designed to run after ingestion completes.
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function brierScore(prob: number | null, outcome: boolean): number | null {
  if (prob == null) return null;
  const p = prob / 100;
  const o = outcome ? 1 : 0;
  return Math.round((p - o) ** 2 * 10000) / 10000;
}

export async function computeSourceAccuracy() {
  console.log("  [source-accuracy] Starting...");

  // Fetch resolved markets that have outcome data
  const { data: markets, error: mErr } = await supabase
    .from("markets")
    .select("id, question, resolved, resolution, poly_price, kalshi_price, resolves_at")
    .eq("resolved", true)
    .not("resolution", "is", null)
    .order("resolves_at", { ascending: false })
    .limit(2000);

  if (mErr || !markets) {
    console.error("  [source-accuracy] Failed to fetch markets:", mErr?.message);
    return;
  }

  const resolved = markets.filter((m) => m.resolution === "YES" || m.resolution === "NO");
  if (resolved.length === 0) {
    console.log("  [source-accuracy] No resolved markets found. Skipping.");
    return;
  }

  console.log(`  [source-accuracy] Processing ${resolved.length} resolved markets...`);

  // Fetch community consensus for all these market IDs
  const marketIds = resolved.map((m) => m.id);
  const batchSize = 200;
  const consensusMap: Record<string, number | null> = {};

  for (let i = 0; i < marketIds.length; i += batchSize) {
    const batch = marketIds.slice(i, i + batchSize);
    const { data: cacheRows } = await supabase
      .from("market_consensus_cache")
      .select("market_id, consensus_prob")
      .in("market_id", batch);
    (cacheRows ?? []).forEach((r: any) => {
      consensusMap[r.market_id] = Number(r.consensus_prob);
    });
  }

  // Fetch whale consensus from whale_positions
  const whaleMap: Record<string, number | null> = {};
  for (let i = 0; i < marketIds.length; i += batchSize) {
    const batch = marketIds.slice(i, i + batchSize);
    const { data: whaleRows } = await supabase
      .from("whale_positions")
      .select("market_id, avg_price")
      .in("market_id", batch);
    (whaleRows ?? []).forEach((r: any) => {
      whaleMap[r.market_id] = r.avg_price != null ? Math.round(Number(r.avg_price) * 100) / 100 : null;
    });
  }

  // Check which markets already have rows in source_accuracy_history
  const { data: existing } = await supabase
    .from("source_accuracy_history")
    .select("market_id")
    .in("market_id", marketIds);
  const existingSet = new Set((existing ?? []).map((r: any) => r.market_id));

  const toInsert: any[] = [];

  for (const m of resolved) {
    if (existingSet.has(m.id)) continue; // already recorded

    const outcome = m.resolution === "YES";
    const polyProb = m.poly_price != null ? Math.round(Number(m.poly_price) * 100) / 100 : null;
    const kalshiProb = m.kalshi_price != null ? Math.round(Number(m.kalshi_price) * 100) / 100 : null;
    const whaleProb = whaleMap[m.id] ?? null;
    const communityProb = consensusMap[m.id] ?? null;

    // Need at least one source to record
    if (polyProb == null && kalshiProb == null && communityProb == null) continue;

    toInsert.push({
      market_id: m.id,
      market_question: m.question ?? "",
      resolved_at: m.resolves_at,
      outcome,
      poly_prob: polyProb,
      kalshi_prob: kalshiProb,
      whale_prob: whaleProb,
      community_prob: communityProb,
      poly_brier: brierScore(polyProb, outcome),
      kalshi_brier: brierScore(kalshiProb, outcome),
      whale_brier: brierScore(whaleProb, outcome),
      community_brier: brierScore(communityProb, outcome),
    });
  }

  if (toInsert.length === 0) {
    console.log("  [source-accuracy] No new resolved markets to record.");
    return;
  }

  // Batch insert
  for (let i = 0; i < toInsert.length; i += 100) {
    const batch = toInsert.slice(i, i + 100);
    const { error: insErr } = await supabase
      .from("source_accuracy_history")
      .upsert(batch, { onConflict: "market_id" });
    if (insErr) {
      console.error("  [source-accuracy] Insert error:", insErr.message);
    }
  }

  console.log(`  [source-accuracy] Recorded ${toInsert.length} new resolved markets.`);
}

// ─── Standalone entry point ───────────────────────────────────────────────────
if (require.main === module) {
  computeSourceAccuracy()
    .then(() => {
      console.log("Done.");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
