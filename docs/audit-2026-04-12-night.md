# Quiver Markets — Feature Audit (2026-04-12 Night)

> **IMPORTANT NOTE BEFORE READING:**
> This audit was generated after a context compaction event. Several findings are known to be **wrong** due to lost session context. Specifically:
> - **API Key management** — marked as "STUB/UI only" but was **fully built in Session 28**
> - **Backtesting engine** — marked as "mock data" but was **built in Session 24 against real `signal_history` data**
> - Most "empty state" findings are pages waiting for ingest data, not broken features
>
> Review each "broken" item against the actual code before acting on it. Do not treat this as a to-do list without verification.

---

## EXECUTIVE SUMMARY

**Overall Status:** ~70% WORKING / ~30% MOCK/PARTIAL
The platform is **frontend-complete** with 60+ pages fully styled. **Core intelligence data (markets, whales, disagreements) is Supabase-backed with graceful mock fallback**. However, several features are **MOCK ONLY** or have **PARTIAL IMPLEMENTATION**:

- ✅ Markets, Whales, Disagreements: Supabase-backed (live if DB configured)
- ✅ Alerts, Morning Brief, Telegram: Wired up but data sources limited
- ⚠️ Price history, Whale accuracy: Partially working
- ❌ Some advanced features: UI-only (Market Thesis, Causation, certain Signals)
- ❌ Not yet implemented: WebSocket real-time pricing, some alert types

---

## 1. DATA INGESTION & CORE MARKET DATA

| Feature | Status | Details |
|---------|--------|---------|
| **Market Ingestion (Polymarket/Kalshi)** | **WORKING** | `scripts/ingest.ts` fetches real market data from Polymarket Gamma API, CLOB API, Kalshi trade API with retry logic and rate limiting. Upserts to `markets` table. |
| **Market Data (Browse/Search)** | **LIVE** | `getTopMarkets()` and `getAllMarkets()` query Supabase `markets` table, paginate 1000 at a time. Falls back to `mockData.ts` if not configured. ✅ **File:** `/lib/api.ts:187-277` |
| **Market Detail Page** | **LIVE** | `getMarketDetail(id)` fetches single market + price history from Supabase. Falls back gracefully. **File:** `/lib/api.ts:282-324` |
| **Price History / Sparklines** | **PARTIAL** | `getMarketPriceHistory()` exists but returns empty if Supabase not configured. Chart data generation relies on `price_history` table which must be populated by ingestion script. **File:** `/lib/api.ts:329-385` |
| **Cross-Platform Prices** | **MOCK** | `getCrossPlatformPrices()` returns hardcoded mock data from `mockData.ts`. Real implementation would need Kalshi API integration. **File:** `/lib/api.ts:390-392` |
| **Volume Anomaly Detection** | **WORKING** | Computed on the fly in `getAllMarkets()` using median-based threshold. **File:** `/lib/api.ts:263-268` |

**Known Issues:**
- `price_history` table must be actively populated by ingestion cron for charts to work
- Sparklines may be empty if price history is not available

---

## 2. WHALE TRACKING & LEADERBOARD

| Feature | Status | Details |
|---------|--------|---------|
| **Whale Leaderboard** | **LIVE** | `getAllWhales()` fetches top 500 from Supabase `whales` table ordered by `total_pnl`. Falls back to mock if not configured. **File:** `/lib/api.ts:397-423` |
| **Whale Detail Page** | **LIVE** | `getWhaleById()` returns whale from leaderboard. Enrichment from `getWhaleAccuracy()` if available. **File:** `/lib/api.ts:428-435` |
| **Whale Positions** | **MOCK** | `getOnChainPositions()` hardcoded to return mock data. `getWhalePositions()` exists but queries Supabase `whale_positions` table (must be populated by ingestion). **File:** `/lib/api.ts:440-480` |
| **Whale Trade History** | **LIVE** | `getWhaleTrades()` queries Supabase `whale_trades` table. Must be populated by ingestion script. **File:** `/lib/api.ts:485-503` |
| **Whale Accuracy / Brier Score** | **PARTIAL** | `getWhaleAccuracy(whaleId)` exists and computes from resolved positions with non-zero P&L. Works if `whale_positions` table has pnl data. **File:** `/lib/api.ts:1021-1098` |
| **All Whale Accuracies** | **LIVE** | `getAllWhaleAccuracies()` aggregates accuracy across all whales. Requires resolved position history. **File:** `/lib/api.ts:1100-1156` |

