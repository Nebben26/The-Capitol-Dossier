-- session27-consensus.sql
-- Community Consensus Predictions: crowd-sourced probabilities per market
-- Part of the Quiver Markets intelligence layer

-- ─── 1. community_predictions ────────────────────────────────────────────────
-- One row per authenticated user per market. Upsert-based (last write wins).
CREATE TABLE IF NOT EXISTS public.community_predictions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id        text NOT NULL,
  market_question  text NOT NULL,
  predicted_prob   int  NOT NULL CHECK (predicted_prob BETWEEN 1 AND 99),
  -- confidence: 1=low, 2=medium, 3=high — used for weighted average
  confidence       int  NOT NULL DEFAULT 2 CHECK (confidence BETWEEN 1 AND 3),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, market_id)
);

CREATE INDEX IF NOT EXISTS idx_community_predictions_market_id
  ON public.community_predictions (market_id);

CREATE INDEX IF NOT EXISTS idx_community_predictions_user_id
  ON public.community_predictions (user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.community_predictions_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_community_predictions_updated_at ON public.community_predictions;
CREATE TRIGGER trg_community_predictions_updated_at
  BEFORE UPDATE ON public.community_predictions
  FOR EACH ROW EXECUTE FUNCTION public.community_predictions_set_updated_at();

-- RLS
ALTER TABLE public.community_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read all community predictions" ON public.community_predictions;
CREATE POLICY "Users can read all community predictions"
  ON public.community_predictions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own prediction" ON public.community_predictions;
CREATE POLICY "Users can insert their own prediction"
  ON public.community_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own prediction" ON public.community_predictions;
CREATE POLICY "Users can update their own prediction"
  ON public.community_predictions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own prediction" ON public.community_predictions;
CREATE POLICY "Users can delete their own prediction"
  ON public.community_predictions FOR DELETE
  USING (auth.uid() = user_id);

-- ─── 2. market_consensus_cache ───────────────────────────────────────────────
-- Pre-aggregated consensus per market. Recomputed on every prediction upsert/delete.
CREATE TABLE IF NOT EXISTS public.market_consensus_cache (
  market_id            text        PRIMARY KEY,
  market_question      text        NOT NULL DEFAULT '',
  consensus_prob       numeric(5,2) NOT NULL,   -- confidence-weighted mean
  raw_mean             numeric(5,2) NOT NULL,    -- simple mean (unweighted)
  vote_count           int         NOT NULL DEFAULT 0,
  avg_confidence       numeric(3,2) NOT NULL DEFAULT 2,
  last_updated         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_consensus_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read consensus" ON public.market_consensus_cache;
CREATE POLICY "Public read consensus"
  ON public.market_consensus_cache FOR SELECT
  USING (true);

-- ─── 3. source_accuracy_history ──────────────────────────────────────────────
-- Each resolved market contributes one row per source with its predicted probability
-- and the actual outcome. Populated by compute-source-accuracy.ts.
CREATE TABLE IF NOT EXISTS public.source_accuracy_history (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id            text NOT NULL,
  market_question      text NOT NULL DEFAULT '',
  resolved_at          timestamptz,
  outcome              boolean,               -- true=YES, false=NO
  -- Predicted probabilities at resolution time (null if source had no data)
  poly_prob            numeric(5,2),
  kalshi_prob          numeric(5,2),
  whale_prob           numeric(5,2),          -- whale consensus at resolution
  community_prob       numeric(5,2),          -- community consensus at resolution
  -- Brier scores per source (lower = better, 0-1)
  poly_brier           numeric(6,4),
  kalshi_brier         numeric(6,4),
  whale_brier          numeric(6,4),
  community_brier      numeric(6,4),
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (market_id)
);

CREATE INDEX IF NOT EXISTS idx_source_accuracy_resolved_at
  ON public.source_accuracy_history (resolved_at DESC);

ALTER TABLE public.source_accuracy_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read source accuracy" ON public.source_accuracy_history;
CREATE POLICY "Public read source accuracy"
  ON public.source_accuracy_history FOR SELECT
  USING (true);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
