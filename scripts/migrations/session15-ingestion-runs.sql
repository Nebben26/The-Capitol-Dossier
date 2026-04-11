-- Session 15: Ingestion run tracking
-- Every ingest.ts run writes a record here so you can audit history,
-- spot stuck runs, and verify the cron is firing on schedule.
-- Apply via Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id                    BIGSERIAL PRIMARY KEY,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'running',  -- running | completed | completed_with_errors | failed
  markets_fetched       INT,
  markets_upserted      INT,
  disagreements_upserted INT,
  whales_processed      INT,
  duration_seconds      INT,
  errors                JSONB,
  source                TEXT DEFAULT 'github_actions'
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started ON ingestion_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_status  ON ingestion_runs(status);

ALTER TABLE ingestion_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access ingestion_runs"
  ON ingestion_runs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can read ingestion_runs"
  ON ingestion_runs FOR SELECT
  USING (true);

NOTIFY pgrst, 'reload schema';
