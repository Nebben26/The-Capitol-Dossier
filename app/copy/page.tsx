"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Search,
  BadgeCheck,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  UserPlus,
  Flame,
  X,
  ChevronRight,
} from "lucide-react";
import { useWhales } from "@/hooks/useData";
import { getCopyPortfolio, getAllWhaleAccuracies } from "@/lib/api";
import type { CopyPortfolioSummary } from "@/lib/api";
import type { Whale } from "@/lib/mockData";
import { formatUsd, formatPct } from "@/lib/format";
import { LastUpdated } from "@/components/layout/LastUpdated";
import { MarketsBrowseSkeleton } from "@/components/ui/skeleton-loaders";

const LS_KEY = "qm_copy_whales";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function formatSignedUsd(n: number): string {
  const abs = Math.abs(n);
  const sign = n >= 0 ? "+" : "-";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

// ─── STAT TILE ───────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-[#1a1e2e] rounded-xl p-3 space-y-0.5">
      <div className="text-[10px] text-[#8892b0] uppercase tracking-wide">{label}</div>
      <div
        className="text-lg font-bold font-mono tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
      {sub && <div className="text-[9px] text-[#8892b0]">{sub}</div>}
    </div>
  );
}

// ─── MINI CONSENSUS BAR ──────────────────────────────────────────────────────

function ConsensusMiniBar({
  yes,
  no,
  height = "h-1.5",
}: {
  yes: number;
  no: number;
  height?: string;
}) {
  const total = yes + no;
  if (total === 0) return <div className={`w-full ${height} rounded-full bg-[#2f374f]`} />;
  const yesPct = Math.round((yes / total) * 100);
  return (
    <div className={`w-full ${height} rounded-full bg-[#2f374f] overflow-hidden flex`}>
      <div
        className="h-full bg-[#22c55e] rounded-l-full"
        style={{ width: `${yesPct}%` }}
      />
      <div
        className="h-full bg-[#ef4444] rounded-r-full"
        style={{ width: `${100 - yesPct}%` }}
      />
    </div>
  );
}

// ─── WHALE ROW CARD ──────────────────────────────────────────────────────────

function WhaleRow({
  w,
  selected,
  liveAccuracy,
  onToggle,
}: {
  w: Whale;
  selected: boolean;
  liveAccuracy?: { accuracy: number; total: number };
  onToggle: (id: string) => void;
}) {
  const acc =
    liveAccuracy && liveAccuracy.total >= 1
      ? liveAccuracy.accuracy
      : w.accuracy;
  const accStr = acc > 0 ? `${acc}%` : "—";
  const pnlPositive = w.totalPnlNum >= 0;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${
        selected
          ? "bg-[#57D7BA]/8 border-[#57D7BA]/30"
          : "bg-[#1a1e2e] border-transparent hover:border-[#2f374f]"
      }`}
      onClick={() => onToggle(w.id)}
    >
      {/* Avatar */}
      <div className="size-8 rounded-full bg-gradient-to-br from-[#57D7BA] to-[#8b5cf6] flex items-center justify-center shrink-0">
        <span className="text-[9px] font-bold text-[#0f1119]">{w.name[0]}</span>
      </div>

      {/* Name + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-[#e2e8f0] truncate">{w.name}</span>
          {w.verified && <BadgeCheck className="size-3 text-[#57D7BA] shrink-0" />}
          {w.smart && (
            <span className="px-1 py-0 rounded bg-[#57D7BA]/10 text-[#57D7BA] text-[7px] font-bold shrink-0">
              SMART
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-[10px] font-mono font-bold tabular-nums ${pnlPositive ? "text-[#22c55e]" : "text-[#ef4444]"}`}
          >
            {w.totalPnl}
          </span>
          <span className="text-[10px] text-[#8892b0]">{accStr} acc</span>
        </div>
      </div>

      {/* Toggle */}
      {selected ? (
        <div className="shrink-0 size-7 rounded-full bg-[#57D7BA] flex items-center justify-center">
          <CheckCircle className="size-4 text-[#0f1119]" />
        </div>
      ) : (
        <div className="shrink-0 size-7 rounded-full bg-[#2f374f] flex items-center justify-center hover:bg-[#57D7BA]/20 transition-colors">
          <UserPlus className="size-3.5 text-[#8892b0]" />
        </div>
      )}
    </div>
  );
}

