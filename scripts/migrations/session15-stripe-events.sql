-- Session 15: Stripe webhook event log + idempotency
-- Every incoming Stripe webhook event is recorded here.
-- Prevents double-processing when Stripe retries delivery.
-- Apply via Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS stripe_events (
  id           TEXT PRIMARY KEY,     -- Stripe event ID (evt_xxx) — natural PK prevents duplicates
  type         TEXT NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  status       TEXT DEFAULT 'received',  -- received | processed | failed | skipped
  payload      JSONB,
  error        TEXT
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type     ON stripe_events(type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_received ON stripe_events(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_stripe_events_status   ON stripe_events(status);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access stripe_events"
  ON stripe_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
