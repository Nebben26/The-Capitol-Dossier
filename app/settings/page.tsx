"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useUserTier } from "@/hooks/useUserTier";
import { TIER_LABELS, TIER_COLORS } from "@/lib/tiers";
import { TierBadge } from "@/components/layout/tier-badge";
import { CreditCard, User, LogOut, ExternalLink, Settings, Send, Wallet, Target } from "lucide-react";
import { trackEvent, resetAnalytics, AnalyticsEvents } from "@/lib/analytics";
import { useRouter } from "next/navigation";
import { TestModeBanner } from "@/components/ui/test-mode-banner";
import Link from "next/link";

export default function SettingsPage() {
  const { tier, loading } = useUserTier();
  const [user, setUser] = useState<any>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handlePortal = async () => {
    if (!user) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Could not open billing portal. Please try again.");
        setPortalLoading(false);
      }
    } catch (err: any) {
      alert(err.message || "Could not open billing portal.");
      setPortalLoading(false);
    }
  };

  const handleSignOut = async () => {
    trackEvent(AnalyticsEvents.SIGN_OUT);
    resetAnalytics();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-[#161b27] border border-[#21262d] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
        <h1 className="text-2xl font-bold text-[#f0f6fc]">Settings</h1>
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-6 text-center space-y-3">
          <p className="text-sm text-[#8d96a0]">Sign in to manage your account and subscription.</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-[#57D7BA] text-[#0d1117] text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#57D7BA]/90 transition-all"
          >
            Sign in / Sign up
          </Link>
        </div>
      </div>
    );
  }

  const tierColor = TIER_COLORS[tier];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <TestModeBanner />

      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#57D7BA]/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-[#57D7BA]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">Settings</h1>
          <p className="text-xs text-[#8d96a0]">Manage your account and subscription.</p>
        </div>
      </div>

      {/* Account card */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#57D7BA]/10 flex items-center justify-center">
            <User className="w-4 h-4 text-[#57D7BA]" />
          </div>
          <h2 className="text-sm font-semibold text-[#f0f6fc]">Account</h2>
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Email</div>
          <div className="text-sm text-[#f0f6fc]">{user.email}</div>
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Member since</div>
          <div className="text-sm text-[#8d96a0]">
            {user.created_at
              ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
              : "—"}
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 bg-[#0d1117] border border-[#21262d] text-[#f85149] hover:border-[#f85149]/30 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      {/* Subscription card */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${tierColor}15` }}>
            <CreditCard className="w-4 h-4" style={{ color: tierColor }} />
          </div>
          <h2 className="text-sm font-semibold text-[#f0f6fc]">Subscription</h2>
        </div>

        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Current Plan</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-bold" style={{ color: tierColor }}>
              {TIER_LABELS[tier]}
            </span>
            <TierBadge tier={tier} size="xs" />
          </div>
        </div>

        {tier === "free" ? (
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-[#57D7BA] text-[#0d1117] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#57D7BA]/90 transition-all active:scale-[0.97]"
          >
            Upgrade to Pro
          </Link>
        ) : (
          <button
            onClick={handlePortal}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 bg-[#0d1117] border border-[#21262d] text-[#f0f6fc] hover:border-[#57D7BA]/40 text-xs font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-60"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {portalLoading ? "Loading..." : "Manage Subscription"}
          </button>
        )}

        {tier === "free" && (
          <p className="text-[11px] text-[#484f58] leading-relaxed">
            Upgrade to Pro for full AI theses, spread history, and CSV export. Cancel anytime.
          </p>
        )}
      </div>

      {/* Public prediction profile card */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#57D7BA]/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-[#57D7BA]" />
          </div>
          <h2 className="text-sm font-semibold text-[#f0f6fc]">My Prediction Profile</h2>
        </div>

        <p className="text-xs text-[#8d96a0] leading-relaxed">
          Build a verifiable public track record. Log your market calls, track your accuracy and
          Brier score, and share your profile page as social proof.
        </p>

        <Link
          href="/profile/claim"
          className="inline-flex items-center gap-2 bg-[#57D7BA]/10 border border-[#57D7BA]/30 text-[#57D7BA] hover:bg-[#57D7BA]/20 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Target className="w-3.5 h-3.5" />
          Claim or edit your profile
        </Link>
      </div>

      {/* My Quiver portfolio card */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#57D7BA]/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-[#57D7BA]" />
          </div>
          <h2 className="text-sm font-semibold text-[#f0f6fc]">My Quiver</h2>
          <span className="text-[8px] font-bold uppercase tracking-widest text-[#57D7BA] bg-[#57D7BA]/10 border border-[#57D7BA]/20 px-1.5 py-0.5 rounded-full">NEW</span>
        </div>

        <p className="text-xs text-[#8d96a0] leading-relaxed">
          Connect your Polymarket wallet to track your positions, monitor P&amp;L, and
          cross-reference your trades with whale activity and arbitrage data. Free for all users.
        </p>

        <Link
          href="/my"
          className="inline-flex items-center gap-2 bg-[#57D7BA]/10 border border-[#57D7BA]/30 text-[#57D7BA] hover:bg-[#57D7BA]/20 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Wallet className="w-3.5 h-3.5" />
          Connect your Polymarket wallet
        </Link>
      </div>

      {/* Telegram alerts card */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#57D7BA]/10 flex items-center justify-center">
            <Send className="w-4 h-4 text-[#57D7BA]" />
          </div>
          <h2 className="text-sm font-semibold text-[#f0f6fc]">Telegram Alerts</h2>
        </div>

        <p className="text-xs text-[#8d96a0] leading-relaxed">
          Get real-time push notifications when arbitrage spreads open or whale wallets take
          significant positions. Delivered instantly to your Telegram.
        </p>

        <Link
          href="/settings/telegram"
          className="inline-flex items-center gap-2 bg-[#57D7BA]/10 border border-[#57D7BA]/30 text-[#57D7BA] hover:bg-[#57D7BA]/20 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          Connect Telegram for real-time alerts
        </Link>
      </div>
    </div>
  );
}
