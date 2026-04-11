/**
 * Single source of truth for all tier pricing.
 * Every page that displays prices MUST import from here.
 * Never hardcode prices in UI components.
 */

export const PRICING = {
  free: {
    name: "Free",
    slug: "free",
    price: 0,
    annualPrice: 0,
    description: "Get started with basic prediction market data",
    tagline: "Free forever",
    cta: "Sign up",
    features: [
      "Live market data from Polymarket and Kalshi",
      "Basic screener with category filters",
      "Daily Morning Brief email",
      "Top 10 whale leaderboard",
      "Public methodology and changelog",
    ],
    limits: [
      "No real-time alerts",
      "Limited historical data",
      "No CSV export",
    ],
  },
  pro: {
    name: "Pro",
    slug: "pro",
    price: 49,
    annualPrice: 490,
    description: "For active prediction market traders",
    tagline: "Most popular",
    cta: "Upgrade to Pro",
    badge: "MOST POPULAR",
    features: [
      "Everything in Free",
      "Full screener with advanced filters",
      "All 200+ tracked whale wallets",
      "AI Market Thesis on every market",
      "CSV export and saved searches",
      "Custom alert rules in the app",
      "Watchlists and followed whales",
      "Full historical data access",
    ],
  },
  trader: {
    name: "Trader",
    slug: "trader",
    price: 149,
    annualPrice: 1490,
    description: "Advanced analytics for serious bettors",
    tagline: "For power users",
    cta: "Upgrade to Trader",
    features: [
      "Everything in Pro",
      "Smart Money Watch — track multiple whales",
      "Smart Money Flow — capital movement by category",
      "Pattern detection signals",
      "Disagreement archive with conversion stats",
      "Calibration tracking and Brier scores",
      "Priority email support",
    ],
  },
  signal_desk: {
    name: "Signal Desk",
    slug: "signal_desk",
    price: 199,
    annualPrice: 1990,
    description: "Real-time push alerts for traders who deploy capital",
    tagline: "Built for action",
    cta: "Upgrade to Signal Desk",
    badge: "NEW",
    founderPrice: 149,
    founderSpots: 25,
    features: [
      "Everything in Trader",
      "Real-time Telegram push alerts",
      "Configurable spread thresholds (3–30pt)",
      "Whale position alerts ($10K–$500K)",
      "Category-specific filters",
      "Up to 50 alerts per day",
      "Private Discord/Telegram community access",
      "Weekly recap PDF with closed arbitrage performance",
    ],
  },
  quant: {
    name: "Quant API",
    slug: "quant",
    price: 399,
    annualPrice: 3990,
    description: "Raw API access for quant funds and trading firms",
    tagline: "For institutions",
    cta: "Contact sales",
    features: [
      "Everything in Signal Desk",
      "Full REST and WebSocket API access",
      "Real-time market data feed",
      "Historical data exports (CSV, JSON)",
      "Custom webhook integrations",
      "Higher rate limits (10K req/day)",
      "SLA and dedicated support",
      "Custom data pipelines on request",
    ],
  },
} as const;

export const FOUNDER_COHORT = {
  active: true,
  pro: {
    cohortPrice: 39,
    regularPrice: 49,
    description: "Pro founder pricing — locked in for life",
  },
  signal_desk: {
    cohortPrice: 149,
    regularPrice: 199,
    spots: 25,
    description: "Signal Desk founder pricing — first 25 customers only",
  },
};

export const TIER_ORDER = ["free", "pro", "trader", "signal_desk", "quant"] as const;
export type TierSlug = (typeof TIER_ORDER)[number];

export function getTier(slug: TierSlug) {
  return PRICING[slug];
}
