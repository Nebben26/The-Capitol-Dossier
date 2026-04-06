Read CLAUDE.md and rules.md first.

DAY 7: Final deploy, OG images, and viral sharing polish.

1. OG Image generation:
   - Create a simple OG image template using @vercel/og or a static SVG template
   - For market share cards: show market title, current probability, platform logos, spread if cross-platform
   - Set proper og:image meta tags on market detail pages
   - Fallback: create a single static OG image for the site (dark background, Quiver Markets logo/name, tagline)

2. SEO and meta tags:
   - Ensure every page has proper <title>, <meta description>
   - Market detail pages: dynamic titles like "Trump Wins 2024 | 62% | Quiver Markets"
   - Add structured data (JSON-LD) for market pages if time permits

3. Share card polish:
   - Verify ShareCardButton generates clean links with OG previews
   - Test Telegram and X share flows
   - Ensure embed widgets render correctly at /embed/* routes

4. Error states:
   - Add user-friendly error messages when APIs fail (not blank pages)
   - Add "Data from Polymarket & Kalshi" attribution footer
   - Add "Last updated X seconds ago" that reflects real cache age

5. Final build and deploy:
   - Run `npm run build` — fix ALL warnings and errors
   - Test all 60 pages render (at least spot-check key pages)
   - Deploy to Netlify: `npx netlify deploy --prod --dir=out`
   - Verify deployed site loads real data

6. Reply "Day 7 complete — Quiver Markets is live" after successful deploy.
