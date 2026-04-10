CREATE TABLE IF NOT EXISTS correlations (
  id BIGSERIAL PRIMARY KEY,
  market_a_id TEXT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  market_b_id TEXT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  correlation NUMERIC NOT NULL,
  sample_size INT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(market_a_id, market_b_id)
);

CREATE INDEX IF NOT EXISTS idx_correlations_a ON correlations(market_a_id);
CREATE INDEX IF NOT EXISTS idx_correlations_b ON correlations(market_b_id);
CREATE INDEX IF NOT EXISTS idx_correlations_strength ON correlations((ABS(correlation)) DESC);

ALTER TABLE correlations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON correlations
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Public read access" ON correlations
  FOR SELECT TO anon, authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';
