Read CLAUDE.md, rules.md, docs/API_REFERENCE.md, and docs/FRONTEND_CONTRACT.md first.

DAY 2: Add Kalshi markets and create unified market feed.

1. Add a new function `getKalshiMarkets()` in lib/api.ts:
   - Fetch from https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=200
   - Use CURSOR pagination (NOT offset). Save `cursor` from response, pass as param for next page. Stop when cursor is null/empty.
   - CRITICAL: Prices are dollar strings ("0.5600") — parseFloat() them
   - CRITICAL: `volume` is contract count — use `dollar_volume` for USD volume
   - Transform into Market type: probability = parseFloat(yes_bid), volume = dollar_volume, endDate = close_time, platform = "kalshi", url = `https://kalshi.com/markets/${ticker}`
   - Cache with 60-second TTL
   - Mock fallback on error

2. Update getAllMarkets() to:
   - Fetch Polymarket and Kalshi in parallel with Promise.all
   - Merge results into single array
   - Sort combined array by volume descending
   - Each market must have `platform` field set correctly

3. Verify /markets page shows markets from both platforms.
4. Verify /screener filters work on the combined feed.

5. Run `npm run build` and fix any errors.
6. Reply "Day 2 complete — Polymarket + Kalshi markets unified" after clean build.
