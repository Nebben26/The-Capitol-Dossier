-- Session 7 v2: Create whale_positions and disagreement_snapshots
-- Run this in Supabase SQL Editor

-- ─── WHALE POSITIONS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whale_positions (
  id SERIAL PRIMARY KEY,
  whale_id TEXT NOT NULL,
  market_id TEXT NOT NULL,
  outcome TEXT NOT NULL DEFAULT 'YES',
  size NUMERIC NOT NULL DEFAULT 0,
  avg_price NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC NOT NULL DEFAULT 0,
  pnl NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(whale_id, market_id, outcome)
);

CREATE INDEX IF NOT EXISTS idx_wp_whale ON whale_positions(whale_id);
CREATE INDEX IF NOT EXISTS idx_wp_market ON whale_positions(market_id);

ALTER TABLE whale_positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read whale_positions" ON whale_positions;
CREATE POLICY "Public read whale_positions" ON whale_positions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write whale_positions" ON whale_positions;
CREATE POLICY "Service write whale_positions" ON whale_positions FOR ALL USING (true) WITH CHECK (true);

-- ─── DISAGREEMENT SNAPSHOTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS disagreement_snapshots (
  id SERIAL PRIMARY KEY,
  poly_market_id TEXT NOT NULL,
  kalshi_market_id TEXT NOT NULL,
  question TEXT NOT NULL,
  poly_price NUMERIC NOT NULL,
  kalshi_price NUMERIC NOT NULL,
  spread NUMERIC NOT NULL,
  poly_volume NUMERIC,
  kalshi_volume NUMERIC,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ds_pair ON disagreement_snapshots(poly_market_id, kalshi_market_id);
CREATE INDEX IF NOT EXISTS idx_ds_time ON disagreement_snapshots(captured_at DESC);

ALTER TABLE disagreement_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read disagreement_snapshots" ON disagreement_snapshots;
CREATE POLICY "Public read disagreement_snapshots" ON disagreement_snapshots FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service write disagreement_snapshots" ON disagreement_snapshots;
CREATE POLICY "Service write disagreement_snapshots" ON disagreement_snapshots FOR ALL USING (true) WITH CHECK (true);

-- ─── FIX whale_trades — add missing columns if they don't exist ──────
ALTER TABLE whale_trades ADD COLUMN IF NOT EXISTS whale_id TEXT;
ALTER TABLE whale_trades ADD COLUMN IF NOT EXISTS tx_hash TEXT;
ALTER TABLE whale_trades ADD COLUMN IF NOT EXISTS usd_value NUMERIC DEFAULT 0;
ALTER TABLE whale_trades ADD COLUMN IF NOT EXISTS outcome TEXT DEFAULT 'YES';

-- Add unique constraint on tx_hash if not already present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'whale_trades_tx_hash_key') THEN
    ALTER TABLE whale_trades ADD CONSTRAINT whale_trades_tx_hash_key UNIQUE (tx_hash);
  END IF;
END $$;
