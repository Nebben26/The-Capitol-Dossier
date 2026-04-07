import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Try inserting a test row to see which columns work
  const { error } = await sb.from("whale_trades").insert({
    wallet_address: "test",
    whale_id: "test",
    market_id: "test",
    tx_hash: "test-" + Date.now(),
    transaction_hash: "test-" + Date.now(),
    side: "BUY",
    outcome: "YES",
    size_usd: 100,
    price: 0.5,
    usd_value: 100,
    timestamp: new Date().toISOString(),
  });
  if (error) {
    console.log("Insert error:", error.message);
    // Try minimal columns
    const { error: e2 } = await sb.from("whale_trades").insert({
      wallet_address: "test2",
      market_id: "test2",
      side: "BUY",
      size_usd: 100,
      price: 0.5,
      outcome: "YES",
      timestamp: new Date().toISOString(),
      transaction_hash: "test2-" + Date.now(),
    });
    console.log("Minimal insert:", e2 ? e2.message : "OK");
  } else {
    console.log("Full insert: OK");
  }
  // Cleanup
  await sb.from("whale_trades").delete().like("wallet_address", "test%");
  process.exit(0);
}
main();
