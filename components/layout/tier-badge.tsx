"use client";

import { TIER_LABELS, TIER_COLORS, type Tier } from "@/lib/tiers";

interface TierBadgeProps {
  tier: Tier;
  size?: "xs" | "sm";
  className?: string;
}

/**
 * Small inline badge showing the user's current tier.
 * Used in the header, settings page, etc.
 */
export function TierBadge({ tier, size = "xs", className = "" }: TierBadgeProps) {
  if (tier === "free") return null; // Free users get no badge

  const color = TIER_COLORS[tier];
  const label = TIER_LABELS[tier];

  const sizeClass = size === "sm"
    ? "px-2.5 py-1 text-[11px]"
    : "px-2 py-0.5 text-[9px]";

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full ${sizeClass} ${className}`}
      style={{
        backgroundColor: `${color}18`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {label}
    </span>
  );
}
