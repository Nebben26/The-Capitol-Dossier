"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GitCompareArrows,
  Search,
  LayoutGrid,
  List,
  ChevronUp,
  ChevronDown,
  Inbox,
  AlertTriangle,
} from "lucide-react";
import { useDisagreements } from "@/hooks/useData";
import { supabase } from "@/lib/supabase";
import type { Disagreement } from "@/lib/mockData";

const catFilters = ["All", "Economics", "Elections", "Crypto", "Tech", "Geopolitics"];
const PAGE_SIZE = 20;

type SortDir = "asc" | "desc";
type ViewMode = "grid" | "table";

// ─── Simple disagree card ────────────────────────────────────────────────────
function DisagreeCard({ d }: { d: Disagreement }) {
  const spreadColor = d.spread >= 20 ? "#f59e0b" : d.spread >= 10 ? "#57D7BA" : "#8d96a0";
  const href = d.marketId ? `/markets/${d.marketId}` : "/disagrees";
  return (
    <Link
      href={href}
      className="block rounded-xl bg-[#161b27] border border-[#21262d] hover:border-[#57D7BA]/30 transition-colors p-4 h-full"
    >
      <p className="text-xs font-medium text-[#e2e8f0] line-clamp-2 leading-snug mb-3 min-h-[2.5rem]">
        {d.question}
      </p>
      <div className="flex items-center justify-between gap-2">
        <div className="text-center">
          <div className="text-[9px] text-[#8892b0] mb-0.5">PM</div>
          <div className="font-mono text-sm font-bold tabular-nums text-[#e2e8f0]">{d.polyPrice}¢</div>
        </div>
        <div className="text-center px-1">
          <div className="font-mono font-bold tabular-nums text-base" style={{ color: spreadColor }}>
            {d.spread}pt
          </div>
          <div className="text-[8px] text-[#8892b0]">spread</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] text-[#8892b0] mb-0.5">KX</div>
          <div className="font-mono text-sm font-bold tabular-nums text-[#e2e8f0]">{d.kalshiPrice}¢</div>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#57D7BA]/10 text-[#57D7BA] shrink-0">
          {d.category}
        </span>
      </div>
    </Link>
  );
}

function minutesAgo(ts: Date | null): string {
  if (!ts) return "—";
  const m = Math.round((Date.now() - ts.getTime()) / 60000);
  if (m < 1) return "just now";
  return `${m}m ago`;
}

