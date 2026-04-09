-- Session 36: Add match_confidence column to disagreements
-- Apply in Supabase SQL Editor

ALTER TABLE disagreements ADD COLUMN IF NOT EXISTS match_confidence NUMERIC DEFAULT 0.5;
CREATE INDEX IF NOT EXISTS disagreements_match_confidence_idx ON disagreements(match_confidence DESC);
