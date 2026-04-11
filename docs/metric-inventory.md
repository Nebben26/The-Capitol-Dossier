# Quiver Markets — Displayed Metric Inventory

Built for Session 16 math audit (2026-04-11). Every user-visible computed number on the site.

---

## Homepage (`app/page.tsx`)

### Market Pulse Score
- **Display:** Gauge showing 0–100 number + label ("Neutral", "Greed", etc.)
- **Component:** `app/page.tsx` → `PulseGauge`, sourced from `lib/market-pulse.ts` → `computeMarketPulse()`
- **Formula:** Weighted average of four components: spreadScore (30%), volumeScore (25%), whaleScore (20%), movementScore (25%)
- **Source:** Live Supabase queries against `disagreements`, `markets`, `whales`, `price_history`
- **Status:** AUDITED — see audit doc

### Pulse Component: Spread Score
- **Display:** Shown in hover tooltip as "Spread health: N"
- **Formula:** `80 - avgSpread * 2` (clipped 0–100). Avg of top-100 disagreement spreads.
- **Source:** `disagreements.spread` (last 100 rows by updated_at)
- **Status:** AUDITED — formula inverts spread (high spread = fear)

### Pulse Component: Volume Score
- **Display:** Shown in hover tooltip as "Volume: N"
- **Formula:** `(Math.log10(totalVolume + 1) - 5) * 15 + 50` (clipped 0–100). Total volume of top-100 markets.
- **Source:** `markets.volume` (top 100 by volume, non-null)
- **Status:** AUDITED — log scale with baseline at 10^5 ($100K). Sensitive to changes in market volume distribution.

### Pulse Component: Whale Activity Score
- **Display:** Shown in hover tooltip as "Whale activity: N"
- **Formula:** `Math.abs(topQuartilePnl) / totalAbsPnl * 100` (clipped 0–100). PnL concentration in top 25% of whales.
- **Source:** `whales.pnl` (top 50 by pnl)
- **Label mismatch:** Labeled "Whale activity" but measures PnL concentration (inequality), not trading activity.
- **Status:** MODERATE — label doesn't match formula

### Pulse Component: Price Movement Score
- **Display:** Shown in hover tooltip as "Price movement: N"
- **Formula:** `30 + avgDelta * 5` (clipped 0–100). Average absolute price change across markets in last 24h.
- **Source:** `price_history` (last 24h, up to 500 rows)
- **Status:** AUDITED

### Markets Tracked (hero stat)
- **Display:** Count with CountUp animation
- **Source:** `getSystemStats()` → `supabase.from("markets").select("*", {count: "exact", head: true})`
- **Status:** VERIFIED — simple count

### Active Disagreements (hero stat)
- **Display:** Count with CountUp animation
- **Source:** `getSystemStats()` → `disagreements` table count
- **Status:** VERIFIED — simple count

### Whales Tracked (hero stat)
- **Display:** Count with CountUp animation
- **Source:** `getSystemStats()` → `whales` table count
- **Status:** VERIFIED — simple count

### 24h Change (movers table column, labeled "24H")
- **Display:** "+3.5pt" (after fix) e.g. `+3.5pt` with arrow icon
- **Source:** `markets.change_24h` via `useHomepageData()` → `dbMarketToFrontend()`
- **Formula (ingest):** `newPrice - oldPrice` where prices are on 0–100 scale
- **Status:** FIXED (was displaying as "%" — now "pt")

### Treemap cell change label
- **Display:** "+3.5pt" (after fix) inside treemap cell
- **Source:** Same `change_24h` field
- **Status:** FIXED (was displaying as "%" — now "pt")

### "Last updated X ago" indicator
- **Display:** "Updated 12m ago" or similar
- **Component:** `components/layout/LastUpdated.tsx`
- **Source:** `getLastIngestTimestamp()` → reads `markets.updated_at` most recent row
- **Note:** After Session 15, source of truth should be `ingestion_runs` table. Currently reads from market rows (close approximation, minor difference).
- **Status:** MODERATE — reads wrong table post-Session-15

---

## Disagrees Page (`app/disagrees/page.tsx`)

