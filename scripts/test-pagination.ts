/**
 * Test that paginated getAllMarkets logic works correctly.
 * Uses the anon key (same as browser) to test RLS access.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log("=== Test Pagination (anon key, same as browser) ===\n");

  // Test 1: Old broken approach — order by volume + range
  console.log("OLD approach (order by volume + range):");
  const allOld: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data: page, error } = await supabase
      .from("markets")
      .select("id")
      .order("volume", { ascending: false })
      .range(from, from + 999);
    if (error) { console.log(`  Error at offset ${from}:`, error.message); break; }
    if (!page || page.length === 0) break;
    allOld.push(...page);
    console.log(`  Page ${from}-${from + page.length}: ${page.length} rows`);
    if (page.length < 1000) break;
  }
  console.log(`  Total: ${allOld.length}\n`);

  // Test 2: New fixed approach — order by id + range
  console.log("NEW approach (order by id + range):");
  const allNew: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data: page, error } = await supabase
      .from("markets")
      .select("id")
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) { console.log(`  Error at offset ${from}:`, error.message); break; }
    if (!page || page.length === 0) break;
    allNew.push(...page);
    console.log(`  Page ${from}-${from + page.length}: ${page.length} rows`);
    if (page.length < 1000) break;
  }
  console.log(`  Total: ${allNew.length}\n`);

  // Test 3: Disagreements fetch (anon key)
  console.log("Disagreements (anon key):");
  const { data: dData, error: dErr } = await supabase
    .from("disagreements")
    .select("*")
    .order("spread", { ascending: false })
    .limit(500);
  if (dErr) console.log("  Error:", dErr.message);
  else console.log(`  Got ${dData?.length || 0} disagreements`);
}

main().catch(console.error);
