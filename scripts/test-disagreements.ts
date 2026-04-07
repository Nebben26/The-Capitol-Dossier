/**
 * Test script — runs ONLY the disagreement matching logic against
 * markets already in Supabase. Verbose output to diagnose why 0 rows.
 *
 *   npx tsx scripts/test-disagreements.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const STOPWORDS = new Set([
  "will", "what", "when", "where", "which", "have", "been", "before",
  "after", "than", "they", "this", "that", "with", "from", "into",
  "does", "much", "many", "more", "most", "about", "would", "could",
  "should", "their", "there", "these", "those", "being", "other",
  "some", "only", "also", "over", "under", "between", "through",
  "during", "2024", "2025", "2026", "2027", "2028", "2029", "2030",
  "year", "next", "first", "last",
]);

async function main() {
  console.log("=== Test Disagreements (improved matcher) ===\n");

  // 1. Count existing disagreements
  const { count: existingCount } = await supabase
    .from("disagreements")
    .select("*", { count: "exact", head: true });
  console.log(`Existing disagreements in DB: ${existingCount}\n`);

  // 2. Load all markets from Supabase (up to 5000)
  const { data: allMarkets, error: mkErr } = await supabase
    .from("markets")
    .select("id, question, platform, price, category, volume")
    .limit(5000);
  if (mkErr) {
    console.error("Failed to load markets:", mkErr.message);
    process.exit(1);
  }
  console.log(`Total markets in DB: ${allMarkets!.length}`);

  const polyMarkets = allMarkets!.filter((m: any) => m.platform === "Polymarket");
  const kalshiMarkets = allMarkets!.filter((m: any) => {
    if (m.platform !== "Kalshi") return false;
    const q = m.question || "";
    if (/^yes\s/i.test(q)) return false;
    if ((q.match(/yes\s/gi) || []).length >= 2) return false;
    return true;
  });
  console.log(`Polymarket: ${polyMarkets.length}, Kalshi (filtered): ${kalshiMarkets.length}\n`);

  // 3. Run the improved matching
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const contentWords = (s: string) =>
    normalize(s).split(/\s+/).filter((w: string) => w.length > 3 && !STOPWORDS.has(w));

  const rows: any[] = [];

  for (const pm of polyMarkets) {
    const pmWords = new Set(contentWords(pm.question));
    if (pmWords.size < 2) continue;
    let bestMatch: any = null;
    let bestScore = 0;
    let bestOverlap = 0;

    for (const km of kalshiMarkets) {
      const kmWords = contentWords(km.question);
      if (kmWords.length < 2) continue;
      const overlap = kmWords.filter((w: string) => pmWords.has(w)).length;
      if (overlap < 3) continue;
      const score = overlap / Math.max(pmWords.size, kmWords.length, 1);
      if (score > bestScore && score >= 0.4) {
        bestScore = score;
        bestOverlap = overlap;
        bestMatch = km;
      }
    }

    if (bestMatch) {
      const spread = Math.abs(pm.price - bestMatch.price);
      console.log(`MATCH (spread=${spread}pt, score=${bestScore.toFixed(2)}, overlap=${bestOverlap}): "${pm.question}" ↔ "${bestMatch.question}"`);
      console.log(`  Poly: ${pm.price}¢ | Kalshi: ${bestMatch.price}¢\n`);
      if (spread >= 3) {
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

  console.log(`\n=== RESULTS ===`);
  console.log(`Matches with spread >= 3pt: ${rows.length}`);

  // 4. Upsert
  if (rows.length > 0) {
    console.log(`\nUpserting ${rows.length} disagreements...`);
    await supabase.from("disagreements").delete().neq("id", "");
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await supabase.from("disagreements").upsert(chunk, { onConflict: "id" });
      if (error) console.error(`Upsert error (batch ${i}):`, error.message);
      else console.log(`  Upserted batch ${i}-${i + chunk.length}`);
    }
  } else {
    console.log("\nNo quality disagreements found. Clearing table.");
    await supabase.from("disagreements").delete().neq("id", "");
  }

  // Verify
  const { count: newCount } = await supabase
    .from("disagreements")
    .select("*", { count: "exact", head: true });
  console.log(`\nDisagreements now in DB: ${newCount}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
