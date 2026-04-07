import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // COUNT(*)
  const { count: total } = await sb.from("disagreements").select("*", { count: "exact", head: true });
  console.log("COUNT(*):", total);

  // COUNT WHERE spread >= 3
  const { count: gte3 } = await sb.from("disagreements").select("*", { count: "exact", head: true }).gte("spread", 3);
  console.log("COUNT WHERE spread >= 3:", gte3);

  // COUNT WHERE spread >= 10
  const { count: gte10 } = await sb.from("disagreements").select("*", { count: "exact", head: true }).gte("spread", 10);
  console.log("COUNT WHERE spread >= 10:", gte10);

  // MIN, MAX, AVG spread
  const { data: allSpreads } = await sb.from("disagreements").select("spread");
  if (allSpreads && allSpreads.length > 0) {
    const spreads = allSpreads.map((r: any) => Number(r.spread));
    console.log("MIN spread:", Math.min(...spreads));
    console.log("MAX spread:", Math.max(...spreads));
    console.log("AVG spread:", (spreads.reduce((a, b) => a + b, 0) / spreads.length).toFixed(1));
  }

  // Top 5 by spread
  const { data: top5 } = await sb.from("disagreements").select("id, question, spread, poly_price, kalshi_price").order("spread", { ascending: false }).limit(5);
  console.log("\nTop 5 by spread:");
  top5?.forEach((r: any) => {
    console.log(`  ${r.spread}pt: "${r.question}" (Poly ${r.poly_price}¢ / Kalshi ${r.kalshi_price}¢)`);
  });

  // Also test with anon key (what browser uses)
  const sbAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: anonData, error: anonErr } = await sbAnon.from("disagreements").select("*").order("spread", { ascending: false }).limit(500);
  console.log("\nAnon key disagreements:", anonErr ? `ERROR: ${anonErr.message}` : `${anonData?.length} rows`);
}

main().catch(console.error);
