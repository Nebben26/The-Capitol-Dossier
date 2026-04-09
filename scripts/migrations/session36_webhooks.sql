-- Session 36: Webhook infrastructure
-- Apply in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id BIGINT REFERENCES api_keys(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS webhooks_api_key_idx ON webhooks(api_key_id);
CREATE INDEX IF NOT EXISTS webhooks_active_idx ON webhooks(active) WHERE active = true;
