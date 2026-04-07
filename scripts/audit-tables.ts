import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const tables = ["markets", "whales", "price_history", "whale_trades", "disagreements", "disagreement_snapshots", "whale_positions", "spread_history"];
  for (const t of tables) {
    const { count, error } = await sb.from(t).select("*", { count: "exact", head: true });
    console.log(`${t.padEnd(25)} : ${error ? "DOES NOT EXIST" : count + " rows"}`);
  }
  process.exit(0);
}
main();
