-- Session 26: Quiver Indices — composite proprietary indices
-- Aggregates prediction market data into single citeable numbers.

CREATE TABLE IF NOT EXISTS quiver_indices (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 50,
  previous_value NUMERIC,
  change_24h NUMERIC,
  component_count INTEGER NOT NULL DEFAULT 0,
  methodology TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiver_index_history (
  id BIGSERIAL PRIMARY KEY,
  index_slug TEXT NOT NULL,
  value NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_index_history_slug
  ON quiver_index_history(index_slug, recorded_at DESC);

ALTER TABLE quiver_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiver_index_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read indices" ON quiver_indices;
CREATE POLICY "Public read indices" ON quiver_indices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role write indices" ON quiver_indices;
CREATE POLICY "Service role write indices" ON quiver_indices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read index history" ON quiver_index_history;
CREATE POLICY "Public read index history" ON quiver_index_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role write index history" ON quiver_index_history;
CREATE POLICY "Service role write index history" ON quiver_index_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO quiver_indices (slug, name, description, category, methodology) VALUES
(
  'election-confidence',
  'Quiver Election Confidence Index',
  'Aggregates whale sentiment and market prices across all active election markets into a single confidence score (0–100). Higher = stronger consensus on outcomes.',
  'Elections',
  'Volume-weighted average of all election market prices, normalized by distance from 50¢. A market at 90¢ (decisive) contributes more confidence than one at 55¢ (uncertain). Formula: Σ(|price−50|×2 × volume) / Σ(volume). Updated every ~30 minutes via ingest cycle.'
),
(
  'crypto-sentiment',
  'Quiver Crypto Sentiment Index',
  'Tracks bullish vs bearish sentiment across all crypto-related prediction markets. 0 = extreme bear, 100 = extreme bull.',
  'Crypto',
  'Volume-weighted mean probability of bullish outcomes across all crypto-category markets. Formula: Σ(price × volume) / Σ(volume). Updated every ~30 minutes via ingest cycle.'
),
(
  'geopolitical-risk',
  'Quiver Geopolitical Risk Index',
  'Measures market-implied probability of geopolitical escalation events. Higher = more risk priced in.',
  'Geopolitics',
  'Volume-weighted average of prices across all geopolitics-category prediction markets. Formula: Σ(price × volume) / Σ(volume). Interpreted as: higher values reflect markets pricing in greater probability of conflict, sanctions, or diplomatic crises. Updated every ~30 minutes.'
),
(
  'economic-outlook',
  'Quiver Economic Outlook Index',
  'Composite of recession, inflation, rates, and employment market probabilities. Higher = more optimistic economic outlook.',
  'Economics',
  'Volume-weighted mean price of economics-category markets. Inverted from raw value (100 − weighted_mean) to produce an optimism score: when recession/crisis probabilities are high the index falls; when positive economic outcomes dominate it rises. Updated every ~30 minutes.'
)
ON CONFLICT (slug) DO NOTHING;

NOTIFY pgrst, 'reload schema';
