"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Radio,
  Wallet,
  TrendingUp,
  Volume2,
  Timer,
  CheckCircle,
  ChevronRight,
  Zap,
  Users,
  BarChart2,
  GitFork,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useAlertData } from "@/hooks/useData";
import { getSignals } from "@/lib/api";
import type { Signal, SignalType } from "@/lib/signals";
import { supabase } from "@/lib/supabase";
import { useDataSource } from "@/components/layout/DataSourceContext";
import { LastUpdated } from "@/components/layout/LastUpdated";
import { LeaderboardSkeleton } from "@/components/ui/skeleton-loaders";
import { TrialBanner } from "@/components/ui/pro-gate";

// ─── SIGNAL TYPE CONFIG ───────────────────────────────────────────────────────

const SIGNAL_TYPES: Record<
  SignalType,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  whale_consensus: {
    label: "Whale Consensus",
    color: "#8b5cf6",
    icon: Users,
  },
  smart_money_concentration: {
    label: "Concentration",
    color: "#f59e0b",
    icon: BarChart2,
  },
  size_spike: {
    label: "Size Spike",
    color: "#ef4444",
    icon: Zap,
  },
  whale_divergence: {
    label: "Divergence",
    color: "#57D7BA",
    icon: GitFork,
  },
};

// ─── CONFIDENCE BAR ───────────────────────────────────────────────────────────

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round((score / 10) * 100);
  const color =
    score >= 8 ? "#22c55e" : score >= 6 ? "#f59e0b" : "#8892b0";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-[#2f374f] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="text-[10px] font-mono font-bold tabular-nums"
        style={{ color }}
      >
        {score}/10
      </span>
    </div>
  );
}

// ─── SIGNAL CARD ─────────────────────────────────────────────────────────────

