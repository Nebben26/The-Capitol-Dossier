/**
 * Re-enrich whale markets_traded from positions API.
 * Only updates the top 50 whales with real position data.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DATA_API_BASE = "https://data-api.polymarket.com";
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log("=== Fixing whale markets_traded ===\n");

  const { data: whales } = await sb.from("whales")
    .select("address, display_name, markets_traded, positions_count")
    .order("total_pnl", { ascending: false })
    .limit(50);

  if (!whales?.length) { console.log("No whales"); return; }

  let fixed = 0;
  for (const w of whales) {
    try {
      const res = await fetch(`${DATA_API_BASE}/v1/positions?user=${w.address}`);
      if (!res.ok) continue;
      const positions = await res.json();
      if (!Array.isArray(positions) || positions.length === 0) continue;

      const uniqueMarkets = new Set(positions.map((p: any) => p.eventSlug || p.slug || p.conditionId || "unknown"));
      const newCount = uniqueMarkets.size;

      if (newCount !== w.markets_traded) {
        await sb.from("whales").update({
          markets_traded: newCount,
          positions_count: positions.length,
        }).eq("address", w.address);
        console.log(`  ${w.display_name}: ${w.markets_traded} → ${newCount} markets (${positions.length} positions)`);
        fixed++;
      }
    } catch { /* skip */ }
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nFixed ${fixed}/${whales.length} whales`);

  // Verify
  const { data: sample } = await sb.from("whales")
    .select("display_name, markets_traded, positions_count")
    .order("total_pnl", { ascending: false })
    .limit(10);
  console.log("\nTop 10 after fix:");
  sample?.forEach((w: any) => console.log(`  ${w.display_name}: markets=${w.markets_traded}, positions=${w.positions_count}`));
}

main().catch(console.error);
