/**
 * Session 25 — Upsert Market Theses into Supabase
 * Reads scripts/output/theses-generated.json and upserts into market_theses table.
 *
 * Run: npx tsx scripts/upsert-theses.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const thesesPath = path.join(__dirname, "output", "theses-generated.json");
  if (!fs.existsSync(thesesPath)) {
    console.error("theses-generated.json not found — run export-thesis-context.ts first");
    process.exit(1);
  }

  const theses = JSON.parse(fs.readFileSync(thesesPath, "utf8"));
  console.log(`Upserting ${theses.length} theses into market_theses table...`);

  let successCount = 0;
  let errorCount = 0;

  for (const thesis of theses) {
    const { error } = await supabase
      .from("market_theses")
      .upsert(
        {
          market_id: thesis.market_id,
          bull_case: thesis.bull_case,
          bear_case: thesis.bear_case,
          catalysts: thesis.catalysts,
          whale_read: thesis.whale_read,
          historical_context: thesis.historical_context,
          confidence: thesis.confidence,
          generated_at: new Date().toISOString(),
          model: "claude-sonnet-4-6-via-code",
        },
        { onConflict: "market_id" }
      );

    if (error) {
      console.error(`  ✗ ${thesis.market_id}: ${error.message}`);
      errorCount++;
    } else {
      console.log(`  ✓ ${thesis.market_id}`);
      successCount++;
    }
  }

  console.log(`\nDone: ${successCount} succeeded, ${errorCount} failed`);

  // Verify count
  const { count } = await supabase
    .from("market_theses")
    .select("*", { count: "exact", head: true });
  console.log(`Total rows in market_theses: ${count}`);
}

main().catch(console.error);
