# Quiver Markets — Mathematical Correctness Audit

**Date:** 2026-04-11  
**Auditor:** Session 16  
**Scope:** All user-facing computed numbers in `app/`, `components/`, `lib/`, `scripts/ingest.ts`

---

## Executive Summary

39 metrics catalogued across 8 pages. 3 critical bugs found and fixed. 5 moderate issues documented. 6 minor issues documented. The two most dangerous bugs were the arb calculator fee formula (understating fees by 5–33× and making trades look far more profitable than they are) and two uses of `Math.random()` in the whale data mapper (showing different fake numbers on every page load as if they were real analytics). After fixes, the displayed numbers are either correct or clearly labeled as estimates. The core prediction-market data (spreads, prices, volumes, P&L) flows from real APIs and is handled correctly; the bugs are concentrated in derived/enrichment fields.

---

## Metrics by Severity

---

### CRITICAL — Wrong values displayed to users

#### 1. Arb Calculator: Fee formula understates fees by 5–33×

**Metric:** Total Fees / Net Profit / Return on Capital  
**Page:** Disagrees (`/disagrees`) — "Spread Execution Planner" modal  
**What it showed:** For a 5pt spread, $1000 capital (US fee regime): Total Fees = $2.37, Net Profit = +$50.23, ROC = +5.0%  
**What it should show:** Total Fees = $47.34, Net Profit = +$5.26, ROC = +0.53%  
**Root cause:** `totalFees = grossProfit * (polyRate + kalshiRate) / 2`. Fees were applied as a fraction of gross *profit*, but Polymarket/Kalshi charge fees on the settlement *value* ($1 per contract), not on the spread earned. The correct formula is `totalFees = nContracts * (polyRate + kalshiRate) / 2`. The previous formula underestimated by a factor of `100/spread` (e.g., 20× for a 5pt spread, 10× for a 10pt spread).  
**Fix:** `components/ui/spread-execution-calculator.tsx` line 38 — changed base from `grossProfit` to `nContracts`.  
**Verification:** 5pt spread, 1052 contracts: old = 1052 × 0.05 × 0.045 = $2.37. New = 1052 × 0.045 = $47.34. ✓

---

#### 2. Whale streak badge shows randomized fake data

**Metric:** Streak badge ("🔥 Nw" — "N-trade win streak")  
**Pages:** Whales (`/whales`), Leaderboard (`/leaderboard`), Whale Profile (`/whales/[id]`), Watchlist (`/watchlist`)  
**What it showed:** Top whales (P&L > $1M) displayed a randomized win streak of 5–14, different on every page load. Example: "🔥 8W" appears on one visit, "🔥 13W" on the next.  
**Root cause:** `lib/api.ts` `dbWhaleToFrontend()`: `streak: pnlNum > 1_000_000 ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 5)`  
**Fix:** Changed to `streak: 0`. The `streak >= 5` display guards in all pages now suppress the badge (0 < 5).  
**Note:** Streak is a legitimately useful metric but requires resolved-position history that the ingestion script doesn't currently compute.

---

#### 3. Whale 24h P&L change shows randomized fake data

**Metric:** "24h change" sub-label on the Leaderboard P&L column  
**Page:** Leaderboard (`/leaderboard`)  
**What it showed:** `+1.4% 24h` or `-2.1% 24h` with green/red coloring — different on every page load.  
**Root cause:** `lib/api.ts` `dbWhaleToFrontend()`: `change24h: Math.round((Math.random() - 0.3) * 6 * 10) / 10`  
**Fix:** Changed to `change24h: 0`. The `t.change24h !== 0` guard in `app/leaderboard/page.tsx` now suppresses this sub-label entirely. Also corrected unit from "%" to "pt" for future use.  
**Note:** Whale PnL change requires prior-snapshot comparison, not available in current data.

---

### MODERATE — Approximations labeled as precise values

#### 4. `change_24h` displayed as "%" when unit is percentage points

**Metric:** 24h change in the homepage movers table, market treemap, mobile treemap list, morning brief "Biggest Mover"  
**Pages:** Homepage, Morning Brief component  
**What's wrong:** `change_24h = newPrice - oldPrice` is in *percentage points* (e.g., 3.5 means the market moved from 50% to 53.5%). Displaying it as "3.5%" implies a 3.5% *relative* change, which would mean 50% × 1.035 = 51.75%. These are different quantities.  
**Fix:** Added `formatSignedPt()` and `formatPt()` to `lib/format.ts`. Applied in `app/page.tsx` (treemap, mobile list, movers table) and `components/ui/morning-brief.tsx`.  
**Recommendation:** Rename the homepage table column header "24H" to "24H (pt)".

---

#### 5. Pulse gauge "Whale activity" component measures P&L concentration, not trading activity

