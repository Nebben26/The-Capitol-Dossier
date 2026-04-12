-- Session 25: Market Price History + Correlation Engine
-- Adds market_price_history (cumulative snapshots, not rolling-window) and
-- market_correlations (computed nightly by compute-correlations.ts).
--
-- The existing price_history table stores full CLOB-sourced candle history.
-- market_price_history stores lightweight ingest-time price snapshots (every
-- ~30-min ingest cycle), which is the dataset the correlation engine uses when
-- CLOB history is sparse or unavailable.

CREATE TABLE IF NOT EXISTS market_price_history (
  id BIGSERIAL PRIMARY KEY,
  market_id TEXT NOT NULL,
  price NUMERIC NOT NULL,
  volume NUMERIC,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_market
  ON market_price_history(market_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_history_recorded
  ON market_price_history(recorded_at DESC);

ALTER TABLE market_price_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read price history" ON market_price_history;
CREATE POLICY "Public read price history"
  ON market_price_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role write price history" ON market_price_history;
CREATE POLICY "Service role write price history"
  ON market_price_history FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- market_correlations: nightly-computed Pearson correlations.
-- Separate from the existing correlations table (session44) which uses
-- FK references to markets. This table uses TEXT IDs for flexibility.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS market_correlations (
  id BIGSERIAL PRIMARY KEY,
  market_a_id TEXT NOT NULL,
  market_b_id TEXT NOT NULL,
  correlation NUMERIC NOT NULL,
  sample_count INTEGER NOT NULL,
  category_a TEXT,
  category_b TEXT,
  question_a TEXT,
  question_b TEXT,
  price_a NUMERIC,
  price_b NUMERIC,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(market_a_id, market_b_id)
);

CREATE INDEX IF NOT EXISTS idx_mc_strength
  ON market_correlations(ABS(correlation) DESC);

CREATE INDEX IF NOT EXISTS idx_mc_market_a
  ON market_correlations(market_a_id);

CREATE INDEX IF NOT EXISTS idx_mc_market_b
  ON market_correlations(market_b_id);

ALTER TABLE market_correlations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read market_correlations" ON market_correlations;
CREATE POLICY "Public read market_correlations"
  ON market_correlations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role write market_correlations" ON market_correlations;
CREATE POLICY "Service role write market_correlations"
  ON market_correlations FOR ALL TO service_role
  USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
