/**
 * Create market_theses table via Supabase Management API
 * Run: npx tsx scripts/create-theses-table.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sql = `
CREATE TABLE IF NOT EXISTS market_theses (
  id BIGSERIAL PRIMARY KEY,
  market_id TEXT NOT NULL UNIQUE,
  bull_case TEXT NOT NULL,
  bear_case TEXT NOT NULL,
  catalysts TEXT NOT NULL,
  whale_read TEXT NOT NULL,
  historical_context TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  model TEXT NOT NULL DEFAULT 'claude-sonnet-4-6-via-code'
);

CREATE INDEX IF NOT EXISTS idx_market_theses_market_id ON market_theses(market_id);

ALTER TABLE market_theses ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public read theses" ON market_theses FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`;

async function main() {
  // Use Supabase's direct SQL endpoint via the REST API
  const projectRef = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    // Try the pg endpoint instead
    const res2 = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: "POST",
      headers: {
        "apikey": SERVICE_KEY,
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    });
    const text2 = await res2.text();
    console.log("pg endpoint response:", res2.status, text2.slice(0, 500));
    return;
  }

  const data = await res.text();
  console.log("Response:", data.slice(0, 500));
}

main().catch(console.error);
