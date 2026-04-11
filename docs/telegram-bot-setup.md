# Telegram Bot Setup Guide

This guide walks through creating the Quiver Markets Telegram bot in BotFather before the code can receive messages.

---

## Step 1: Create the Bot in BotFather

1. Open Telegram and search for **@BotFather** (the official Telegram bot for creating bots)
2. Start a chat and send: `/newbot`
3. BotFather will ask for a **display name** — enter: `Quiver Markets Alerts`
4. BotFather will ask for a **username** (must end in `bot`) — try: `quivermarkets_bot`
   - If taken, try `quivermarkets_alerts_bot` or `quiver_alerts_bot`
5. BotFather will reply with a **bot token** that looks like: `7234567890:AAF_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
6. **Copy and save this token** — you'll need it in steps below.

---

## Step 2: Configure Bot Metadata

Send these commands to BotFather after creating the bot:

### Set description (shown before user starts the bot)
```
/setdescription
@quivermarkets_bot
Real-time alerts for prediction market arbitrage and whale activity. Visit quivermarkets.com/settings/telegram to subscribe.
```

### Set about text (shown in the bot's profile)
```
/setabouttext
@quivermarkets_bot
Get instant push notifications when cross-platform arbitrage spreads open or whale wallets take significant positions. Powered by Quiver Markets.
```

### Set profile picture
- Download or screenshot the Quiver Markets logo
- Send: `/setuserpic`
- Select the bot: `@quivermarkets_bot`
- Send the image

### Set bot commands (enables autocomplete in Telegram)
```
/setcommands
@quivermarkets_bot
start - Link your account and start receiving alerts
status - View your alert subscription status
pause - Pause alerts (1h, 1d, or forever)
resume - Resume paused alerts
settings - Open web settings
help - Show available commands
```

---

## Step 3: Add Environment Variables

### In `.env.local` (local development)
```env
TELEGRAM_BOT_TOKEN=7234567890:AAF_your_actual_token_here
TELEGRAM_WEBHOOK_SECRET=459f0708163ee8d6b8bf99d48568c36ee713531aa91cf9e89d29c183a181cd91
TELEGRAM_BOT_USERNAME=quivermarkets_bot
```

Replace the token with the one BotFather gave you. The webhook secret above is pre-generated — use the same value in Netlify.

### In Netlify environment variables
Go to: Netlify Dashboard → Site → Site configuration → Environment variables

Add the same three variables:
- `TELEGRAM_BOT_TOKEN` = your token from BotFather
- `TELEGRAM_WEBHOOK_SECRET` = `459f0708163ee8d6b8bf99d48568c36ee713531aa91cf9e89d29c183a181cd91`
- `TELEGRAM_BOT_USERNAME` = `quivermarkets_bot` (or whatever username you got)

---

## Step 4: Register the Webhook After Deploying

After the site is deployed with the new env vars, register the webhook URL with Telegram. Run this curl command once:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://amazing-kitsune-139d51.netlify.app/api/telegram/webhook",
    "secret_token": "459f0708163ee8d6b8bf99d48568c36ee713531aa91cf9e89d29c183a181cd91",
    "allowed_updates": ["message", "callback_query"]
  }'
```

Expected response: `{"ok":true,"result":true,"description":"Webhook was set"}`

### Verify the webhook is set
```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"
```

---

## Step 5: Run the Database Migration

In Supabase SQL Editor (Dashboard → SQL Editor → New query):
- Paste the contents of `scripts/migrations/session18-telegram.sql`
- Click **Run**

---

## Step 6: Test the Full Flow

1. Message your bot `/start` — should get a welcome message
2. Log into quivermarkets.com, go to `/settings/telegram`
3. Click "Generate connection link"
4. Click the generated link — Telegram should open with a `/start <token>` pre-filled
5. Tap **Start** in Telegram
6. Should receive "Linked successfully!" message
7. Go back to the settings page — should now show "Connected as @your_username"
8. Wait for the next ingestion run (or trigger manually) — you should receive spread alerts

---

## Troubleshooting

| Problem | Check |
|---------|-------|
| Bot doesn't respond | Webhook not registered, or `TELEGRAM_BOT_TOKEN` wrong in Netlify |
| "Unauthorized" on webhook hits | `TELEGRAM_WEBHOOK_SECRET` mismatch between Netlify and curl command |
| Link generation fails | `SUPABASE_SERVICE_ROLE_KEY` missing or `telegram_subscribers` table not created |
| "Invalid or expired link" | Token expired (15 min TTL) — generate a new one |
| No alerts arriving | Check ingestion logs; check that `alert_arb_spreads=true` and `active=true` in DB |

---

## Architecture Notes

- Telegram pushes updates to `/api/telegram/webhook` (webhook mode, not polling)
- The webhook is verified by comparing `x-telegram-bot-api-secret-token` header against `TELEGRAM_WEBHOOK_SECRET`
- Users link via a 15-minute one-time token (`/api/telegram/link` → `telegram_subscribers.link_token`)
- Alert dispatch happens inside `lib/telegram-dispatcher.ts`, called from `scripts/ingest.ts`
- Daily limit: 20 alerts per subscriber per day (configurable per subscriber in the DB)
