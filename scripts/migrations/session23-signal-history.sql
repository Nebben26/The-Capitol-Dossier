-- ─── Session 23: Signal History ───────────────────────────────────────────────
-- Snapshots every arb signal at detection time for backtesting and track record.
-- Idempotent: YES

CREATE TABLE IF NOT EXISTS public.signal_history (
  id                  BIGSERIAL PRIMARY KEY,
  disagreement_id     TEXT NOT NULL,
  question            TEXT NOT NULL,
  category            TEXT,
  poly_price          NUMERIC NOT NULL,
  kalshi_price        NUMERIC NOT NULL,
  spread              NUMERIC NOT NULL,
  score               NUMERIC,
  poly_volume         NUMERIC,
  kalshi_volume       NUMERIC,
  detected_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Resolution tracking
  resolved            BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at         TIMESTAMPTZ,
  resolution_outcome  TEXT,
  poly_final_price    NUMERIC,
  kalshi_final_price  NUMERIC,

  -- P&L tracking (computed after resolution)
  arb_profit_pct      NUMERIC,
  would_have_profited BOOLEAN,

  -- Execution context
  poly_url            TEXT,
  kalshi_url          TEXT,

  UNIQUE(disagreement_id, detected_at)
);

CREATE INDEX IF NOT EXISTS idx_signal_history_detected      ON public.signal_history(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_history_disagreement  ON public.signal_history(disagreement_id);
CREATE INDEX IF NOT EXISTS idx_signal_history_spread        ON public.signal_history(spread DESC);
CREATE INDEX IF NOT EXISTS idx_signal_history_resolved      ON public.signal_history(resolved) WHERE resolved = TRUE;
CREATE INDEX IF NOT EXISTS idx_signal_history_profitable    ON public.signal_history(would_have_profited) WHERE would_have_profited = TRUE;

ALTER TABLE public.signal_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signal_history_public_read"   ON public.signal_history;
DROP POLICY IF EXISTS "signal_history_service_write" ON public.signal_history;

CREATE POLICY "signal_history_public_read"
  ON public.signal_history FOR SELECT USING (true);

CREATE POLICY "signal_history_service_write"
  ON public.signal_history FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
