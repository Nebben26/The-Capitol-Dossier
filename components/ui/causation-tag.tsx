"use client";

import {
  Percent,
  Droplet,
  AlertTriangle,
  Users,
  Zap,
  Lock,
  HelpCircle,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CausationAnalysis, CausationType } from "@/lib/causation";
import { getCausationLabel } from "@/lib/causation";

// Static icon map to avoid dynamic import
const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Percent,
  Droplet,
  AlertTriangle,
  Users,
  Zap,
  Lock,
  HelpCircle,
};

export interface CausationTagProps {
  analysis: CausationAnalysis;
  compact?: boolean;
  showExplanation?: boolean;
}

export function CausationTag({
  analysis,
  compact = false,
  showExplanation = false,
}: CausationTagProps) {
  const meta = getCausationLabel(analysis.primaryCause);
  const Icon = ICON_MAP[meta.icon] ?? HelpCircle;

  const sizeClass = compact
    ? "text-[9px] px-1.5 py-0.5 gap-0.5"
    : "text-[10px] px-2 py-0.5 gap-1";

  const dimClass = analysis.confidence === "low" ? "opacity-60" : "";

  const pill = (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${sizeClass} ${dimClass}`}
      style={{
        backgroundColor: `${meta.color}1a`,
        color: meta.color,
        border: `1px solid ${meta.color}33`,
      }}
    >
      <Icon className={compact ? "size-2.5 shrink-0" : "size-3 shrink-0"} />
      {meta.label}
    </span>
  );

  const tooltipText = `${analysis.explanation}\n\nConfidence: ${analysis.confidence}`;

  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <Tooltip>
        <TooltipTrigger>
          {pill}
        </TooltipTrigger>
        <TooltipContent className="max-w-[240px] text-[11px] whitespace-pre-line">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
      {showExplanation && (
        <span className="text-[9px] text-[#8892b0] italic leading-snug max-w-[200px]">
          {analysis.explanation}
        </span>
      )}
      {!analysis.actionable && !compact && (
        <span className="text-[8px] text-[#6b7280] font-medium">Structural — less exploitable</span>
      )}
    </div>
  );
}
