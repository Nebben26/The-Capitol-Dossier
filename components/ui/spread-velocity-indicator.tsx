"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getSpreadSnapshots, calculateSpreadVelocity } from "@/lib/api";
import type { SpreadVelocity } from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface SpreadVelocityIndicatorProps {
  marketId: string;
  compact?: boolean;
}

export function SpreadVelocityIndicator({ marketId, compact = false }: SpreadVelocityIndicatorProps) {
  const [velocity, setVelocity] = useState<SpreadVelocity | null>(null);
  const [loaded, setLoaded]     = useState(false);

  useEffect(() => {
    getSpreadSnapshots(marketId, 24).then((snapshots) => {
      setVelocity(calculateSpreadVelocity(snapshots, 4));
      setLoaded(true);
    });
  }, [marketId]);

  if (!loaded || velocity === null) {
    return compact ? <span className="text-[9px] text-[#8892b0] font-mono">—</span> : null;
  }

  const { direction, changeInCents, changeOverHours, confidence } = velocity;

  const color  = direction === "widening" ? "#ef4444" : direction === "narrowing" ? "#22c55e" : "#8892b0";
  const Icon   = direction === "widening" ? TrendingUp : direction === "narrowing" ? TrendingDown : Minus;
  const sign   = changeInCents > 0 ? "+" : "";
  const label  = direction === "widening"
    ? `↑ Widening ${sign}${changeInCents}¢ in ${changeOverHours}h`
    : direction === "narrowing"
      ? `↓ Narrowing ${changeInCents}¢ in ${changeOverHours}h`
      : "↔ Stable";

  const inner = compact ? (
    <span className="font-mono text-[9px] tabular-nums" style={{ color }}>{label}</span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color }}>
      <Icon className="size-3 shrink-0" />
      {label}
    </span>
  );

  if (confidence === "low") {
    return (
      <Tooltip>
        <TooltipTrigger>
          <span className="opacity-70">{inner}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px] text-[11px]">
          Low confidence — only 2 data points available in the 4-hour window. Velocity will be more reliable as data accumulates.
        </TooltipContent>
      </Tooltip>
    );
  }

  return inner;
}
