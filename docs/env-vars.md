# Quiver Markets — Environment Variables

This is the authoritative reference for every environment variable the app uses.
Check this list against your Netlify environment variables panel before deploying.

Variables must be set in both `.env.local` (local dev) **and** Netlify (production) unless noted.

---

## Supabase (Database + Auth)

### `NEXT_PUBLIC_SUPABASE_URL`
- **Required:** Yes — site will not load without it
- **Service:** Supabase project URL
- **Where to get it:** [supabase.com/dashboard](https://supabase.com/dashboard) → Your project → Settings → API → Project URL
- **Format:** `https://xxxxxxxxxxxxxxxxxxxx.supabase.co`
- **If missing/placeholder:** All database reads fail; auth broken; site shows mock data only
- **Set in:** `.env.local` + Netlify

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Required:** Yes
- **Service:** Supabase anonymous (public) API key
- **Where to get it:** Same page as URL → `anon` `public` key
- **Format:** Long JWT string starting with `eyJ...`
- **If missing/placeholder:** All database reads fail silently; site falls back to mock data
- **Set in:** `.env.local` + Netlify

### `SUPABASE_SERVICE_ROLE_KEY`
- **Required:** Yes (for ingestion scripts + server-side API routes)
- **Service:** Supabase service role key (bypasses RLS)
- **Where to get it:** Same page → `service_role` `secret` key
- **Format:** Long JWT string
- **⚠️ Never expose this in the browser.** Used only in server-side code and GitHub Actions secrets.
- **If missing/placeholder:** Stripe webhook cannot upsert user tiers; alert evaluator cannot insert triggers; morning brief subscriber count fails; ingestion scripts fail
- **Set in:** `.env.local` + Netlify + GitHub Actions secrets (`SUPABASE_SERVICE_ROLE_KEY`)

---

## Stripe (Payments)

### `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Required:** Yes (for checkout to function)
- **Service:** Stripe — publishable (frontend-safe) key
- **Where to get it:** [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
- **Format:** `pk_test_...` (test) or `pk_live_...` (production)
- **If missing/placeholder:** Checkout button throws an error; no payments possible
- **Set in:** `.env.local` + Netlify

### `STRIPE_SECRET_KEY`
- **Required:** Yes (server-side checkout session creation)
- **Service:** Stripe — secret key
- **Where to get it:** Same page as above
- **Format:** `sk_test_...` or `sk_live_...`
- **⚠️ Never expose in browser.**
- **If missing/placeholder:** `/api/stripe/checkout` returns 500; no subscriptions can be created
- **Set in:** `.env.local` + Netlify

### `STRIPE_WEBHOOK_SECRET`
- **Required:** Yes (webhook signature verification)
- **Service:** Stripe webhook endpoint secret
- **Where to get it:** [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks) → Create endpoint → Signing secret
- **Format:** `whsec_...`
- **If missing/placeholder:** Stripe webhook events rejected with 400; user tiers never upgrade after payment
- **Set in:** `.env.local` (for local testing with Stripe CLI) + Netlify

### `STRIPE_PRICE_PRO_MONTHLY`
- **Required:** Yes (for Pro Monthly checkout)
- **Service:** Stripe Price ID
- **Where to get it:** Stripe Dashboard → Products → Pro plan → Monthly price → Copy price ID
- **Format:** `price_xxx`
- **If missing/placeholder:** Pro Monthly checkout throws error
- **Set in:** `.env.local` + Netlify

### `STRIPE_PRICE_PRO_ANNUAL`
- **Required:** Yes
- **Format:** `price_xxx`
- **If missing/placeholder:** Pro Annual checkout throws error
- **Set in:** `.env.local` + Netlify

### `STRIPE_PRICE_TRADER_MONTHLY`
- **Required:** Yes
- **Format:** `price_xxx`
- **If missing/placeholder:** Trader Monthly checkout throws error
- **Set in:** `.env.local` + Netlify

### `STRIPE_PRICE_TRADER_ANNUAL`
- **Required:** Yes
- **Format:** `price_xxx`
- **If missing/placeholder:** Trader Annual checkout throws error
- **Set in:** `.env.local` + Netlify

---

## Resend (Email)

### `RESEND_API_KEY`
- **Required:** Yes (for morning brief to send)
- **Service:** Resend transactional email
- **Where to get it:** [resend.com](https://resend.com) → Sign up → API Keys → Create API Key
- **Format:** `re_...`
- **If missing/placeholder:** Morning brief send silently skips; subscribe still works but no emails go out
- **Set in:** `.env.local` + Netlify

### `MORNING_BRIEF_FROM_EMAIL`
- **Required:** No (defaults to `brief@quivermarkets.com`)
- **Service:** Resend — sender address
- **Notes:** Must be a verified domain in Resend. Verify `quivermarkets.com` DNS at [resend.com/domains](https://resend.com/domains).
- **If missing:** Falls back to `brief@quivermarkets.com` (which must still be verified in Resend)
- **Set in:** `.env.local` + Netlify

### `MORNING_BRIEF_CRON_SECRET`
- **Required:** Yes (for the Netlify scheduled function to authenticate with the API route)
- **Service:** Internal — shared secret
- **How to generate:** `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **If missing/placeholder:** Netlify cron silently aborts; no morning briefs are ever sent
- **Set in:** `.env.local` + Netlify (must match in both places — the cron function and the API route must share the same value)

---

## PostHog (Analytics)

### `NEXT_PUBLIC_POSTHOG_KEY`
- **Required:** No — analytics silently disabled when missing
- **Service:** PostHog product analytics
- **Where to get it:** [posthog.com](https://posthog.com) → Create project → Project API Key
- **Format:** `phc_...`
- **If missing/placeholder:** All `trackEvent` calls are no-ops; no funnel data collected
- **Set in:** `.env.local` + Netlify

### `NEXT_PUBLIC_POSTHOG_HOST`
- **Required:** No (defaults to `https://us.i.posthog.com`)
- **Service:** PostHog ingestion host
- **Notes:** Change to `https://eu.i.posthog.com` for EU data residency
- **Set in:** `.env.local` + Netlify (if overriding)

---

## Sentry (Error Tracking)

### `NEXT_PUBLIC_SENTRY_DSN`
- **Required:** No — error reporting silently disabled when missing
- **Service:** Sentry error monitoring
- **Where to get it:** [sentry.io](https://sentry.io) → Project → Settings → Client Keys (DSN)
- **Format:** `https://xxxx@xxxx.ingest.sentry.io/xxxx`
- **Current value:** A real DSN is hardcoded as fallback in `sentry.client.config.ts` — the project is already reporting to Sentry even without this var set
- **If missing/placeholder:** Falls back to hardcoded DSN (continues working)
- **Set in:** `.env.local` + Netlify

### `SENTRY_AUTH_TOKEN`
- **Required:** No — only needed for source map uploads during build
- **Service:** Sentry — build-time token for `@sentry/nextjs` webpack plugin
- **Where to get it:** Sentry → User Settings → Auth Tokens → Create new token
- **Format:** `sntrys_...`
- **If missing/placeholder:** Source maps are NOT uploaded; stack traces in Sentry show minified code. The app still works and errors are captured — they just lack readable stack traces.
- **Set in:** Netlify only (not needed in `.env.local` unless you want local source map uploads)

### `SENTRY_ORG`
- **Required:** Only when `SENTRY_AUTH_TOKEN` is set
- **Current value:** `the-conspiracy-trader-llc` (hardcoded fallback in `next.config.ts`)
- **Set in:** Netlify

### `SENTRY_PROJECT`
- **Required:** Only when `SENTRY_AUTH_TOKEN` is set
- **Current value:** `javascript-nextjs` (hardcoded fallback in `next.config.ts`)
- **Set in:** Netlify

---

## Internal Secrets

### `ALERT_EVALUATOR_SECRET`
- **Required:** Yes (for the alert evaluator cron to authenticate)
- **Service:** Internal — shared secret between cron caller and `/api/alerts/evaluate` route
- **How to generate:** `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **If missing/placeholder:** Alert evaluation endpoint returns 401; no alerts ever fire
- **Set in:** `.env.local` + Netlify + GitHub Actions secrets (if triggered from GH Actions)

---

## GitHub Actions Only

These are only needed as GitHub repository secrets, not in `.env.local` or Netlify:

| Secret | Purpose |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Ingestion scripts read public URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Ingestion scripts write to DB |
| `NETLIFY_BUILD_HOOK` | Trigger Netlify rebuild after ingestion |

Set at: GitHub repo → Settings → Secrets and variables → Actions → New repository secret

---

## Summary Table

| Variable | Required | Breaks Without It |
|----------|----------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Critical** | Entire app shows mock data |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Critical** | Entire app shows mock data |
| `SUPABASE_SERVICE_ROLE_KEY` | **Critical** | Stripe webhooks, alerts, ingestion all fail |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **Critical** | No payments |
| `STRIPE_SECRET_KEY` | **Critical** | No payments |
| `STRIPE_WEBHOOK_SECRET` | **Critical** | Payments go through but tiers never upgrade |
| `STRIPE_PRICE_PRO_MONTHLY` | **Critical** | Pro Monthly checkout fails |
| `STRIPE_PRICE_PRO_ANNUAL` | **Critical** | Pro Annual checkout fails |
| `STRIPE_PRICE_TRADER_MONTHLY` | **Critical** | Trader Monthly checkout fails |
| `STRIPE_PRICE_TRADER_ANNUAL` | **Critical** | Trader Annual checkout fails |
| `RESEND_API_KEY` | High | Morning brief never sends |
| `MORNING_BRIEF_CRON_SECRET` | High | Morning brief cron aborts |
| `ALERT_EVALUATOR_SECRET` | High | Alerts never fire |
| `NEXT_PUBLIC_POSTHOG_KEY` | Low | No analytics (silent no-op) |
| `NEXT_PUBLIC_SENTRY_DSN` | Low | Uses hardcoded fallback DSN |
| `SENTRY_AUTH_TOKEN` | Low | Minified stack traces in Sentry |
| `MORNING_BRIEF_FROM_EMAIL` | Low | Uses default address |
| `NEXT_PUBLIC_POSTHOG_HOST` | Low | Uses default US host |
