-- session19-waitlist-tier.sql
-- Adds a `tier` column to the waitlist table so we can track
-- which founder cohort (pro or signal_desk) each subscriber is interested in.
-- Idempotent: safe to run multiple times.

ALTER TABLE waitlist
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'pro';

CREATE INDEX IF NOT EXISTS idx_waitlist_tier ON waitlist(tier);

-- Bust PostgREST schema cache so the new column is immediately available
NOTIFY pgrst, 'reload schema';
