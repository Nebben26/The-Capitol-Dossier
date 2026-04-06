import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Querying markets...");
  const { data, error } = await sb
    .from("markets")
    .select("question, price, change_24h, volume, platform")
    .order("volume", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(`Found ${data?.length} markets:`);
    for (const m of data || []) {
      console.log(`  ${m.price}¢ | ${m.platform} | vol=${m.volume} | ${m.question}`);
    }
  }
  process.exit(0);
}

main();
