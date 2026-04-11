# Quiver Markets — External Auditor Issues (2026-04-11)

**Source:** Issues flagged during external review of the deployed site.  
**Session:** 17  
**Status:** All items resolved in this session unless marked [QUEUE].

---

## Resolved in Session 17

### 1. Broken `/api` links → `/api-docs`
- **Found:** Footer and any sidebar links pointing to `/api` returned 404.
- **Status:** Already correct in Sidebar (`/api-docs`). Footer in `app/page.tsx` already used `/api-docs`. No broken links found.

### 2. Pricing inconsistency — $60/mo displayed instead of $49/mo
- **Found:** `components/ui/waitlist-form.tsx` showed "lock in $39/mo before Pro launches at $60/mo".
  `app/pricing/layout.tsx` metadata said "Pro at $60/mo".
- **Fix:** Changed both to $49/mo (the correct price from `lib/pricing.ts`).
- **Root cause:** Stale copy written before the pricing was finalized.

### 3. Twitter links pointing to non-existent account
- **Found:** Three locations — `app/page.tsx` footer, `app/about/page.tsx`, `app/contact/page.tsx`.
- **Fix:** Removed all three. Contact page Twitter card removed entirely. About page now email-only.

### 4. "Testimonials coming soon" on homepage
- **Found:** `app/page.tsx` — small text under the waitlist form.
- **Fix:** Removed. Empty promises about future content undermine credibility.

### 5. Page title duplication ("Page Name · Quiver Markets · Quiver Markets")
- **Found:** 7 sub-layout files included "Quiver Markets" in their title string, which Next.js then wraps in the root layout's `template: '%s · Quiver Markets'`.
- **Affected layouts:** about, alerts, calibration, copy (Smart Money Watch), flow, strategies, watchlist.
- **Also fixed in pages:** blog/[slug], markets/[id], whales/[id] (title + openGraph/twitter fields).
- **Fix:** Removed "— Quiver Markets" / "| Quiver Markets" from all affected titles.

### 6. "Since you were last here" banner — 30-day staleness guard
- **Found:** No upper bound on how old the last-visit timestamp could be.
- **Fix:** `components/ui/since-last-visit.tsx` — added `if (hoursAgo > 24 * 30) return;` to suppress banner for visits >30 days ago.

### 7. `change_24h` sanity bounds
- **Found:** `getMorningBrief` queries had no filter on `change_24h`, so stale bad rows (with values outside 0–100 scale) could surface as "biggest movers".
- **Fix:** Added `.gte("change_24h", -100).lte("change_24h", 100)` to both biggest-mover queries in `lib/api.ts`.
- **Also:** Added `.lte("change_24h", 100)` to the movers count in `components/ui/since-last-visit.tsx`.

### 8. `getLastIngestTimestamp()` reads wrong table
- **Found:** Function reads `markets.updated_at` instead of `ingestion_runs.completed_at`.
- **Fix:** Updated `lib/api.ts` to query `ingestion_runs` first (status=completed, most recent), falling back to `markets.updated_at` if the table doesn't exist yet.

### 9. Resolved markets empty state too sparse
- **Found:** Empty state just said "No resolved markets found." with no explanation.
- **Fix:** `app/resolved/page.tsx` — differentiated search vs. no-data case, added explanatory text for the no-data case.

### 10. Pro CTA sidebar card not dismissible
- **Found:** `SidebarUpgradeCard` in `components/ui/pro-gate.tsx` had no dismiss button; shown on every page load forever.
- **Fix:** Added X dismiss button with 7-day localStorage cooldown (`qm_cta_dismissed_until`). Starts hidden to avoid hydration flash, reads localStorage on mount.

### 11. Blog layout awkward with single post
- **Found:** 3-column grid looks bad with one card.
- **Fix:** `app/blog/page.tsx` — when POSTS.length === 1, renders a single full-width card (max-w-2xl) instead of a grid. Added Morning Brief CTA below for content richness.

---

## Could Not Reproduce / Already Correct

- `/api` links in sidebar: already pointed to `/api-docs` ✓
- Smart Money naming in sidebar: already clean (Whales, Smart Money, Leaderboard, Flow) ✓

---

## Still Queued (not in scope for Session 17)

- Calibration whale comparison table uses mock data (audit doc #8) — needs real Supabase data
- Whale "SMART MONEY" badge based on arbitrary P&L threshold (audit doc #9)
- Whale `bestCategory` hardcoded (audit doc #10)
- Calibration "Whale Rank" hardcoded pool size (audit doc #11)
- Kalshi trader count "(est.)" label (audit doc #13)
- Whale P&L concentration tooltip rename → "Whale P&L concentration" (audit doc #14)
- Real win_rate/accuracy computation from resolved positions
- Disagrees Return sort mismatch (raw vs annualized)
- Methodology page documentation gaps
