-- Spread snapshots table: stores historical cross-platform spread data
-- Populated by the existing ingest pipeline (extended in Session 39)
-- Used to render historical convergence charts and calculate spread velocity
--
-- NOTE: The existing `disagreement_snapshots` table remains unchanged and
-- continues to power the Sparkline components. This new table uses the
-- canonical `market_id` key (= poly_market_id) and adds structured columns
-- for the new chart + velocity features.
--
-- Apply in Supabase SQL Editor after Session 39 ships.

CREATE TABLE IF NOT EXISTS spread_snapshots (
  id BIGSERIAL PRIMARY KEY,
  market_id TEXT NOT NULL,
  polymarket_price INTEGER NOT NULL,
  kalshi_price INTEGER NOT NULL,
  spread INTEGER NOT NULL,
  polymarket_volume NUMERIC,
  kalshi_volume NUMERIC,
  direction TEXT NOT NULL CHECK (direction IN ('poly-higher', 'kalshi-higher')),
  captured_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_spread_snapshots_market_time
  ON spread_snapshots(market_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_spread_snapshots_captured
  ON spread_snapshots(captured_at DESC);

ALTER TABLE spread_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read spread_snapshots"
  ON spread_snapshots FOR SELECT USING (true);

CREATE POLICY "service write spread_snapshots"
  ON spread_snapshots FOR INSERT WITH CHECK (true);
