-- Session 25: AI Market Thesis Generator
-- Run in Supabase SQL editor

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
CREATE POLICY "public read theses" ON market_theses FOR SELECT USING (true);