// ─── EMPTY PORTFOLIO STATE ────────────────────────────────────────────────────

function PortfolioEmpty({ onPreset }: { onPreset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 space-y-4">
      <div className="size-16 rounded-2xl bg-[#57D7BA]/10 flex items-center justify-center">
        <UserPlus className="size-8 text-[#57D7BA]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#e2e8f0] mb-1">
          No whales selected
        </p>
        <p className="text-[11px] text-[#8892b0] leading-relaxed max-w-xs mx-auto">
          Select whales from the left to build your virtual portfolio and track
          their combined positions.
        </p>
      </div>
      <Button
        onClick={onPreset}
        size="sm"
        className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 gap-1.5"
      >
        <Flame className="size-3.5" />
        Try Top 10 by P&L
      </Button>
    </div>
  );
}

// ─── PORTFOLIO PANEL ─────────────────────────────────────────────────────────

function PortfolioPanel({
  summary,
  loading,
  onPreset,
}: {
  summary: CopyPortfolioSummary | null;
  loading: boolean;
  onPreset: () => void;
}) {
  if (!summary || summary.selected_count === 0) {
    return (
      <Card className="bg-[#222638] border-[#2f374f] h-full">
        <CardContent className="p-0 h-full">
          <PortfolioEmpty onPreset={onPreset} />
        </CardContent>
      </Card>
    );
  }

  const total = summary.yes_total + summary.no_total;
  const yesPct = total > 0 ? Math.round((summary.yes_total / total) * 100) : 50;
  const noPct = 100 - yesPct;
  const pnlPositive = summary.combined_pnl >= 0;

  return (
    <div className="space-y-4">
      {/* Summary tiles */}
      <Card className="bg-[#222638] border-[#2f374f]">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold text-[#8892b0] uppercase tracking-wide">
            Portfolio Summary
          </p>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-[#1a1e2e] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Selected Whales"
                value={String(summary.selected_count)}
                sub="tracked wallets"
              />
              <StatTile
                label="Combined Capital"
                value={formatUsd(summary.combined_capital)}
                sub="open positions"
              />
              <StatTile
                label="Combined P&L"
                value={formatSignedUsd(summary.combined_pnl)}
                color={pnlPositive ? "#22c55e" : "#ef4444"}
                sub="across all markets"
              />
              <StatTile
                label="Weighted Accuracy"
                value={summary.weighted_accuracy > 0 ? `${summary.weighted_accuracy}%` : "—"}
                sub="by position count"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consensus bar */}
      <Card className="bg-[#222638] border-[#2f374f]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#8892b0] uppercase tracking-wide">
              Combined Consensus
            </p>
            <p className="text-[11px] text-[#e2e8f0] font-mono">
              <span className="text-[#22c55e] font-bold">{yesPct}% YES</span>
              <span className="text-[#8892b0] mx-1.5">·</span>
              <span className="text-[#ef4444] font-bold">{noPct}% NO</span>
            </p>
          </div>
          {loading ? (
            <div className="h-3 rounded-full bg-[#1a1e2e] animate-pulse" />
          ) : (
            <>
              <ConsensusMiniBar yes={summary.yes_total} no={summary.no_total} height="h-3" />
              <div className="flex justify-between text-[9px] text-[#8892b0]">
                <span>{formatUsd(summary.yes_total)} YES</span>
                <span>{formatUsd(summary.no_total)} NO</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Top conviction plays */}
      <Card className="bg-[#222638] border-[#2f374f]">
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold text-[#8892b0] uppercase tracking-wide">
            Top Conviction Plays
          </p>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-[#1a1e2e] animate-pulse" />
              ))}
            </div>
          ) : summary.top_plays.length === 0 ? (
            <p className="text-[11px] text-[#8892b0] py-4 text-center">
              No positions found for these whales.
            </p>
          ) : (
            <div className="space-y-2">
              {summary.top_plays.map((play) => (
                <div
                  key={play.market_id}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-[#1a1e2e] hover:bg-[#1a1e2e]/80 transition-colors"
                >
                  {/* Direction badge */}
                  <span
                    className={`shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      play.direction === "YES"
                        ? "bg-[#22c55e]/10 text-[#22c55e]"
                        : "bg-[#ef4444]/10 text-[#ef4444]"
                    }`}
                  >
                    {play.direction === "YES" ? (
                      <ArrowUpRight className="size-2.5" />
                    ) : (
                      <ArrowDownRight className="size-2.5" />
                    )}
                    {play.direction}
                  </span>

                  {/* Market + bar */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/markets/${play.market_id}`}
                      className="text-[11px] font-medium text-[#e2e8f0] hover:text-[#57D7BA] transition-colors line-clamp-1"
                    >
                      {play.market_question}
                    </Link>
                    <ConsensusMiniBar yes={play.yes_value} no={play.no_value} />
                  </div>

                  {/* Stats */}
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] font-mono font-bold text-[#e2e8f0] tabular-nums">
                      {formatUsd(play.total_value)}
                    </div>
                    <div className="text-[8px] text-[#8892b0]">
                      {play.whale_count}w
                    </div>
                  </div>

                  <Link href={`/markets/${play.market_id}`} className="shrink-0">
                    <ChevronRight className="size-4 text-[#8892b0] hover:text-[#57D7BA] transition-colors" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function CopyWhalesPage() {
  const { whales, lastFetched, refreshing, error, retry } = useWhales();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [accuracyMap, setAccuracyMap] = useState<Record<string, { accuracy: number; total: number }>>({});
  const [summary, setSummary] = useState<CopyPortfolioSummary | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) {
        const ids = JSON.parse(stored) as string[];
        setSelectedIds(new Set(ids));
      }
    } catch { /* ignore */ }
    setPageReady(true);
  }, []);

  // Fetch accuracy data
  useEffect(() => {
    getAllWhaleAccuracies().then((res) => {
      if (Object.keys(res.data).length > 0) setAccuracyMap(res.data);
    });
  }, []);

  // Debounced portfolio refresh whenever selection changes
  const refreshPortfolio = useCallback((ids: Set<string>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const arr = [...ids];
      if (arr.length === 0) {
        setSummary(null);
        return;
      }
      setPortfolioLoading(true);
      try {
        const result = await getCopyPortfolio(arr);
        setSummary(result);
      } finally {
        setPortfolioLoading(false);
      }
    }, 300);
  }, []);

  // Persist + trigger refresh whenever selection changes
  const setSelected = useCallback(
    (updater: (prev: Set<string>) => Set<string>) => {
      setSelectedIds((prev) => {
        const next = updater(prev);
        try {
          localStorage.setItem(LS_KEY, JSON.stringify([...next]));
        } catch { /* ignore */ }
        refreshPortfolio(next);
        return next;
      });
    },
    [refreshPortfolio]
  );

  // Initial portfolio load if localStorage had selections
  useEffect(() => {
    if (pageReady && selectedIds.size > 0) refreshPortfolio(selectedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageReady]);

  const toggleWhale = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── PRESETS ───────────────────────────────────────────────────────────────

  const sortedByPnl = [...whales].sort((a, b) => b.totalPnlNum - a.totalPnlNum);
  const sortedByAcc = [...whales].sort((a, b) => {
    const aAcc = accuracyMap[a.id]?.total >= 5 ? (accuracyMap[a.id]?.accuracy ?? a.accuracy) : a.accuracy;
    const bAcc = accuracyMap[b.id]?.total >= 5 ? (accuracyMap[b.id]?.accuracy ?? b.accuracy) : b.accuracy;
    return bAcc - aAcc;
  });
  const smartWhales = whales.filter((w) => w.smart);

  const applyPreset = (ids: string[]) => {
    setSelected(() => new Set(ids));
  };

  const presetTop10Pnl = () => applyPreset(sortedByPnl.slice(0, 10).map((w) => w.id));

  // ─── FILTERED WHALE LIST ───────────────────────────────────────────────────

  const filteredWhales = whales.filter((w) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return w.name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q);
  });

  if (!pageReady) return <MarketsBrowseSkeleton />;

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="size-7 text-[#57D7BA]" />
            Copy the Whales
          </h1>
          <p className="text-sm text-[#8892b0] mt-1">
            Build a virtual portfolio that mirrors what the smartest whales are doing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ef4444]/10 text-[#ef4444] text-[10px] font-bold animate-pulse">
            <span className="size-1.5 rounded-full bg-[#ef4444]" />
            LIVE
          </span>
          <LastUpdated lastFetched={lastFetched} refreshing={refreshing} error={error} onRetry={retry} />
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { n: "1", title: "Select Whales", desc: "Click whales below or use a quick preset" },
          { n: "2", title: "We Aggregate", desc: "We combine positions across all markets they hold" },
          { n: "3", title: "Track & Share", desc: "See combined P&L, top plays, and consensus" },
        ].map((step) => (
          <div
            key={step.n}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#222638] border border-[#2f374f]"
          >
            <div className="size-8 rounded-full bg-[#57D7BA]/15 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-[#57D7BA]">{step.n}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#e2e8f0]">{step.title}</p>
              <p className="text-[10px] text-[#8892b0] leading-snug">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-column layout */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* ═══ LEFT: Whale Selector (40%) ═════════════════════════════════ */}
        <div className="lg:w-[40%] space-y-3">
          {/* Presets */}
          <Card className="bg-[#222638] border-[#2f374f]">
            <CardContent className="p-3 space-y-2">
              <p className="text-[10px] font-semibold text-[#8892b0] uppercase tracking-wide">
                Quick Presets
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="xs"
                  onClick={presetTop10Pnl}
                  className="bg-[#57D7BA]/10 text-[#57D7BA] hover:bg-[#57D7BA]/20 border border-[#57D7BA]/20 text-[10px]"
                  variant="ghost"
                >
                  Top 10 by P&L
                </Button>
                <Button
                  size="xs"
                  onClick={() => applyPreset(sortedByAcc.slice(0, 5).map((w) => w.id))}
                  className="bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6]/20 border border-[#8b5cf6]/20 text-[10px]"
                  variant="ghost"
                >
                  Top 5 by Accuracy
                </Button>
                <Button
                  size="xs"
                  onClick={() =>
                    applyPreset(
                      (smartWhales.length > 0 ? smartWhales : sortedByPnl.slice(0, 5)).map((w) => w.id)
                    )
                  }
                  className="bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20 border border-[#f59e0b]/20 text-[10px]"
                  variant="ghost"
                >
                  Smart Money
                </Button>
                <Button
                  size="xs"
                  onClick={() => setSelected(() => new Set())}
                  className="bg-[#2f374f] text-[#8892b0] hover:text-[#e2e8f0] text-[10px]"
                  variant="ghost"
                >
                  <X className="size-3 mr-1" />
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Selection count */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] text-[#57D7BA] font-semibold">
                {selectedIds.size} whale{selectedIds.size !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => setSelected(() => new Set())}
                className="text-[10px] text-[#8892b0] hover:text-[#ef4444] transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8892b0]" />
            <input
              type="text"
              placeholder="Search whales..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#222638] border border-[#2f374f] text-sm text-[#e2e8f0] placeholder:text-[#8892b0]/60 focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 transition-all"
            />
          </div>

          {/* Scrollable whale list */}
          <div className="overflow-y-auto max-h-[600px] space-y-1 pr-1 scrollbar-thin scrollbar-thumb-[#2f374f] scrollbar-track-transparent">
            {filteredWhales.length === 0 ? (
              <p className="text-[11px] text-[#8892b0] text-center py-8">
                No whales match "{search}"
              </p>
            ) : (
              filteredWhales.map((w) => (
                <WhaleRow
                  key={w.id}
                  w={w}
                  selected={selectedIds.has(w.id)}
                  liveAccuracy={accuracyMap[w.id]}
                  onToggle={toggleWhale}
                />
              ))
            )}
          </div>
        </div>

        {/* ═══ RIGHT: Virtual Portfolio (60%) ══════════════════════════════ */}
        <div className="lg:w-[60%]">
          <PortfolioPanel
            summary={summary}
            loading={portfolioLoading}
            onPreset={presetTop10Pnl}
          />
        </div>
      </div>

      <footer className="flex items-center justify-between py-4 border-t border-[#2f374f] text-[10px] text-[#8892b0]">
        <span>© 2026 Quiver Markets. Not financial advice. Data from Polymarket &amp; Kalshi.</span>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
