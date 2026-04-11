# Analytics + Error Tracking — Setup Guide

Quiver Markets uses **PostHog** for product analytics and **Sentry** for error tracking. Both have generous free tiers that will comfortably carry the site to thousands of users.

---

## PostHog (product analytics)

**Free tier:** 1 million events/month — more than enough until significant scale.

### 1. Sign up

1. Go to https://posthog.com and click "Get started free"
2. Create a new organization and project
3. Choose **US Cloud** region (matching the configured host `https://us.i.posthog.com`)

### 2. Get your API key

1. In PostHog, go to **Settings → Project → Project API Key**
2. Copy the key — it starts with `phc_`

### 3. Add to environment

**.env.local:**
```
NEXT_PUBLIC_POSTHOG_KEY=phc_your_actual_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Netlify:** Site → Settings → Environment Variables → add both vars.

### 4. Verify

Visit `/debug/analytics` (dev or prod), click **Fire Custom Event**, then check your PostHog dashboard → **Activity** tab. You should see `viewed_disagreement` arrive within 30 seconds.

---

## Sentry (error tracking)

**Free tier:** 5,000 errors/month, 50MB attachments.

### 1. Sign up

1. Go to https://sentry.io and create an account
2. Create a new **Next.js** project

### 2. Get your DSN

1. In Sentry, go to **Settings → Projects → your-project → Client Keys (DSN)**
2. Copy the DSN — it looks like `https://abc123@sentry.io/456789`

### 3. Generate an auth token

1. Go to **Settings → Account → API → Auth Tokens**
2. Click **Create New Token**
3. Select scopes: `project:write`, `project:read`, `org:read`
4. Copy the token — it starts with `sntrys_`

### 4. Add to environment

**.env.local:**
```
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_AUTH_TOKEN=sntrys_your_token_here
SENTRY_ORG=your-sentry-org-slug
SENTRY_PROJECT=your-sentry-project-slug
```

**Netlify:** Site → Settings → Environment Variables → add all four vars.

### 5. Verify

Visit `/debug/analytics`, click **Capture Error**, then check Sentry → **Issues** tab. You should see "Test error from debug page" arrive within a minute.

---

## Events tracked automatically

| Event | Where |
|---|---|
| `$pageview` | Every page navigation (PostHog provider) |
| `viewed_market` | Market detail page loads |
| `viewed_disagreement` | — (available, add to card click if desired) |
| `opened_arb_calculator` | Arb calculator modal opens |
| `exported_csv` | Disagrees CSV export |
| `viewed_pricing` | Pricing page loads |
| `clicked_subscribe` | Checkout button clicked |
| `subscribed_morning_brief` | Morning Brief email subscribe |
| `signed_up` | New account created |
| `signed_in` | Login success |
| `signed_out` | Logout |

---

## Errors tracked automatically

- All React component crashes (`app/error.tsx`)
- Catastrophic root-level crashes (`app/global-error.tsx`)
- Any exception you capture manually with `Sentry.captureException(err)`

---

## PostHog dashboard setup

Once events are flowing, build these in PostHog → **Dashboards**:

1. **Funnel: Pricing → Subscribe**
   - `viewed_pricing` → `clicked_subscribe` → `completed_checkout`

2. **Daily active users**
   - Insight → Trends → `$pageview` grouped by user → weekly

3. **Top pages**
   - Insight → Trends → `$pageview` broken down by `$current_url`

4. **Sign-up rate**
   - Trends → `signed_up` over time

---

## Advanced: Feature flags and A/B testing

PostHog supports feature flags out of the box. Use them to roll out features gradually:

```typescript
import posthog from "posthog-js";

if (posthog.isFeatureEnabled("new-arb-calculator")) {
  // show new version
}
```

See: https://posthog.com/docs/feature-flags

---

## Troubleshooting

**PostHog events not showing up:**
- Check browser console for errors
- Verify `NEXT_PUBLIC_POSTHOG_KEY` is set and doesn't contain "PLACEHOLDER"
- PostHog has a short delay before events appear in the UI (~30s)

**Sentry errors not showing up:**
- Check `NEXT_PUBLIC_SENTRY_DSN` is correct
- The `beforeSend` filter in `sentry.client.config.ts` drops `localhost` events — test in production or temporarily remove that filter
- Sentry free tier has a rate limit — check the Issues tab for quota warnings

**Build fails with Sentry webpack plugin errors:**
- These are usually about missing auth token
- Set `SENTRY_AUTH_TOKEN` in your build environment
- Or set it to a PLACEHOLDER value — the `next.config.ts` will skip the plugin entirely when the token contains "PLACEHOLDER"
