// ─── Tier system ─────────────────────────────────────────────────────────────
// Defines the 5 subscription tiers, their display labels/colors, and access helpers.

export type Tier = "free" | "pro" | "trader" | "signal_desk" | "quant";

/** Display labels for each tier */
export const TIER_LABELS: Record<Tier, string> = {
  free:        "Free",
  pro:         "Pro",
  trader:      "Trader",
  signal_desk: "Signal Desk",
  quant:       "Quant API",
};

/** Brand colors for each tier */
export const TIER_COLORS: Record<Tier, string> = {
  free:        "#8d96a0",
  pro:         "#57D7BA",
  trader:      "#f59e0b",
  signal_desk: "#d29922",
  quant:       "#8b5cf6",
};

/** Numeric rank — higher is better access */
const TIER_RANK: Record<Tier, number> = {
  free:        0,
  pro:         1,
  trader:      2,
  signal_desk: 3,
  quant:       4,
};

/**
 * Returns true if `userTier` has access to a feature that requires `requiredTier`.
 * e.g. canAccess("pro", "pro") → true
 *      canAccess("free", "pro") → false
 *      canAccess("trader", "pro") → true  (trader ≥ pro)
 */
export function canAccess(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[requiredTier];
}

/** Short upgrade CTA label based on required tier */
export function upgradeCta(requiredTier: Tier): string {
  switch (requiredTier) {
    case "pro":         return "Upgrade to Pro";
    case "trader":      return "Upgrade to Trader";
    case "signal_desk": return "Upgrade to Signal Desk";
    case "quant":       return "Get Quant API";
    default:            return "Upgrade";
  }
}