### Spread (pt)
- **Display:** "23pt" badge on each card and table row
- **Source:** `disagreements.spread` = `ABS(poly_price - kalshi_price)`
- **Formula (ingest):** `Math.abs(pm.price - bestMatch.price)` in `ingestDisagreements()`
- **Status:** VERIFIED — direct subtraction, correct

### Polymarket Price / Kalshi Price
- **Display:** "72¢" / "49¢"
- **Source:** `disagreements.poly_price` / `disagreements.kalshi_price`
- **Status:** VERIFIED — read directly from database

### Return (raw %)
- **Display:** "5.0% in 30d" via `formatReturn(spread, daysLeft)`
- **Formula:** `rawReturn = spread` (spread points ≈ raw % return). Approximation: accurate to within ~0.3pp for typical spreads.
- **Source:** `lib/format.ts` → `formatReturn()`
- **Disclaimer:** Shows "One-shot trade — not annualized" and tooltip explains fees/slippage not included.
- **Status:** VERIFIED — documented approximation with clear disclaimer

### Opportunity Score (0–100)
- **Display:** Score number + verdict ("elite", "strong", "moderate", "weak")
- **Formula:** See `lib/opportunity-score.ts` — weighted sum of spreadScore (0–30), returnScore (0–30), volumeScore (0–20), timeScore (0–10), trendScore (0–10)
- **Source:** Computed client-side from disagreement fields
- **Status:** AUDITED — now clamped to [0,100]; annualized return used only internally for ranking

### Sort by "Return" — uses annualized return internally
- **Display:** Column sorted by "Return" but sort key uses `calcAnnReturn()` (annualized), while the column displays raw %
- **Status:** MODERATE — sort order doesn't match displayed column value

### Days Left
- **Display:** "30d" or "—"
- **Formula:** `Math.max(0, Math.round((new Date(endDate).getTime() - Date.now()) / 86400000))`
- **Source:** `markets.days_left` computed at ingest time from `endDate`/`closeTime`
- **Status:** VERIFIED — integer days, UTC comparison

### Summary stats (Active Spreads, Avg Spread, Widest Spread, Combined Volume)
- **Display:** Numbers in the stats strip
- **Source:** Computed from loaded disagreements array client-side
- **Status:** VERIFIED — derived from database-backed array

---

## Whales Page (`app/whales/page.tsx`)

### Total P&L
- **Display:** "$2.3M" formatted USD
- **Source:** `whales.total_pnl` from Polymarket leaderboard API
- **Formula (ingest):** Direct from API `e.pnl` field
- **Status:** CANNOT VERIFY — depends on Polymarket API accuracy

### Accuracy (%)
- **Display:** Progress bar + "65%" or "—"
- **Source:** `whales.accuracy` column — **always 0** in current ingestion. Display guards against this: shows "—" when `w.accuracy === 0`.
- **Status:** MINOR — always "—" since accuracy never computed; column exists but is never populated

### Win Rate (%)
- **Display:** "—" in most cases
- **Source:** `whales.win_rate` column — **always 0** in current ingestion
- **Status:** MINOR — always "—" since win_rate never computed

### Streak badge ("🔥 Nw")
- **Display:** Flame badge with "N-trade win streak"
- **Source:** `w.streak` — **was randomized `Math.random()`; now fixed to 0** (badge hidden)
- **Status:** CRITICAL — was fake random data, now fixed

### "SMART MONEY" badge
- **Display:** Teal badge
- **Source:** `w.smart = pnlNum > 500_000` — computed from total P&L threshold
- **Status:** MINOR — arbitrary $500K threshold, not based on actual trading accuracy

---

## Leaderboard Page (`app/leaderboard/page.tsx`)

### Brier Score column
- **Display:** "0.15" or "—" (shown only when `t.brier > 0`)
- **Source:** `dbWhaleToFrontend()` → `realBrier = realWinRate > 0 || realAccuracy > 0 ? Max(0.05, 0.30 - realAccuracy/200) : 0`
- **Since `win_rate` and `accuracy` are always 0**, realBrier = 0 for all real whales → shows "—"
- **Status:** MINOR — displays "—" correctly, but column implies data exists that doesn't

