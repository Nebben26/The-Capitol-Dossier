import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Get first whale address
  const { data: whales } = await sb.from("whales").select("address, display_name").order("total_pnl", { ascending: false }).limit(1);
  if (!whales?.length) { console.log("No whales"); process.exit(1); }

  const wallet = whales[0].address;
  console.log(`Testing whale: ${whales[0].display_name} (${wallet})\n`);

  // Test positions endpoint
  console.log("=== /v1/positions ===");
  try {
    const res = await fetch(`https://data-api.polymarket.com/v1/positions?user=${wallet}`);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(`Type: ${typeof data}, isArray: ${Array.isArray(data)}, length: ${Array.isArray(data) ? data.length : 'N/A'}`);
    if (Array.isArray(data) && data.length > 0) {
      console.log("First position keys:", Object.keys(data[0]));
      console.log("First position:", JSON.stringify(data[0], null, 2).slice(0, 500));
    }
  } catch (e) { console.log("Error:", e); }

  console.log("\n=== /v1/activity (trades) ===");
  try {
    const res = await fetch(`https://data-api.polymarket.com/v1/activity?user=${wallet}&limit=5`);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(`Type: ${typeof data}, isArray: ${Array.isArray(data)}, length: ${Array.isArray(data) ? data.length : 'N/A'}`);
    if (Array.isArray(data) && data.length > 0) {
      console.log("First activity keys:", Object.keys(data[0]));
      console.log("First activity:", JSON.stringify(data[0], null, 2).slice(0, 500));
    }
  } catch (e) { console.log("Error:", e); }

  // Also try /trades endpoint
  console.log("\n=== /trades (legacy) ===");
  try {
    const res = await fetch(`https://data-api.polymarket.com/trades?maker=${wallet}&limit=5`);
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`Type: ${typeof data}, isArray: ${Array.isArray(data)}, length: ${Array.isArray(data) ? data.length : 'N/A'}`);
      if (Array.isArray(data) && data.length > 0) {
        console.log("First trade keys:", Object.keys(data[0]));
        console.log("First trade:", JSON.stringify(data[0], null, 2).slice(0, 500));
      }
    }
  } catch (e) { console.log("Error:", e); }

  process.exit(0);
}
main();
