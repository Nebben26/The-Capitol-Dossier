/**
 * Session 26 — Generate Smart Signals
 * Runs all 4 signal detectors against live whale_positions data,
 * then upserts results into the signals table.
 *
 * Run: npx tsx scripts/generate-signals.ts
 *
 * NOTE: The signals table must exist first — apply scripts/migrations/session26_signals.sql
 * via the Supabase SQL Editor before running this script.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { detectAllSignals } from "../lib/signals";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Override the supabase client with service key so the script can write
process.env.SUPABASE_SERVICE_ROLE_KEY = SUPABASE_SERVICE_KEY;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Verify the table exists
  const { error: pingErr } = await supabase
    .from("signals")
    .select("id")
    .limit(1);

  if (pingErr) {
    if (pingErr.message.includes("does not exist") || pingErr.code === "42P01") {
      console.error(
        "❌ signals table not found.\n" +
        "   Apply scripts/migrations/session26_signals.sql via the Supabase SQL Editor first."
      );
      process.exit(1);
    }
    // Non-fatal warning — table might still work
    console.warn("[generate-signals] ping warning:", pingErr.message);
  }

  console.log("Running signal detectors...");
  let signals;
  try {
    signals = await detectAllSignals(supabase);
  } catch (err) {
    console.error("❌ detectAllSignals failed:", err);
    process.exit(1);
  }

  if (signals.length === 0) {
    console.log("No signals detected — nothing to upsert.");
    return;
  }

  console.log(`Detected ${signals.length} signals. Upserting...`);

  let successCount = 0;
  let errorCount = 0;

  for (const signal of signals) {
    const { error } = await supabase
      .from("signals")
      .upsert(
        {
          signal_id: signal.signal_id,
          type: signal.type,
          confidence: signal.confidence,
          market_id: signal.market_id,
          market_question: signal.market_question,
          headline: signal.headline,
          detail: signal.detail,
          stats: signal.stats,
          detected_at: signal.detected_at,
        },
        { onConflict: "signal_id" }
      );

    if (error) {
      console.error(`  ✗ ${signal.signal_id}: ${error.message}`);
      errorCount++;
    } else {
      console.log(`  ✓ [${signal.type}] conf=${signal.confidence} — ${signal.headline.slice(0, 60)}`);
      successCount++;
    }
  }

  console.log(`\nDone: ${successCount} succeeded, ${errorCount} failed`);

  // Delete signals older than 12h that weren't refreshed
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const { error: deleteErr, count: deleteCount } = await supabase
    .from("signals")
    .delete({ count: "exact" })
    .lt("detected_at", cutoff);

  if (!deleteErr) {
    console.log(`Pruned ${deleteCount ?? 0} stale signals (older than 12h)`);
  }

  // Final count
  const { count } = await supabase
    .from("signals")
    .select("*", { count: "exact", head: true });
  console.log(`Total rows in signals: ${count}`);
}

main().catch(console.error);
