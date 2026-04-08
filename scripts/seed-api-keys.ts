/**
 * Session 28 — Seed API Keys
 * Generates 3 test API keys (free/pro/premium), hashes with SHA-256,
 * inserts into api_keys table, and prints plaintext keys.
 *
 * Run: npx tsx scripts/seed-api-keys.ts
 *
 * IMPORTANT: Apply scripts/migrations/session28_api_keys.sql in Supabase
 * SQL Editor before running this script.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TIER_CONFIGS = {
  free:    { rate_limit_per_minute: 10,  rate_limit_per_day: 100 },
  pro:     { rate_limit_per_minute: 60,  rate_limit_per_day: 5000 },
  premium: { rate_limit_per_minute: 600, rate_limit_per_day: 100000 },
} as const;

function generateKey(tier: string): string {
  const random = randomBytes(16).toString("hex"); // 32 hex chars
  return `qm_${tier}_${random}`;
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

async function main() {
  console.log("Generating API keys...\n");

  const keys: Array<{
    plaintext: string;
    key_hash: string;
    key_prefix: string;
    name: string;
    tier: string;
    rate_limit_per_minute: number;
    rate_limit_per_day: number;
  }> = [];

  for (const [tier, limits] of Object.entries(TIER_CONFIGS)) {
    const plaintext = generateKey(tier);
    const key_hash = hashKey(plaintext);
    const key_prefix = plaintext.slice(0, 16); // "qm_free_a1b2c3d4"

    keys.push({
      plaintext,
      key_hash,
      key_prefix,
      name: `Test ${tier.charAt(0).toUpperCase() + tier.slice(1)} Key`,
      tier,
      ...limits,
    });
  }

  // Insert into Supabase
  for (const key of keys) {
    const { plaintext, ...row } = key;

    const { error } = await supabase.from("api_keys").upsert(
      {
        key_hash: row.key_hash,
        key_prefix: row.key_prefix,
        name: row.name,
        tier: row.tier,
        rate_limit_per_minute: row.rate_limit_per_minute,
        rate_limit_per_day: row.rate_limit_per_day,
        active: true,
      },
      { onConflict: "key_hash" }
    );

    if (error) {
      console.error(`  ✗ ${row.tier}: ${error.message}`);
    } else {
      console.log(`  ✓ ${row.tier} key inserted`);
    }
  }

  // Print plaintext keys (save these!)
  console.log("\n" + "═".repeat(60));
  console.log("PLAINTEXT API KEYS — SAVE THESE NOW (not stored in DB)");
  console.log("═".repeat(60));
  for (const key of keys) {
    console.log(`\n${key.tier.toUpperCase()} TIER:`);
    console.log(`  Key:      ${key.plaintext}`);
    console.log(`  Prefix:   ${key.key_prefix}`);
    console.log(`  Limits:   ${key.rate_limit_per_minute} req/min · ${key.rate_limit_per_day.toLocaleString()} req/day`);
  }
  console.log("\n" + "═".repeat(60));
  console.log("Usage: Authorization: Bearer <key>");
  console.log("Example: curl -H 'Authorization: Bearer qm_free_...' http://localhost:3000/api/v1/health");
}

main().catch(console.error);
