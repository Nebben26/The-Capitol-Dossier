"use client";

import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { canAccess, TIER_LABELS, TIER_COLORS, upgradeCta, type Tier } from "@/lib/tiers";

interface TierGateProps {
  /** The tier required to see the content */
  requiredTier: Tier;
  /** The user's current tier */
  userTier: Tier;
  /** Whether tier data is still loading */
  loading?: boolean;
  /** Content to show when access is granted */
  children: React.ReactNode;
  /** If true, render a full-page gate instead of an inline overlay */
  fullPage?: boolean;
  /** Optional custom title for the gate */
  title?: string;
  /** Optional custom description for the gate */
  description?: string;
}

/**
 * Wraps gated content. If the user's tier is insufficient, renders an upgrade
 * prompt instead. Works both as an overlay on top of blurred content or as a
 * full-page gate.
 */
export function TierGate({
  requiredTier,
  userTier,
  loading = false,
  children,
  fullPage = false,
  title,
  description,
}: TierGateProps) {
  if (loading) {
    // Render children blurred while we wait to avoid layout shift
    return (
      <div className="relative">
        <div className="blur-sm opacity-40 pointer-events-none select-none">{children}</div>
      </div>
    );
  }

  if (canAccess(userTier, requiredTier)) {
    return <>{children}</>;
  }

  const color = TIER_COLORS[requiredTier];
  const label = TIER_LABELS[requiredTier];
  const cta = upgradeCta(requiredTier);

  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center space-y-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Lock className="w-7 h-7" style={{ color }} />
        </div>
        <div className="space-y-2">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
            style={{ backgroundColor: `${color}10`, color, border: `1px solid ${color}20` }}
          >
            <Sparkles className="w-3 h-3" />
            {label} Feature
          </div>
          <h2 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">
            {title ?? `${label} required`}
          </h2>
          <p className="text-sm text-[#8d96a0] leading-relaxed max-w-md mx-auto">
            {description ??
              `This feature is available on the ${label} plan and above. Upgrade to unlock it.`}
          </p>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-[#0d1117] transition-all active:scale-[0.97] shadow-lg"
          style={{ backgroundColor: color }}
        >
          <Sparkles className="w-4 h-4" />
          {cta}
        </Link>
        <Link href="/pricing" className="text-xs text-[#484f58] hover:text-[#8d96a0] transition-colors">
          View all plans →
        </Link>
      </div>
    );
  }

  // Inline overlay: show blurred children with a centered unlock prompt
  return (
    <div className="relative">
      <div className="blur-sm opacity-40 pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-2xl shadow-2xl p-6 text-center space-y-3 mx-4 max-w-sm w-full"
          style={{
            backgroundColor: "#161b27",
            border: `1px solid ${color}30`,
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
            style={{ backgroundColor: `${color}15`, border: `1px solid ${color}25` }}
          >
            <Lock className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <div
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest mb-2"
              style={{ backgroundColor: `${color}10`, color, border: `1px solid ${color}20` }}
            >
              <Sparkles className="w-2.5 h-2.5" />
              {label}
            </div>
            <h3 className="text-sm font-bold text-[#f0f6fc]">
              {title ?? `${label} feature`}
            </h3>
            <p className="text-xs text-[#8d96a0] mt-1 leading-relaxed">
              {description ?? `Upgrade to ${label} to unlock this.`}
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-[#0d1117] transition-all active:scale-[0.97]"
            style={{ backgroundColor: color }}
          >
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
