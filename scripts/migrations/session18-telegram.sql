-- session18-telegram.sql
-- Telegram bot subscriber management and alert delivery logging.
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query → paste → Run

-- ─── 1. SUBSCRIBERS ───────────────────────────��──────────────────────────────

CREATE TABLE IF NOT EXISTS telegram_subscribers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id BIGINT NOT NULL UNIQUE,
  telegram_username TEXT,
  first_name TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  paused_until TIMESTAMPTZ,
  link_token TEXT UNIQUE,
  link_token_expires_at TIMESTAMPTZ,

  -- Subscription preferences
  alert_arb_spreads BOOLEAN NOT NULL DEFAULT TRUE,
  alert_whale_activity BOOLEAN NOT NULL DEFAULT TRUE,
  alert_market_resolution BOOLEAN NOT NULL DEFAULT FALSE,

  -- Thresholds
  min_spread_pt INTEGER NOT NULL DEFAULT 10,
  min_whale_position_usd INTEGER NOT NULL DEFAULT 50000,

  -- Categories filter (NULL means all)
  categories TEXT[],

  -- Rate limiting
  alerts_today INTEGER NOT NULL DEFAULT 0,
  alerts_today_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  max_alerts_per_day INTEGER NOT NULL DEFAULT 20
);

CREATE INDEX IF NOT EXISTS idx_telegram_subs_active
  ON telegram_subscribers(active) WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_telegram_subs_user
  ON telegram_subscribers(user_id);

CREATE INDEX IF NOT EXISTS idx_telegram_subs_chat
  ON telegram_subscribers(chat_id);

CREATE INDEX IF NOT EXISTS idx_telegram_subs_token
  ON telegram_subscribers(link_token) WHERE link_token IS NOT NULL;

ALTER TABLE telegram_subscribers ENABLE ROW LEVEL SECURITY;

-- Service role has unrestricted access (ingestion + webhook handler)
CREATE POLICY "Service role full access"
  ON telegram_subscribers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read their own subscription
CREATE POLICY "Users read own"
  ON telegram_subscribers FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can update their own preferences
CREATE POLICY "Users update own"
  ON telegram_subscribers FOR UPDATE
  USING (auth.uid() = user_id);

-- ─── 2. ALERT DELIVERY LOG ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS telegram_alerts_sent (
  id BIGSERIAL PRIMARY KEY,
  subscriber_id BIGINT NOT NULL REFERENCES telegram_subscribers(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,          -- 'arb_spread' | 'whale_position' | 'market_resolution'
  payload JSONB NOT NULL,            -- full alert data
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_status TEXT NOT NULL DEFAULT 'sent',  -- 'sent' | 'failed'
  telegram_message_id BIGINT,        -- message_id from Telegram API response
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_alerts_sent_subscriber
  ON telegram_alerts_sent(subscriber_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_sent_type
  ON telegram_alerts_sent(alert_type, sent_at DESC);

ALTER TABLE telegram_alerts_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access alerts_sent"
  ON telegram_alerts_sent FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── 3. SCHEMA CACHE BUST ────────────────────────────────────────────────────

NOTIFY pgrst, 'reload schema';
