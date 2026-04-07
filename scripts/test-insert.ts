import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Test whale_positions insert
  console.log("Testing whale_positions insert...");
  const { error: e1 } = await sb.from("whale_positions").insert({
    whale_id: "test-wallet",
    market_id: "test-market",
    outcome: "YES",
    size: 100,
    avg_price: 0.5,
    current_value: 60,
    pnl: 10,
  });
  console.log("whale_positions:", e1 ? `ERROR: ${e1.message}` : "OK");

  // Test disagreement_snapshots insert
  console.log("Testing disagreement_snapshots insert...");
  const { error: e2 } = await sb.from("disagreement_snapshots").insert({
    poly_market_id: "test-poly",
    kalshi_market_id: "test-kalshi",
    question: "Test question",
    poly_price: 60,
    kalshi_price: 50,
    spread: 10,
  });
  console.log("disagreement_snapshots:", e2 ? `ERROR: ${e2.message}` : "OK");

  // Test whale_trades insert
  console.log("Testing whale_trades insert...");
  const { error: e3 } = await sb.from("whale_trades").insert({
    whale_id: "test-wallet",
    market_id: "test-market",
    tx_hash: "0xtest123",
    side: "BUY",
    outcome: "YES",
    size: 1000,
    price: 0.5,
    usd_value: 500,
    timestamp: new Date().toISOString(),
  });
  console.log("whale_trades:", e3 ? `ERROR: ${e3.message}` : "OK");

  // Clean up test rows
  await sb.from("whale_positions").delete().eq("whale_id", "test-wallet");
  await sb.from("disagreement_snapshots").delete().eq("poly_market_id", "test-poly");
  await sb.from("whale_trades").delete().eq("tx_hash", "0xtest123");
  console.log("Cleaned up test rows");

  process.exit(0);
}
main();
