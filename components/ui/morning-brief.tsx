"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRef } from "react";
import {
  Sunrise,
  TrendingUp,
  TrendingDown,
  GitCompareArrows,
  DollarSign,
  Fish,
  Calendar,
  RefreshCw,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getMorningBrief, type MorningBrief } from "@/lib/api";
import { formatSignedPct, formatUsd as fmtUsdLib } from "@/lib/format";

function fmtUsd(n: number): string { return fmtUsdLib(n); }

function fmtAge(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function fmtWhale(id: string, name?: string): string {
  if (name) return name;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function Chip({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1e2e] border border-[#2f374f] hover:border-[#57D7BA]/30 transition-colors whitespace-nowrap shrink-0">
      <Icon className="size-3.5 shrink-0" style={{ color }} />
      <span className="text-[9px] text-[#8892b0] uppercase tracking-wide font-medium">{label}</span>
      <span className="text-[11px] font-bold font-mono tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

export function MorningBriefCard() {
  const [brief, setBrief] = useState<MorningBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 180 : -180, behavior: "smooth" });
  };

  // Read collapsed state from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    const stored = localStorage.getItem("morning-brief-collapsed");
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("morning-brief-collapsed", String(next));
  };

  const load = useCallback(() => {
    setLoading(true);
    getMorningBrief().then((res) => {
      setBrief(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const age = brief ? fmtAge(brief.generatedAt) : null;

  return (
    <div className="rounded-xl bg-[#222638] border border-[#2f374f] overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f374f]">
        <div className="flex items-center gap-2">
          <Sunrise className="size-4 text-[#57D7BA]" />
          <span className="text-sm font-semibold text-[#e2e8f0]">Morning Brief</span>
          {age && !loading && (
            <span className="text-[10px] text-[#8892b0]">· Generated {age}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            aria-label="Refresh morning brief"
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[#8892b0] hover:text-[#57D7BA] text-[10px] transition-colors"
          >
            <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Show morning brief" : "Hide morning brief"}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[#8892b0] hover:text-[#e2e8f0] text-[10px] transition-colors"
          >
            <ChevronUp className={`size-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            {collapsed ? "Show" : "Hide"}
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="px-4 py-3">
          {loading ? (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 px-6">
              {[120, 90, 110].map((w, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1e2e] border border-[#2f374f] shrink-0 animate-pulse" style={{ width: `${w}px` }}>
                  <div className="size-3.5 rounded-full bg-[#2f374f]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-1.5 rounded bg-[#2f374f] w-2/3" />
                    <div className="h-2 rounded bg-[#2f374f] w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              {/* Scroll buttons */}
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 size-5 rounded-full bg-[#1a1e2e] border border-[#2f374f] flex items-center justify-center text-[#8892b0] hover:text-[#e2e8f0] transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="size-3" />
              </button>
              {/* Right gradient fade */}
              <div className="absolute right-5 top-0 bottom-0 w-12 bg-gradient-to-l from-[#222638] to-transparent pointer-events-none z-10" />
              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 size-5 rounded-full bg-[#1a1e2e] border border-[#2f374f] flex items-center justify-center text-[#8892b0] hover:text-[#e2e8f0] transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="size-3" />
              </button>
              {/* Scrollable chip row */}
              <div
                ref={scrollRef}
                className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 px-6"
              >
              {/* New spreads */}
              <Chip
                icon={GitCompareArrows}
                label="New Spreads"
                value={brief?.newDisagreementsCount
                  ? `${brief.newDisagreementsCount} in 24h`
                  : brief?.biggestNewSpread ? "1 notable" : "—"}
                color="#f59e0b"
                href="/disagrees"
              />

              {/* Biggest mover */}
              {brief?.biggestMover ? (
                <Chip
                  icon={brief.biggestMover.change24h >= 0 ? TrendingUp : TrendingDown}
                  label="Biggest Mover"
                  value={formatSignedPct(brief.biggestMover.change24h)}
                  color={brief.biggestMover.change24h >= 0 ? "#22c55e" : "#ef4444"}
                  href={`/markets/${brief.biggestMover.id}`}
                />
              ) : (
                <Chip icon={TrendingUp} label="Biggest Mover" value="—" color="#8892b0" />
              )}

              {/* Top flow shift */}
              {brief?.topFlowShift ? (
                <Chip
                  icon={DollarSign}
                  label={`${brief.topFlowShift.category} Flow`}
                  value={`${fmtUsd(brief.topFlowShift.amountUsd)} ${brief.topFlowShift.direction}`}
                  color="#57D7BA"
                  href="/flow"
                />
              ) : (
                <Chip icon={DollarSign} label="Top Flow" value="—" color="#8892b0" />
              )}

              {/* Most active whale */}
              {brief?.mostActiveWhale ? (
                <Chip
                  icon={Fish}
                  label="Active Whale"
                  value={`${fmtWhale(brief.mostActiveWhale.whaleId, brief.mostActiveWhale.displayName)} · ${brief.mostActiveWhale.positionCount} moves`}
                  color="#8b5cf6"
                  href={`/whales/${brief.mostActiveWhale.whaleId}`}
                />
              ) : (
                <Chip icon={Fish} label="Active Whale" value="—" color="#8892b0" />
              )}

              {/* Markets resolving this week */}
              <Chip
                icon={Calendar}
                label="Resolving This Week"
                value={brief?.marketsResolvingThisWeek ? `${brief.marketsResolvingThisWeek} markets` : "—"}
                color="#6366f1"
                href="/screener"
              />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
