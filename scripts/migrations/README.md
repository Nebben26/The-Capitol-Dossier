# Quiver Markets — SQL Migrations

Run every migration in the order listed below using the Supabase SQL Editor:
**Dashboard → SQL Editor → New query → paste → Run**

Mark each migration as ✅ once applied to production.

---

## Chronological Order

### 1. `session4-alerts.sql`
**What it does:** Creates `user_alerts` table — per-user market alert rules with conditions, thresholds, and trigger history.
**Idempotent:** Yes (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`)
**Dependencies:** Supabase `auth.users` must exist (it always does)
**Tables created:** `public.user_alerts`
**RLS:** Users can only read/write/delete their own rows

---

### 2. `session6-tiers.sql`
**What it does:** Creates `user_tiers` table — backs the paywall system; Stripe webhook upserts rows here after checkout.
**Idempotent:** Yes (`CREATE TABLE IF NOT EXISTS`; trigger uses `CREATE OR REPLACE`)
**Dependencies:** Supabase `auth.users`
**Tables created:** `public.user_tiers`
**RLS:** Users can read their own row; service role has full access

---

### 3. `session7.sql`
**What it does:** Creates `whale_positions`, `disagreement_snapshots` tables; **DROPS and recreates `whale_trades`** with a `tx_hash UNIQUE` constraint for deduplication.
**Idempotent:** Partially — `DROP TABLE IF EXISTS whale_trades CASCADE` is destructive. **Safe only on first run or when `whale_trades` is empty.**
**Dependencies:** None
**Tables created:** `whale_positions`, `disagreement_snapshots`, `whale_trades`
**⚠️ Destructive:** Drops `whale_trades` CASCADE. If whale trade data exists, run `session7_v2.sql` instead.

---

### 4. `session7_v2.sql`
**What it does:** Safer alternative to `session7.sql` — creates `whale_positions` and `disagreement_snapshots` using `IF NOT EXISTS`, and adds missing columns to an existing `whale_trades` table rather than dropping it.
**Idempotent:** Yes — uses `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DROP POLICY IF EXISTS`
**Dependencies:** `whale_trades` table must already exist (created by `session7.sql` or earlier session)
**Tables modified:** `whale_positions` (create), `disagreement_snapshots` (create), `whale_trades` (alter)
**Use this instead of `session7.sql` if whale trade data has already been ingested.**

---

### 5. `session8-alert-triggers.sql`
**What it does:** Creates `alert_triggers` table — stores a record each time an alert fires; powers the notification history UI.
**Idempotent:** Yes
**Dependencies:** `session4-alerts.sql` must be applied first (`user_alerts` table must exist)
**Tables created:** `public.alert_triggers`
**RLS:** Users can read/update their own triggers; service role can insert

---

### 6. `session9-morning-brief.sql`
**What it does:** Creates `morning_brief_subscribers` and `morning_brief_sends` tables for the daily email digest system.
**Idempotent:** Yes
**Dependencies:** None
**Tables created:** `morning_brief_subscribers`, `morning_brief_sends`
**RLS:** Service role has full access; anon/authenticated can insert (subscribe)

---

### 7. `session14_news.sql`
**What it does:** Creates `news_articles` and `news_market_tags` tables for the news/insights pipeline.
**Idempotent:** Yes
**Dependencies:** None
**Tables created:** `news_articles`, `news_market_tags`
**RLS:** Anon can read both tables

---

### 8. `session25_market_theses.sql`
**What it does:** Creates `market_theses` table — stores AI-generated bull/bear cases per market.
**Idempotent:** Yes
**Dependencies:** `markets` table must exist
**Tables created:** `market_theses`
**RLS:** Public read

---

### 9. `session26_signals.sql`
**What it does:** Creates `signals` table — smart signal alerts (whale consensus, size spikes, divergence).
**Idempotent:** Yes (uses `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object` for policy)
**Dependencies:** None
**Tables created:** `signals`
**RLS:** Public read

---

### 10. `session28_api_keys.sql`
**What it does:** Creates `api_keys` and `api_request_logs` tables for the public API v1 key management system.
**Idempotent:** Yes
**Dependencies:** None
**Tables created:** `api_keys`, `api_request_logs`
**RLS:** No public read — server-side only via service role key

---

### 11. `session29_candles.sql`
**What it does:** Creates `market_candles` table — OHLCV candlestick data for price charts.
**Idempotent:** Yes
**Dependencies:** None
**Tables created:** `market_candles`
**RLS:** Public read

---

### 12. `session31_signal_accuracy.sql`
**What it does:** Adds `historical_accuracy_pct` and `historical_sample_size` columns to `signals` table.
**Idempotent:** Yes (`ADD COLUMN IF NOT EXISTS`)
**Dependencies:** `session26_signals.sql` must be applied first
**Tables modified:** `signals` (two new columns)

---

### 13. `session335_waitlist.sql`
**What it does:** Creates `waitlist` table for pre-launch email capture.
**Idempotent:** Yes
**Dependencies:** None
**Tables created:** `waitlist`
**RLS:** Anon can INSERT (join waitlist); no public read

---

### 14. `session36_match_confidence.sql`
**What it does:** Adds `match_confidence` column to `disagreements` table for fuzzy-match quality scoring.
**Idempotent:** Yes (`ADD COLUMN IF NOT EXISTS`)
**Dependencies:** `disagreements` table must exist (core table, created in early sessions)
**Tables modified:** `disagreements`

---

### 15. `session36_webhooks.sql`
**What it does:** Creates `webhooks` table for API key–based webhook subscriptions.
**Idempotent:** Yes
**Dependencies:** `session28_api_keys.sql` must be applied first (`api_keys` table must exist)
**Tables created:** `webhooks`

---

### 16. `session39_spread_snapshots.sql`
**What it does:** Creates `spread_snapshots` table — time-series of cross-platform spread data for convergence charts.
**Idempotent:** Yes
**Dependencies:** None (independent of `disagreement_snapshots`)
**Tables created:** `spread_snapshots`
**RLS:** Public read and service write

---

### 17. `session41_stories.sql`
**What it does:** Creates `stories` table (template-generated narrative stories) and `wallet_labels` table (human-readable whale wallet names).
**Idempotent:** Yes
**Dependencies:** None
**Tables created:** `stories`, `wallet_labels`
**RLS:** Free stories are publicly readable; authenticated users see all; service role can write

---

### 18. `session42_schema_fixes.sql`
**What it does:** Adds `category` column to `markets`; adds `poly_volume` and `kalshi_volume` columns to `disagreements`; creates a `notify_pgrst_reload()` function to bust PostgREST schema cache after migrations.
**Idempotent:** Yes (`ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`)
**Dependencies:** `markets` and `disagreements` tables must exist

---

### 19. `session44.sql`
**What it does:** Creates `correlations` table — stores pairwise market correlation coefficients.
**Idempotent:** Yes
**Dependencies:** `markets` table must exist (foreign key constraint)
**Tables created:** `correlations`
**RLS:** Public read; service role full access

---

### 20. `whales-schema.sql`
**What it does:** Creates `whales` table — stores whale leaderboard data ingested from the Polymarket Data API (address, rank, PnL, volume, win rate, accuracy, positions).
**Idempotent:** Yes (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`)
**Dependencies:** None
**Tables created:** `whales`
**RLS:** Service role full access; public read
**⚠️ Do NOT run if a `whales` table already exists** — check first with `\d whales` in psql or `SELECT * FROM whales LIMIT 1` in the SQL Editor.

