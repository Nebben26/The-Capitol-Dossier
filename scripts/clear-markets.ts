import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  console.log("Clearing all market data...");
  await sb.from("price_history").delete().neq("id", 0);
  await sb.from("disagreements").delete().neq("id", "");
  await sb.from("markets").delete().neq("id", "");
  console.log("Done. Run ingest.ts to repopulate.");
  process.exit(0);
}
main();
