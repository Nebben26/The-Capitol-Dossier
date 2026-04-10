-- Session 41: Template story engine + whale wallet labels
-- Apply manually in Supabase SQL editor

-- ─── STORIES ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS stories (
  id             BIGSERIAL PRIMARY KEY,
  slug           TEXT UNIQUE NOT NULL,
  template_id    TEXT NOT NULL,
  event_type     TEXT NOT NULL,
  headline       TEXT NOT NULL,
  summary        TEXT NOT NULL,
  body           TEXT NOT NULL,
  category       TEXT,
  quality_score  INTEGER NOT NULL DEFAULT 0,
  tier           TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'trader')),
  source_market_ids  TEXT[],
  source_whale_ids   TEXT[],
  metadata       JSONB,
  published_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_stories_published     ON stories(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_tier_quality  ON stories(tier, quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_stories_category      ON stories(category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_stories_slug   ON stories(slug);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read free stories"
  ON stories FOR SELECT
  USING (tier = 'free');

CREATE POLICY "authenticated read all stories"
  ON stories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "service write stories"
  ON stories FOR INSERT
  WITH CHECK (true);

-- ─── WALLET LABELS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wallet_labels (
  wallet_address  TEXT PRIMARY KEY,
  display_name    TEXT NOT NULL,
  description     TEXT,
  verified        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wallet_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read wallet_labels"
  ON wallet_labels FOR SELECT
  USING (true);
