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
    price: 49,
    period: "month" as const,
    priceLabel: "$49",
    annualLabel: "$490/year (save $98)",
  },
  trader: {
    name: "Trader",
    price: 149,
    period: "month" as const,
    priceLabel: "$149",
    annualLabel: "$1,490/year (save $298)",
  },
  quant: {
    name: "Quant API",
    price: 299,
    period: "month" as const,
    priceLabel: "$299",
    annualLabel: "$2,990/year (save $598)",
  },
} as const;
