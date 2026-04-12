"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";
import { Target, TrendingUp, Users, Activity, Info, ArrowLeft, CheckCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

interface AccuracyRow {
  market_id: string;
  market_question: string;
  resolved_at: string | null;
  outcome: boolean;
  poly_prob: number | null;
  kalshi_prob: number | null;
  whale_prob: number | null;
  community_prob: number | null;
  poly_brier: number | null;
  kalshi_brier: number | null;
  whale_brier: number | null;
  community_brier: number | null;
}

interface SourceStats {
  name: string;
  color: string;
  avgBrier: number | null;
  accuracy: number | null;   // % within 10pp of outcome
  sampleSize: number;
  icon: React.ReactNode;
}

function brierToScore(brier: number) {
  // Convert Brier score (0–1, lower=better) to human-readable "accuracy" (higher=better, %)
  return Math.round((1 - brier) * 100);
}

function StatCard({ stat }: { stat: SourceStats }) {
  const hasData = stat.sampleSize > 0;
  return (
    <Card className="bg-[#161b27] border-[#21262d]">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${stat.color}15`, border: `1px solid ${stat.color}30` }}
          >
            <span style={{ color: stat.color }}>{stat.icon}</span>
          </div>
          <div>
            <p className="text-xs font-bold text-[#f0f6fc]">{stat.name}</p>
            <p className="text-[9px] text-[#484f58]">{stat.sampleSize} resolved markets</p>
          </div>
        </div>
        {hasData ? (
          <>
            <div>
              <div className="text-2xl font-black tabular-nums" style={{ color: stat.color }}>
                {stat.avgBrier != null ? brierToScore(stat.avgBrier) : "—"}
                <span className="text-sm font-normal text-[#8d96a0]">/100</span>
              </div>
              <p className="text-[9px] text-[#484f58] mt-0.5">Accuracy score (Brier-based)</p>
            </div>
            {stat.avgBrier != null && (
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] text-[#484f58]">
                  <span>Brier score</span>
                  <span className="font-mono">{stat.avgBrier.toFixed(4)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#21262d] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${brierToScore(stat.avgBrier)}%`, backgroundColor: stat.color }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-[#484f58]">No data yet — check back after markets resolve.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function AccuracyPage() {
  const [rows, setRows] = useState<AccuracyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PER_PAGE = 20;

  useEffect(() => {
    fetch("/api/accuracy")
      .then((r) => r.json())
      .then((json) => setRows(json.rows ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Compute per-source stats
  const sources: SourceStats[] = [
    {
      name: "Polymarket",
      color: "#57D7BA",
      icon: <Activity className="size-4" />,
      sampleSize: rows.filter((r) => r.poly_brier != null).length,
      avgBrier:
        rows.filter((r) => r.poly_brier != null).length > 0
          ? rows.filter((r) => r.poly_brier != null).reduce((s, r) => s + r.poly_brier!, 0) /
            rows.filter((r) => r.poly_brier != null).length
          : null,
      accuracy: null,
    },
    {
      name: "Kalshi",
      color: "#388bfd",
      icon: <TrendingUp className="size-4" />,
      sampleSize: rows.filter((r) => r.kalshi_brier != null).length,
      avgBrier:
        rows.filter((r) => r.kalshi_brier != null).length > 0
          ? rows.filter((r) => r.kalshi_brier != null).reduce((s, r) => s + r.kalshi_brier!, 0) /
            rows.filter((r) => r.kalshi_brier != null).length
          : null,
      accuracy: null,
    },
    {
      name: "Whale Consensus",
      color: "#a371f7",
      icon: <Users className="size-4" />,
      sampleSize: rows.filter((r) => r.whale_brier != null).length,
      avgBrier:
        rows.filter((r) => r.whale_brier != null).length > 0
          ? rows.filter((r) => r.whale_brier != null).reduce((s, r) => s + r.whale_brier!, 0) /
            rows.filter((r) => r.whale_brier != null).length
          : null,
      accuracy: null,
    },
    {
      name: "Community",
      color: "#f59e0b",
      icon: <Target className="size-4" />,
      sampleSize: rows.filter((r) => r.community_brier != null).length,
      avgBrier:
        rows.filter((r) => r.community_brier != null).length > 0
          ? rows.filter((r) => r.community_brier != null).reduce((s, r) => s + r.community_brier!, 0) /
            rows.filter((r) => r.community_brier != null).length
          : null,
      accuracy: null,
    },
  ];

  const chartData = sources
    .filter((s) => s.avgBrier != null)
    .map((s) => ({ name: s.name, score: brierToScore(s.avgBrier!), color: s.color }));

  const paginated = rows.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(rows.length / PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Source Accuracy" }]} />

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <CheckCircle className="size-5 text-[#f59e0b]" />
          <h1 className="text-xl font-bold text-[#f0f6fc]">Source Accuracy Tracker</h1>
        </div>
        <p className="text-sm text-[#8d96a0]">
          Brier-score comparison of Polymarket, Kalshi, Whale Consensus, and Community predictions on resolved markets.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sources.map((s) => (
          <StatCard key={s.name} stat={s} />
        ))}
      </div>

      {/* Bar chart comparison */}
      {chartData.length > 0 && (
        <Card className="bg-[#161b27] border-[#21262d]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart className="size-4 text-[#f59e0b]" />
              Accuracy Comparison
            </CardTitle>
            <CardDescription className="text-[10px]">
              Higher = better (100 = perfect). Brier-score based.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="name" tick={{ fill: "#8d96a0", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#8d96a0", fontSize: 10 }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "#161b27", border: "1px solid #21262d", borderRadius: 8, fontSize: 11 }}
                    formatter={(v) => [`${v}/100`, "Accuracy"]}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && rows.length === 0 && (
        <Card className="bg-[#161b27] border-[#21262d]">
          <CardContent className="py-16 text-center space-y-3">
            <Target className="size-8 text-[#484f58] mx-auto" />
            <p className="text-sm font-semibold text-[#f0f6fc]">No resolved markets yet</p>
            <p className="text-xs text-[#484f58] max-w-xs mx-auto">
              Source accuracy data appears once markets resolve. Come back after markets close.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {rows.length > 0 && (
        <Card className="bg-[#161b27] border-[#21262d]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Resolved Markets ({rows.length.toLocaleString()})</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#21262d]">
                    <th className="text-left pl-4 py-2 text-[10px] font-medium text-[#484f58] uppercase tracking-wider w-1/2">Market</th>
                    <th className="text-center py-2 text-[10px] font-medium text-[#484f58] uppercase tracking-wider w-12">Out</th>
                    <th className="text-center py-2 text-[10px] font-medium text-[#57D7BA] uppercase tracking-wider w-16">POLY</th>
                    <th className="text-center py-2 text-[10px] font-medium text-[#388bfd] uppercase tracking-wider w-16">KSHL</th>
                    <th className="text-center py-2 text-[10px] font-medium text-[#a371f7] uppercase tracking-wider w-16">WHALE</th>
                    <th className="text-center pr-4 py-2 text-[10px] font-medium text-[#f59e0b] uppercase tracking-wider w-16">COMM</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((r) => (
                    <tr key={r.market_id} className="border-b border-[#21262d]/40 hover:bg-[#1c2333] transition-colors">
                      <td className="pl-4 py-2.5 pr-2">
                        <Link href={`/markets/${r.market_id}`} className="text-[#e2e8f0] hover:text-[#57D7BA] transition-colors line-clamp-1">
                          {r.market_question}
                        </Link>
                        {r.resolved_at && (
                          <span className="text-[9px] text-[#484f58] block">
                            {new Date(r.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        )}
                      </td>
                      <td className="text-center py-2.5">
                        <span className={`font-bold text-[10px] ${r.outcome ? "text-[#3fb950]" : "text-[#f85149]"}`}>
                          {r.outcome ? "YES" : "NO"}
                        </span>
                      </td>
                      {[
                        { prob: r.poly_prob, brier: r.poly_brier, color: "#57D7BA" },
                        { prob: r.kalshi_prob, brier: r.kalshi_brier, color: "#388bfd" },
                        { prob: r.whale_prob, brier: r.whale_brier, color: "#a371f7" },
                        { prob: r.community_prob, brier: r.community_brier, color: "#f59e0b" },
                      ].map((src, i) => (
                        <td key={i} className={`text-center py-2.5 ${i === 3 ? "pr-4" : ""}`}>
                          {src.prob != null ? (
                            <div>
                              <span className="font-mono font-semibold" style={{ color: src.color }}>
                                {src.prob.toFixed(0)}%
                              </span>
                              {src.brier != null && (
                                <span className="block text-[8px] text-[#484f58] font-mono">
                                  B:{src.brier.toFixed(3)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#484f58]">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 pt-3">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="text-[10px] text-[#8d96a0] hover:text-[#f0f6fc] disabled:opacity-30 transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-[10px] text-[#484f58]">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="text-[10px] text-[#8d96a0] hover:text-[#f0f6fc] disabled:opacity-30 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Methodology note */}
      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[#161b27] border border-[#21262d]">
        <Info className="size-4 text-[#484f58] shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#484f58] leading-relaxed">
          <strong className="text-[#8d96a0]">Brier Score:</strong> measures probabilistic accuracy (0 = perfect, 1 = worst).
          We convert to a 0–100 scale for readability. Scores are computed at market resolution using each source's last-known probability.
          Community consensus uses confidence-weighted means. See <Link href="/methodology#community-consensus" className="text-[#57D7BA] hover:underline">methodology</Link> for details.
        </p>
      </div>
    </div>
  );
}
