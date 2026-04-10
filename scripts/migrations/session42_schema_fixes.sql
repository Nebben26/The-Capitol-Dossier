-- Session 42: Schema fixes for category + volume columns + schema reload function
-- Apply in Supabase SQL Editor

-- ─── MARKETS ─────────────────────────────────────────────────────────────────
-- category column — ingest has been writing this for months; just ensure it exists
ALTER TABLE markets ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Economics';

-- ─── DISAGREEMENTS ───────────────────────────────────────────────────────────
-- Volume columns — ingest now writes these; detect-story-events.ts reads them
ALTER TABLE disagreements ADD COLUMN IF NOT EXISTS poly_volume  NUMERIC DEFAULT 0;
ALTER TABLE disagreements ADD COLUMN IF NOT EXISTS kalshi_volume NUMERIC DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_disagreements_spread ON disagreements(spread DESC);
CREATE INDEX IF NOT EXISTS idx_disagreements_poly_vol ON disagreements(poly_volume DESC);

-- ─── PGRST SCHEMA RELOAD ─────────────────────────────────────────────────────
-- Call supabase.rpc('notify_pgrst_reload') from ingest.ts / detect-story-events.ts
-- to bust PostgREST schema cache after migrations add new columns.
-- Note: ingest.ts and detect-story-events.ts call this via .catch(() => null)
-- so it is safe to invoke even before this function exists.
CREATE OR REPLACE FUNCTION public.notify_pgrst_reload()
RETURNS void LANGUAGE sql
AS $$
  SELECT pg_notify('pgrst', 'reload schema');
$$;

GRANT EXECUTE ON FUNCTION public.notify_pgrst_reload() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_pgrst_reload() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_pgrst_reload() TO anon;
