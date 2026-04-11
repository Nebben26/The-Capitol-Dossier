"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  Send,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Subscriber {
  id: number;
  chat_id: number;
  telegram_username: string | null;
  first_name: string | null;
  active: boolean;
  paused_until: string | null;
  alert_arb_spreads: boolean;
  alert_whale_activity: boolean;
  alert_market_resolution: boolean;
  min_spread_pt: number;
  min_whale_position_usd: number;
  alerts_today: number;
  max_alerts_per_day: number;
}

export default function TelegramSettingsPage() {
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [linkExpiry, setLinkExpiry] = useState<Date | null>(null);
  const [generating, setGenerating] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const loadSubscriber = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("telegram_subscribers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    // Only treat as "connected" if chat_id > 0 (placeholder rows are 0)
    if (data && data.chat_id > 0) {
      setSubscriber(data as Subscriber);
    } else {
      setSubscriber(null);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (u) {
        setUser(u);
        await loadSubscriber(u.id);
      }
      setLoading(false);
    };
    init();
  }, [loadSubscriber]);

  const generateLink = async () => {
    setGenerating(true);
    setLinkUrl(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/telegram/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setLinkUrl(data.link);
        setLinkExpiry(new Date(data.expiresAt));
      }
    } finally {
      setGenerating(false);
    }
  };

  const updatePreference = async (key: string, value: number | boolean) => {
    if (!subscriber) return;
    const { error } = await supabase
      .from("telegram_subscribers")
      .update({ [key]: value })
      .eq("id", subscriber.id);

    if (!error) {
      setSubscriber({ ...subscriber, [key]: value });
      setSaveMsg("Saved");
      setTimeout(() => setSaveMsg(null), 2000);
    }
  };

  const refreshStatus = async () => {
    if (!user) return;
    setLoading(true);
    await loadSubscriber(user.id);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-[#161b27] border border-[#21262d] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
        <h1 className="text-2xl font-bold text-[#f0f6fc]">Telegram Alerts</h1>
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-6 text-center space-y-3">
          <p className="text-sm text-[#8d96a0]">Sign in to manage your Telegram alerts.</p>
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-xs text-[#8d96a0] hover:text-[#57D7BA] transition-colors mb-4"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Settings
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#57D7BA]/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-[#57D7BA]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#f0f6fc] tracking-tight">Telegram Alerts</h1>
              <p className="text-xs text-[#8d96a0]">
                Real-time push notifications for spreads and whale activity.
              </p>
            </div>
          </div>
          <button
            onClick={refreshStatus}
            className="p-2 rounded-lg text-[#8d96a0] hover:text-[#57D7BA] hover:bg-[#57D7BA]/10 transition-colors"
            aria-label="Refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Not connected yet ────────────────────────────────────────────── */}
      {!subscriber ? (
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-6 space-y-5">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-[#57D7BA] mt-0.5 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-[#f0f6fc]">Connect your Telegram</h2>
              <p className="text-xs text-[#8d96a0] mt-1 leading-relaxed">
                Link your Telegram account to receive instant push notifications when new
                cross-platform arbitrage opportunities open or when tracked whale wallets take
                significant positions.
              </p>
            </div>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-2">
            {[
              "Arbitrage spreads above your threshold (default: 10pt)",
              "Whale wallets entering positions above $50K",
              "Pause, resume, or adjust thresholds via bot commands",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-[#8d96a0]">
                <CheckCircle className="w-3.5 h-3.5 text-[#3fb950] shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>

          {/* Generate / open link */}
          {linkUrl ? (
            <div className="space-y-3">
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#57D7BA] hover:bg-[#57D7BA]/80 text-[#0d1117] font-bold text-sm py-3 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Telegram and connect
              </a>
              <p className="text-[10px] text-[#484f58] text-center">
                Link expires{" "}
                {linkExpiry
                  ? `at ${linkExpiry.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "in 15 minutes"}
                . Tap Start in the bot after opening.
              </p>
              <button
                onClick={refreshStatus}
                className="w-full text-xs text-[#8d96a0] hover:text-[#57D7BA] py-2 transition-colors"
              >
                Already connected? Click to refresh status
              </button>
            </div>
          ) : (
            <button
              onClick={generateLink}
              disabled={generating}
              className="w-full bg-[#57D7BA] hover:bg-[#57D7BA]/80 disabled:opacity-50 text-[#0d1117] font-bold text-sm py-3 rounded-lg transition-colors"
            >
              {generating ? "Generating link…" : "Generate connection link"}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Connected status ──────────────────────────────────────────── */}
          <div className="rounded-xl bg-[#3fb950]/10 border border-[#3fb950]/30 p-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-[#3fb950] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#3fb950]">
                  Connected
                  {subscriber.telegram_username
                    ? ` as @${subscriber.telegram_username}`
                    : subscriber.first_name
                    ? ` as ${subscriber.first_name}`
                    : ""}
                </p>
                <p className="text-[11px] text-[#8d96a0] mt-0.5">
                  {subscriber.alerts_today} of {subscriber.max_alerts_per_day} daily alerts used
                  {subscriber.paused_until &&
                  new Date(subscriber.paused_until) > new Date()
                    ? ` · Paused until ${new Date(subscriber.paused_until).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : ""}
                </p>
              </div>
            </div>
            <span className="text-[10px] text-[#8d96a0] bg-[#21262d] px-2 py-1 rounded-md font-mono shrink-0">
              /pause to mute
            </span>
          </div>

          {/* ── Alert types ───────────────────────────────────────────────── */}
          <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#8d96a0]">
                Alert Types
              </h2>
              {saveMsg && (
                <span className="text-[10px] text-[#3fb950] font-semibold">{saveMsg}</span>
              )}
            </div>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-[#f0f6fc]">Arbitrage Spreads</div>
                <div className="text-[11px] text-[#8d96a0]">
                  New cross-platform spread opportunities
                </div>
              </div>
              <input
                type="checkbox"
                checked={subscriber.alert_arb_spreads}
                onChange={(e) => updatePreference("alert_arb_spreads", e.target.checked)}
                className="w-5 h-5 accent-[#57D7BA] shrink-0"
              />
            </label>

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-[#f0f6fc]">Whale Activity</div>
                <div className="text-[11px] text-[#8d96a0]">
                  Tracked wallets taking large positions
                </div>
              </div>
              <input
                type="checkbox"
                checked={subscriber.alert_whale_activity}
                onChange={(e) => updatePreference("alert_whale_activity", e.target.checked)}
                className="w-5 h-5 accent-[#57D7BA] shrink-0"
              />
            </label>
          </div>

          {/* ── Thresholds ────────────────────────────────────────────────── */}
          <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#8d96a0]">
              Thresholds
            </h2>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#f0f6fc]">
                  Minimum spread for arb alerts
                </label>
                <span className="text-sm font-mono font-bold text-[#57D7BA]">
                  {subscriber.min_spread_pt}pt
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="30"
                step="1"
                value={subscriber.min_spread_pt}
                onChange={(e) =>
                  setSubscriber({ ...subscriber, min_spread_pt: parseInt(e.target.value) })
                }
                onMouseUp={(e) =>
                  updatePreference(
                    "min_spread_pt",
                    parseInt((e.target as HTMLInputElement).value)
                  )
                }
                onTouchEnd={(e) =>
                  updatePreference(
                    "min_spread_pt",
                    parseInt((e.target as HTMLInputElement).value)
                  )
                }
                className="w-full accent-[#57D7BA]"
              />
              <div className="flex justify-between text-[10px] text-[#484f58]">
                <span>3pt (very sensitive)</span>
                <span>30pt (only big spreads)</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[#f0f6fc]">
                  Minimum whale position size
                </label>
                <span className="text-sm font-mono font-bold text-[#57D7BA]">
                  ${(subscriber.min_whale_position_usd / 1000).toFixed(0)}K
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="10000"
                value={subscriber.min_whale_position_usd}
                onChange={(e) =>
                  setSubscriber({
                    ...subscriber,
                    min_whale_position_usd: parseInt(e.target.value),
                  })
                }
                onMouseUp={(e) =>
                  updatePreference(
                    "min_whale_position_usd",
                    parseInt((e.target as HTMLInputElement).value)
                  )
                }
                onTouchEnd={(e) =>
                  updatePreference(
                    "min_whale_position_usd",
                    parseInt((e.target as HTMLInputElement).value)
                  )
                }
                className="w-full accent-[#57D7BA]"
              />
              <div className="flex justify-between text-[10px] text-[#484f58]">
                <span>$10K</span>
                <span>$500K</span>
              </div>
            </div>
          </div>

          {/* ── Reconnect ─────────────────────────────────────────────────── */}
          <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-4">
            <p className="text-xs text-[#8d96a0] mb-3">
              Need to link a different Telegram account?
            </p>
            <button
              onClick={generateLink}
              disabled={generating}
              className="text-xs font-semibold text-[#57D7BA] hover:text-[#57D7BA]/80 disabled:opacity-50 transition-colors"
            >
              {generating ? "Generating…" : "Generate a new connection link"}
            </button>
            {linkUrl && (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-xs text-[#388bfd] hover:underline"
              >
                Open Telegram →
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}