---

### 21. `session15-ingestion-runs.sql`
**What it does:** Creates `ingestion_runs` table — records every execution of the ingest script with status, counts, duration, and errors. Powers the `/pipelines` dashboard.
**Idempotent:** Yes
**Dependencies:** None
**Tables created:** `ingestion_runs`
**RLS:** Service role full access; public read (dashboard reads without auth)

---

### 22. `session15-stripe-events.sql`
**What it does:** Creates `stripe_events` table — logs every inbound Stripe webhook event for idempotency (prevents double-processing on retries) and audit. Stripe event ID is the primary key.
**Idempotent:** Yes
**Dependencies:** None
**Tables created:** `stripe_events`
**RLS:** Service role full access; no public read (contains payment data)

---

### 24. `session18-telegram.sql`
**What it does:** Creates `telegram_subscribers` table (one row per linked Telegram chat, with preferences and rate-limit counters) and `telegram_alerts_sent` table (delivery log for every alert dispatched).
**Idempotent:** Yes (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`)
**Dependencies:** Supabase `auth.users`
**Tables created:** `telegram_subscribers`, `telegram_alerts_sent`
**RLS:** Service role full access; authenticated users can read/update their own subscriber row

---

### 25. `session19-waitlist-tier.sql`
**What it does:** Adds a `tier` column to the `waitlist` table (default `'pro'`) to track which founder cohort (pro or signal_desk) each subscriber wants. Adds an index on the new column.
**Idempotent:** Yes (`ADD COLUMN IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`)
**Dependencies:** `waitlist` table must exist (`session335_waitlist.sql` applied first)
**Tables modified:** `waitlist` (one new column)

---

### 26. `session20-portfolio.sql`
**What it does:** Creates the My Quiver portfolio tracking tables — `user_portfolios` (one row per user, wallet address + summary P&L stats), `user_positions` (per-market positions synced from Polymarket data API, replaced wholesale on each sync), and `portfolio_snapshots` (time-series of total_value_usd for the sparkline chart).
**Idempotent:** Yes (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DO $$ BEGIN...EXCEPTION WHEN duplicate_object` for policies)
**Dependencies:** Supabase `auth.users`
**Tables created:** `user_portfolios`, `user_positions`, `portfolio_snapshots`
**RLS:** Service role full access; authenticated users can read/write their own rows only

