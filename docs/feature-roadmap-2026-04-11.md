# Quiver Markets — Feature Roadmap (2026-04-11)

Captured from session 17. Items ordered roughly by user impact.

---

## Tier 1: Data completeness (highest leverage)

### Real whale win_rate and accuracy
- **What:** Compute per-whale win_rate and accuracy from resolved position history
- **Why:** Every downstream display (Calibration comparison, Leaderboard Brier column) currently shows "—" because these fields are always 0
- **Blocker:** Requires resolved-position snapshot pipeline — compare positions at close vs. outcome
- **Files:** `scripts/ingest.ts` `ingestWhaleLeaderboard()` ~line 507

### Calibration whale comparison — real data
- **What:** Replace `import { whales } from "@/lib/mockData"` in `app/calibration/page.tsx` with real Supabase whale data
- **Why:** Users are currently being compared to fictional Brier scores (0.142 etc.)
- **Depends on:** whale accuracy computation above

### Backfill resolved markets
- **What:** Run `scripts/backfill-resolved.sql` (or equivalent) to mark markets as `resolved=true` where `end_date < NOW()` and price = 0 or 100
- **Why:** Resolved Markets page is empty; calibration depends on resolved-market history
- **Note:** Ben to run manually — see `docs/backfill-resolved.sql`

---

## Tier 2: Analytics quality

### Real `change_24h` for first ingestion
- **What:** Store `null` instead of `0` when no prior price exists (first ingest)
- **Why:** `0` is indistinguishable from "no change"; causes false movers
- **File:** `scripts/ingest.ts` ~line 313

### Disagrees Return sort — match displayed column
- **What:** Sort by raw return (`spread` value) when user clicks "Return" column, not annualized return
- **Why:** The column shows raw %; sorting by annualized confuses users (5pt/2d ranks above 5pt/100d even though the display is the same)
- **File:** `app/disagrees/page.tsx`

### Kalshi trader count "(est.)" label
- **What:** Add "(est.)" to Kalshi market trader counts in the UI
- **Why:** Kalshi API doesn't return unique trader counts; current value is `Math.floor(totalVol / 200)`
- **File:** `scripts/ingest.ts`, market card display components

### Fake whale trade ID dedup fix
- **What:** Use content-based hash for fallback trade ID in `ingestWhaleTrades()`
- **Why:** `trade-${Date.now()}-${i}` is non-deterministic — re-runs insert duplicate rows
- **File:** `scripts/ingest.ts` ~line 556

---

## Tier 3: UI labeling

### "Whale activity" → "Whale P&L concentration" in pulse tooltip
- **What:** Rename the label in the Market Pulse hover breakdown
- **Why:** The formula measures PnL concentration (Gini-like), not trading activity
- **File:** `lib/market-pulse.ts` / `app/page.tsx` PulseGauge tooltip

### "Whale Rank" dynamic pool size
- **What:** Replace `"vs 2,847 tracked"` hardcoded string with live whale count from `getSystemStats()`
- **File:** `app/calibration/page.tsx`

### Calibration "Accuracy" → "Direction Accuracy"
- **What:** Rename label and add tooltip explaining it measures above/below 50% prediction, not calibration
- **File:** `app/calibration/page.tsx`

### Remove "SMART MONEY" badge or rename to "High P&L Trader"
- **What:** Current badge is triggered by `pnl > $500K` — implies skill, not wealth
- **File:** `lib/api.ts` `dbWhaleToFrontend()` / whale card components

### Remove `bestCategory` from whale cards
- **What:** Currently hardcoded by PnL tier ("Economics" for all $1M+ whales)
- **File:** `lib/api.ts` `dbWhaleToFrontend()`

---

## Tier 4: Methodology documentation

### Update `app/methodology/page.tsx`
Add entries for:
- Market Pulse gauge formula and four components with weights
- Opportunity Score formula and weights
- Whale P&L data source (Polymarket leaderboard API)
- Disagreement matching algorithm (40% word overlap threshold)
- `change_24h` unit definition (percentage points, not relative %)

---

## Tier 5: Infrastructure

### Kalshi price parsing — explicit null check
- **What:** Replace `parseFloat(m.last_price_dollars || "")` with explicit undefined/null check
- **Why:** `"0.0000"` is falsy — legitimate 0-priced markets fall through silently
- **File:** `scripts/ingest.ts` `kPrice` function

### Multi-outcome market representative selection — consistent criteria
- **What:** Polymarket uses highest-priced outcome; Kalshi uses highest-volume market. Should use same criterion.
- **Why:** Could produce false disagreements where different sub-questions are compared
- **File:** `scripts/ingest.ts` matching logic
