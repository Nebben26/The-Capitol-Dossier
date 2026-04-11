-- whales table — reverse-engineered from scripts/ingest.ts and lib/api.ts
-- The original table was created manually in the Supabase dashboard.
-- This file documents the schema so it can be reproduced if the database
-- is ever recreated from scratch.
--
-- ⚠ DO NOT RUN against a database that already has a whales table.
--   It will fail on CREATE TABLE due to the existing table.
--   Use this only when recreating the schema from zero.
--
-- Columns sourced from:
--   scripts/ingest.ts: ingestWhaleLeaderboard() upsert (address, display_name,
--     total_pnl, total_volume, win_rate, accuracy, positions_count, markets_traded, rank)
--   lib/api.ts: dbWhaleToFrontend() mapper (same columns + brier derived)

CREATE TABLE IF NOT EXISTS whales (
  address          TEXT PRIMARY KEY,            -- Polymarket proxy wallet address
  display_name     TEXT,                        -- Human-readable name or truncated address
  rank             INT NOT NULL DEFAULT 0,      -- Leaderboard rank by P&L
  total_pnl        NUMERIC NOT NULL DEFAULT 0,  -- Lifetime P&L in USD
  total_volume     NUMERIC NOT NULL DEFAULT 0,  -- Lifetime trading volume in USD
  win_rate         NUMERIC NOT NULL DEFAULT 0,  -- Win rate 0-1 (enriched separately)
  accuracy         NUMERIC NOT NULL DEFAULT 0,  -- Accuracy 0-1 (enriched separately)
  positions_count  INT NOT NULL DEFAULT 0,      -- Current open positions
  markets_traded   INT NOT NULL DEFAULT 0,      -- Unique markets ever traded
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whales_pnl     ON whales(total_pnl DESC);
CREATE INDEX IF NOT EXISTS idx_whales_rank    ON whales(rank ASC);
CREATE INDEX IF NOT EXISTS idx_whales_updated ON whales(updated_at DESC);

ALTER TABLE whales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read whales"
  ON whales FOR SELECT USING (true);

CREATE POLICY "Service role write whales"
  ON whales FOR ALL TO service_role
  USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
