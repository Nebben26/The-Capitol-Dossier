-- Session 14: News/Insights pipeline tables
-- Run this in Supabase SQL editor before running ingest-news.ts

CREATE TABLE IF NOT EXISTS news_articles (
  id          BIGSERIAL PRIMARY KEY,
  url         TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  summary     TEXT,
  source      TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  image_url   TEXT
);

CREATE TABLE IF NOT EXISTS news_market_tags (
  id          BIGSERIAL PRIMARY KEY,
  article_id  BIGINT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  market_id   TEXT NOT NULL,   -- markets.id (Polymarket condition ID)
  market_slug TEXT,
  question    TEXT,
  score       NUMERIC(5,3) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(article_id, market_id)
);

-- Index for fetching recent articles efficiently
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles(published_at DESC);

-- Index for looking up tags by article
CREATE INDEX IF NOT EXISTS idx_news_market_tags_article ON news_market_tags(article_id);

-- Index for looking up articles by market
CREATE INDEX IF NOT EXISTS idx_news_market_tags_market ON news_market_tags(market_id);

-- Enable anon read access
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_market_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon read news_articles"
  ON news_articles FOR SELECT TO anon USING (true);

CREATE POLICY "anon read news_market_tags"
  ON news_market_tags FOR SELECT TO anon USING (true);
