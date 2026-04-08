-- Session 31: Signal Historical Accuracy
-- Apply via Supabase SQL Editor

ALTER TABLE signals ADD COLUMN IF NOT EXISTS historical_accuracy_pct NUMERIC;
ALTER TABLE signals ADD COLUMN IF NOT EXISTS historical_sample_size INTEGER;
