-- session20-portfolio.sql
-- Creates the portfolio tracking tables for My Quiver:
--   user_portfolios  — one row per user, wallet address + summary stats
--   user_positions   — per-market positions synced from Polymarket data API
--   portfolio_snapshots — time-series of total_value_usd for the sparkline
-- Idempotent: safe to run multiple times.

CREATE TABLE IF NOT EXISTS user_portfolios (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  polymarket_address TEXT,
  polymarket_username TEXT,
  connected_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle',
  sync_error TEXT,
  total_value_usd NUMERIC DEFAULT 0,
  total_pnl_usd NUMERIC DEFAULT 0,
  total_pnl_pct NUMERIC DEFAULT 0,
  position_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user ON user_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_address ON user_portfolios(polymarket_address);
CREATE INDEX IF NOT EXISTS idx_portfolios_synced ON user_portfolios(last_synced_at DESC);

ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role full access portfolios" ON user_portfolios
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users read own portfolio" ON user_portfolios
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users update own portfolio" ON user_portfolios
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users insert own portfolio" ON user_portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_positions (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id TEXT NOT NULL,
  market_question TEXT NOT NULL,
  market_slug TEXT,
  outcome TEXT NOT NULL,
  side TEXT NOT NULL,
  size NUMERIC NOT NULL DEFAULT 0,
  avg_entry_price NUMERIC,
  current_price NUMERIC,
  cost_basis_usd NUMERIC,
  current_value_usd NUMERIC,
  realized_pnl_usd NUMERIC DEFAULT 0,
  unrealized_pnl_usd NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'open',
  category TEXT,
  resolves_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_positions_portfolio ON user_positions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_positions_user ON user_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_market ON user_positions(market_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON user_positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_category ON user_positions(category);

ALTER TABLE user_positions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role full access positions" ON user_positions
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users read own positions" ON user_positions
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id BIGSERIAL PRIMARY KEY,
  portfolio_id BIGINT NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_value_usd NUMERIC NOT NULL,
  total_pnl_usd NUMERIC NOT NULL,
  position_count INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snapshots_portfolio ON portfolio_snapshots(portfolio_id, snapshot_at DESC);

ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role full access snapshots" ON portfolio_snapshots
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users read own snapshots" ON portfolio_snapshots
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Bust PostgREST schema cache
NOTIFY pgrst, 'reload schema';