### 24h Change
- **Display:** "+1.2pt 24h" (after fix) or hidden when 0
- **Source:** `w.change24h` — **was randomized `Math.random()`; now fixed to 0** (suppressed when 0)
- **Status:** CRITICAL — was fake random data, now fixed

---

## Calibration Page (`app/calibration/page.tsx`)

### Brier Score (user's own)
- **Display:** "0.123"
- **Formula:** `sum((p_i/100 - o_i)^2) / n` where p_i = prediction probability (0–100), o_i = outcome (0 or 1)
- **Status:** VERIFIED — standard Brier score formula

### Accuracy (user's own)
- **Display:** "73%"
- **Formula:** `correct / resolved * 100` where "correct" = (outcome=YES && prob>=50) || (outcome=NO && prob<50)
- **Note:** This is direction accuracy (above/below 50%), not calibration accuracy
- **Status:** VERIFIED with caveat — measures direction not calibration; label should say "Direction accuracy"

### Simulated P&L curve
- **Display:** Area chart showing cumulative P&L
- **Formula:** `+$100 per correct, -$80 per incorrect`
- **Source:** Hardcoded — not based on actual bet sizes or prices
- **Status:** MINOR — labeled "Simulated P&L" which is accurate

### "Whale Rank" card
- **Display:** "Top 10% · vs 2,847 tracked"
- **Source:** Hardcoded threshold on Brier score (`<= 0.15` → "Top 10%", etc.). 2,847 is a hardcoded number.
- **Status:** MINOR — hardcoded comparison pool size

### Whale comparison table (Brier, Accuracy, Trades)
- **Display:** Shows top 5 whales from `lib/mockData.ts`
- **Source:** `import { whales } from "@/lib/mockData"` — **FAKE DATA**
- **Status:** MODERATE — comparing real user scores to fictional whale data

---

## Arb Calculator (`components/ui/spread-execution-calculator.tsx`)

### Gross Profit
- **Display:** "$52.60"
- **Formula:** `nContracts * (spread / 100)` — correct
- **Status:** VERIFIED

### Total Fees
- **Display:** "$47.34" (after fix)
- **Formula (original — WRONG):** `grossProfit * (polyRate + kalshiRate) / 2` — applied fees to profit, not settlement
- **Formula (fixed):** `nContracts * (polyRate + kalshiRate) / 2` — fees on $1 settlement per contract
- **Impact:** For 5pt spread, original showed $2.37 fees; correct is $47.34. Off by 20x.
- **Status:** CRITICAL — was overstating net profit by 5–33x; now fixed

### Net Profit
- **Display:** "+$5.26" (after fix)
- **Formula:** `grossProfit - totalFees` — correct after fee fix
- **Status:** FIXED

### Return on Capital
- **Display:** "+0.5%" (after fix)
- **Formula:** `netProfit / capital * 100`
- **Status:** FIXED (was showing ~5x too high due to fee bug)

---

## Ingest Script (`scripts/ingest.ts`)

### `change_24h` (stored in DB)
- **Formula:** `Math.round((newPrice - oldPrice) * 10) / 10`
- **Where oldPrice comes from:** Previous value of `markets.price` for same ID (loaded at start of ingest run)
- **Note:** On first ingestion (no old price), stored as 0 — not "—". Shows "+0pt" which could be confused with "no change."
- **Status:** VERIFIED — arithmetic is correct; zero on first run is documented behavior

### `days_left` (stored in DB)
- **Formula:** `Math.max(0, Math.round((new Date(endDate).getTime() - Date.now()) / 86400000))`
- **Status:** VERIFIED — UTC comparison, floors at 0

### `match_confidence` (disagreement matching quality)
- **Formula:** `overlap / Math.max(pmWords.size, kmWords.length, 1)` where overlap = shared content words
- **Threshold:** `>= 0.4` (40% word overlap required to form a disagreement pair)
- **Status:** CANNOT VERIFY WITHOUT DATA — threshold could produce false positives

---

## Cannot Verify Without External Data

- Whale P&L from Polymarket API (requires cross-checking against Polymarket website)
- Disagreement matching quality (requires manual inspection of actual pairs)
- Price history accuracy (requires comparison to CLOB API)
- Kalshi volume field interpretation (`volume_fp` vs `volume`)