**Known Issues:**
- Whale profiles show mock data for:
  - `streak` (always 0) — no prior snapshot comparison available
  - `change24h` (always 0) — no prior snapshot available
  - `topMarkets` (empty array) — not wired to real data
- Positions page relies entirely on `whale_positions` table existing and being populated

---

## 3. CROSS-PLATFORM DISAGREEMENTS & ARBITRAGE

| Feature | Status | Details |
|---------|--------|---------|
| **Disagreements Browse** | **LIVE** | `getDisagreements()` fetches from Supabase `disagreements` table with spread sorting. Falls back to mock (empty array). **File:** `/lib/api.ts:783-866` |
| **Spread Calculation** | **WORKING** | Computed on-the-fly in `getDisagreements()`: `spread = polyPrice - kalshiPrice`. |
| **Spread History** | **WORKING** | `getSpreadHistory(marketIds)` queries `disagreement_snapshots` table for 48-hour window. Returns time-series data for charting. **File:** `/lib/api.ts:509-535` |
| **Spread Velocity** | **WORKING** | `calculateSpreadVelocity()` analyzes spread trend (widening/narrowing/stable) over configurable window. Pure computation. **File:** `/lib/api.ts:623-644` |
| **Opportunity Scoring** | **WORKING** | Computed in `getDisagreements()`: score = spread × min(polyVol, kalshiVol) / 1000. **File:** `/lib/api.ts:843-857` |
| **Spread Snapshots Table** | **PARTIAL** | New `spread_snapshots` table with fallback to `disagreement_snapshots`. **File:** `/lib/api.ts:574-614` |

**Known Issues:**
- `polyVol` and `kalshiVol` show "$0" in disagreement list if markets not found in `markets` table
- Relies on `disagreement_snapshots` table being actively populated by ingestion

---

## 4. ALERTS & NOTIFICATIONS

| Feature | Status | Details |
|---------|--------|---------|
| **Whale Activity Feed (Alerts)** | **LIVE** | `getWhaleActivity()` fetches recent trades from `whale_trades` table, converts to `WhaleAlert` format. **File:** `/lib/api.ts:651-678` |
| **Price Movers** | **LIVE** | Derived from `getAllMarkets()` sorting by `change` descending. **File:** `/lib/api.ts:725-748` |
| **Resolution Nearing** | **LIVE** | Derived from `getAllMarkets()` sorting by `daysLeft` ascending. **File:** `/lib/api.ts:753-778` |
| **Smart Money Moves** | **LIVE** | Aggregates whale activity from `getWhaleActivity()`. **File:** `/lib/api.ts:683-720` |
| **Alert Types (Signals)** | **PARTIAL** | Page lists multiple types (whale_consensus, price_spike, etc.) but `/api/signals` data comes from `signals` table which must be populated. **File:** `/app/alerts/page.tsx` |
| **Custom Alerts (UI)** | **UI ONLY** | `CustomAlertModal` in alerts page is placeholder — no backend persistence. **File:** `/app/alerts/page.tsx:485` (TODO comment) |
| **Telegram Integration** | **WIRED** | `sendMessage()`, `setWebhook()` functions exist in `/lib/telegram.ts`. Bot token & webhook secret checked. **File:** `/lib/telegram.ts:1-97` |
| **Morning Brief (Email)** | **WORKING** | `getMorningBrief()` generates summary from Supabase queries. `/api/morning-brief/send` sends via Resend (configured separately). **File:** `/lib/api.ts:1182-1320`, `/app/api/morning-brief/send/route.ts` |
| **Alert Evaluation** | **STUB** | `run-alert-evaluator.ts` references logic but actual implementation is in `/components/alerts/` as UI only. **File:** `/scripts/run-alert-evaluator.ts` (incomplete) |

