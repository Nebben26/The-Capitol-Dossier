-- backfill-resolved.sql
-- Run once in Supabase SQL editor to mark expired markets as resolved.
--
-- Markets are considered resolved if:
--   1. Their end_date has passed AND
--   2. Their price is 0 or 100 (settled at a definitive outcome)
--
-- After running this, the Resolved Markets page will show real data.
-- The change_24h sanity filter (.gte(-100).lte(100)) prevents stale rows
-- from surfacing as "biggest movers" on subsequent ingest runs.

UPDATE markets
SET resolved = true
WHERE
  resolved = false
  AND end_date IS NOT NULL
  AND end_date < NOW()
  AND (price = 0 OR price = 100);

-- Verify:
SELECT COUNT(*) AS newly_resolved FROM markets WHERE resolved = true;

-- Optional: also null-out change_24h for resolved markets
-- (their price won't move so the 24h change is noise)
UPDATE markets
SET change_24h = NULL
WHERE resolved = true;
