import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Fetch ALL rows in batches to avoid 1000 limit
  let all: any[] = [];
  let from = 0;
  while (true) {
    const { data } = await sb.from("markets").select("category").range(from, from + 999);
    if (!data || data.length === 0) break;
    all.push(...data);
    from += data.length;
    if (data.length < 1000) break;
  }

  const counts: Record<string, number> = {};
  for (const m of all) {
    const cat = m.category || "Unknown";
    counts[cat] = (counts[cat] || 0) + 1;
  }

  console.log("\ncategory | count");
  console.log("-".repeat(30));
  for (const [cat, count] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`${cat.padEnd(15)} | ${count}`);
  }
  console.log(`${"TOTAL".padEnd(15)} | ${all.length}`);
  process.exit(0);
}
main();
