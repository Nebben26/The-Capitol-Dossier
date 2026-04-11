-- Session 9: Morning Brief subscriber tables
-- Run in Supabase SQL Editor. DO NOT run automatically.

CREATE TABLE IF NOT EXISTS morning_brief_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  user_id TEXT,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_sent_at TIMESTAMPTZ,
  send_count INT NOT NULL DEFAULT 0,
  source TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  unsubscribe_token TEXT NOT NULL DEFAULT gen_random_uuid()::text
);

CREATE INDEX IF NOT EXISTS idx_brief_subs_active ON morning_brief_subscribers(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_brief_subs_email ON morning_brief_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_brief_subs_token ON morning_brief_subscribers(unsubscribe_token);

ALTER TABLE morning_brief_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access brief"
  ON morning_brief_subscribers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can subscribe"
  ON morning_brief_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Send history log
CREATE TABLE IF NOT EXISTS morning_brief_sends (
  id BIGSERIAL PRIMARY KEY,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscriber_count INT NOT NULL,
  success_count INT NOT NULL DEFAULT 0,
  failure_count INT NOT NULL DEFAULT 0,
  subject TEXT NOT NULL,
  errors JSONB
);

ALTER TABLE morning_brief_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access sends"
  ON morning_brief_sends FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
