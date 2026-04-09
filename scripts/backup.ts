/**
 * Quiver Markets — Database Backup Script
 *
 * Dumps every table to backups/YYYY-MM-DD/{table}.json
 * Run manually before risky operations:
 *
 *   npx tsx scripts/backup.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TABLES = [
  "markets",
  "whales",
  "whale_positions",
  "disagreements",
  "signals",
  "market_theses",
  "news_articles",
  "api_keys",
  "waitlist",
  "webhooks",
];

async function backupTable(table: string, dir: string): Promise<void> {
  // Supabase returns at most 1000 rows by default — use range to paginate
  const allRows: unknown[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) {
      if (error.message.includes("does not exist") || error.code === "42P01") {
        console.warn(`  [${table}] table does not exist — skipping`);
        return;
      }
      throw new Error(`[${table}] query failed: ${error.message}`);
    }

    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  const filePath = join(dir, `${table}.json`);
  const json = JSON.stringify(allRows, null, 2);
  writeFileSync(filePath, json, "utf-8");

  const sizeKb = (Buffer.byteLength(json, "utf-8") / 1024).toFixed(1);
  console.log(`  ✓ ${table}: ${allRows.length} rows (${sizeKb} KB) → ${filePath}`);
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const dir = join(process.cwd(), "backups", today);
  mkdirSync(dir, { recursive: true });

  console.log(`Quiver Markets — Database Backup`);
  console.log(`Destination: ${dir}`);
  console.log(`Tables: ${TABLES.join(", ")}\n`);

  for (const table of TABLES) {
    await backupTable(table, dir).catch((err) => {
      console.error(`  ✗ ${table}: ${err.message}`);
    });
  }

  console.log("\nBackup complete.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
