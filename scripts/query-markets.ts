import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  console.log("\n=== Polymarket top 15 by volume ===");
  const { data: poly } = await sb
    .from("markets")
    .select("question, price, volume, category, traders, liquidity")
    .eq("platform", "Polymarket")
    .order("volume", { ascending: false })
    .limit(15);
  if (poly) {
    console.log("question | price | volume | category | traders | liquidity");
    console.log("-".repeat(100));
    for (const m of poly) {
      const vol = m.volume >= 1e6 ? `$${(m.volume / 1e6).toFixed(1)}M` : `$${(m.volume / 1e3).toFixed(0)}K`;
      const liq = m.liquidity >= 1e6 ? `$${(m.liquidity / 1e6).toFixed(1)}M` : `$${(m.liquidity / 1e3).toFixed(0)}K`;
      console.log(`${m.question.slice(0, 55).padEnd(55)} | ${String(m.price).padStart(3)}¢ | ${vol.padStart(8)} | ${(m.category || "?").padEnd(12)} | ${String(m.traders).padStart(6)} | ${liq}`);
    }
  }

  console.log("\n=== Kalshi top 10 by volume ===");
  const { data: kal } = await sb
    .from("markets")
    .select("question, price, volume, category")
    .eq("platform", "Kalshi")
    .order("volume", { ascending: false })
    .limit(10);
  if (kal) {
    console.log("question | price | volume | category");
    console.log("-".repeat(80));
    for (const m of kal) {
      const vol = m.volume >= 1e6 ? `$${(m.volume / 1e6).toFixed(1)}M` : `$${(m.volume / 1e3).toFixed(0)}K`;
      console.log(`${m.question.slice(0, 55).padEnd(55)} | ${String(m.price).padStart(3)}¢ | ${vol.padStart(8)} | ${m.category || "?"}`);
    }
  }

  process.exit(0);
}
main();
