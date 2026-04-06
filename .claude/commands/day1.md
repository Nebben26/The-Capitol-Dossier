Read CLAUDE.md, rules.md, docs/API_REFERENCE.md, and docs/FRONTEND_CONTRACT.md first. Understand every field mapping before writing code.

DAY 1: Replace all mock market data with real Polymarket Gamma API data.

1. Update lib/api.ts — rewrite getAllMarkets() to:
   - Fetch from https://gamma-api.polymarket.com/events?active=true&closed=false&limit=100&offset=0
   - Paginate through ALL active events (increment offset by 100 until empty response, cap at 1000 total markets)
   - For each event, extract nested markets. CRITICAL: `outcomes`, `outcomePrices`, and `clobTokenIds` are JSON STRINGS — you must JSON.parse() them
   - Transform each into the exact Market type shape (see FRONTEND_CONTRACT.md)
   - Set platform to "polymarket"
   - Set url to `https://polymarket.com/event/${event.slug}`
   - Sort by volume descending
   - Cache results with 60-second TTL using the cachedFetch pattern from API_REFERENCE.md
   - Keep mock data as fallback on any error — wrap entire function in try-catch

2. Update the Market type in lib/mockData.ts if needed to accommodate real Polymarket fields (slug, clobTokenIds, platform). Add as OPTIONAL fields only.

3. Update useMarkets() hook to show real market count in the UI (not hardcoded "24 active markets").

4. Run `npm run build` and fix any errors.

5. Reply with "Day 1 complete — real Polymarket markets flowing into all pages" only after a clean build.