---

### 23. `session21-profiles.sql`
**What it does:** Creates `user_profiles` (public prediction profiles with username, bio, social links), `user_predictions` (per-user market calls with probability, conviction, reasoning, and resolution tracking), and `profile_followers` tables. Powers the /p/[username] public profile pages and prediction logging system.
**Idempotent:** Yes (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `CREATE OR REPLACE FUNCTION`)
**Dependencies:** Supabase `auth.users`
**Tables created:** `user_profiles`, `user_predictions`, `profile_followers`
**RLS:** Public profiles/predictions are readable by anyone; owners can write their own rows; service role has full access

---

### 28. `session23-signal-history.sql`
**What it does:** Creates `signal_history` table — snapshots every arb signal at detection time with spread, prices, volumes, and resolution tracking. Powers the simulator's historical context section and the future backtester.
**Idempotent:** Yes (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DROP POLICY IF EXISTS`)
**Dependencies:** None
**Tables created:** `signal_history`
**RLS:** Public read; service role full access

---

### 27. `session22-embed-analytics.sql`
**What it does:** Creates `embed_views` table — logs every widget render with type, resource ID, HTTP referrer, and user-agent for affiliate outreach and usage analytics.
**Idempotent:** Yes (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, `DROP POLICY IF EXISTS`)
**Dependencies:** None
**Tables created:** `embed_views`
**RLS:** Service role full access; no public read (analytics data)

---

### 30. `session26-indices.sql`
**What it does:** Creates `quiver_indices` (one row per index, stores current value, 24h change, component count, methodology) and `quiver_index_history` (time-series of index values for charts). Seeds the 4 initial index definitions: Election Confidence, Crypto Sentiment, Geopolitical Risk, Economic Outlook. Values start at default 50 until `compute-indices.ts` runs.
**Idempotent:** Yes (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `ON CONFLICT (slug) DO NOTHING` for seed data)
**Dependencies:** None
**Tables created:** `quiver_indices`, `quiver_index_history`
**RLS:** Public read; service role full access
**After running:** Run `npx tsx scripts/compute-indices.ts` to seed initial values from live market data.

---

### 29. `session25-price-history.sql`
**What it does:** Creates `market_price_history` table — lightweight ingest-cycle price snapshots (~30 min frequency) used by the correlation engine. Also creates `market_correlations` table — nightly-computed returns-based Pearson correlations with denormalized question/category/price fields for fast UI rendering.
**Idempotent:** Yes (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`)
**Dependencies:** None
**Tables created:** `market_price_history`, `market_correlations`
**RLS:** Public read; service role full access
**After running:** Execute `npx tsx scripts/ingest.ts` to start populating price history, then after 24+ hours run `npx tsx scripts/compute-correlations.ts` to populate correlations.

