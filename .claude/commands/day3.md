Read CLAUDE.md, rules.md, docs/API_REFERENCE.md, and docs/FRONTEND_CONTRACT.md first.

DAY 3: Build cross-platform matching engine for real Disagrees page.

1. Install string-similarity: `npm install string-similarity`

2. Create a new function `matchCrossPlatform(polymarkets: Market[], kalshiMarkets: Market[]): Disagreement[]` in lib/api.ts:
   - Normalize all titles: lowercase, remove "will ", "?", punctuation
   - For each Polymarket market, find best Kalshi match using string-similarity's `findBestMatch()`
   - Threshold: only accept matches with rating > 0.65
   - For each match, create a Disagreement object:
     - title: the Polymarket title (usually more descriptive)
     - platforms: array with both platform entries (name, probability, volume, url, marketId)
     - spread: Math.abs(polymarket.probability - kalshi.probability)
   - Sort by spread descending (biggest disagreements first)
   - Filter out spreads < 0.02 (noise)

3. Implement getDisagreements() to:
   - Call getAllMarkets() (which now returns both platforms)
   - Split by platform
   - Run matchCrossPlatform()
   - Cache result for 120 seconds

4. Update the /disagrees page to call getDisagreements() instead of using mock data.

5. Update the Homepage "Market Disagrees" section to use real disagreements.

6. Run `npm run build` and fix any errors.
7. Reply "Day 3 complete — real cross-platform spreads on Disagrees page" after clean build.
