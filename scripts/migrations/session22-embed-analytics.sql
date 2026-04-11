-- ─── Session 22: Embed Widget Analytics ──────────────────────────────────────
-- Tracks every widget load with type, resource, referrer, and user-agent.
-- Idempotent: YES

CREATE TABLE IF NOT EXISTS public.embed_views (
  id          BIGSERIAL PRIMARY KEY,
  widget_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  referrer    TEXT,
  user_agent  TEXT,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embed_views_resource ON public.embed_views(widget_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_embed_views_referrer ON public.embed_views(referrer);
CREATE INDEX IF NOT EXISTS idx_embed_views_time     ON public.embed_views(viewed_at DESC);

ALTER TABLE public.embed_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "embed_views_service_all" ON public.embed_views;
CREATE POLICY "embed_views_service_all"
  ON public.embed_views FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
