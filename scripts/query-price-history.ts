import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Count total rows
  const { count: totalCount } = await sb.from("price_history").select("*", { count: "exact", head: true });

  // Count distinct market_ids (need to fetch and dedupe)
  let allMarketIds = new Set<string>();
  let from = 0;
  while (true) {
    const { data } = await sb.from("price_history").select("market_id").range(from, from + 999);
    if (!data || data.length === 0) break;
    for (const r of data) allMarketIds.add(r.market_id);
    from += data.length;
    if (data.length < 1000) break;
  }

  console.log(`\nTotal price_history rows: ${totalCount}`);
  console.log(`Distinct market_ids: ${allMarketIds.size}`);
  process.exit(0);
}
main();
