"use client";

import Link from "next/link";
import { Crown, Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/layout/AuthContext";

/** Small inline "PRO" badge */
export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[7px] font-bold ${className}`}>
      <Crown className="size-2" />PRO
    </span>
  );
}

/** Trial banner shown at top of gated pages */
export function TrialBanner() {
  const { isPro, trialDaysLeft, user, setShowLogin, startTrial } = useAuth();

  if (isPro && trialDaysLeft !== null && trialDaysLeft > 0) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg text-xs">
        <Crown className="size-3.5 text-[#f59e0b]" />
        <span className="text-[#f59e0b] font-semibold">Pro Trial — {trialDaysLeft} days left</span>
        <span className="text-[#8892b0] ml-2">Pro coming soon</span>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#222638] border border-[#2f374f] rounded-lg">
        <div className="flex items-center gap-2">
          <Lock className="size-3.5 text-[#8892b0]" />
          <span className="text-xs text-[#8892b0]">This feature requires <span className="text-[#f59e0b] font-semibold">Pro</span></span>
        </div>
        {user ? (
          <Button onClick={startTrial} size="xs" className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 gap-1">
            <Zap className="size-3" />Start Free Trial
          </Button>
        ) : (
          <Button onClick={() => setShowLogin(true)} size="xs" className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 gap-1">
            Sign In to Try Pro
          </Button>
        )}
      </div>
    );
  }

  return null;
}

/** Overlay gate for locked content sections */
export function ProGate({ children, feature }: { children: React.ReactNode; feature: string }) {
  const { isPro, user, setShowLogin, startTrial } = useAuth();

  if (isPro) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-[#1a1e2e]/60 backdrop-blur-sm rounded-xl">
        <div className="text-center space-y-3 p-6 max-w-xs">
          <div className="size-12 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center mx-auto">
            <Lock className="size-6 text-[#f59e0b]" />
          </div>
          <h3 className="text-sm font-bold">{feature}</h3>
          <p className="text-[10px] text-[#8892b0]">Upgrade to Pro to unlock this feature</p>
          {user ? (
            <Button onClick={startTrial} size="sm" className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 gap-1.5 w-full">
              <Zap className="size-3.5" />Start 14-Day Free Trial
            </Button>
          ) : (
            <Button onClick={() => setShowLogin(true)} size="sm" className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 gap-1.5 w-full">
              Sign In to Try Pro
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Upgrade CTA for sidebar */
export function SidebarUpgradeCard() {
  const { isPro, trialDaysLeft, startTrial, user, setShowLogin } = useAuth();

  if (isPro && trialDaysLeft !== null && trialDaysLeft > 0) {
    return (
      <div className="p-3 rounded-xl bg-[#222638] border border-[#f59e0b]/20">
        <div className="flex items-center gap-2 mb-1">
          <Crown className="size-3.5 text-[#f59e0b]" />
          <span className="text-xs font-semibold text-[#f59e0b]">Pro Trial</span>
        </div>
        <p className="text-[10px] text-[#8892b0] mb-2">{trialDaysLeft} days remaining</p>
        <Button disabled className="w-full h-7 text-xs bg-[#f59e0b]/50 text-[#0f1119] cursor-not-allowed">Pro Coming Soon</Button>
      </div>
    );
  }

  if (isPro) {
    return (
      <div className="p-3 rounded-xl bg-[#222638] border border-[#57D7BA]/20">
        <div className="flex items-center gap-2">
          <Crown className="size-3.5 text-[#57D7BA]" />
          <span className="text-xs font-semibold text-[#57D7BA]">Pro Active</span>
        </div>
        <p className="text-[10px] text-[#8892b0] mt-1">Full access to all features</p>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl bg-[#222638] border border-[#2f374f]">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="size-3.5 text-[#57D7BA]" />
        <span className="text-xs font-medium">Unlock Pro</span>
      </div>
      <p className="text-[10px] text-[#8892b0] leading-relaxed mb-2">Real-time alerts, full API, advanced calibration & more.</p>
      {user ? (
        <Button onClick={startTrial} className="w-full h-7 text-xs bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80">Start Free Trial</Button>
      ) : (
        <Button onClick={() => setShowLogin(true)} className="w-full h-7 text-xs bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80">Sign In</Button>
      )}
    </div>
  );
}
