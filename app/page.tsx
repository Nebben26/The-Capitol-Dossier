"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Trophy,
  Users,
  GitCompareArrows,
  BarChart3,
  ExternalLink,
  Flame,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHomepageData, useDisagreements } from "@/hooks/useData";
import { getSystemStats } from "@/lib/api";
import { DisagreeShareButton } from "@/components/ui/disagree-share";
import { LastUpdated } from "@/components/layout/LastUpdated";
import { HomepageSkeleton } from "@/components/ui/skeleton-loaders";
import { formatSignedPt, formatPt } from "@/lib/format";
import { CountUp } from "@/components/ui/count-up";
import { InlineSparkline } from "@/components/ui/inline-sparkline";

// ─── INDICES TYPES ────────────────────────────────────────────────────────────
interface IndexRow {
  slug: string;
  name: string;
  current_value: number;
  change_24h: number | null;
  category: string;
}

function indexZoneColor(v: number): string {
  if (v <= 30) return "#f85149";
  if (v <= 70) return "#d29922";
  return "#3fb950";
}

function shortIndexName(name: string): string {
  return name.replace(/^Quiver\s+/i, "").replace(/\s+Index$/i, "");
}

// ─── DISAGREE CARD ─────────────────────────────────────────────────────────────
function DisagreeCard({ d }: { d: ReturnType<typeof useDisagreements>["disagreements"][number] }) {
  const href = d.marketId ? `/markets/${d.marketId}` : "/disagrees";
  const spreadColor = d.spread >= 20 ? "#f59e0b" : d.spread >= 10 ? "#57D7BA" : "#8d96a0";

  return (
    <Link href={href} className="block group">
      <div className="rounded-xl bg-[#0d1117] border border-[#21262d] group-hover:border-[#57D7BA]/25 p-4 transition-colors h-full flex flex-col gap-3">
        {/* Category + score */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#484f58]">{d.category}</span>
          {d.opportunityScore != null && d.opportunityScore > 0 && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
              style={{ color: d.opportunityScore >= 75 ? "#f59e0b" : "#57D7BA", background: d.opportunityScore >= 75 ? "#f59e0b15" : "#57D7BA15" }}>
              {d.opportunityScore >= 75 ? "ELITE" : d.opportunityScore >= 50 ? "STRONG" : "MODERATE"}
            </span>
          )}
        </div>

        {/* Question */}
        <p className="text-xs font-semibold text-[#f0f6fc] leading-snug line-clamp-2 flex-1 group-hover:text-[#57D7BA] transition-colors">
          {d.question}
        </p>

        {/* Prices */}
        <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
          <div className="flex-1 rounded-lg bg-[#161b27] border border-[#21262d] p-2 text-center">
            <div className="text-[9px] text-[#8d96a0] mb-0.5">Polymarket</div>
            <div className="font-bold text-[#f0f6fc]">{d.polyPrice}¢</div>
          </div>
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <span className="text-[10px] font-black" style={{ color: spreadColor }}>
              {d.spread}pt
            </span>
            <span className="text-[8px] text-[#484f58]">spread</span>
          </div>
          <div className="flex-1 rounded-lg bg-[#161b27] border border-[#21262d] p-2 text-center">
            <div className="text-[9px] text-[#8d96a0] mb-0.5">Kalshi</div>
            <div className="font-bold text-[#f0f6fc]">{d.kalshiPrice}¢</div>
          </div>
        </div>

        {/* Volume + resolution */}
        <div className="flex items-center justify-between text-[10px] text-[#484f58]">
          <span>{d.polyVol} / {d.kalshiVol} vol</span>
          {d.daysLeft > 0 && <span>{d.daysLeft}d left</span>}
        </div>
      </div>
    </Link>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { markets, biggestMovers, breakingMarkets, whaleActivity, source, refreshing, lastFetched, retry } = useHomepageData();
  const { disagreements } = useDisagreements();

  // System stats
  const [marketCount, setMarketCount] = useState(0);
  const [disagreeCount, setDisagreeCount] = useState(0);
  const [whaleCount, setWhaleCount] = useState(0);

  useEffect(() => {
    getSystemStats().then((s) => {
      if (s.marketsCount > 0) setMarketCount(s.marketsCount);
      if (s.disagreementsCount > 0) setDisagreeCount(s.disagreementsCount);
      if (s.whalesCount > 0) setWhaleCount(s.whalesCount);
    });
  }, []);

  // Indices
  const [indices, setIndices] = useState<IndexRow[]>([]);
  useEffect(() => {
    fetch("/api/indices")
      .then((r) => r.json())
      .then((j) => { if (j.indices?.length) setIndices(j.indices); })
      .catch(() => {});
  }, []);

  const top3Disagrees = useMemo(
    () => [...disagreements].sort((a, b) => b.spread - a.spread).slice(0, 3),
    [disagreements]
  );

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  if (loading && markets.length === 0) return <HomepageSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-[#21262d] bg-gradient-to-br from-[#161b27] via-[#0d1117] to-[#0d1117] p-8 lg:p-12 mb-6 relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#57D7BA]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#388bfd]/8 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2 bg-[#57D7BA]/10 border border-[#57D7BA]/20 rounded-full px-3 py-1 text-[11px] font-bold text-[#57D7BA] uppercase tracking-widest mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#57D7BA] animate-pulse" />
            Live Intelligence
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#f0f6fc] leading-[1.1] tracking-tight mb-4">
            Prediction market intelligence
            <br />
            <span className="bg-gradient-to-r from-[#57D7BA] to-[#388bfd] bg-clip-text text-transparent">
              you can&apos;t get anywhere else.
            </span>
          </h1>

          {/* Sub */}
          <p className="text-base sm:text-lg text-[#8d96a0] leading-relaxed mb-6 max-w-2xl">
            Track whale positions, detect cross-platform arbitrage, and see the smart money moves on Polymarket and Kalshi — updated every 30 minutes.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-10 mb-6">
            <div>
              <div className="text-2xl font-bold tabular-nums font-mono text-[#f0f6fc]">
                {marketCount > 0 ? <CountUp end={marketCount} /> : "—"}
              </div>
              <div className="text-xs text-[#8d96a0] uppercase tracking-wide mt-0.5">Markets Tracked</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums font-mono text-[#57D7BA]">
                {disagreeCount > 0 ? <CountUp end={disagreeCount} /> : "—"}
              </div>
              <div className="text-xs text-[#8d96a0] uppercase tracking-wide mt-0.5">Active Disagreements</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums font-mono text-[#f0f6fc]">
                {whaleCount > 0 ? <CountUp end={whaleCount} /> : "—"}
              </div>
              <div className="text-xs text-[#8d96a0] uppercase tracking-wide mt-0.5">Whales Tracked</div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/disagrees"
              className="inline-flex items-center gap-2 bg-[#57D7BA] text-[#0d1117] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#57D7BA]/90 transition-all duration-150 active:scale-[0.97] shadow-glow-brand"
            >
              See Live Opportunities
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/whales"
              className="inline-flex items-center gap-2 bg-[#161b27] text-[#f0f6fc] font-semibold text-sm px-5 py-2.5 rounded-lg border border-[#21262d] hover:border-[#57D7BA]/40 transition-all duration-150 active:scale-[0.97]"
            >
              Browse Whales
            </Link>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF STRIP ─────────────────────────────────────────── */}
      {(marketCount > 0 || disagreeCount > 0 || whaleCount > 0) && (
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-4 px-6 rounded-2xl bg-[#161b27] border border-[#21262d]">
          {marketCount > 0 && (
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-[#57D7BA]/10 flex items-center justify-center shrink-0">
                <Activity className="size-4 text-[#57D7BA]" />
              </div>
              <div>
                <div className="text-base font-bold font-mono tabular-nums text-[#f0f6fc]">{marketCount.toLocaleString()}</div>
                <div className="text-[10px] text-[#8d96a0] uppercase tracking-wide">Markets</div>
              </div>
            </div>
          )}
          {whaleCount > 0 && (
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center shrink-0">
                <Users className="size-4 text-[#8b5cf6]" />
              </div>
              <div>
                <div className="text-base font-bold font-mono tabular-nums text-[#f0f6fc]">{whaleCount.toLocaleString()}</div>
                <div className="text-[10px] text-[#8d96a0] uppercase tracking-wide">Whales</div>
              </div>
            </div>
          )}
          {disagreeCount > 0 && (
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center shrink-0">
                <GitCompareArrows className="size-4 text-[#f59e0b]" />
              </div>
              <div>
                <div className="text-base font-bold font-mono tabular-nums text-[#f0f6fc]">{disagreeCount.toLocaleString()}</div>
                <div className="text-[10px] text-[#8d96a0] uppercase tracking-wide">Disagreements</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── QUIVER INDICES STRIP ────────────────────────────────────────── */}
      {indices.length > 0 && (
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#21262d]">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="size-3.5 text-[#57D7BA]" />
              <span className="text-[10px] font-bold text-[#57D7BA] uppercase tracking-widest">Quiver Indices</span>
            </div>
            <Link href="/indices" className="text-[10px] text-[#484f58] hover:text-[#57D7BA] transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-[#21262d]">
            {indices.map((idx) => {
              const color = indexZoneColor(idx.current_value);
              return (
                <Link
                  key={idx.slug}
                  href={`/indices/${idx.slug}`}
                  className="p-3 hover:bg-[#1c2333] transition-colors group flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-[#8d96a0] group-hover:text-[#f0f6fc] transition-colors truncate">
                      {shortIndexName(idx.name)}
                    </p>
                    <p className="text-[10px] text-[#484f58] uppercase tracking-wide">{idx.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-black tabular-nums" style={{ color }}>
                      {idx.current_value.toFixed(1)}
                    </div>
                    {idx.change_24h != null && (
                      <div className="flex items-center gap-0.5 justify-end text-[10px] font-mono tabular-nums"
                        style={{ color: idx.change_24h >= 0 ? "#3fb950" : "#f85149" }}>
                        {idx.change_24h >= 0 ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
                        {idx.change_24h >= 0 ? "+" : ""}{idx.change_24h.toFixed(1)}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── THE MARKET DISAGREES ─────────────────────────────────────────── */}
      <Card className="bg-[#161b27] border-[#21262d]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
                <GitCompareArrows className="size-4 text-[#f59e0b]" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-[#f0f6fc]">The Market Disagrees</CardTitle>
                <CardDescription className="text-[11px] text-[#8d96a0]">
                  Cross-platform spreads ≥ 10pts — potential arbitrage opportunities
                </CardDescription>
              </div>
            </div>
            <Link href="/disagrees" className="text-[11px] text-[#484f58] hover:text-[#57D7BA] transition-colors shrink-0">
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {top3Disagrees.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#484f58]">Loading disagreements…</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {top3Disagrees.map((d) => (
                <DisagreeCard key={d.id} d={d} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── THREE-COLUMN LAYOUT ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* LEFT — Biggest Movers */}
        <div className="lg:col-span-5">
          <Card className="bg-[#161b27] border-[#21262d] h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-[#57D7BA]/10 flex items-center justify-center">
                    <TrendingUp className="size-4 text-[#57D7BA]" />
                  </div>
                  <CardTitle className="text-sm font-bold text-[#f0f6fc]">Biggest Movers Right Now</CardTitle>
                </div>
                <LastUpdated lastFetched={lastFetched} refreshing={refreshing} onRetry={retry} />
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#21262d]">
                    <TableHead className="text-[#8d96a0] text-[10px] pl-4">CONTRACT</TableHead>
                    <TableHead className="text-[#8d96a0] text-[10px] text-center">TREND</TableHead>
                    <TableHead className="text-[#8d96a0] text-[10px] text-right">PRICE</TableHead>
                    <TableHead className="text-[#8d96a0] text-[10px] text-right">24H</TableHead>
                    <TableHead className="text-[#8d96a0] text-[10px] text-right pr-4">VOL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {biggestMovers.slice(0, 6).map((m) => {
                    const sparkValues = m.spark.map((s) => s.v);
                    return (
                      <TableRow
                        key={m.id}
                        className="border-[#21262d] hover:bg-[#1c2333] cursor-pointer transition-colors"
                        onClick={() => { if (typeof window !== "undefined") window.location.href = `/markets/${m.id}`; }}
                      >
                        <TableCell className="pl-4 py-2">
                          <Tooltip>
                            <TooltipTrigger>
                              <p className="text-xs text-[#f0f6fc] truncate max-w-[160px]">{m.q}</p>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[260px]">
                              <p className="text-xs">{m.q}</p>
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-[9px] text-[#484f58]">{m.cat}</span>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <div className="flex justify-center">
                            <InlineSparkline data={sparkValues} positive={m.change >= 0} width={48} height={18} />
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-2 font-mono tabular-nums text-xs text-[#f0f6fc]">
                          {m.price}¢
                        </TableCell>
                        <TableCell className={`text-right py-2 font-mono tabular-nums text-xs font-bold ${m.change >= 0 ? "text-[#3fb950]" : "text-[#f85149]"}`}>
                          <div className="flex items-center justify-end gap-0.5">
                            {m.change >= 0 ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                            {formatSignedPt(m.change)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-2 text-xs text-[#8d96a0] pr-4">
                          {m.vol}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* CENTER — Highest Volume Markets */}
        <div className="lg:col-span-4">
          <Card className="bg-[#161b27] border-[#21262d] h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-[#388bfd]/10 flex items-center justify-center">
                  <BarChart3 className="size-4 text-[#388bfd]" />
                </div>
                <CardTitle className="text-sm font-bold text-[#f0f6fc]">Highest Volume Markets</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {breakingMarkets.slice(0, 6).map((m) => (
                <Link
                  key={m.id}
                  href={`/markets/${m.id}`}
                  className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-[#1c2333] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#f0f6fc] truncate group-hover:text-[#57D7BA] transition-colors">{m.title}</p>
                    <p className="text-[10px] text-[#484f58]">{m.vol} vol · {m.time}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold font-mono tabular-nums text-[#f0f6fc]">{m.price}¢</div>
                    {m.hot && <Flame className="size-3 text-[#f59e0b] ml-auto" />}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Top Whales by P&L */}
        <div className="lg:col-span-3">
          <Card className="bg-[#161b27] border-[#21262d] h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                    <Trophy className="size-4 text-[#8b5cf6]" />
                  </div>
                  <CardTitle className="text-sm font-bold text-[#f0f6fc]">Top Whales by P&amp;L</CardTitle>
                </div>
                <Link href="/whales" className="text-[10px] text-[#484f58] hover:text-[#57D7BA] transition-colors">
                  All →
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {whaleActivity.slice(0, 5).map((w) => (
                <Link
                  key={w.id}
                  href={`/whales/${w.id}`}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#1c2333] transition-colors group"
                >
                  <div className="size-7 rounded-full bg-[#2a2f45] flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold font-mono text-[#8892b0]">{w.rank}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#f0f6fc] truncate group-hover:text-[#57D7BA] transition-colors">{w.name}</p>
                    <p className="text-[10px] text-[#8d96a0]">{w.pos}</p>
                  </div>
                  {w.acc > 0 && (
                    <span className="text-[10px] font-mono tabular-nums text-[#3fb950] shrink-0">{w.acc}%</span>
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <div className="border-t border-[#21262d] pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-[10px] text-[#484f58]">
          © 2026 Quiver Markets — not financial advice
        </span>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
          {[
            { label: "About", href: "/about" },
            { label: "Methodology", href: "/methodology" },
            { label: "Contact", href: "/contact" },
            { label: "Terms", href: "/terms" },
            { label: "Privacy", href: "/privacy" },
          ].map((l) => (
            <Link key={l.href} href={l.href}
              className="text-[10px] text-[#8d96a0] hover:text-[#57D7BA] transition-colors">
              {l.label}
            </Link>
          ))}
          <a
            href="https://thecapitoldossier.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-[#8d96a0] hover:text-[#57D7BA] transition-colors"
          >
            The Capitol Dossier <ExternalLink className="size-2.5" />
          </a>
        </nav>
      </div>
    </div>
  );
}
