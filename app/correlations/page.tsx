"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  GitMerge,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CorrelationRow {
  market_a_id: string;
  market_b_id: string;
  correlation: number;
  sample_count: number;
  category_a: string | null;
  category_b: string | null;
  question_a: string | null;
  question_b: string | null;
  price_a: number | null;
  price_b: number | null;
  computed_at: string;
}

type DirectionFilter = "all" | "positive" | "negative";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function corrLabel(r: number): string {
  const a = Math.abs(r);
  const dir = r >= 0 ? "positive" : "negative";
  if (a >= 0.9) return `Extremely ${dir}`;
  if (a >= 0.75) return `Strongly ${dir}`;
  if (a >= 0.6) return `Moderately ${dir}`;
  return `Weakly ${dir}`;
}

function corrColor(r: number): string {
  const a = Math.abs(r);
  if (r >= 0) {
    if (a >= 0.75) return "#3fb950";
    if (a >= 0.6) return "#57D7BA";
    return "#8d96a0";
  } else {
    if (a >= 0.75) return "#f85149";
    if (a >= 0.6) return "#d29922";
    return "#8d96a0";
  }
}

function CategoryBadge({ cat }: { cat: string | null }) {
  if (!cat) return null;
  return (
    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[#388bfd]/10 text-[#388bfd] border border-[#388bfd]/20">
      {cat}
    </span>
  );
}

// ─── Mini dual-line chart fetching from price_history ────────────────────────
function MiniCorrelationChart({
  aId,
  bId,
}: {
  aId: string;
  bId: string;
}) {
  const [points, setPoints] = useState<{ t: string; a: number; b: number }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Try market_price_history first, fallback to price_history
    async function load() {
      // Try market_price_history (new table)
      const { data: mph } = await supabase
        .from("market_price_history")
        .select("market_id, price, recorded_at")
        .in("market_id", [aId, bId])
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true })
        .limit(200);

      let rows = mph ?? [];

      // Fallback to price_history (CLOB-sourced)
      if (!rows.length) {
        const { data: ph } = await supabase
          .from("price_history")
          .select("market_id, price, timestamp")
          .in("market_id", [aId, bId])
          .gte("timestamp", since)
          .order("timestamp", { ascending: true })
          .limit(200);

        rows = (ph ?? []).map((r) => ({ ...r, recorded_at: r.timestamp }));
      }

      if (!rows.length) { setLoaded(true); return; }

      const aRows = rows.filter((r) => r.market_id === aId);
      const bRows = rows.filter((r) => r.market_id === bId);

      // Sample every N-th point so chart stays legible
      const N = Math.max(1, Math.ceil(aRows.length / 30));
      const sampled = aRows
        .filter((_, i) => i % N === 0)
        .map((ra) => {
          const closest = bRows.reduce(
            (best, rb) =>
              Math.abs(new Date(rb.recorded_at).getTime() - new Date(ra.recorded_at).getTime()) <
              Math.abs(new Date(best.recorded_at).getTime() - new Date(ra.recorded_at).getTime())
                ? rb
                : best,
            bRows[0]
          );
          return {
            t: new Date(ra.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            a: Number(ra.price),
            b: closest ? Number(closest.price) : 0,
          };
        })
        .filter((p) => p.b > 0);

      setPoints(sampled);
      setLoaded(true);
    }

    load();
  }, [aId, bId]);

  if (!loaded) {
    return <div className="h-14 w-32 rounded bg-[#0d1117] animate-pulse" />;
  }
  if (!points.length) {
    return (
      <div className="h-14 w-32 rounded bg-[#0d1117] flex items-center justify-center">
        <span className="text-[9px] text-[#484f58]">no data</span>
      </div>
    );
  }

  return (
    <div className="h-14 w-32">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <Tooltip
            contentStyle={{ background: "#1c2333", border: "1px solid #21262d", borderRadius: 6, fontSize: 10 }}
            labelStyle={{ color: "#8d96a0" }}
          />
          <Line type="monotone" dataKey="a" stroke="#57D7BA" strokeWidth={1.5} dot={false} name="Market A" />
          <Line type="monotone" dataKey="b" stroke="#d29922" strokeWidth={1.5} dot={false} name="Market B" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Correlation Card ─────────────────────────────────────────────────────────
function CorrelationCard({ row }: { row: CorrelationRow }) {
  const [expanded, setExpanded] = useState(false);
  const c = row.correlation;
  const color = corrColor(c);
  const label = corrLabel(c);

  return (
    <div className="rounded-xl bg-[#161b27] border border-[#21262d] hover:border-[#388bfd]/20 transition-colors overflow-hidden">
      <button
        className="w-full text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-3 p-4">
          {/* Correlation coefficient */}
          <div
            className="shrink-0 w-14 text-center rounded-lg px-1 py-2 border"
            style={{ borderColor: `${color}30`, backgroundColor: `${color}10` }}
          >
            <div className="text-base font-bold font-mono tabular-nums" style={{ color }}>
              {c >= 0 ? "+" : ""}{c.toFixed(2)}
            </div>
            <div className="text-[8px] font-bold uppercase tracking-widest mt-0.5" style={{ color: `${color}99` }}>
              {c >= 0 ? (
                <TrendingUp className="size-2.5 mx-auto" />
              ) : (
                <TrendingDown className="size-2.5 mx-auto" />
              )}
            </div>
          </div>

          {/* Questions */}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <div className="flex items-start gap-1.5">
                <CategoryBadge cat={row.category_a} />
                {row.price_a != null && (
                  <span className="text-[9px] font-mono text-[#484f58]">{Math.round(row.price_a)}¢</span>
                )}
              </div>
              <p className="text-xs text-[#f0f6fc] font-medium line-clamp-2 mt-0.5 leading-snug">
                {row.question_a ?? row.market_a_id}
              </p>
            </div>
            <div className="border-t border-[#21262d]/50 pt-2">
              <div className="flex items-start gap-1.5">
                <CategoryBadge cat={row.category_b} />
                {row.price_b != null && (
                  <span className="text-[9px] font-mono text-[#484f58]">{Math.round(row.price_b)}¢</span>
                )}
              </div>
              <p className="text-xs text-[#f0f6fc] font-medium line-clamp-2 mt-0.5 leading-snug">
                {row.question_b ?? row.market_b_id}
              </p>
            </div>
          </div>

          {/* Right column */}
          <div className="shrink-0 flex flex-col items-end gap-2 ml-1">
            <MiniCorrelationChart aId={row.market_a_id} bId={row.market_b_id} />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#484f58] font-mono">{row.sample_count}pts</span>
              {expanded ? (
                <ChevronUp className="size-3.5 text-[#484f58]" />
              ) : (
                <ChevronDown className="size-3.5 text-[#484f58]" />
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#21262d] px-4 py-3 bg-[#0d1117]/50 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[#f0f6fc]">{label}</div>
              <div className="text-[11px] text-[#8d96a0] mt-0.5">
                {c >= 0
                  ? `When one market moves up, the other tends to move up — they track similar outcomes.`
                  : `When one market moves up, the other tends to move down — they represent opposing outcomes.`}
              </div>
              <div className="text-[10px] text-[#484f58] mt-1">
                Based on {row.sample_count} aligned price observations · Last computed {new Date(row.computed_at).toLocaleDateString()}
              </div>
            </div>
            <Link
              href={`/correlations/${row.market_a_id}?vs=${row.market_b_id}`}
              className="shrink-0 flex items-center gap-1 text-[11px] text-[#388bfd] hover:text-[#388bfd]/80 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Detail <ExternalLink className="size-3" />
            </Link>
          </div>
          <div className="rounded-lg bg-[#d29922]/8 border border-[#d29922]/20 px-3 py-2 text-[10px] text-[#d29922]">
            <AlertTriangle className="size-3 inline mr-1.5" />
            Correlation does not imply causation. These markets may be responding to the same underlying events rather than influencing each other.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CorrelationsPage() {
  const [rows, setRows] = useState<CorrelationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"ok" | "empty" | "table_missing">("ok");
  const [configOpen, setConfigOpen] = useState(false);

  // Filters
  const [minStrength, setMinStrength] = useState(0.7);
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const [sort, setSort] = useState<"strength" | "recent">("strength");

  // All categories from results
  const [categoryFilter, setCategoryFilter] = useState("");
  const allCategories = Array.from(
    new Set(rows.flatMap((r) => [r.category_a, r.category_b]).filter(Boolean) as string[])
  ).sort();

  const fetchCorrelations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        minStrength: String(minStrength),
        direction,
        limit: "100",
        sort,
        ...(categoryFilter ? { category: categoryFilter } : {}),
      });
      const res = await fetch(`/api/correlations?${params}`);
      const json = await res.json();

      if (json.status === "table_missing") {
        setStatus("table_missing");
        setRows([]);
      } else if (!json.correlations?.length) {
        setStatus("empty");
        setRows([]);
      } else {
        setStatus("ok");
        setRows(json.correlations);
      }
    } catch {
      setStatus("empty");
    } finally {
      setLoading(false);
    }
  }, [minStrength, direction, sort, categoryFilter]);

  useEffect(() => {
    fetchCorrelations();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const posCount = rows.filter((r) => r.correlation >= 0).length;
  const negCount = rows.filter((r) => r.correlation < 0).length;
  const strongCount = rows.filter((r) => Math.abs(r.correlation) >= 0.8).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#a371f7]/10 flex items-center justify-center">
            <GitMerge className="w-5 h-5 text-[#a371f7]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">Market Correlation Engine</h1>
            <p className="text-xs text-[#8d96a0]">Discover hidden relationships between prediction markets.</p>
          </div>
        </div>
        <p className="text-sm text-[#8d96a0] leading-relaxed">
          Pairs of markets whose prices move together — or opposite. Useful for finding pairs trades,
          confirming directional signals, or identifying lead-lag relationships that might give you an edge.
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-[#d29922]/10 border border-[#d29922]/20 px-3 py-2 text-[11px] text-[#d29922]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Correlation does not imply causation. Computed nightly from returns-based Pearson correlation.{" "}
          <Link href="/methodology#correlations" className="underline hover:opacity-80 transition-opacity">
            Methodology →
          </Link>
        </div>
      </div>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      {status === "ok" && rows.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-3 text-center">
            <div className="text-xl font-bold text-[#f0f6fc] tabular-nums">{rows.length}</div>
            <div className="text-[10px] text-[#484f58] uppercase tracking-widest font-bold mt-0.5">Pairs Found</div>
          </div>
          <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-3 text-center">
            <div className="text-xl font-bold text-[#3fb950] tabular-nums">{posCount}</div>
            <div className="text-[10px] text-[#484f58] uppercase tracking-widest font-bold mt-0.5">Positive</div>
          </div>
          <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-3 text-center">
            <div className="text-xl font-bold text-[#f85149] tabular-nums">{negCount}</div>
            <div className="text-[10px] text-[#484f58] uppercase tracking-widest font-bold mt-0.5">Inverse</div>
          </div>
        </div>
      )}

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#f0f6fc] hover:bg-[#1c2333] transition-colors"
          onClick={() => setConfigOpen((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-[#8d96a0]" />
            Filters &amp; sorting
          </div>
          {configOpen ? (
            <ChevronUp className="size-4 text-[#8d96a0]" />
          ) : (
            <ChevronDown className="size-4 text-[#8d96a0]" />
          )}
        </button>

        {configOpen && (
          <div className="px-4 pb-4 border-t border-[#21262d] space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Min strength */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#8d96a0]">Min |Correlation|</label>
                  <span className="text-xs font-mono font-bold text-[#a371f7]">{minStrength.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.6}
                  max={1.0}
                  step={0.05}
                  value={minStrength}
                  onChange={(e) => setMinStrength(Number(e.target.value))}
                  className="w-full accent-[#a371f7]"
                />
                <div className="flex justify-between text-[9px] text-[#484f58]">
                  <span>0.60 (moderate)</span>
                  <span>1.00 (perfect)</span>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#8d96a0]">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-[#a371f7]/40"
                >
                  <option value="">All categories</option>
                  {allCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Direction */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#8d96a0]">Direction</div>
                <div className="flex items-center gap-1">
                  {(["all", "positive", "negative"] as DirectionFilter[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDirection(d)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        direction === d
                          ? "bg-[#a371f7]/15 text-[#a371f7] border border-[#a371f7]/30"
                          : "text-[#484f58] border border-[#21262d] hover:text-[#8d96a0]"
                      }`}
                    >
                      {d === "all" ? "Both" : d === "positive" ? "+ Positive" : "− Inverse"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#8d96a0]">Sort</div>
                <div className="flex items-center gap-1">
                  {(["strength", "recent"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSort(s)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        sort === s
                          ? "bg-[#a371f7]/15 text-[#a371f7] border border-[#a371f7]/30"
                          : "text-[#484f58] border border-[#21262d] hover:text-[#8d96a0]"
                      }`}
                    >
                      {s === "strength" ? "Strongest" : "Most Recent"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={fetchCorrelations}
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-[#a371f7] hover:bg-[#a371f7]/80 disabled:opacity-50 text-white text-sm font-bold transition-colors"
            >
              {loading ? "Loading…" : "Apply Filters"}
            </button>
          </div>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-[#161b27] border border-[#21262d] animate-pulse" />
          ))}
        </div>
      ) : status === "table_missing" ? (
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-10 text-center space-y-3">
          <GitMerge className="size-8 text-[#484f58] mx-auto" />
          <div className="text-sm font-semibold text-[#f0f6fc]">Correlation Engine Initializing</div>
          <p className="text-xs text-[#8d96a0] max-w-sm mx-auto">
            Run <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">session25-price-history.sql</code> in Supabase,
            then run the ingest pipeline for 24+ hours before computing correlations.
          </p>
        </div>
      ) : status === "empty" ? (
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-10 text-center space-y-3">
          <GitMerge className="size-8 text-[#484f58] mx-auto" />
          <div className="text-sm font-semibold text-[#f0f6fc]">Correlations Computing</div>
          <p className="text-xs text-[#8d96a0] max-w-sm mx-auto">
            Correlations are computed nightly from price history. Check back tomorrow.
          </p>
          <div className="text-[11px] text-[#484f58]">
            Try lowering the minimum correlation threshold, or check back after the next nightly run.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#484f58]">
              {rows.length} pair{rows.length !== 1 ? "s" : ""}
              {strongCount > 0 && ` · ${strongCount} with |r| ≥ 0.80`}
            </span>
            <Link
              href="/methodology#correlations"
              className="text-[11px] text-[#484f58] hover:text-[#8d96a0] transition-colors"
            >
              How is this computed? →
            </Link>
          </div>
          {rows.map((row) => (
            <CorrelationCard
              key={`${row.market_a_id}:${row.market_b_id}`}
              row={row}
            />
          ))}
        </div>
      )}
    </div>
  );
}
