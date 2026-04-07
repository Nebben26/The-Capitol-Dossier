import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { count } = await sb.from("markets").select("*", { count: "exact", head: true });
  console.log("Total markets:", count);
  const { count: poly } = await sb.from("markets").select("*", { count: "exact", head: true }).eq("platform", "Polymarket");
  console.log("Polymarket:", poly);
  const { count: kalshi } = await sb.from("markets").select("*", { count: "exact", head: true }).eq("platform", "Kalshi");
  console.log("Kalshi:", kalshi);
}
main().catch(console.error);