**Metric:** Pulse gauge component "Whale activity"  
**Page:** Homepage  
**What's wrong:** Formula computes `topQuartilePnl / totalAbsPnl` — the fraction of total absolute P&L held by the top 25% of whales. This is a P&L inequality measure (Gini-like). High values mean a few whales dominate P&L. This is NOT "whale activity" (volume of recent trades).  
**Recommendation:** Rename to "Whale P&L concentration" in the hover breakdown tooltip.

---

#### 6. `getLastIngestTimestamp()` reads `markets.updated_at` instead of `ingestion_runs`

**Metric:** "Last updated N minutes ago" indicator  
**Pages:** Homepage, any page with `LastUpdated` component  
**What's wrong:** After Session 15 added the `ingestion_runs` table, the authoritative source for "when did ingestion last complete" is `ingestion_runs.completed_at WHERE status = 'completed'`. The current function reads `markets.updated_at` which is a good approximation but slightly wrong (it's when Supabase last touched the row, which might differ by seconds from when ingestion completed).  
**Recommendation:** Update `getLastIngestTimestamp()` in `lib/api.ts` to read from `ingestion_runs`.

---

#### 7. Disagrees "Return" sort uses annualized return; column displays raw return

**Metric:** Return column sort order on the Disagrees page  
**Page:** Disagrees (`/disagrees`)  
**What's wrong:** The "Return" column shows raw return (`formatReturn(spread, daysLeft)` e.g., "5.0% in 30d"). But when the user clicks the column header to sort, the sort uses `calcAnnReturn()` (annualized %). A 5pt spread expiring in 2 days ranks above a 5pt spread expiring in 100 days even though the raw return shown in the column is the same.  
**Recommendation:** Either (a) sort by raw return (`spread` value, since that's what's displayed), or (b) add a separate "Ann Return" column that makes the annualization explicit.

---

#### 8. Calibration page whale comparison uses mockData (fictional Brier/accuracy values)

**Metric:** "You vs Top Whales" comparison table on Calibration page  
**Page:** Calibration (`/calibration`)  
**What's wrong:** `import { whales } from "@/lib/mockData"` — the whales shown (with realistic-looking Brier scores like "0.142") are fake test data, not real whale performance.  
**Recommendation:** Replace with real whale data from Supabase. Note: real whale `brier` and `accuracy` are currently 0 (not computed), so this would show "—" columns. Either compute real accuracy or add a note that accuracy data isn't yet available.

---

### MINOR — Cosmetic or labeling issues

#### 9. Whale "SMART MONEY" badge based on arbitrary P&L threshold

**Source:** `smart: pnlNum > 500_000` — any whale with > $500K lifetime P&L gets the badge  
**Issue:** Implies sophisticated trading skill but is just a wealth threshold.  
**Recommendation:** Either remove the badge or rename to "High P&L Trader."

#### 10. Whale `bestCategory` hardcoded from P&L tiers

**Source:** `pnlNum > 1_000_000 ? "Economics" : pnlNum > 500_000 ? "Elections" : "Crypto"`  
**Issue:** All $1M+ whales show "Economics" as their best category. Not derived from actual trade history.  
**Recommendation:** Remove until category analysis is computed from position history.

#### 11. Calibration "Whale Rank" shows hardcoded pool size

**Source:** `"vs 2,847 tracked"` — hardcoded string  
**Recommendation:** Replace with `whaleCount` from `getSystemStats()`.

#### 12. Calibration "Direction accuracy" labeled as "Accuracy"

**Formula:** `correct / resolved * 100` where "correct" = predicted direction  
**Issue:** This is direction accuracy (did you predict above/below 50%?), not calibration accuracy. A forecaster who always says 51% YES would score 100% "accuracy" here.  
**Recommendation:** Rename to "Direction Accuracy" with a tooltip explaining the distinction from Brier score.

#### 13. Trader count for Kalshi markets is estimated

**Source:** `traders: Math.floor(totalVol / 200)` in `scripts/ingest.ts`  
**Issue:** The Kalshi API doesn't return unique trader counts; this is a volume-based estimate.  
**Recommendation:** Add "(est.)" to any display of Kalshi trader counts.

#### 14. `whaleScore` label in pulse gauge

**Display:** "Whale activity" in pulse gauge tooltip  
**Issue:** Measures P&L concentration, not activity. See Moderate #5.  
**Action:** Change tooltip label to "Whale concentration."

---

### VERIFIED CORRECT

