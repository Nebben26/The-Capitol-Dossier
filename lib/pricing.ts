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
  enterprise: {
    name: "Enterprise",
    price: 500,
    period: "month" as const,
    priceLabel: "$500",
    annualLabel: "$5,000/year (save $1,000)",
  },
} as const;
