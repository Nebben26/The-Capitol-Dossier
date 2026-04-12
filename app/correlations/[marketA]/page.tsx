"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  GitMerge,
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CorrelatedMarket {
  otherId: string;
  otherQuestion: string | null;
  otherCategory: string | null;
  otherPrice: number | null;
  anchorQuestion: string | null;
  anchorPrice: number | null;
  correlation: number;
  sampleCount: number;
  computedAt: string;
}

interface ChartPoint {
  t: string;
  anchor: number;
  other: number;
}

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
  if (r >= 0) return a >= 0.75 ? "#3fb950" : "#57D7BA";
  return a >= 0.75 ? "#f85149" : "#d29922";
}

function tradingInsight(anchorQ: string | null, otherQ: string | null, r: number): string {
  if (!anchorQ || !otherQ) return "";
  const dir = r >= 0 ? "tends to move in the same direction" : "tends to move in the opposite direction";
  const strength = Math.abs(r) >= 0.8 ? "strongly" : "moderately";
  return `When "${anchorQ.slice(0, 60)}…" moves, "${otherQ.slice(0, 60)}…" ${strength} ${dir}.`;
}

// ─── Expanded price chart ─────────────────────────────────────────────────────
function PriceChart({
  anchorId,
  otherId,
  anchorLabel,
  otherLabel,
}: {
  anchorId: string;
  otherId: string;
  anchorLabel: string;
  otherLabel: string;
}) {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    async function load() {
      // Try market_price_history first
      let { data: rows } = await supabase
        .from("market_price_history")
        .select("market_id, price, recorded_at")
        .in("market_id", [anchorId, otherId])
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: true })
        .limit(400);

      if (!rows?.length) {
        // Fallback to CLOB price_history
        const { data: ph } = await supabase
          .from("price_history")
          .select("market_id, price, timestamp")
          .in("market_id", [anchorId, otherId])
          .gte("timestamp", since)
          .order("timestamp", { ascending: true })
          .limit(400);
        rows = (ph ?? []).map((r) => ({ ...r, recorded_at: r.timestamp }));
      }

      if (!rows?.length) { setLoading(false); return; }

      const aRows = rows.filter((r) => r.market_id === anchorId);
      const bRows = rows.filter((r) => r.market_id === otherId);

      const N = Math.max(1, Math.ceil(aRows.length / 60));
      const points: ChartPoint[] = aRows
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
            anchor: Number(ra.price),
            other: closest ? Number(closest.price) : 0,
          };
        })
        .filter((p) => p.other > 0);

      setData(points);
      setLoading(false);
    }

    load();
  }, [anchorId, otherId]);

  if (loading) {
    return <div className="h-48 rounded-xl bg-[#0d1117] animate-pulse" />;
  }
  if (!data.length) {
    return (
      <div className="h-32 rounded-xl bg-[#0d1117] flex items-center justify-center">
        <p className="text-xs text-[#484f58]">No price history available for this window.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-2 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-[#57D7BA] rounded" />
          <span className="text-[#8d96a0] truncate max-w-[180px]">{anchorLabel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-[#d29922] rounded" />
          <span className="text-[#8d96a0] truncate max-w-[180px]">{otherLabel}</span>
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
            <XAxis
              dataKey="t"
              tick={{ fill: "#484f58", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#484f58", fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              width={28}
              tickFormatter={(v) => `${v}¢`}
            />
            <Tooltip
              contentStyle={{ background: "#1c2333", border: "1px solid #21262d", borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: "#8d96a0" }}
            />
            <Line type="monotone" dataKey="anchor" stroke="#57D7BA" strokeWidth={2} dot={false} name={anchorLabel.slice(0, 30)} />
            <Line type="monotone" dataKey="other" stroke="#d29922" strokeWidth={2} dot={false} name={otherLabel.slice(0, 30)} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-[#484f58] text-center mt-1">30-day price history</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CorrelationDetailPage({
  params,
}: {
  params: Promise<{ marketA: string }>;
}) {
  const { marketA } = use(params);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("vs");

  const [anchorQuestion, setAnchorQuestion] = useState<string | null>(null);
  const [anchorPrice, setAnchorPrice] = useState<number | null>(null);
  const [corrs, setCorrs] = useState<CorrelatedMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(highlightId);

  useEffect(() => {
    fetch(`/api/correlations/${encodeURIComponent(marketA)}`)
      .then((r) => r.json())
      .then((json) => {
        setAnchorQuestion(json.anchor?.question ?? null);
        setAnchorPrice(json.anchor?.price ?? null);
        setCorrs(json.correlations ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [marketA]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* ── Back nav ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Link
          href="/correlations"
          className="inline-flex items-center gap-1.5 text-xs text-[#8d96a0] hover:text-[#f0f6fc] transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          All correlations
        </Link>
      </div>

      {/* ── Anchor market ───────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#161b27] border border-[#a371f7]/30 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <GitMerge className="size-4 text-[#a371f7]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#a371f7]">Anchor Market</span>
          {anchorPrice != null && (
            <span className="text-[10px] font-mono text-[#484f58]">{Math.round(anchorPrice)}¢</span>
          )}
        </div>
        <p className="text-sm font-semibold text-[#f0f6fc] leading-snug">
          {anchorQuestion ?? marketA}
        </p>
        {!loading && corrs.length > 0 && (
          <p className="text-[11px] text-[#8d96a0]">
            {corrs.length} correlated market{corrs.length !== 1 ? "s" : ""} found
            · {corrs.filter((c) => c.correlation >= 0).length} positive
            · {corrs.filter((c) => c.correlation < 0).length} inverse
          </p>
        )}
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-[#161b27] border border-[#21262d] animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Empty ───────────────────────────────────────────────────────── */}
      {!loading && corrs.length === 0 && (
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-10 text-center space-y-3">
          <GitMerge className="size-8 text-[#484f58] mx-auto" />
          <div className="text-sm text-[#f0f6fc]">No correlations found for this market.</div>
          <p className="text-xs text-[#8d96a0]">
            This market may not have enough price history yet, or no other markets met the
            significance threshold. Correlations are computed nightly.
          </p>
        </div>
      )}

      {/* ── Correlation list ────────────────────────────────────────────── */}
      {!loading && corrs.length > 0 && (
        <div className="space-y-3">
          {corrs.map((c) => {
            const color = corrColor(c.correlation);
            const label = corrLabel(c.correlation);
            const insight = tradingInsight(c.anchorQuestion, c.otherQuestion, c.correlation);
            const isExpanded = expandedId === c.otherId;

            return (
              <div
                key={c.otherId}
                className={`rounded-xl bg-[#161b27] border transition-colors overflow-hidden ${
                  isExpanded ? "border-[#388bfd]/30" : "border-[#21262d] hover:border-[#388bfd]/20"
                }`}
              >
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedId(isExpanded ? null : c.otherId)}
                >
                  <div className="flex items-start gap-3 p-4">
                    {/* Coefficient badge */}
                    <div
                      className="shrink-0 w-14 text-center rounded-lg px-1 py-2 border"
                      style={{ borderColor: `${color}30`, backgroundColor: `${color}10` }}
                    >
                      <div className="text-base font-bold font-mono tabular-nums" style={{ color }}>
                        {c.correlation >= 0 ? "+" : ""}{c.correlation.toFixed(2)}
                      </div>
                      <div className="flex justify-center mt-1">
                        {c.correlation >= 0 ? (
                          <TrendingUp className="size-3" style={{ color }} />
                        ) : (
                          <TrendingDown className="size-3" style={{ color }} />
                        )}
                      </div>
                    </div>

                    {/* Market info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {c.otherCategory && (
                          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[#388bfd]/10 text-[#388bfd] border border-[#388bfd]/20">
                            {c.otherCategory}
                          </span>
                        )}
                        {c.otherPrice != null && (
                          <span className="text-[9px] font-mono text-[#484f58]">{Math.round(c.otherPrice)}¢</span>
                        )}
                        <span className="text-[9px] text-[#484f58] font-mono">{c.sampleCount} pts</span>
                      </div>
                      <p className="text-sm font-medium text-[#f0f6fc] leading-snug line-clamp-2">
                        {c.otherQuestion ?? c.otherId}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
                      </div>
                    </div>

                    <Link
                      href={`/markets/${c.otherId}`}
                      className="shrink-0 p-1 text-[#484f58] hover:text-[#388bfd] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="size-3.5" />
                    </Link>
                  </div>
                </button>

                {/* Expanded: chart + insight */}
                {isExpanded && (
                  <div className="border-t border-[#21262d] px-4 py-4 space-y-4 bg-[#0d1117]/40">
                    <PriceChart
                      anchorId={marketA}
                      otherId={c.otherId}
                      anchorLabel={c.anchorQuestion?.slice(0, 50) ?? marketA}
                      otherLabel={c.otherQuestion?.slice(0, 50) ?? c.otherId}
                    />

                    {insight && (
                      <div className="rounded-lg bg-[#a371f7]/8 border border-[#a371f7]/20 px-3 py-2.5 space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-[#a371f7]">Trading Insight</div>
                        <p className="text-xs text-[#8d96a0] leading-relaxed">{insight}</p>
                      </div>
                    )}

                    <div className="rounded-lg bg-[#d29922]/8 border border-[#d29922]/20 px-3 py-2 text-[10px] text-[#d29922]">
                      <AlertTriangle className="size-3 inline mr-1" />
                      Correlation ≠ causation. Both markets may be responding to the same event. Computed{" "}
                      {new Date(c.computedAt).toLocaleDateString()}.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-[#484f58] text-center">
        <Link href="/methodology#correlations" className="hover:text-[#8d96a0] transition-colors">
          How correlations are computed →
        </Link>
      </div>
    </div>
  );
}