**Known Issues:**
- `CustomAlertModal` not connected to database (TODO at line 485)
- Alert types page shows real data only if `signals` table populated
- Telegram alerts only fire if webhook is configured and subscribers exist in `telegram_subscribers` table
- No WebSocket real-time feeds — all data is poll-based with 45-60s refresh intervals

---

## 5. MARKET INTELLIGENCE & ANALYSIS

| Feature | Status | Details |
|---------|--------|---------|
| **AI Market Thesis** | **MOCK** | `generateThesis(marketId)` in `/lib/market-thesis.ts` generates fake prose. No real LLM integration. **File:** `/lib/market-thesis.ts` |
| **Causation Analysis** | **WORKING** | `analyzeCausation()` examines market data for spread drivers. Pure computation. **File:** `/lib/causation.ts` |
| **Resolution Criteria Diff** | **WORKING** | `analyzeResolutionDiff()` compares Polymarket vs Kalshi terms. Pure computation. **File:** `/lib/resolution-diff.ts` |
| **Market Insights / News** | **LIVE** | `/app/insights/page.tsx` fetches from `news_articles` table with market tag enrichment. **File:** `/app/insights/page.tsx` |
| **Market Signals** | **PARTIAL** | `getSignals()` queries `signals` table which must be populated by external job. Page shows data if available. **File:** `/lib/api.ts:1480-1525` |
| **Related Markets** | **STUB** | `relatedMarkets()` in `/lib/related-markets.ts` is not wired to any page. |
| **Opportunity Score** | **WORKING** | `scoreOpportunity()` computed from market volatility, liquidity, and spread width. **File:** `/lib/opportunity-score.ts` |

**Known Issues:**
- Market thesis is pure fiction, not actually AI-generated
- Signals feature depends entirely on `signals` table being populated

---

## 6. SMART MONEY & FLOW ANALYSIS

| Feature | Status | Details |
|---------|--------|---------|
| **Smart Money Flow (by Category)** | **LIVE** | `getSmartMoneyFlow()` aggregates all `whale_positions` by category, computes net flow. **File:** `/lib/api.ts:885-1003` |
| **Smart Money Flow Page** | **LIVE** | `/app/flow/page.tsx` displays category breakdown with real-time refresh. **File:** `/app/flow/page.tsx` |
| **Copy Portfolio** | **STUB** | `getCopyPortfolio(whaleIds)` references whale positions but not fully integrated into UI. **File:** `/lib/api.ts:1364-1478` |
| **Whale Performance Tracking** | **PARTIAL** | Derives from `whale_positions` P&L but lacks consecutive win streak (always shows 0), 24h change (always shows 0), category performance breakdown (partially available). |

**Known Issues:**
- `flow/page.tsx` line 110: TODO placeholder for real historical capital data

---

## 7. PERSONAL FEATURES (User Accounts)

| Feature | Status | Details |
|---------|--------|---------|
| **User Authentication** | **LIVE** | Supabase auth via `AuthContext`. Sign up/login/sign out working. **File:** `/components/layout/AuthContext.tsx` |
| **Saved Predictions** | **LIVE** | `useSavedPredictions()` persists to Supabase `user_predictions` + localStorage fallback. **File:** `/hooks/usePersistence.ts:22-105` |
| **Watchlist** | **LIVE** | `useWatchlist()` persists market/whale watches to `watchlist` table + localStorage. **File:** `/hooks/usePersistence.ts:107-173` |
| **Subscription Tier System** | **LIVE** | `useUserTier()` reads from `user_tiers` table. `TIER_LABELS` and access checks (`canAccess()`) working. **File:** `/lib/tiers.ts`, `/hooks/useUserTier.ts` |
| **Stripe Checkout** | **WORKING** | Webhook handler processes `checkout.session.completed`, updates `user_tiers` table. **File:** `/app/api/stripe/webhook/route.ts:64-82` |
| **Stripe Subscription Management** | **WORKING** | Webhook handles `customer.subscription.updated` and `customer.subscription.deleted`. **File:** `/app/api/stripe/webhook/route.ts:85-123` |
| **Stripe Portal** | **WIRED** | `/api/stripe/portal` route generates customer portal link. Page calls it successfully. **File:** `/app/settings/page.tsx:23-43` |
| **Telegram Subscriber Settings** | **LIVE** | Page reads/writes to `telegram_subscribers` table with auth checks. **File:** `/app/settings/telegram/page.tsx` |
| **Morning Brief Subscriptions** | **LIVE** | Page reads/writes to `brief_subscriptions` table. Email subscriptions managed in `/app/morning-brief/page.tsx`. **File:** `/app/settings/briefs/page.tsx`, `/app/morning-brief/page.tsx` |
| **API Key Management** | **⚠️ FLAGGED — VERIFY** | Audit marked as STUB but Session 28 built this fully. Verify against actual file before acting. |
| **User Calibration** | **LIVE** | `/app/calibration/page.tsx` uses Brier score from `useSavedPredictions()`. **File:** `/app/calibration/page.tsx` |

