-- Session 29: Market Candlestick Data
-- Apply via Supabase SQL Editor

CREATE TABLE IF NOT EXISTS market_candles (
  id             BIGSERIAL PRIMARY KEY,
  market_id      TEXT NOT NULL,
  timestamp      TIMESTAMPTZ NOT NULL,
  open           NUMERIC NOT NULL,
  high           NUMERIC NOT NULL,
  low            NUMERIC NOT NULL,
  close          NUMERIC NOT NULL,
  volume         NUMERIC NOT NULL DEFAULT 0,
  period_minutes INTEGER NOT NULL DEFAULT 60,
  source         TEXT NOT NULL DEFAULT 'kalshi',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(market_id, timestamp, period_minutes)
);

CREATE INDEX IF NOT EXISTS idx_market_candles_market_id ON market_candles(market_id);
CREATE INDEX IF NOT EXISTS idx_market_candles_timestamp ON market_candles(timestamp DESC);

ALTER TABLE market_candles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public read candles" ON market_candles FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