---

### 24. `backfill-resolved.sql`
**What it does:** Data cleanup — marks markets as resolved when `resolves_at` or `end_date` is in the past; zeros out impossible `change_24h` values (artifacts of old % formula).
**Idempotent:** Yes (UPDATE with WHERE clause, safe to re-run)
**Dependencies:** `markets` table must exist with `resolved`, `resolves_at`, `end_date`, `change_24h` columns
**⚠️ Run after ingestion has been running for a while** — meaningless on an empty database

---

### 32. `session28-api.sql`
**What it does:** Adds `user_id` FK to `api_keys` table, updates default rate limits to published free-tier values (30/min, 1,000/day), and adds proper RLS policies so users can self-serve key management via the UI.
**Idempotent:** Yes (`ADD COLUMN IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `CREATE POLICY`)
**Dependencies:** `session28_api_keys.sql` must be applied first
**Tables modified:** `api_keys`, `api_request_logs` (RLS policies only)
**Run after:** `session28_api_keys.sql`

---

### 31. `session27-consensus.sql`
**What it does:** Creates `community_predictions` (one row per user per market, upserted), `market_consensus_cache` (pre-aggregated confidence-weighted consensus per market), and `source_accuracy_history` (Brier scores per resolved market per source).
**Idempotent:** Yes (`CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP TRIGGER IF EXISTS`, `DROP POLICY IF EXISTS`)
**Dependencies:** Supabase `auth.users`
**Tables created:** `community_predictions`, `market_consensus_cache`, `source_accuracy_history`
**RLS:** Community predictions publicly readable; users can insert/update/delete their own rows; accuracy history publicly readable

---

## Quick Checklist

| # | File | Applied? |
|---|------|----------|
| 1 | `session4-alerts.sql` | ☐ |
| 2 | `session6-tiers.sql` | ☐ |
| 3 | `session7_v2.sql` *(skip session7.sql)* | ☐ |
| 4 | `session8-alert-triggers.sql` | ☐ |
| 5 | `session9-morning-brief.sql` | ☐ |
| 6 | `session14_news.sql` | ☐ |
| 7 | `session25_market_theses.sql` | ☐ |
| 8 | `session26_signals.sql` | ☐ |
| 9 | `session28_api_keys.sql` | ☐ |
| 10 | `session29_candles.sql` | ☐ |
| 11 | `session31_signal_accuracy.sql` | ☐ |
| 12 | `session335_waitlist.sql` | ☐ |
| 13 | `session36_match_confidence.sql` | ☐ |
| 14 | `session36_webhooks.sql` | ☐ |
| 15 | `session39_spread_snapshots.sql` | ☐ |
| 16 | `session41_stories.sql` | ☐ |
| 17 | `session42_schema_fixes.sql` | ☐ |
| 18 | `session44.sql` | ☐ |
| 19 | `whales-schema.sql` *(skip if whales table exists)* | ☐ |
| 20 | `session15-ingestion-runs.sql` | ☐ |
| 21 | `session15-stripe-events.sql` | ☐ |
| 22 | `session18-telegram.sql` | ☐ |
| 23 | `session19-waitlist-tier.sql` | ☐ |
| 24 | `session20-portfolio.sql` | ☐ |
| 25 | `session21-profiles.sql` | ☐ |
| 26 | `session22-embed-analytics.sql` | ☐ |
| 27 | `session23-signal-history.sql` | ☐ |
| 28 | `backfill-resolved.sql` *(run last)* | ☐ |
| 29 | `session25-price-history.sql` | ☐ |
| 30 | `session26-indices.sql` | ☐ |
| 31 | `session27-consensus.sql` | ☐ |
| 32 | `session28-api.sql` *(run after session28_api_keys.sql)* | ☐ |

> **Note:** `session14_news.sql` is listed as #6 but was built in session 14 — it still goes after the core tables (sessions 4–9).
