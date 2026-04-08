-- Session 26: Smart Signal Alerts
-- Apply via Supabase SQL Editor (Management API PAT required for programmatic DDL)

CREATE TABLE IF NOT EXISTS signals (
  id           BIGSERIAL PRIMARY KEY,
  signal_id    TEXT NOT NULL UNIQUE,
  type         TEXT NOT NULL,        -- whale_consensus | smart_money_concentration | size_spike | whale_divergence
  confidence   INTEGER NOT NULL,     -- 1-10
  market_id    TEXT NOT NULL,
  market_question TEXT,
  headline     TEXT NOT NULL,
  detail       TEXT,
  stats        JSONB,
  detected_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ          -- optional TTL; null = keep until replaced
);

CREATE INDEX IF NOT EXISTS idx_signals_type         ON signals(type);
CREATE INDEX IF NOT EXISTS idx_signals_market_id    ON signals(market_id);
CREATE INDEX IF NOT EXISTS idx_signals_confidence   ON signals(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_signals_detected_at  ON signals(detected_at DESC);

ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public read signals" ON signals FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
