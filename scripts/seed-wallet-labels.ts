/**
 * seed-wallet-labels.ts
 * One-time seeding of known wallet labels into the wallet_labels table.
 * Run manually: npx tsx scripts/seed-wallet-labels.ts
 *
 * TODO: Add known wallet addresses and display names below.
 * Format: { wallet_address: "0x...", display_name: "Label", description?: "...", verified: true/false }
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LABELS: Array<{
  wallet_address: string;
  display_name: string;
  description?: string;
  verified: boolean;
}> = [
  // TODO: Populate with known whale wallet addresses
  // Example:
  // {
  //   wallet_address: "0xabc123...",
  //   display_name: "Sigma Whale",
  //   description: "High-conviction political trader",
  //   verified: false,
  // },
];

async function main() {
  if (LABELS.length === 0) {
    console.log("[seed-wallet-labels] No labels to seed — add entries to the LABELS array.");
    return;
  }

  const { error } = await supabase
    .from("wallet_labels")
    .upsert(LABELS, { onConflict: "wallet_address" });

  if (error) {
    console.error("[seed-wallet-labels] upsert failed:", error.message);
    process.exit(1);
  }

  console.log(`[seed-wallet-labels] seeded ${LABELS.length} wallet labels`);
}

main().catch(e => { console.error("[seed-wallet-labels] fatal:", e); process.exit(1); });
