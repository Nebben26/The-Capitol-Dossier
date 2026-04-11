# Stripe Setup Guide — Quiver Markets

Follow these steps to go from zero to live payments.

---

## 1. Sign Up for Stripe

1. Go to https://dashboard.stripe.com/register
2. Complete signup and verify your email
3. Complete business verification (required before going live)

---

## 2. Get Your API Keys

1. In the Stripe dashboard, go to **Developers → API Keys**
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Add both to `.env.local`:

```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

---

## 3. Create Products and Prices

You need 4 price objects: Pro Monthly, Pro Annual, Trader Monthly, Trader Annual.

### Step-by-step for each product:

**Product 1: Quiver Markets Pro**

1. Go to **Catalog → Products → Add product**
2. Name: `Quiver Markets Pro`
3. Click **Add price**:
   - Price: `$49.00` / month (recurring)
   - Copy the price ID (`price_xxx`) → paste into `.env.local` as `STRIPE_PRICE_PRO_MONTHLY`
4. Click **Add another price**:
   - Price: `$490.00` / year (recurring)
   - Copy the price ID → paste as `STRIPE_PRICE_PRO_ANNUAL`

**Product 2: Quiver Markets Trader**

1. **Add product**: `Quiver Markets Trader`
2. Add price: `$149.00` / month → `STRIPE_PRICE_TRADER_MONTHLY`
3. Add price: `$1,490.00` / year → `STRIPE_PRICE_TRADER_ANNUAL`

Your `.env.local` should now have 4 real price IDs replacing the placeholders.

---

## 4. Set Up the Webhook Endpoint

The webhook keeps your Supabase `user_tiers` table in sync with Stripe subscription events.

### For local development (Stripe CLI):

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Copy the **webhook signing secret** (`whsec_xxx`) that Stripe CLI prints
4. Add it to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

### For production (Netlify):

1. Go to **Developers → Webhooks → Add endpoint**
2. URL: `https://your-site.netlify.app/api/stripe/webhook`
3. Select these events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Click **Add endpoint**
5. Copy the **Signing secret** → add to Netlify environment variables as `STRIPE_WEBHOOK_SECRET`

---

## 5. Add Environment Variables to Netlify

1. Go to your Netlify site → **Site configuration → Environment variables**
2. Add all 7 Stripe environment variables:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_PRICE_PRO_MONTHLY`
   - `STRIPE_PRICE_PRO_ANNUAL`
   - `STRIPE_PRICE_TRADER_MONTHLY`
   - `STRIPE_PRICE_TRADER_ANNUAL`
3. Trigger a redeploy (Deploys → Trigger deploy → Deploy site)

---

## 6. Test the Full Checkout Flow Locally

1. Make sure `stripe listen` is running (from Step 4)
2. Start the dev server: `npm run dev`
3. Go to http://localhost:3000/pricing
4. You should see a **yellow Test Mode banner** at the top
5. Click **Subscribe to Pro**
6. Sign in or create an account when prompted
7. In the Stripe checkout page, use test card:
   - **Card number:** `4242 4242 4242 4242`
   - **Expiry:** Any future date (e.g. `12/30`)
   - **CVC:** Any 3 digits (e.g. `123`)
   - **ZIP:** Any 5 digits (e.g. `10001`)
8. After paying, you'll be redirected back to `/pricing?success=true`
9. The green success modal should appear
10. Check Supabase → Table Editor → `user_tiers` — you should see a new row with `tier = 'pro'`

### Other test cards:
- `4000 0000 0000 9995` — Declined (insufficient funds)
- `4000 0025 0000 3155` — Requires 3D Secure authentication

---

## 7. Run the Database Migration

Before going live, run the migration in Supabase:

1. Go to https://app.supabase.com → Your project → **SQL Editor → New query**
2. Paste the contents of `scripts/migrations/session6-tiers.sql`
3. Click **Run**
4. Verify the `user_tiers` table appears in Table Editor

---

## 8. Go Live

1. In the Stripe dashboard, complete **Account activation** (business details, bank account)
2. Switch from test mode to live mode (toggle in top-left of dashboard)
3. Get your **live API keys** (they start with `sk_live_` and `pk_live_`)
4. Replace the test keys in Netlify environment variables with live keys
5. Create a second webhook endpoint pointing to your production URL using live mode
6. Replace price IDs with live price IDs (you need to re-create prices in live mode)
7. Redeploy

---

## Environment Variable Reference

| Variable | Where to get it |
|---|---|
| `STRIPE_SECRET_KEY` | Dashboard → Developers → API Keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Dashboard → Developers → Webhooks → endpoint detail |
| `STRIPE_PRICE_PRO_MONTHLY` | Dashboard → Catalog → Products → Pro → price detail |
| `STRIPE_PRICE_PRO_ANNUAL` | Dashboard → Catalog → Products → Pro → price detail |
| `STRIPE_PRICE_TRADER_MONTHLY` | Dashboard → Catalog → Products → Trader → price detail |
| `STRIPE_PRICE_TRADER_ANNUAL` | Dashboard → Catalog → Products → Trader → price detail |

---

## Pricing Reference

| Plan | Monthly | Annual |
|---|---|---|
| Pro | $49/mo | $490/yr (save 17%) |
| Trader | $149/mo | $1,490/yr (save 17%) |

---

## Troubleshooting

**"Stripe not configured" error on pricing page**
→ Check that `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are set and don't contain "PLACEHOLDER"

**Webhook returns 503**
→ Check that `STRIPE_WEBHOOK_SECRET` is set in `.env.local` / Netlify env vars

**user_tiers not updating after checkout**
→ Make sure `stripe listen` is running locally, or the Netlify webhook endpoint is configured in live/test mode matching your keys

**"No price ID configured" error**
→ Paste the `price_xxx` IDs from the Stripe dashboard into the env vars
