-- session29-briefs.sql
-- Market Briefs: daily white-label content feed for newsletters and podcasts

-- ─── market_briefs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.market_briefs (
  id                  BIGSERIAL PRIMARY KEY,
  slug                TEXT NOT NULL UNIQUE,      -- e.g. "elections-2026-04-11"
  category            TEXT NOT NULL,             -- Elections | Crypto | Economics | Geopolitics | Sports
  title               TEXT NOT NULL,
  brief_markdown      TEXT NOT NULL,
  brief_html          TEXT NOT NULL,
  brief_json          JSONB NOT NULL DEFAULT '{}',
  generated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_market_count INTEGER,
  word_count          INTEGER
);

CREATE INDEX IF NOT EXISTS idx_briefs_category
  ON public.market_briefs (category, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_briefs_generated
  ON public.market_briefs (generated_at DESC);

-- ─── brief_subscriptions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.brief_subscriptions (
  id               BIGSERIAL PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category         TEXT NOT NULL,
  delivery_method  TEXT NOT NULL DEFAULT 'rss',   -- rss | api | email
  custom_branding  TEXT,                           -- e.g. "Brought to you by The Capitol Dossier"
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, category)
);

CREATE INDEX IF NOT EXISTS idx_brief_subs_user
  ON public.brief_subscriptions (user_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.market_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read briefs"         ON public.market_briefs;
DROP POLICY IF EXISTS "Service role write briefs"  ON public.market_briefs;

CREATE POLICY "Public read briefs"
  ON public.market_briefs FOR SELECT
  USING (true);

CREATE POLICY "Service role write briefs"
  ON public.market_briefs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users read own subscriptions"   ON public.brief_subscriptions;
DROP POLICY IF EXISTS "Users insert own subscriptions" ON public.brief_subscriptions;
DROP POLICY IF EXISTS "Users update own subscriptions" ON public.brief_subscriptions;
DROP POLICY IF EXISTS "Users delete own subscriptions" ON public.brief_subscriptions;

CREATE POLICY "Users read own subscriptions"
  ON public.brief_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own subscriptions"
  ON public.brief_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own subscriptions"
  ON public.brief_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own subscriptions"
  ON public.brief_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