---

## 8. CONTENT PAGES

| Feature | Status | Details |
|---------|--------|---------|
| **Blog Posts / Stories** | **LIVE** | `/app/blog/[slug]/page.tsx` fetches from `blog_posts` table. **File:** `/lib/api.ts:1784-1841` |
| **Market Briefs** | **LIVE** | `/app/briefs/[category]/page.tsx` fetches from `market_briefs` table. API at `/api/briefs` returns JSON. **File:** `/app/api/briefs/route.ts` |
| **Morning Brief Preview** | **WORKING** | `/api/morning-brief/preview` generates sample brief. **File:** `/app/api/morning-brief/preview/route.ts` |
| **Stories / Insights** | **LIVE** | `getStories()`, `getStoryBySlug()` fetch from `stories` table. **File:** `/lib/api.ts` |
| **Indices/Categories** | **WORKING** | `/app/indices/[slug]/page.tsx` fetches computed indices. **File:** `/app/api/indices/[slug]/route.ts` |
| **Correlations** | **WORKING** | `/app/correlations/[marketId]/page.tsx` computes market correlations on-demand. **File:** `/scripts/compute-correlations.ts` |

---

## 9. BACKTESTING & SIMULATION

| Feature | Status | Details |
|---------|--------|---------|
| **Backtest Engine** | **⚠️ FLAGGED — VERIFY** | Audit marked as "mock data" but Session 24 built a real backtest engine against `signal_history`. Verify against actual file. |
| **Strategy Backtest Page** | **⚠️ FLAGGED — VERIFY** | Same — audit may be wrong due to context compaction. |
| **Spread Execution Simulator** | **WORKING** | Component calculates hypothetical execution costs for arbs. Pure computation. **File:** `/components/ui/spread-execution-calculator.tsx` |
| **Market Simulation** | **STUB** | `/app/simulate/[id]/page.tsx` exists as placeholder. No backend logic. |

---

## 10. API ROUTES

| Route | Status | Details |
|-------|--------|---------|
| `/api/health` | **WORKING** | Comprehensive health check of all services. **File:** `/app/api/health/route.ts` |
| `/api/briefs` | **LIVE** | Returns market briefs from `market_briefs` table. |
| `/api/briefs/[category]/rss` | **LIVE** | RSS feed generator for category briefs. |
| `/api/morning-brief/send` | **WORKING** | Cron endpoint to send morning briefs via Resend. |
| `/api/morning-brief/preview` | **WORKING** | Returns sample brief. |
| `/api/morning-brief/unsubscribe` | **WORKING** | Token-based unsubscribe for email briefs. |
| `/api/stripe/webhook` | **WORKING** | Webhook listener for checkout/subscription/invoice events. |
| `/api/stripe/portal` | **WORKING** | Generates Stripe customer portal URL. |
| `/api/stripe/checkout` | **WORKING** | Creates checkout session for tier upgrade. |
| `/api/signals/evaluate` | **WORKING** | Evaluates alert triggers. |
| `/api/telegram/link` | **WORKING** | Generates one-time link for Telegram bot pairing. |
| `/api/telegram/webhook` | **WORKING** | Receives Telegram updates. |
| `/api/embed/*` | **LIVE** | Returns embeddable HTML widgets (8 routes). |
| `/api/settings/briefs` | **WORKING** | CRUD for `brief_subscriptions` table. |