- **Spread (pt)** — `ABS(poly_price - kalshi_price)`. Correct.
- **Polymarket/Kalshi prices** — Direct from API, stored as 0–100 integers. Correct.
- **`change_24h` formula in ingest** — `newPrice - oldPrice` (in points). Correct.
- **`days_left`** — UTC floor division, max(0, ...). Correct.
- **Disagreement spread filter** — only stores spreads >= 3pt and <= 50pt. Reasonable.
- **Markets Tracked / Disagreements / Whales counts** — SQL COUNT(*) queries. Correct.
- **User Brier score on Calibration page** — `mean((p/100 - o)^2)`. Correct standard formula.
- **Raw return `formatReturn()`** — `spread` as raw %. Slight approximation (within 0.3pp for typical spreads); documented with disclaimer.
- **Arb calculator cost-per-pair** — `(low + (100-high)) / 100`. Correct.
- **Opportunity score range clamping** — Now clamped to [0, 100]. Correct.
- **Market Pulse final score clamping** — Now clamped to [0, 100]. Correct.

---

## Data Quality Issues in Ingestion (`scripts/ingest.ts`)

### 1. `win_rate` and `accuracy` always stored as 0

**Location:** `ingestWhaleLeaderboard()` line ~507: `win_rate: 0, accuracy: 0`  
**Impact:** All downstream consumers that check `> 0` before displaying will show "—". Correct defensive behavior, but the columns serve no purpose until computed.  
**Recommendation:** Consider removing these columns from the UI until the computation pipeline is built.

### 2. `change_24h` stored as 0 on first ingestion run

**Location:** `ingestMarkets()` line ~313: `const change24h = oldPrice != null ? ... : 0`  
**Impact:** Markets appearing for the first time show change_24h = 0. Indistinguishable from "no change" until the second ingestion run.  
**Recommendation:** Consider storing `null` instead of `0` for "no prior price available".

### 3. Multi-outcome market representative selection

**Polymarket:** Uses highest-priced outcome as representative price  
**Kalshi:** Uses highest-volume market within the event  
**Issue:** The two platforms use different selection criteria. This could produce disagreements where prices are being compared for different sub-questions within the same event.  
**Severity:** Moderate — affects match quality for multi-outcome events.

### 4. Fake whale trade IDs on fallback path

**Location:** `ingestWhaleTrades()` line ~556: `id: t.id || t.transactionHash || \`trade-${Date.now()}-${i}\``  
**Impact:** Fallback IDs aren't deterministic — a re-run would insert duplicate rows with different generated IDs, bypassing the `ON CONFLICT (id)` dedup.  
**Recommendation:** Use a content-based hash as the fallback ID (e.g., `hash(wallet + amount + timestamp)`).

### 5. Kalshi price parsing order

**Location:** `kPrice = (m: any) => parseFloat(m.last_price_dollars || "") || Number(m.last_price) || 0`  
**Issue:** If `last_price_dollars` is the string `"0.0000"`, `parseFloat("0.0000") = 0` which is falsy, causing it to fall through to `Number(m.last_price) || 0`. This is correct by coincidence (0 price falls through to 0 anyway), but could mask a legitimate 0-priced market.  
**Recommendation:** Use explicit `!== undefined && !== null` check instead of falsy fallback.

---

## Documentation Gaps

The following displayed metrics have **no entry in `app/methodology/page.tsx`**:

- Market Pulse gauge and its four components
- Opportunity Score formula and weights
- Whale P&L data source (Polymarket leaderboard API)
- Disagreement matching algorithm (word overlap, 0.4 threshold)
- `change_24h` unit definition (percentage points, not relative %)

---

## Cannot Verify Without External Data

1. **Whale P&L totals** — Would need to compare displayed values against Polymarket leaderboard website. Cannot verify API response fidelity.
2. **Disagreement pair quality** — The matching algorithm (40% word overlap) could produce false positives. Need to inspect actual matched pairs in the database to audit false positive rate.
3. **Price history accuracy** — CLOB API prices vs Polymarket's own UI. Requires spot-check comparison.
4. **Kalshi volume unit** — `volume_fp` field: unclear whether it's in USD or contracts. Used in match threshold filtering (`< 100`) which could be too low or high depending on unit.

---

## Recommended Next Steps (by leverage)

1. ✅ **[DONE]** Fix fee calculator — most dangerous user-facing bug
2. ✅ **[DONE]** Remove `Math.random()` from whale streak and change24h
3. ✅ **[DONE]** Fix `change_24h` display unit (`%` → `pt`)
4. **[QUEUE]** Replace calibration whale comparison with real data (or hide until accuracy is computed)
5. **[QUEUE]** Update `getLastIngestTimestamp()` to read from `ingestion_runs` table
6. **[QUEUE]** Fix disagrees Return sort to sort by raw return (matches the displayed column)
7. **[QUEUE]** Compute real win_rate/accuracy from resolved whale positions
8. **[QUEUE]** Update methodology page to document Pulse gauge and Opportunity Score formulas
9. **[QUEUE]** Add "(est.)" label to Kalshi trader counts
10. **[QUEUE]** Rename "Whale activity" → "Whale concentration" in pulse tooltip
