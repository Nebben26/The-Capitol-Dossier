Read CLAUDE.md, rules.md, docs/API_REFERENCE.md, and docs/FRONTEND_CONTRACT.md first.

DAY 4: Replace mock whales with real Polymarket whale data.

IMPORTANT: The Data API rate limit is 200 req/10s. Cache aggressively. Do NOT make per-whale API calls in loops without caching.

1. Implement getWhales() in lib/api.ts:
   - Fetch leaderboard: GET https://data-api.polymarket.com/leaderboard (top traders by P&L)
   - Transform each entry into Whale type:
     - id = address, name = truncated address (0xabc...def), address = full address
     - totalPnl = parseFloat(pnl), portfolioValue = estimate from positions
     - rank from leaderboard position
     - platform = ["polymarket"]
   - Cache for 300 seconds (5 min)
   - Mock fallback on error

2. Implement getWhaleById(address) in lib/api.ts:
   - Fetch positions: GET https://data-api.polymarket.com/positions?user={address}
   - Fetch recent trades: GET https://data-api.polymarket.com/activity?user={address}
   - Build full Whale object with positions and recentTrades arrays
   - Cache per-whale data for 300 seconds

3. Implement whale alert detection:
   - Fetch recent large trades: GET https://data-api.polymarket.com/trades?limit=50
   - Filter for trades where parseFloat(size) > 10000 (>$10K = whale trade)
   - Transform into Alert objects with type "whale_trade"
   - Cache for 60 seconds

4. Update /whales page to use real data from getWhales().
5. Update /whales/[id] to use getWhaleById().
6. Update /alerts whale tab to use real whale alerts.
7. Update /leaderboard to use real leaderboard data.

8. Run `npm run build` and fix any errors.
9. Reply "Day 4 complete — real whale tracking live" after clean build.
