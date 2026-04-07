-- Session 7: Whale positions, whale trades schema fix, disagreement snapshots
-- Run this in Supabase SQL Editor: dashboard.supabase.com → SQL editor → new query

-- ─── WHALE POSITIONS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS whale_positions (
  id SERIAL PRIMARY KEY,
  whale_id TEXT NOT NULL,
  market_id TEXT NOT NULL,
  outcome TEXT NOT NULL,
  size NUMERIC NOT NULL,
  avg_price NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL,
  pnl NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(whale_id, market_id, outcome)
);
CREATE INDEX IF NOT EXISTS idx_whale_positions_whale ON whale_positions(whale_id);
CREATE INDEX IF NOT EXISTS idx_whale_positions_market ON whale_positions(market_id);

ALTER TABLE whale_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read whale_positions" ON whale_positions FOR SELECT USING (true);

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
CREATE INDEX IF NOT EXISTS idx_disagreement_snapshots_pair ON disagreement_snapshots(poly_market_id, kalshi_market_id);
CREATE INDEX IF NOT EXISTS idx_disagreement_snapshots_time ON disagreement_snapshots(captured_at DESC);

ALTER TABLE disagreement_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read disagreement_snapshots" ON disagreement_snapshots FOR SELECT USING (true);

-- ─── FIX whale_trades if it exists but has wrong schema ──────────────
-- Drop and recreate with tx_hash UNIQUE constraint for dedup
DROP TABLE IF EXISTS whale_trades CASCADE;
CREATE TABLE whale_trades (
  id SERIAL PRIMARY KEY,
  whale_id TEXT NOT NULL,
  market_id TEXT,
  tx_hash TEXT UNIQUE,
  side TEXT NOT NULL,
  outcome TEXT NOT NULL DEFAULT 'YES',
  size NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  usd_value NUMERIC NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_whale_trades_whale ON whale_trades(whale_id);
CREATE INDEX IF NOT EXISTS idx_whale_trades_market ON whale_trades(market_id);
CREATE INDEX IF NOT EXISTS idx_whale_trades_timestamp ON whale_trades(timestamp DESC);

ALTER TABLE whale_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read whale_trades" ON whale_trades FOR SELECT USING (true);
