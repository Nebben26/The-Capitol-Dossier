// ─── Causation Heuristic Engine ──────────────────────────────────────────────
// Pure heuristic rules. No ML, no external API calls.
// First matching rule wins.

export type CausationType =
  | "fee_differential"
  | "liquidity_gap"
  | "resolution_mismatch"
  | "user_base_bias"
  | "information_lag"
  | "structural_persistent"
  | "unknown";

export interface CausationAnalysis {
  primaryCause: CausationType;
  confidence: "high" | "medium" | "low";
  explanation: string;
  actionable: boolean;
}

export interface CausationInput {
  polymarketPrice: number;
  kalshiPrice: number;
  spread: number;
  polymarketVolume: number;
  kalshiVolume: number;
  daysToResolution: number | null;
  spreadAgeHours: number | null;
  convergenceVelocity: number | null;
  category: string;
  resolutionCriteriaDiffer: boolean | null;
}

export function analyzeCausation(input: CausationInput): CausationAnalysis {
  const {
    spread,
    polymarketVolume,
    kalshiVolume,
    spreadAgeHours,
    convergenceVelocity,
    category,
    resolutionCriteriaDiffer,
  } = input;

  // RULE 1 — Resolution Mismatch (highest priority)
  if (resolutionCriteriaDiffer === true) {
    return {
      primaryCause: "resolution_mismatch",
      confidence: "high",
      explanation:
        "Polymarket and Kalshi define this market differently. The spread may not be true arbitrage — verify resolution criteria before trading.",
      actionable: false,
    };
  }

  // RULE 2 — Information Lag
  if (
    spreadAgeHours !== null &&
    spreadAgeHours < 2 &&
    Math.abs(convergenceVelocity ?? 0) > 0.5
  ) {
    return {
      primaryCause: "information_lag",
      confidence: "high",
      explanation:
        "Recently appeared spread with active movement. One platform may be catching up to breaking news or a recent market event.",
      actionable: true,
    };
  }

  // RULE 3 — Liquidity Gap
  const safeMin = Math.max(Math.min(polymarketVolume, kalshiVolume), 1);
  const ratio = Math.max(polymarketVolume, kalshiVolume) / safeMin;
  if (ratio > 10) {
    const thinSide = polymarketVolume > kalshiVolume ? "Kalshi" : "Polymarket";
    return {
      primaryCause: "liquidity_gap",
      confidence: "high",
      explanation: `${thinSide} has dramatically lower volume on this market. The thinner book likely explains the price difference — watch for price correction on volume increases.`,
      actionable: true,
    };
  }
  if (ratio > 3) {
    return {
      primaryCause: "liquidity_gap",
      confidence: "medium",
      explanation:
        "Volume asymmetry between platforms may be driving the spread. The less-traded side is more likely to move.",
      actionable: true,
    };
  }

  // RULE 4 — Structural Persistent
  if (
    spreadAgeHours !== null &&
    spreadAgeHours > 168 &&
    Math.abs(convergenceVelocity ?? 0) < 0.1
  ) {
    return {
      primaryCause: "structural_persistent",
      confidence: "high",
      explanation:
        "This spread has persisted for 7+ days without meaningful convergence. Likely driven by fee differentials, user base differences, or resolution nuances — unlikely to be simple arbitrage.",
      actionable: false,
    };
  }

  // RULE 5 — User Base Bias
  const userBiasCategories = ["Sports", "Crypto"];
  if (
    userBiasCategories.includes(category) &&
    spread >= 4 &&
    spread <= 8 &&
    (spreadAgeHours === null || spreadAgeHours > 24)
  ) {
    return {
      primaryCause: "user_base_bias",
      confidence: "medium",
      explanation:
        "Persistent moderate spread in a category where user bases differ significantly. Polymarket users skew crypto-native; Kalshi users skew traditional finance. The spread may reflect real demographic differences in belief.",
      actionable: false,
    };
  }

  // RULE 6 — Fee Differential
  if (spread <= 3 && spreadAgeHours !== null && spreadAgeHours > 12) {
    return {
      primaryCause: "fee_differential",
      confidence: "medium",
      explanation:
        "Small persistent spread likely explained by platform fee structures. After accounting for Polymarket and Kalshi fees, this may not be profitable arbitrage.",
      actionable: false,
    };
  }

  // RULE 7 — Unknown (fallback)
  return {
    primaryCause: "unknown",
    confidence: "low",
    explanation:
      "Not enough data to classify this spread's cause. Monitor velocity and volume for clues.",
    actionable: true,
  };
}

export interface CausationDisplayMeta {
  label: string;
  color: string;
  icon: string;
}

export function getCausationLabel(type: CausationType): CausationDisplayMeta {
  switch (type) {
    case "fee_differential":
      return { label: "Fee Differential", color: "#8892b0", icon: "Percent" };
    case "liquidity_gap":
      return { label: "Liquidity Gap", color: "#f59e0b", icon: "Droplet" };
    case "resolution_mismatch":
      return { label: "Resolution Mismatch", color: "#ef4444", icon: "AlertTriangle" };
    case "user_base_bias":
      return { label: "User Base Bias", color: "#8b5cf6", icon: "Users" };
    case "information_lag":
      return { label: "Information Lag", color: "#22c55e", icon: "Zap" };
    case "structural_persistent":
      return { label: "Structural", color: "#6b7280", icon: "Lock" };
    case "unknown":
    default:
      return { label: "Unclassified", color: "#4a5168", icon: "HelpCircle" };
  }
}
