"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, ArrowLeftRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface CorrelationRow {
  id: number;
  market_a_id: string;
  market_b_id: string;
  correlation: number;
  sample_size: number;
  market_a_question: string;
  market_a_platform: string;
  market_b_question: string;
  market_b_platform: string;
}

type Filter = "all" | "positive" | "negative";

function corrBadgeClass(r: number): string {
  if (r >= 0.7)  return "bg-[#57D7BA]/20 text-[#57D7BA] border border-[#57D7BA]/40";
  if (r >= 0.5)  return "bg-[#84cc16]/20 text-[#84cc16] border border-[#84cc16]/40";
  if (r <= -0.7) return "bg-red-500/20 text-red-400 border border-red-500/40";
  return "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40";
}

function corrSign(r: number): string {
  return r >= 0 ? `+${r.toFixed(2)}` : r.toFixed(2);
}

function platformColor(platform: string): string {
  return platform === "Kalshi" ? "#22c55e" : "#6366f1";
}

interface ChartPoint {
  ts: string;
  priceA: number | null;
  priceB: number | null;
}

function ExpandedChart({
  marketAId,
  marketBId,
  correlation,
  questionA,
  questionB,
}: {
  marketAId: string;
  marketBId: string;
  correlation: number;
  questionA: string;
  questionB: string;
}) {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from("price_history")
      .select("market_id, price, timestamp")
      .in("market_id", [marketAId, marketBId])
      .gte("timestamp", since)
      .order("timestamp", { ascending: true })
      .then(({ data: rows }) => {
        if (!rows?.length) { setLoading(false); return; }

        // Separate by market
        const aRows = rows.filter((r) => r.market_id === marketAId);
        const bRows = rows.filter((r) => r.market_id === marketBId);

        // Build union of timestamps
        const tsSet = new Set<string>();
        for (const r of rows) tsSet.add(r.timestamp);
        const timestamps = Array.from(tsSet).sort();

        const points: ChartPoint[] = timestamps.map((ts) => {
          const aMatch = [...aRows].reverse().find((r) => r.timestamp <= ts);
          const bMatch = [...bRows].reverse().find((r) => r.timestamp <= ts);
          return {
            ts: new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            priceA: aMatch ? Number(aMatch.price) : null,
            priceB: bMatch ? Number(bMatch.price) : null,
          };
        });

        setData(points.filter((p) => p.priceA !== null && p.priceB !== null));
        setLoading(false);
      });
  }, [marketAId, marketBId]);

  if (loading) {
    return <div className="py-6 text-center text-xs text-[#8892b0]">Loading chart…</div>;
  }
  if (!data.length) {
    return <div className="py-6 text-center text-xs text-[#8892b0]">No price data in this window.</div>;
  }

  return (
    <div className="mt-3 pt-3 border-t border-[#2f374f]">
      <ResponsiveContainer width="100%" height={250} minWidth={0} minHeight={0}>
        <LineChart data={data} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2f374f" />
          <XAxis
            dataKey="ts"
            tick={{ fill: "#8892b0", fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#8892b0", fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{ background: "#222638", border: "1px solid #2f374f", borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: "#8892b0" }}
          />
          <Line
            type="monotone"
            dataKey="priceA"
            name={questionA.slice(0, 30) + "…"}
            stroke="#57D7BA"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="priceB"
            name={questionB.slice(0, 30) + "…"}
            stroke="#f59e0b"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-[#4a5168] text-center mt-1">
        14-day price history — Pearson correlation: {corrSign(correlation)}
      </p>
    </div>
  );
}

export default function CorrelationsPage() {
  const [rows, setRows] = useState<CorrelationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"empty" | "missing" | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("correlations")
      .select(`
        id, market_a_id, market_b_id, correlation, sample_size,
        markets!correlations_market_a_id_fkey ( question, platform ),
        market_b:markets!correlations_market_b_id_fkey ( question, platform )
      `)
      .order("correlation", { ascending: false, referencedTable: undefined })
      .limit(50)
      .then(({ data, error: err }) => {
        if (err) {
          setError("missing");
          setLoading(false);
          return;
        }
        if (!data?.length) {
          setError("empty");
          setLoading(false);
          return;
        }
        // The join shape from Supabase: markets!fkey returns an object
        const mapped: CorrelationRow[] = (data as any[]).map((r) => ({
          id: r.id,
          market_a_id: r.market_a_id,
          market_b_id: r.market_b_id,
          correlation: Number(r.correlation),
          sample_size: r.sample_size,
          market_a_question: r.markets?.question ?? r.market_a_id,
          market_a_platform: r.markets?.platform ?? "Polymarket",
          market_b_question: r.market_b?.question ?? r.market_b_id,
          market_b_platform: r.market_b?.platform ?? "Polymarket",
        }));
        // Sort by |r| desc
        mapped.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
        setRows(mapped);
        setLoading(false);
      });
  }, []);

  const filtered = rows.filter((r) => {
    if (filter === "positive") return r.correlation > 0;
    if (filter === "negative") return r.correlation < 0;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Market Correlations</h1>
        <p className="text-sm text-[#8892b0] mt-1">
          Markets whose prices move together over the last 14 days. Discover hidden relationships and arbitrage opportunities.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        {(["all", "positive", "negative"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              filter === f
                ? "bg-[#57D7BA]/15 text-[#57D7BA] border-[#57D7BA]/40"
                : "text-[#8892b0] border-[#2f374f] hover:text-[#e2e8f0] hover:border-[#4a5168]"
            }`}
          >
            {f === "all" ? "All" : f === "positive" ? "Positive (+)" : "Negative (−)"}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-[#8892b0] text-sm">Loading correlations…</div>
      ) : error === "missing" ? (
        <div className="text-center py-20 text-[#8892b0] text-sm">
          Correlations feature is initializing. Check back in a few minutes.
        </div>
      ) : error === "empty" ? (
        <div className="text-center py-20 text-[#8892b0] text-sm">
          Correlations haven't been computed yet. Check back after the next update cycle.
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((row) => {
            const isExpanded = expandedId === row.id;
            return (
              <div
                key={row.id}
                className="rounded-xl bg-[#222638] border border-[#2f374f] hover:border-[#4a5168] transition-colors"
              >
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : row.id)}
                  className="w-full flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-3 text-left"
                >
                  {/* Correlation badge */}
                  <span
                    className={`self-start sm:self-auto shrink-0 font-mono text-xs font-bold px-2 py-1 rounded-lg tabular-nums ${corrBadgeClass(row.correlation)}`}
                  >
                    {corrSign(row.correlation)}
                  </span>

                  {/* Questions */}
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#e2e8f0] truncate">{row.market_a_question}</p>
                      <span
                        className="text-[9px] font-bold"
                        style={{ color: platformColor(row.market_a_platform) }}
                      >
                        {row.market_a_platform}
                      </span>
                    </div>
                    <ArrowLeftRight className="size-3 text-[#4a5168] shrink-0 hidden sm:block" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#e2e8f0] truncate">{row.market_b_question}</p>
                      <span
                        className="text-[9px] font-bold"
                        style={{ color: platformColor(row.market_b_platform) }}
                      >
                        {row.market_b_platform}
                      </span>
                    </div>
                  </div>

                  {/* Right: sample size + chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-[#4a5168] font-mono">{row.sample_size} pts</span>
                    {isExpanded
                      ? <ChevronUp className="size-3.5 text-[#8892b0]" />
                      : <ChevronDown className="size-3.5 text-[#8892b0]" />
                    }
                  </div>
                </button>

                {/* Expanded chart */}
                {isExpanded && (
                  <div className="px-4 pb-4">
                    <ExpandedChart
                      marketAId={row.market_a_id}
                      marketBId={row.market_b_id}
                      correlation={row.correlation}
                      questionA={row.market_a_question}
                      questionB={row.market_b_question}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#8892b0] text-sm">
              No {filter} correlations found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
