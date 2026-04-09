/**
 * Identifies markets with stale AI theses (older than 12 hours).
 * Run manually: npx tsx scripts/refresh-theses.ts
 *
 * Outputs JSON to stdout for each stale thesis — paste into Claude.ai
 * to regenerate the thesis at zero API cost.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STALE_HOURS = 12;
const TOP_N = 25;

async function main() {
  const cutoff = new Date(Date.now() - STALE_HOURS * 3_600_000).toISOString();

  // Get top markets by volume
  const { data: markets, error: mErr } = await supabase
    .from("markets")
    .select("id, question, price, platform, category")
    .order("volume", { ascending: false })
    .limit(200);

  if (mErr || !markets) {
    console.error("Failed to fetch markets:", mErr);
    process.exit(1);
  }

  // Get existing theses and their ages
  const marketIds = markets.map((m) => m.id);
  const { data: theses, error: tErr } = await supabase
    .from("market_theses")
    .select("market_id, generated_at")
    .in("market_id", marketIds);

  if (tErr) {
    console.error("Failed to fetch theses:", tErr);
    process.exit(1);
  }

  const thesisMap = new Map((theses || []).map((t) => [t.market_id, t.generated_at]));

  // Find markets with stale or missing theses
  const stale = markets.filter((m) => {
    const gen = thesisMap.get(m.id);
    return !gen || gen < cutoff;
  }).slice(0, TOP_N);

  if (stale.length === 0) {
    console.log("✓ All top markets have fresh theses. Nothing to refresh.");
    process.exit(0);
  }

  console.log(`Found ${stale.length} markets with stale or missing theses (>${STALE_HOURS}h old):\n`);

  for (const m of stale) {
    const gen = thesisMap.get(m.id);
    const ageStr = gen
      ? `${Math.round((Date.now() - new Date(gen).getTime()) / 3_600_000)}h old`
      : "no thesis yet";

    console.log(`STALE THESIS: ${m.question}`);
    console.log(JSON.stringify({
      market_id: m.id,
      question: m.question,
      price: m.price,
      platform: m.platform,
      category: m.category,
      thesis_age: ageStr,
      prompt_hint: `Generate a market thesis for: "${m.question}" (current price: ${m.price}¢). Include bull_case, bear_case, catalysts, whale_read, historical_context.`,
    }, null, 2));
    console.log("---");
  }

  console.log(`\nPaste the above into Claude.ai to generate fresh theses. Then insert via Supabase SQL editor.`);
}

main().catch(console.error);