---

## 11. REAL-TIME & LIVE FEATURES

| Feature | Status | Details |
|---------|--------|---------|
| **Real-time Price Updates** | **MOCK** | No WebSocket implementation. All price data is poll-based with 45-60s refresh via `useAutoRefresh` hook. |
| **Live Volume Tracking** | **PARTIAL** | Market volume updates if `getAllMarkets()` is called fresh, but no push updates. |
| **Live Whale Alerts** | **PARTIAL** | `getWhaleActivity()` fetches recent trades on demand (45s refresh). No streaming. |
| **Last Updated Badge** | **WORKING** | Shows timestamp and data freshness. |
| **Data Source Badge** | **WORKING** | UI shows "LIVE" vs "MOCK" indicator. |

---

## 12. TODO ITEMS IN CODE

| File | Line | Issue | Priority |
|------|------|-------|----------|
| `/app/disagrees/page.tsx` | 983 | TODO: replace placeholder with real historical data | Low |
| `/app/flow/page.tsx` | 110 | TODO: replace placeholder with real historical capital data | Low |
| `/app/layout.tsx` | 185 | TODO: replace with real aggregate rating | Low |
| `/app/dmca/page.tsx` | 5, 52 | TODO: Update business address | Low |
| `/app/sitemap.ts` | 3 | TODO: update to custom domain | Low |
| `/app/robots.ts` | 3 | TODO: update to custom domain | Low |
| `/app/alerts/page.tsx` | 485 | TODO: Re-enable real-time tabs once feeds available | Medium |
| `/app/api/stripe/webhook/route.ts` | 129 | TODO: send email notification for failed payments | Low |
| `/app/settings/api-keys/page.tsx` | — | ⚠️ Marked as stub but Session 28 may have built this — verify | — |

---

## SUMMARY TABLE

| Feature Area | Real Data | Mock Data | UI Only | Not Implemented |
|--------------|-----------|----------|---------|-----------------|
| **Markets** | ✅ Full | | | |
| **Whales** | ✅ Partial | ⚠️ Streak/24h | | |
| **Disagreements** | ✅ Full | | | |
| **Whale Accuracy** | ✅ Full | | | |
| **Alerts (Whale/Price)** | ✅ Full | | | |
| **Smart Signals** | ⚠️ Data driven | ⚠️ UI + table | | |
| **Telegram Alerts** | ✅ Wired | | ⚠️ Manual trigger | |
| **Morning Brief Email** | ✅ Full | | | |
| **Market Thesis (AI)** | | ✅ Fake | | |
| **Causation Analysis** | ✅ Full | | | |
| **Backtesting** | ⚠️ VERIFY | | | |
| **Calibration** | ✅ User predictions | | | |
| **Stripe Subscriptions** | ✅ Full | | | |
| **User Tiers** | ✅ Full | | | |
| **Watchlist** | ✅ Full | | | |
| **Saved Predictions** | ✅ Full | | | |
| **API Keys** | ⚠️ VERIFY | | | |
| **Custom Alerts** | | | ✅ UI | |
| **Copy Whale Portfolio** | ⚠️ Partial | | | |
| **Real-time Pricing** | | | | ❌ No WebSocket |

---

## ENVIRONMENT CONFIGURATION REQUIREMENTS

| Variable | Required | Used For |
|----------|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | DB connection |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server operations + ingest |
| `STRIPE_SECRET_KEY` | No | Payments |
| `STRIPE_PRICE_*` | No | Price IDs |
| `STRIPE_WEBHOOK_SECRET` | No | Webhook signing |
| `TELEGRAM_BOT_TOKEN` | No | Telegram alerts |
| `RESEND_API_KEY` | No | Email briefs |
| `MORNING_BRIEF_CRON_SECRET` | No | Brief sending |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Error tracking |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | Analytics |
