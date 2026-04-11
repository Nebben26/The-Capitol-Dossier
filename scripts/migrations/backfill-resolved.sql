-- backfill-resolved.sql
-- Marks markets as resolved when resolves_at is in the past or when
-- change_24h contains impossible percentage values (>100 or <-100)
-- that were produced by the old percentage formula.
-- Run once against production Supabase.

-- 1. Mark expired markets as resolved based on resolves_at
UPDATE markets
SET resolved = true
WHERE resolved = false
  AND resolves_at IS NOT NULL
  AND resolves_at < now();

-- 2. Also catch markets whose end_date is in the past (Polymarket uses end_date)
UPDATE markets
SET resolved = true
WHERE resolved = false
  AND end_date IS NOT NULL
  AND end_date < now();

-- 3. Zero out impossible change_24h values (>100pt or <-100pt are physically
--    impossible for a 0-100 price scale — artifacts of the old % formula).
UPDATE markets
SET change_24h = 0
WHERE change_24h > 100 OR change_24h < -100;

-- 4. Verify counts
SELECT
  COUNT(*) FILTER (WHERE resolved = true)  AS resolved_count,
  COUNT(*) FILTER (WHERE resolved = false) AS live_count,
  COUNT(*) FILTER (WHERE change_24h = 0 AND previous_price IS NOT NULL) AS zeroed_changes
FROM markets;
