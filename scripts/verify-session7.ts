import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  for (const t of ["whale_positions", "whale_trades", "disagreement_snapshots", "disagreements"]) {
    const { count } = await sb.from(t).select("*", { count: "exact", head: true });
    console.log(`${t.padEnd(25)} : ${count} rows`);
  }

  console.log("\n=== Sample whale_positions ===");
  const { data: pos } = await sb.from("whale_positions").select("whale_id, market_id, outcome, size, pnl").limit(3);
  if (pos?.length) for (const p of pos) console.log(`  ${p.whale_id?.slice(0,10)}... | ${p.market_id?.slice(0,30)} | ${p.outcome} | size=${p.size} | pnl=${p.pnl}`);
  else console.log("  (empty)");

  console.log("\n=== Sample whale_trades ===");
  const { data: trades } = await sb.from("whale_trades").select("whale_id, market_id, side, size, price, usd_value").limit(3);
  if (trades?.length) for (const t of trades) console.log(`  ${t.whale_id?.slice(0,10)}... | ${t.market_id?.slice(0,30)} | ${t.side} | size=${t.size} | price=${t.price} | usd=$${t.usd_value}`);
  else console.log("  (empty)");

  console.log("\n=== Sample disagreement_snapshots ===");
  const { data: snaps } = await sb.from("disagreement_snapshots").select("question, poly_price, kalshi_price, spread").limit(3);
  if (snaps?.length) for (const s of snaps) console.log(`  "${s.question?.slice(0,40)}" | poly=${s.poly_price} | kalshi=${s.kalshi_price} | spread=${s.spread}`);
  else console.log("  (empty)");

  process.exit(0);
}
main();