function SignalCard({ signal }: { signal: Signal }) {
  const cfg = SIGNAL_TYPES[signal.type];
  const Icon = cfg.icon;
  const stats = signal.stats as Record<string, unknown>;

  const side = (stats.side || stats.lead_side || stats.smart_side) as string | undefined;
  const totalUsd = (
    stats.total_value_usd ||
    stats.position_value_usd ||
    stats.smart_total_usd
  ) as number | undefined;

  const ageMs = Date.now() - new Date(signal.detected_at).getTime();
  const ageStr =
    ageMs < 60_000 ? "just now"
    : ageMs < 3_600_000 ? `${Math.floor(ageMs / 60_000)}m ago`
    : `${Math.floor(ageMs / 3_600_000)}h ago`;

  return (
    <Card className="bg-[#222638] border-[#2f374f] hover:border-[#57D7BA]/20 transition-all">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          {/* Icon */}
          <div
            className="size-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${cfg.color}18` }}
          >
            <span style={{ color: cfg.color }}>
              <Icon className="size-5" />
            </span>
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Type badge + confidence */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
              >
                {cfg.label}
              </span>
              <ConfidenceBar score={signal.confidence} />
              <span className="text-[9px] text-[#8892b0] ml-auto">{ageStr}</span>
            </div>

            {/* Headline */}
            <p className="text-sm font-semibold text-[#e2e8f0] leading-snug">
              {signal.headline}
            </p>

            {/* Detail */}
            {signal.detail && (
              <p className="text-[11px] text-[#8892b0] leading-relaxed">
                {signal.detail}
              </p>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-3 flex-wrap pt-0.5">
              {side && (
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    side === "YES"
                      ? "bg-[#22c55e]/10 text-[#22c55e]"
                      : "bg-[#ef4444]/10 text-[#ef4444]"
                  }`}
                >
                  {side === "YES" ? (
                    <ArrowUpRight className="size-2.5" />
                  ) : (
                    <ArrowDownRight className="size-2.5" />
                  )}
                  {side}
                </span>
              )}
              {typeof totalUsd === "number" && totalUsd > 0 && (
                <span className="text-[10px] text-[#8892b0] font-mono tabular-nums">
                  {totalUsd >= 1_000_000
                    ? `$${(totalUsd / 1_000_000).toFixed(1)}M`
                    : `$${(totalUsd / 1_000).toFixed(0)}K`}{" "}
                  exposure
                </span>
              )}
              {typeof stats.whale_count === "number" && (
                <span className="text-[10px] text-[#8892b0]">
                  {stats.whale_count as number} whales
                </span>
              )}
              {typeof stats.multiplier === "number" && (
                <span className="text-[10px] text-[#f59e0b] font-mono font-bold">
                  {(stats.multiplier as number).toFixed(1)}× avg
                </span>
              )}
            </div>
          </div>

          {/* Market link */}
          <div className="shrink-0 flex items-center gap-2 sm:flex-col sm:items-end">
            <Link href={`/markets/${signal.market_id}`}>
              <Button
                size="xs"
                className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 gap-1"
              >
                View <ChevronRight className="size-3" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Market question */}
        <div className="mt-2.5 pt-2.5 border-t border-[#2f374f]">
          <Link
            href={`/markets/${signal.market_id}`}
            className="text-[10px] text-[#8892b0] hover:text-[#57D7BA] transition-colors line-clamp-1"
          >
            {signal.market_question || signal.market_id}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

function SignalsEmpty() {
  return (
    <Card className="bg-[#222638] border-[#2f374f]">
      <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
        <div className="size-12 rounded-xl bg-[#57D7BA]/10 flex items-center justify-center">
          <AlertCircle className="size-6 text-[#57D7BA]" />
        </div>
        <p className="text-sm font-semibold text-[#e2e8f0]">
          No active signals right now
        </p>
        <p className="text-[11px] text-[#8892b0] max-w-xs leading-relaxed">
          Signals are detected from whale positions in the last 6 hours.
          Check back in 30 minutes when the next ingestion completes.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── FILTER CHIPS ─────────────────────────────────────────────────────────────

type FilterChip = "all" | SignalType;

const CHIP_OPTIONS: { key: FilterChip; label: string }[] = [
  { key: "all", label: "All" },
  { key: "whale_consensus", label: "Consensus" },
  { key: "smart_money_concentration", label: "Concentration" },
  { key: "size_spike", label: "Size Spike" },
  { key: "whale_divergence", label: "Divergence" },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const { source, refreshing, lastFetched, error, retry } = useAlertData();
  const { setSource } = useDataSource();

  useEffect(() => { setSource(source); }, [source, setSource]);

  const [signals, setSignals] = useState<Signal[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterChip>("all");
  const [loading, setLoading] = useState(true);

  // Page skeleton
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // Load signals from Supabase
  useEffect(() => {
    getSignals({ limit: 50 }).then(({ data }) => {
      console.log(`[alerts] loaded ${data.length} signals from Supabase`);
      setSignals(data);
      setSignalsLoading(false);
    });
  }, []);

  const filteredSignals =
    activeFilter === "all"
      ? signals
      : signals.filter((s) => s.type === activeFilter);

  // Summary counts
  const typeCount = (t: SignalType) => signals.filter((s) => s.type === t).length;

  if (loading) return <LeaderboardSkeleton />;

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Radio className="size-7 text-[#ef4444]" />
            Smart Signals
          </h1>
          <p className="text-sm text-[#8892b0] mt-1">
            AI-detected whale behaviour patterns — updated every 30 minutes
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ef4444]/10 text-[#ef4444] text-[10px] font-bold animate-pulse">
            <span className="size-1.5 rounded-full bg-[#ef4444]" />
            LIVE
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#222638] border border-[#2f374f] text-[10px] text-[#8892b0] font-mono tabular-nums">
            {signals.length} active signals
          </span>
          <LastUpdated
            lastFetched={lastFetched}
            refreshing={refreshing}
            error={error}
            onRetry={retry}
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(
          [
            { label: "Whale Consensus", type: "whale_consensus", icon: Users, color: "#8b5cf6" },
            { label: "Concentration", type: "smart_money_concentration", icon: BarChart2, color: "#f59e0b" },
            { label: "Size Spikes", type: "size_spike", icon: Zap, color: "#ef4444" },
            { label: "Divergence", type: "whale_divergence", icon: GitFork, color: "#57D7BA" },
          ] as const
        ).map((s) => (
          <Card
            key={s.type}
            className="bg-[#222638] border-[#2f374f] cursor-pointer hover:border-[#57D7BA]/20 transition-all"
            onClick={() =>
              setActiveFilter((prev) =>
                prev === s.type ? "all" : s.type
              )
            }
          >
            <CardContent className="p-3 flex items-center gap-3">
              <div
                className="size-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${s.color}15` }}
              >
                <span style={{ color: s.color }}><s.icon className="size-4" /></span>
              </div>
              <div>
                <div className="text-sm font-bold font-mono tabular-nums">
                  {typeCount(s.type as SignalType)}
                </div>
                <div className="text-[10px] text-[#8892b0]">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TrialBanner />

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {CHIP_OPTIONS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => setActiveFilter(chip.key)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
              activeFilter === chip.key
                ? "bg-[#57D7BA] text-[#0f1119]"
                : "bg-[#222638] border border-[#2f374f] text-[#8892b0] hover:text-[#e2e8f0]"
            }`}
          >
            {chip.label}
            {chip.key !== "all" && (
              <span className="ml-1.5 opacity-60">
                {typeCount(chip.key as SignalType)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Signals list */}
      <div className="space-y-3">
        {signalsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-[#222638] border-[#2f374f]">
                <CardContent className="p-4">
                  <div className="animate-pulse flex gap-3">
                    <div className="size-10 rounded-xl bg-[#2f374f]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 bg-[#2f374f] rounded" />
                      <div className="h-4 w-3/4 bg-[#2f374f] rounded" />
                      <div className="h-3 w-1/2 bg-[#2f374f] rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSignals.length === 0 ? (
          <SignalsEmpty />
        ) : (
          filteredSignals.map((signal) => (
            <SignalCard key={signal.signal_id} signal={signal} />
          ))
        )}
      </div>

      {/* ═══ OLD TABS (commented out for future use) ═══════════════════════
       *
       * TODO: Re-enable these tabs once we have real-time data feeds:
       *
       * <TabsTrigger value="movers">Price Movers</TabsTrigger>
       *   — Real-time price change data from Polymarket/Kalshi websockets
       *
       * <TabsTrigger value="resolution">Resolution Nearing</TabsTrigger>
       *   — Markets with end_date within 30 days, sourced from markets table
       *
       * <TabsTrigger value="resolved">Resolution Alerts</TabsTrigger>
       *   — Recently resolved markets with correct/incorrect outcomes
       *     Currently using recentlyResolved mock data from lib/mockData.ts
       *
       * ════════════════════════════════════════════════════════════════════ */}

      <footer className="flex items-center justify-between py-4 border-t border-[#2f374f] text-[10px] text-[#8892b0]">
        <span>
          © 2026 Quiver Markets. Not financial advice. Data from Polymarket &amp; Kalshi.
        </span>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}