// ─── Main content ────────────────────────────────────────────────────────────
function DisagreesContent() {
  const { disagreements, lastFetched } = useDisagreements();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _searchParams = useSearchParams(); // keep Suspense boundary active

  const [searchQuery, setSearchQuery] = useState("");
  const [category,    setCategory]    = useState("All");
  const [sortDir,     setSortDir]     = useState<SortDir>("desc");
  const [viewMode,    setViewMode]    = useState<ViewMode>("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeTab,   setActiveTab]   = useState<"active" | "resolved">("active");

  const [resolvedDisagreements, setResolvedDisagreements] = useState<Array<{
    id: string;
    question: string;
    spread: number;
    resolved_at: string | null;
    converged: boolean;
  }>>([]);
  const [resolvedLoading, setResolvedLoading] = useState(false);

  // Dynamic page title
  useEffect(() => {
    if (disagreements.length > 0) {
      document.title = `${disagreements.length} Disagreements · Quiver Markets`;
    }
    return () => { document.title = "Disagreements · Quiver Markets"; };
  }, [disagreements.length]);

  // Fetch resolved disagreements when that tab is opened.
  // NOTE: the `disagreements` table is wiped and rebuilt each ingest run —
  // resolved markets are never present in it. We query `disagreement_snapshots`
  // instead, which persists historical spread observations, then join to `markets`
  // to filter for resolved pairs. The "final spread" is the last snapshot we
  // captured for each pair — not necessarily the exact spread at resolution.
  useEffect(() => {
    if (activeTab !== "resolved") return;
    if (resolvedDisagreements.length > 0) return; // already loaded
    setResolvedLoading(true);
    (async () => {
      try {
        // Step 1: get resolved market IDs (cap at 100 to keep the IN clause short)
        const { data: resolvedMarkets } = await supabase
          .from("markets")
          .select("id")
          .eq("resolved", true)
          .limit(100);

        if (!resolvedMarkets || resolvedMarkets.length === 0) {
          setResolvedLoading(false);
          return;
        }

        const resolvedIds = resolvedMarkets.map((m: { id: string }) => m.id);

        // Step 2: pull the most recent snapshots for any pair that involved a
        // resolved market. disagreement_snapshots is an append-only table so
        // resolved pairs are still present here even after ingest clears `disagreements`.
        const { data: rows } = await supabase
          .from("disagreement_snapshots")
          .select("poly_market_id, kalshi_market_id, question, spread, captured_at")
          .or(`poly_market_id.in.(${resolvedIds.join(",")}),kalshi_market_id.in.(${resolvedIds.join(",")})`)
          .order("captured_at", { ascending: false })
          .limit(500);

        if (!rows || rows.length === 0) {
          setResolvedLoading(false);
          return;
        }

        // Step 3: deduplicate — keep only the most-recent snapshot per pair
        const seen = new Map<string, typeof rows[0]>();
        for (const r of rows) {
          const key = `${r.poly_market_id}|${r.kalshi_market_id}`;
          if (!seen.has(key)) seen.set(key, r);
        }

        setResolvedDisagreements(
          Array.from(seen.values()).map((r) => ({
            id: `${r.poly_market_id}|${r.kalshi_market_id}`,
            question: r.question,
            spread: Number(r.spread) || 0,
            resolved_at: r.captured_at,
            converged: (Number(r.spread) || 0) < 2,
          }))
        );
      } catch {
        // non-fatal — show empty state
      } finally {
        setResolvedLoading(false);
      }
    })();
  }, [activeTab]);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = disagreements;
    if (category !== "All") result = result.filter((d) => d.category === category);
    if (searchQuery) result = result.filter((d) => d.question.toLowerCase().includes(searchQuery.toLowerCase()));
    return [...result].sort((a, b) =>
      sortDir === "desc" ? b.spread - a.spread : a.spread - b.spread
    );
  }, [disagreements, category, searchQuery, sortDir]);

  // Reset pagination whenever filters change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [category, searchQuery, sortDir]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">

      {/* ── 1. Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <GitCompareArrows className="size-7 text-[#f59e0b]" />
            The Market Disagrees
            <span className="px-2 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-sm font-mono tabular-nums">
              {disagreements.length}
            </span>
          </h1>
          <p className="text-sm text-[#8892b0] mt-1">
            Cross-platform price spreads where Polymarket and Kalshi see the world differently ·{" "}
            <span className="text-[#484f58] text-xs">Updated {minutesAgo(lastFetched)}</span>
          </p>
        </div>
      </div>

      {/* ── 2. Filter row ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {catFilters.map((cat) => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setVisibleCount(PAGE_SIZE); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${
                category === cat
                  ? "bg-[#f59e0b] text-[#0f1119]"
                  : "bg-[#161b27] text-[#8892b0] hover:text-[#e2e8f0] border border-[#21262d]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8892b0]" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(PAGE_SIZE); }}
            className="h-9 pl-9 pr-4 w-44 rounded-lg bg-[#161b27] border border-[#21262d] text-sm text-[#e2e8f0] placeholder:text-[#8892b0]/60 focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 transition-all"
          />
        </div>

        {/* Spread sort toggle */}
        <button
          onClick={() => setSortDir((v) => (v === "desc" ? "asc" : "desc"))}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#161b27] border border-[#21262d] text-[#8892b0] hover:text-[#e2e8f0] text-[10px] font-semibold transition-colors"
        >
          Spread{" "}
          {sortDir === "desc" ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
        </button>

        {/* Result count */}
        <span className="text-[10px] text-[#484f58] font-mono">{filtered.length} results</span>

        <div className="flex-1" />

        {/* Grid / list toggle */}
        <div className="flex items-center gap-0.5 bg-[#161b27] rounded-lg p-0.5 border border-[#21262d]">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-[#f59e0b] text-[#0f1119]" : "text-[#8892b0]"}`}
          >
            <LayoutGrid className="size-3.5" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-[#f59e0b] text-[#0f1119]" : "text-[#8892b0]"}`}
          >
            <List className="size-3.5" />
          </button>
        </div>
      </div>

      {/* ── 3. Tabs ── */}
      <div className="flex items-center gap-1 border-b border-[#21262d]">
        {(["active", "resolved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-semibold transition-all capitalize border-b-2 -mb-px ${
              activeTab === tab
                ? "border-[#57D7BA] text-[#57D7BA]"
                : "border-transparent text-[#8892b0] hover:text-[#f0f6fc]"
            }`}
          >
            {tab === "active" ? "Active Arbs" : "Did This Arb Close?"}
            {tab === "active" && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[#f59e0b]/15 text-[#f59e0b] text-[9px]">
                {disagreements.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Resolved tab content ── */}
      {activeTab === "resolved" && (
        <div className="space-y-4">
          {resolvedLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-[#161b27] animate-pulse" />
              ))}
            </div>
          ) : resolvedDisagreements.length === 0 ? (
            <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-8 text-center space-y-3">
              <GitCompareArrows className="size-10 text-[#21262d] mx-auto" />
              <h3 className="text-base font-semibold text-[#f0f6fc]">No resolved arbs yet</h3>
              <p className="text-sm text-[#8d96a0] max-w-md mx-auto">
                This archive fills as markets resolve. When a market we tracked a spread on closes,
                it appears here with its final convergence outcome — did the arb pay off or blow out?
              </p>
            </div>
          ) : (
            <>
              {/* Summary stat */}
              {(() => {
                const convergedCount = resolvedDisagreements.filter((d) => d.converged).length;
                const pct = Math.round((convergedCount / resolvedDisagreements.length) * 100);
                return (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#161b27] border border-[#21262d]">
                    <GitCompareArrows className="size-4 text-[#57D7BA] shrink-0" />
                    <span className="text-sm text-[#8d96a0]">
                      <span className="text-[#f0f6fc] font-semibold">
                        {convergedCount} of {resolvedDisagreements.length}
                      </span>{" "}
                      tracked arbs converged at resolution{" "}
                      <span className="text-[#57D7BA] font-semibold">({pct}%)</span>
                    </span>
                    <div className="flex items-center gap-3 ml-auto text-[11px] text-[#484f58] shrink-0">
                      <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-[#3fb950] inline-block" />
                        Converged
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="size-2 rounded-full bg-[#f85149] inline-block" />
                        Did not converge
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {resolvedDisagreements.map((d) => (
                  <div key={d.id} className="rounded-xl bg-[#161b27] border border-[#21262d] p-4 space-y-2.5">
                    <p className="text-xs font-medium text-[#e2e8f0] line-clamp-2 leading-snug">{d.question}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-[#8892b0] uppercase tracking-wider">Last tracked spread</div>
                        <div className={`text-sm font-bold font-mono tabular-nums ${d.converged ? "text-[#3fb950]" : "text-[#f85149]"}`}>
                          {d.spread.toFixed(1)}pt
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${d.converged ? "bg-[#3fb950]/10 text-[#3fb950]" : "bg-[#f85149]/10 text-[#f85149]"}`}>
                        {d.converged ? "Converged" : "Did not converge"}
                      </span>
                    </div>
                    {d.resolved_at && (
                      <div className="text-[10px] text-[#484f58]">
                        Last observed{" "}
                        {new Date(d.resolved_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 4. Active tab — cards ── */}
      {activeTab === "active" && (
        <>
          {/* Empty: no data at all */}
          {disagreements.length === 0 && (
            <Card className="bg-[#161b27] border-[#21262d]">
              <CardContent className="py-16 text-center">
                <GitCompareArrows className="size-12 text-[#21262d] mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active arbitrage opportunities right now</h3>
                <p className="text-sm text-[#8892b0]">
                  Check back in 30 minutes — disagreements are recalculated each ingestion cycle.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Empty: filters match nothing */}
          {disagreements.length > 0 && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#161b27] border border-[#21262d] flex items-center justify-center mb-4">
                <Inbox className="w-7 h-7 text-[#484f58]" />
              </div>
              <h3 className="text-lg font-semibold text-[#f0f6fc] mb-1">No results</h3>
              <p className="text-sm text-[#8d96a0]">Try adjusting your search or filters.</p>
            </div>
          )}

          {/* Grid view */}
          {filtered.length > 0 && viewMode === "grid" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {visible.map((d) => (
                  <DisagreeCard key={d.id} d={d} />
                ))}
              </div>
              {/* ── 5. Show more ── */}
              {visibleCount < filtered.length && (
                <button
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  className="w-full py-3 rounded-lg border border-[#21262d] bg-[#161b27] text-sm font-medium text-[#8d96a0] hover:text-[#f0f6fc] hover:border-[#57D7BA]/40 transition-colors"
                >
                  Show more ({filtered.length - visibleCount} remaining)
                </button>
              )}
            </>
          )}

          {/* Table view */}
          {filtered.length > 0 && viewMode === "table" && (
            <>
              <Card className="bg-[#161b27] border-[#21262d]">
                <CardContent className="px-0 py-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#21262d] hover:bg-transparent">
                        <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">MARKET</TableHead>
                        <TableHead className="text-[10px] text-[#8892b0] font-medium">PM</TableHead>
                        <TableHead className="text-[10px] text-[#8892b0] font-medium">KX</TableHead>
                        <TableHead className="text-[10px] text-[#8892b0] font-medium">SPREAD</TableHead>
                        <TableHead className="text-[10px] text-[#8892b0] font-medium hidden lg:table-cell pr-4">CAT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visible.map((d) => {
                        const spreadColor =
                          d.spread >= 20 ? "#f59e0b" : d.spread >= 10 ? "#57D7BA" : "#8d96a0";
                        const href = d.marketId ? `/markets/${d.marketId}` : "/disagrees";
                        return (
                          <TableRow
                            key={d.id}
                            className="border-[#21262d]/50 hover:bg-[#f59e0b]/5 transition-colors"
                          >
                            <TableCell className="pl-4 py-2.5 max-w-[200px] sm:max-w-[360px]">
                              <div className="flex items-start gap-1.5">
                                {(d.matchConfidence ?? 1) < 0.5 && (
                                  <span title="Low-confidence match — verify before trading.">
                                    <AlertTriangle className="size-3 text-[#f59e0b] shrink-0 mt-0.5" />
                                  </span>
                                )}
                                <Link
                                  href={href}
                                  className="text-xs font-medium text-[#e2e8f0] hover:text-[#57D7BA] transition-colors leading-snug line-clamp-2"
                                >
                                  {d.question}
                                </Link>
                              </div>
                            </TableCell>
                            <TableCell className="py-2.5">
                              <span className="font-mono text-sm font-bold tabular-nums text-[#e2e8f0]">
                                {d.polyPrice}¢
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5">
                              <span className="font-mono text-sm font-bold tabular-nums text-[#e2e8f0]">
                                {d.kalshiPrice}¢
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5">
                              <span
                                className="font-mono text-sm font-bold tabular-nums"
                                style={{ color: spreadColor }}
                              >
                                {d.spread}pt
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5 hidden lg:table-cell pr-4">
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#57D7BA]/10 text-[#57D7BA]">
                                {d.category}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              {/* Show more (table) */}
              {visibleCount < filtered.length && (
                <button
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  className="w-full py-3 rounded-lg border border-[#21262d] bg-[#161b27] text-sm font-medium text-[#8d96a0] hover:text-[#f0f6fc] hover:border-[#57D7BA]/40 transition-colors"
                >
                  Show more ({filtered.length - visibleCount} remaining)
                </button>
              )}
            </>
          )}
        </>
      )}

      <footer className="flex items-center justify-between py-4 border-t border-[#21262d] text-[10px] text-[#8892b0]">
        <span>© 2026 Quiver Markets. Not financial advice. Data from Polymarket &amp; Kalshi.</span>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}

export default function DisagreesClient() {
  return (
    <Suspense fallback={null}>
      <DisagreesContent />
    </Suspense>
  );
}
