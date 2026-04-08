-- Session 28: Public API v1
-- Apply via Supabase SQL Editor

-- ─── API KEYS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id                    BIGSERIAL PRIMARY KEY,
  key_hash              TEXT NOT NULL UNIQUE,
  key_prefix            TEXT NOT NULL,           -- e.g. "qm_free_a1b2c3d4" for display
  name                  TEXT NOT NULL,
  tier                  TEXT NOT NULL DEFAULT 'free',  -- free | pro | premium
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 10,
  rate_limit_per_day    INTEGER NOT NULL DEFAULT 100,
  requests_today        INTEGER NOT NULL DEFAULT 0,
  requests_total        BIGINT NOT NULL DEFAULT 0,
  last_used_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at            TIMESTAMPTZ,
  active                BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_tier     ON api_keys(tier);
CREATE INDEX IF NOT EXISTS idx_api_keys_active   ON api_keys(active);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
-- No public read — API key validation is done server-side with service role key

-- ─── API REQUEST LOGS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_request_logs (
  id          BIGSERIAL PRIMARY KEY,
  key_id      BIGINT REFERENCES api_keys(id) ON DELETE SET NULL,
  key_prefix  TEXT,
  endpoint    TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_ms INTEGER,
  ip          TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_logs_key_id      ON api_request_logs(key_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_requested_at ON api_request_logs(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint     ON api_request_logs(endpoint);

ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
-- No public read — server-side only via service role key
