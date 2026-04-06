Read CLAUDE.md, rules.md, docs/API_REFERENCE.md, and docs/FRONTEND_CONTRACT.md first.

DAY 5: Replace generated sparklines with real probability curves.

1. Implement getMarketPriceHistory(tokenId: string) in lib/api.ts:
   - Fetch from: GET https://clob.polymarket.com/prices-history?market={tokenId}&interval=max&fidelity=60
   - CRITICAL: The `market` param takes the clobTokenId (from Gamma API clobTokenIds field, JSON.parse it first), NOT the condition ID
   - Transform response: history array of {t: number, p: string} → {t: number * 1000, p: parseFloat(p)}
   - t is Unix SECONDS in the response — multiply by 1000 for JavaScript milliseconds
   - p is a STRING — parseFloat() it
   - Cache for 600 seconds (10 min) per token
   - Return empty array on error (don't break the chart)

2. Update getMarketById(id) to also fetch price history:
   - Look up the market's clobTokenIds from the market data
   - Fetch price history for the Yes token (clobTokenIds[0])
   - Attach as market.priceHistory

3. For Kalshi price history:
   - Fetch from: GET https://api.elections.kalshi.com/trade-api/v2/markets/{ticker}/history?limit=100
   - Transform: {yes_price: string, ts: number} → {t: ts * 1000, p: parseFloat(yes_price)}
   - Cache for 600 seconds

4. Update /markets/[id] Chart tab to display real price history data.
5. Update any sparkline components on /markets browse and Homepage to use real mini-charts (fetch price history for top 20 markets only to avoid rate limits).

6. Run `npm run build` and fix any errors.
7. Reply "Day 5 complete — real price history charts live" after clean build.
