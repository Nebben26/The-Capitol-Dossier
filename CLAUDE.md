# PROJECT RULES - Quiver Quant for Prediction Markets (2026)

## Core Aesthetic (exact Quiver match + upgrade)
- Dark navy/charcoal background (#121212 → #1a1e2e)
- Primary accent: Teal #57D7BA (links, positive, active tabs, charts)
- Cards: #222638 with subtle borders
- Use shadcn/ui components ONLY (Tailwind + Radix)
- Every entity (market, whale wallet, contract) MUST be clickable and cross-link
- Dark theme everywhere, responsive, mobile-first

## Tech Stack (never deviate)
- Next.js 15 App Router + Server Components
- TypeScript
- Tailwind + shadcn/ui
- Supabase (Postgres + Auth + Realtime)
- TanStack Query + Recharts (or Tremor for dashboards)
- Deploy to Vercel

## Development Workflow
1. Always start with a detailed plan.md
2. Use /frontend-design skill for any new page
3. After changes: run dev server → ask Claude Chrome to verify UI
4. Every table must be sortable/paginated (use TanStack Table)
5. Cross-link everything (market page ↔ whale profile ↔ related contracts)
