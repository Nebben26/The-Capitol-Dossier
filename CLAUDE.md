# Quiver Markets — Claude Code Project Bible

## What This Is
A Next.js 15 prediction market intelligence platform (the "Quiver Quant of prediction markets"). The frontend is 95% complete with 60 pages. **ALL remaining work is backend data pipeline** — replacing mock data with real API data.

## Critical Rules
1. **NEVER touch UI/styling unless explicitly asked.** The frontend is done.
2. **ALWAYS read `docs/API_REFERENCE.md` before writing any API integration code.** Every endpoint, response shape, rate limit, and gotcha is documented there. Do NOT guess at field names.
3. **ALWAYS read `docs/FRONTEND_CONTRACT.md` before changing any types.** It contains the exact TypeScript interfaces the frontend consumes. Your API transforms must output these shapes exactly.
4. **Keep mock data as fallback.** Every real API call must gracefully fall back to mock data on error. Never let the site break because an API is down.
5. **Use in-memory caching.** 60-second TTL for market data, 5-minute for whale/leaderboard data. Simple `Map<string, {data, timestamp}>` pattern.
6. **Static export constraint.** This project uses `output: "export"` for Netlify. All data fetching happens client-side in hooks/components. No server-side API routes. No `getServerSideProps`.
7. **Run `npm run build` after every change set** to catch errors before reporting done.

## Tech Stack
- **Framework:** Next.js 15 (App Router, static export)
- **UI:** shadcn/ui + Tailwind CSS + Lucide icons
- **Auth:** Supabase (placeholder env vars, basic setup in `lib/supabase.ts`)
- **State:** React hooks + context (AuthContext, DataSourceContext)
- **Data:** Currently `lib/mockData.ts` → migrating to real APIs via `lib/api.ts`

## Project Structure
```
src/
├── app/                    # All pages (60 total)
│   ├── page.tsx            # Homepage (Market Disagrees, hero gauge, treemap)
│   ├── markets/
│   │   ├── page.tsx        # Browse (grid+table toggle, filters, search)
│   │   └── [id]/page.tsx   # Detail (7 tabs: Overview, Chart, Whales, Cross-Platform, Orderbook, Resolution, Signals)
│   ├── whales/
│   │   ├── page.tsx        # Whale browse
│   │   └── [id]/page.tsx   # Whale profile (calibration charts, positions)
│   ├── leaderboard/        # Ranked traders
│   ├── strategies/         # Curated strategies + backtester
│   ├── alerts/             # 4-tab live feed
│   ├── disagrees/          # Cross-platform arbitrage scanner
│   ├── insights/           # News/catalyst feed
│   ├── screener/           # Advanced filtering
│   ├── calibration/        # Personal Brier score
│   ├── watchlist/          # Saved markets + whales
│   ├── widgets/            # Embeddable iframes
│   ├── pricing/            # Free vs Pro
│   └── api-docs/           # REST + WebSocket docs
├── components/
│   └── layout/
│       ├── AppShell.tsx     # Sidebar + Header wrapper
│       ├── Sidebar.tsx      # Collapsible nav
│       ├── Header.tsx       # Global search, Market Pulse, LIVE indicator
│       ├── AuthContext.tsx   # Supabase auth + Pro tier
│       └── DataSourceContext.tsx  # Live vs mock toggle
├── hooks/
│   ├── useData.ts           # React hooks with auto-refresh + mock fallback
│   └── usePersistence.ts    # Supabase + localStorage
└── lib/
    ├── api.ts               # ← PRIMARY FILE TO MODIFY. API integration layer.
    ├── mockData.ts           # Mock data (24 markets, 15 whales, etc.)
    └── supabase.ts           # Client setup
```

## The Data Pipeline Migration (What You're Building)

### Phase 1: Market Ingestion (Days 1-2)
Replace `mockData.ts` market arrays with real Polymarket + Kalshi data fetched in `api.ts`.

### Phase 2: Cross-Platform Intelligence (Day 3)
Fuzzy-match same questions across platforms. Compute real spreads for the Disagrees page.

### Phase 3: Whale Tracking (Day 4)
Replace fake whale profiles with real wallet data from Polymarket Data API.

### Phase 4: Price History (Day 5)
Replace generated sparklines with actual probability curves from CLOB API.

### Phase 5: Derived Intelligence (Day 6)
Spread convergence, whale accuracy on resolved markets, volume anomalies.

### Phase 6: Deploy + Polish (Day 7)
Final build, OG images, deploy.

## Common Gotchas
1. **Polymarket `outcomePrices` is a JSON string**, not an array. You must `JSON.parse()` it.
2. **Polymarket `outcomes` is also a JSON string.** Same treatment.
3. **Kalshi prices are dollar strings** like `"0.5600"`, not numbers. `parseFloat()` them.
4. **Kalshi uses cursor pagination**, not offset. Save `cursor` from response for next page.
5. **Polymarket Gamma API returns events with nested markets.** You want the markets inside each event, not the events themselves.
6. **Rate limits matter.** Gamma: 500 req/10s. CLOB: 1500 req/10s. Data API: 200 req/10s. Kalshi: 10 req/sec. Always cache aggressively.
7. **CORS:** These APIs allow browser requests. No proxy needed for client-side fetching.
8. **Volume fields:** Polymarket `volume` is lifetime USD volume as a number. Kalshi `volume` is contract count (multiply by 100 for rough USD equivalent, or use `dollar_volume`).
9. **The site is statically exported.** No API routes. All fetching is client-side via hooks.

## Design System (DO NOT CHANGE)
- Background: #1a1e2e | Cards: #222638 | Borders: #2f374f
- Primary accent: Teal #57D7BA
- Font: Inter + JetBrains Mono (tabular-nums for numbers)
