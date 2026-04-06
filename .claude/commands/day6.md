Read CLAUDE.md, rules.md, docs/API_REFERENCE.md, and docs/FRONTEND_CONTRACT.md first.

DAY 6: Build the intelligence layer that makes this Quiver, not just an aggregator.

1. Spread convergence analysis:
   - For each Disagreement, if we have spread history, compute:
     - convergenceRate: linear regression slope of spread over time (negative = converging)
     - avgTimeToConverge: mean days for spreads to close below 0.03
   - Add these to the Disagreement type and display on /disagrees page
   - If no historical data yet, compute from snapshots: store current spreads with timestamps in localStorage, compare on next load

2. Price mover alerts:
   - Compare current prices to cached previous prices (from 1 hour ago)
   - Flag markets where |currentPrice - previousPrice| > 0.05 (5%+ move)
   - Generate Alert objects with type "price_mover" and priceChange field
   - Populate /alerts Price Movers tab

3. Resolution-near alerts:
   - From market data, find markets where endDate is within 7 days
   - Generate Alert objects with type "resolution_near" and daysUntilClose
   - Populate /alerts Resolution Nearing tab

4. Volume anomaly detection:
   - For markets with price history, compute average daily volume
   - Flag markets where today's volume > 3x average
   - Display as a badge or indicator on market cards

5. Whale accuracy tracking:
   - For whale trades on markets that have since resolved:
     - Check if the whale's bet matched the resolution
     - Compute per-whale accuracy rate
     - Update winRate on Whale objects
   - Display on whale profiles

6. Run `npm run build` and fix any errors.
7. Reply "Day 6 complete — intelligence layer active" after clean build.
