/**
 * Session 25 — Export Thesis Context
 * Pulls top 25 markets by volume that need a thesis, plus whale/news/disagree context.
 * Output: scripts/output/thesis-context.json
 *
 * Run: npx tsx scripts/export-thesis-context.ts
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
  console.log("Fetching top 25 markets by volume that need a thesis...");

  // 1. Get existing theses (older than 7 days or non-existent)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: existingTheses } = await supabase
    .from("market_theses")
    .select("market_id, generated_at")
    .gt("generated_at", sevenDaysAgo);

  const freshIds = new Set((existingTheses || []).map((t: any) => t.market_id));

  // 2. Get top 25 markets by volume
  const { data: markets, error: marketsErr } = await supabase
    .from("markets")
    .select("id, question, category, price, change_24h, volume, end_date")
    .order("volume", { ascending: false })
    .limit(100);

  if (marketsErr || !markets) {
    console.error("Failed to fetch markets:", marketsErr?.message);
    process.exit(1);
  }

  const targetMarkets = markets
    .filter((m: any) => !freshIds.has(m.id))
    .slice(0, 25);

  console.log(`Found ${targetMarkets.length} markets needing theses`);

  const output: any[] = [];

  for (const m of targetMarkets) {
    console.log(`  Processing: ${m.id}`);

    // Whale positions for this market
    const { data: whales } = await supabase
      .from("whale_positions")
      .select("whale_id, outcome, current_value, pnl")
      .eq("market_id", m.id)
      .order("current_value", { ascending: false })
      .limit(10);

    // News tagged to this market
    const { data: newsTags } = await supabase
      .from("news_market_tags")
      .select("score, news_articles(title, source, published_at, summary)")
      .eq("market_id", m.id)
      .order("score", { ascending: false })
      .limit(5);

    // Disagreement data
    const { data: disagrees } = await supabase
      .from("disagreements")
      .select("poly_price, kalshi_price, spread, direction")
      .or(`poly_market_id.eq.${m.id},kalshi_market_id.eq.${m.id}`)
      .limit(1);

    const news = (newsTags || []).map((t: any) => ({
      title: t.news_articles?.title || "",
      source: t.news_articles?.source || "",
      published_at: t.news_articles?.published_at || "",
      summary: t.news_articles?.summary || "",
    })).filter((n: any) => n.title);

    output.push({
      market: {
        id: m.id,
        question: m.question,
        category: m.category,
        price: m.price,
        change_24h: m.change_24h,
        volume: m.volume,
        end_date: m.end_date,
      },
      whales: (whales || []).map((w: any) => ({
        whale_id: w.whale_id,
        outcome: w.outcome,
        current_value: w.current_value,
        pnl: w.pnl,
      })),
      news,
      disagreement: disagrees?.[0] || null,
    });
  }

  const outPath = path.join(__dirname, "output", "thesis-context.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nWritten ${output.length} market contexts to ${outPath}`);
}

main().catch(console.error);
