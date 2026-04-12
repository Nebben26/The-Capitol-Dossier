-- session28-api.sql
-- Adds user_id to api_keys table, proper RLS for self-service key management,
-- and updates default rate limits to the published free-tier values.
-- Run AFTER session28_api_keys.sql.
-- Idempotent: uses ADD COLUMN IF NOT EXISTS, DROP POLICY IF EXISTS.

-- ─── Add user_id FK so users can manage their own keys ───────────────────────
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- Update default rate limits to published free-tier values
-- (existing rows keep their values; new rows created through the app get the right defaults)
ALTER TABLE public.api_keys
  ALTER COLUMN rate_limit_per_minute SET DEFAULT 30,
  ALTER COLUMN rate_limit_per_day    SET DEFAULT 1000;

-- ─── RLS: self-service CRUD for authenticated users ──────────────────────────

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own keys"   ON public.api_keys;
DROP POLICY IF EXISTS "Users insert own keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users update own keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users delete own keys" ON public.api_keys;
DROP POLICY IF EXISTS "Service role full access keys" ON public.api_keys;

CREATE POLICY "Users read own keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Service role bypasses all RLS for server-side validation
CREATE POLICY "Service role full access keys"
  ON public.api_keys FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ─── RLS on api_request_logs ─────────────────────────────────────────────────

ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own logs"        ON public.api_request_logs;
DROP POLICY IF EXISTS "Service role full access logs" ON public.api_request_logs;

CREATE POLICY "Users read own logs"
  ON public.api_request_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.api_keys
      WHERE api_keys.id = api_request_logs.key_id
        AND api_keys.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access logs"
  ON public.api_request_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ─── Per-tier rate-limit function (convenience, not enforced by DB) ──────────
-- Tier definitions for reference:
--   free:    30 req/min, 1000 req/day
--   pro:     60 req/min, 5000 req/day
--   premium: 300 req/min, 50000 req/day

NOTIFY pgrst, 'reload schema';
