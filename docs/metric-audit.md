# Metric Audit — Quiver Markets
**Date:** 2026-04-10  
**Scope:** Every user-facing number on the site  
**Verdict legend:** ✅ HONEST | ⚠️ MISLABELED (fixed) | ❌ BROKEN | 🔶 HARDCODED | ❓ CANNOT VERIFY

---

## Disagrees / Arbitrage

| Metric | Verdict | Notes |
|--------|---------|-------|
| Raw spread (e.g. "48.0% in 4d") | ✅ HONEST | `spread = polyPrice - kalshiPrice` in percent points. Days from `daysLeft`. |
| Annualized return (removed) | ⚠️ MISLABELED → FIXED | Was "999%+" — a 48pt spread in 4d technically annualizes to ~4380%, but prediction market arbs are one-shot trades and cannot be compounded. Replaced with `rawReturn = spread` displayed as "X% in Nd". |
| Opportunity Score (0–100) | ✅ HONEST | Composite: spreadScore(0–30) + returnScore(0–30, internal only) + volumeScore(0–20) + timeScore(0–10) + trendScore(0–10). `returnScore` uses `calcAnnReturn` as a relative proxy, not displayed to users. |
| Opportunity verdict (Elite/Strong/Moderate/Weak) | ✅ HONEST | Derived directly from score thresholds: ≥75/≥50/≥30/<30. |
| "Biggest Spreads Right Now" strip | ✅ HONEST | Top 3 by raw spread, filter `spread ≥ 10 && minVol ≥ $500`. Previously labeled "Best Capital Efficiency Right Now" — renamed. |

---

## Arb Calculator Modal

| Metric | Verdict | Notes |
|--------|---------|-------|
| Gross profit | ✅ HONEST | `capital × (spread/100)` — correct for full convergence. |
| Net profit | ✅ HONEST | `grossProfit − fees`, where `fees = capital × 0.01` (est. 1%). |
| "Return in Nd" | ✅ HONEST | `netProfit / capital × 100` as raw %. No annualizing. |

---

## Spread Execution Calculator

| Metric | Verdict | Notes |
|--------|---------|-------|
| Contracts (each side) | ✅ HONEST | `floor(capital / costPerPair)` where `costPerPair = (100 - spread) / 100`. |
| Gross profit | ✅ HONEST | `nContracts × (spread/100)`. |
| Total fees | ✅ HONEST | Fee regime table with 4 options (Polymarket US 2%/EU 0%, Kalshi Basic 7%/Pro 3%). |
| Net profit | ✅ HONEST | `grossProfit − totalFees`. |
| Return on Capital | ✅ HONEST | `netProfit / capital × 100`. Labeled "One-shot trade — not annualized". |

---

## Market Pulse

| Metric | Verdict | Notes |
|--------|---------|-------|
| Pulse score (0–100) | ✅ HONEST | 4-component weighted average from live Supabase queries. Returns "—" when all queries fail/default. No fake fallback. |
| Components | ✅ HONEST | spreadHealth(×0.30) + volume(×0.25) + whaleConc(×0.20) + priceMovement(×0.25). |
| Label (Fear/Greed) | ✅ HONEST | Derived from score: <20 Extreme Fear → 80+ Extreme Greed. |

---

## Whale Leaderboard / Cards

| Metric | Verdict | Notes |
|--------|---------|-------|
| Whale accuracy % | ❓ CANNOT VERIFY | Comes from `whale_positions` table joined with resolved outcomes. When `total_resolved ≥ 1`, uses live data. When `total_resolved = 0`, shows "New". **When no live data exists at all, falls back to mock seed data — visually indistinguishable.** No `data_source` flag on the record. |
| PnL | ❓ CANNOT VERIFY | Same pipeline concern as accuracy. May be seeded mock values. |
| Win rate | ❓ CANNOT VERIFY | Same pipeline concern. |

**Action needed:** Add `data_source: "live" | "mock"` column to `whale_positions` table to allow honest labeling at render time.

---

## System Stats (Homepage Strip)

| Metric | Verdict | Notes |
|--------|---------|-------|
| Markets Tracked | ✅ HONEST | `SELECT COUNT(*) FROM markets` — live, hidden if query fails. |
| Whales | ✅ HONEST | `SELECT COUNT(*) FROM whales` — live. |
| Spreads Found | ✅ HONEST | `SELECT COUNT(*) FROM disagreements WHERE spread >= 10` — live. |
| Data Points Today | ✅ HONEST | `SELECT COUNT(*) FROM price_history WHERE created_at >= now() - interval '24h'` — live. |

---

## Market Thesis TL;DR

| Metric | Verdict | Notes |
|--------|---------|-------|
| Thesis sentence | 🔶 HARDCODED | Deterministic rule-based text from price/volume/category/daysLeft. Not AI, not probabilistic, not news-aware. Labeled as "orientation aid, not a trading signal" on methodology page. |

---

## Calibration / Brier Score

| Metric | Verdict | Notes |
|--------|---------|-------|
| Personal Brier score | ✅ HONEST | `(1/N) × Σ(forecast − outcome)²` — standard proper scoring rule, computed client-side from user inputs. |
| Whale Brier comparison | ❓ CANNOT VERIFY | Comparison data uses seeded mock whale Brier scores. Will become accurate once live `whale_positions` pipeline is fully populated. |

---

## Summary

| Status | Count |
|--------|-------|
| ✅ HONEST | 18 |
| ⚠️ MISLABELED → FIXED | 1 (annualized return) |
| ❌ BROKEN | 0 |
| 🔶 HARDCODED | 1 (market thesis) |
| ❓ CANNOT VERIFY | 4 (whale accuracy, PnL, win rate, Brier comparison) |

The one mislabeled metric (annualized return) was fixed in this session. The four "cannot verify" metrics all stem from the same root cause: the `whale_positions` live pipeline has not fully replaced seed mock data, and there is no `data_source` flag to distinguish them at render time. This is documented on the Methodology page.
