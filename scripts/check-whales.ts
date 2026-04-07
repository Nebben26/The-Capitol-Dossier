import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { count } = await sb.from("whales").select("*", { count: "exact", head: true });
  console.log("Total whales:", count);

  const { data: sample } = await sb.from("whales")
    .select("display_name, positions_count, markets_traded, total_volume, total_pnl")
    .order("total_pnl", { ascending: false })
    .limit(15);
  console.log("\nTop 15 whales:");
  sample?.forEach((w: any) => {
    console.log(`  ${w.display_name}: positions=${w.positions_count}, markets_traded=${w.markets_traded}, vol=${w.total_volume}, pnl=${w.total_pnl}`);
  });

  // Check whale_positions for real position counts
  const { data: posCounts } = await sb.rpc("", {}).catch(() => null) as any;
  // Manual aggregation
  const { data: posData } = await sb.from("whale_positions").select("whale_id");
  if (posData) {
    const counts = new Map<string, number>();
    for (const p of posData) {
      counts.set(p.whale_id, (counts.get(p.whale_id) || 0) + 1);
    }
    console.log(`\nWhale_positions: ${posData.length} rows across ${counts.size} whales`);
    const top5 = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    console.log("Top 5 by position count:");
    top5.forEach(([id, cnt]) => console.log(`  ${id.slice(0, 10)}...: ${cnt} positions`));
  }
}

main().catch(console.error);
