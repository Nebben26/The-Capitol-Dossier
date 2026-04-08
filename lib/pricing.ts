/**
 * Single source of truth for all tier pricing.
 * Import from here instead of hardcoding prices in pages.
 */
export const PRICING = {
  free: {
    name: "Free",
    price: 0,
    period: "forever" as const,
    priceLabel: "$0",
  },
  pro: {
    name: "Pro",
    price: 60,
    period: "month" as const,
    priceLabel: "$60",
    annualLabel: "$600/year (save $120)",
  },
  starterApi: {
    name: "Starter API",
    price: 150,
    period: "month" as const,
    priceLabel: "$150",
    annualLabel: "$1,500/year (save $300)",
  },
  quantApi: {
    name: "Quant API",
    price: 500,
    period: "month" as const,
    priceLabel: "$500",
    annualLabel: "$5,000/year (save $1,000)",
  },
  premium: {
    name: "Premium",
    price: 1500,
    period: "month" as const,
    priceLabel: "$1,500",
    annualLabel: "Custom billing",
  },
} as const;
