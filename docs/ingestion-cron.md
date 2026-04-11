# Quiver Markets — Ingestion Cron

This document describes how market data is kept fresh.

---

## Where the Cron is Defined

**GitHub Actions** — `.github/workflows/ingest.yml`

The ingestion pipeline runs every 30 minutes via GitHub Actions scheduled workflow. This is the primary data refresh mechanism for the site.

There is a **second, separate** cron for the morning brief email:
- **Netlify Scheduled Function** — `netlify/functions/morning-brief-cron.ts`
- Runs once daily at 11:00 UTC (7:00 AM ET)

---

## Ingestion Schedule

```
*/30 * * * *   — every 30 minutes (GitHub Actions)
```

The workflow also supports manual triggering via `workflow_dispatch`.

---

## What Each Run Does

The workflow runs these steps in sequence (`continue-on-error: true` on each):

| Step | Script | Purpose |
|------|--------|---------|
| 1 | `npx tsx scripts/ingest.ts` | Fetches markets from Polymarket + Kalshi, upserts to `markets` and `disagreements` tables |
| 2 | `npx tsx scripts/ingest-news.ts` | Fetches recent news articles, upserts to `news_articles` |
| 3 | `npx tsx scripts/tag-news.ts` | Tags articles with relevant market IDs |
| 4 | `npx tsx scripts/generate-signals.ts` | Computes smart signals (whale consensus, size spikes) |
| 5 | `npx tsx scripts/detect-story-events.ts` | Detects narrative events, writes to `stories` table |
| 6 | Netlify rebuild trigger | POSTs to `NETLIFY_BUILD_HOOK` if set, triggering a fresh static build |

---

## Required Secrets (GitHub Actions)

Set these in GitHub repo → Settings → Secrets and variables → Actions:

| Secret | Used by |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | All scripts |
| `SUPABASE_SERVICE_ROLE_KEY` | All scripts (bypasses RLS to write data) |
| `NETLIFY_BUILD_HOOK` | Final rebuild step (optional but recommended) |

If `NETLIFY_BUILD_HOOK` is not set, the rebuild step is skipped silently.

---

## Where Logs Go

1. **GitHub Actions UI** — github.com → Your repo → Actions → `Ingest Market Data`
   - Shows each run, pass/fail per step, stdout from each script
   - Retained for 90 days by default

2. **Supabase** — data freshness is visible at `/health` (the new health check page)
   - `markets_data` check reports how many minutes since last `updated_at`

---

## How to Verify the Cron is Running

**Option 1 — GitHub Actions UI:**
```
github.com/Nebben26/The-Capitol-Dossier/actions/workflows/ingest.yml
```
Check the most recent run. Green = OK. Red = at least one step failed (but `continue-on-error` means data may still be partially updated).

**Option 2 — Health endpoint:**
```bash
curl https://quivermarkets.com/api/health | jq '.checks[] | select(.service == "markets_data")'
```
This reports how many minutes ago the most recent market row was updated.

**Option 3 — Supabase SQL Editor:**
```sql
SELECT MAX(updated_at) AS last_ingest, NOW() - MAX(updated_at) AS age
FROM markets;
```

---

## How to Manually Trigger Ingestion

**Trigger via GitHub UI:**
1. Go to Actions → `Ingest Market Data` → Run workflow → Run workflow

**Trigger via GitHub CLI:**
```bash
gh workflow run ingest.yml
```

**Run locally (requires env vars):**
```bash
# Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in .env.local
npx tsx scripts/ingest.ts
```

**Full local pipeline:**
```bash
npx tsx scripts/ingest.ts && \
npx tsx scripts/ingest-news.ts && \
npx tsx scripts/tag-news.ts && \
npx tsx scripts/generate-signals.ts && \
npx tsx scripts/detect-story-events.ts
```

---

## What to Do if Ingestion Stops Running

1. **Check GitHub Actions** — has the workflow been disabled? Re-enable it in Actions → `Ingest Market Data` → Enable workflow.

2. **Check GitHub Actions minutes quota** — free tier has 2,000 minutes/month. At 48 runs/day × 30 min workflow, this project uses ~1,440 min/month. Monitor at: GitHub → Settings → Billing.

3. **Check secrets** — if `SUPABASE_SERVICE_ROLE_KEY` was rotated in Supabase, update the GitHub Actions secret to match.

4. **Check for script errors** — open the last failed run in GitHub Actions and read the output. Common issues:
   - Supabase rate limiting (retry after a few minutes)
   - API shape changes from Polymarket/Kalshi (check `docs/API_REFERENCE.md`)
   - TypeScript errors after a merge (run `npm run build` locally to diagnose)

5. **Emergency fallback** — the site falls back to mock data when the DB is unreachable. Users will see slightly stale or mock data but the site will not crash.

---

## Morning Brief Cron (Separate)

The morning brief email is triggered by a Netlify Scheduled Function:

- **File:** `netlify/functions/morning-brief-cron.ts`
- **Schedule:** `0 11 * * *` — 11:00 UTC = 7:00 AM Eastern
- **What it does:** POSTs to `/api/morning-brief/send` with a Bearer token
- **Logs:** Netlify dashboard → Functions → `morning-brief-cron` → logs
- **Required env var:** `MORNING_BRIEF_CRON_SECRET` must be set in Netlify (not a GitHub secret)
- **Manual trigger:** Hit `/api/morning-brief/preview` to see the current brief content; POST to `/api/morning-brief/send` with the correct Authorization header to actually send
