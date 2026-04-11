"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight, DollarSign, RefreshCw } from "lucide-react";
import { InlineSparkline } from "@/components/ui/inline-sparkline";
import { Card, CardContent } from "@/components/ui/card";
import { getSmartMoneyFlow, getLastIngestTimestamp, type SmartMoneyFlowByCategory } from "@/lib/api";
import { formatUsd } from "@/lib/format";

const CATEGORY_COLORS: Record<string, string> = {
  Elections:     "#6366f1",
  Politics:      "#6366f1",
  Crypto:        "#f97316",
  Sports:        "#22c55e",
  Economics:     "#57D7BA",
  Geopolitics:   "#ef4444",
  Tech:          "#8b5cf6",
  Business:      "#f59e0b",
  Climate:       "#10b981",
  Culture:       "#ec4899",
  Science:       "#64748b",
  Other:         "#8892b0",
};

export default function SmartMoneyFlowPage() {
  const [flows, setFlows] = useState<SmartMoneyFlowByCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"live" | "mock">("live");
  const [lastIngestAt, setLastIngestAt] = useState<string | null>(null);

  function load() {
    setLoading(true);
    getSmartMoneyFlow().then((res) => {
      setFlows(res.data);
      setSource(res.source as "live" | "mock");
      setLoading(false);
    });
  }

  useEffect(() => {
    load();
    getLastIngestTimestamp().then(setLastIngestAt);
  }, []);

  const totalYes = flows.reduce((s, f) => s + f.yesValueUsd, 0);
  const totalNo  = flows.reduce((s, f) => s + f.noValueUsd, 0);
  const totalFlow = totalYes - totalNo;
  const totalCapital = totalYes + totalNo;

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="size-7 text-[#57D7BA]" />
            Smart Money Flow
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-1 ${
              source === "live"
                ? "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20"
                : "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20"
            }`}>
              {source === "live" ? "LIVE" : "MOCK"}
            </span>
          </h1>
          <p className="text-sm text-[#8892b0] mt-1">
            Where whale capital is positioned right now, broken down by category
          </p>
          {lastIngestAt && (() => {
            const ageMs = Date.now() - new Date(lastIngestAt).getTime();
            const ageStr = ageMs < 60_000 ? "just now" : ageMs < 3_600_000 ? `${Math.floor(ageMs / 60_000)}m ago` : `${Math.floor(ageMs / 3_600_000)}h ago`;
            const color = ageMs < 3_600_000 ? "#22c55e" : ageMs < 6 * 3_600_000 ? "#f59e0b" : "#ef4444";
            return (
              <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono tabular-nums" style={{ color }}>
                <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
                Data last updated {ageStr}
              </div>
            );
          })()}
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#21262d] text-[#8892b0] text-xs hover:text-[#57D7BA] hover:border-[#57D7BA]/30 transition-colors"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Whale Capital", val: formatUsd(totalCapital), color: "#57D7BA", sparkline: true },
          {
            label: "Net Position",
            val: `${totalFlow >= 0 ? "+" : ""}${formatUsd(totalFlow)}`,
            color: totalFlow >= 0 ? "#22c55e" : "#ef4444",
          },
          { label: "YES Positions", val: formatUsd(totalYes), color: "#22c55e" },
          { label: "NO Positions",  val: formatUsd(totalNo),  color: "#ef4444" },
        ].map((s) => (
          <Card key={s.label} className="bg-[#161b27] border-[#21262d]">
            <CardContent className="p-4">
              <div className="text-[10px] text-[#8892b0] uppercase tracking-wide">{s.label}</div>
              <div className="flex items-center gap-1">
                <div className="text-xl font-mono font-bold mt-1 tabular-nums" style={{ color: s.color }}>
                  {loading ? "—" : s.val}
                </div>
                {/* TODO: replace placeholder with real historical capital data when available */}
                {(s as any).sparkline && !loading && <InlineSparkline data={[10, 11, 10, 12, 11, 13, 12, 14]} positive={true} />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-[#8892b0]">
          <RefreshCw className="size-5 animate-spin text-[#57D7BA]" />
          <span className="text-sm">Loading whale flow data…</span>
        </div>
      ) : flows.length === 0 ? (
        <div className="text-center text-[#8892b0] py-16">
          <DollarSign className="size-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No whale flow data available yet.</p>
          <p className="text-xs mt-1 opacity-60">Whale positions will appear after the next ingest run.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {flows.map((flow) => {
            const color = CATEGORY_COLORS[flow.category] || "#8892b0";
            const maxBar = Math.max(flow.yesValueUsd, flow.noValueUsd) || 1;
            const yesPct = (flow.yesValueUsd / maxBar) * 100;
            const noPct  = (flow.noValueUsd  / maxBar) * 100;
            const isLong = flow.netFlowUsd >= 0;
            const directionColor = isLong ? "#22c55e" : "#ef4444";

            return (
              <Card
                key={flow.category}
                className="bg-[#161b27] border-[#21262d] hover:border-[#57D7BA]/30 transition-all"
              >
                <CardContent className="p-5">
                  {/* Category header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-12 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <div>
                        <h3 className="text-lg font-bold" style={{ color }}>{flow.category}</h3>
                        <div className="text-[11px] text-[#8892b0] mt-0.5">
                          {flow.positionCount.toLocaleString()} positions · {flow.uniqueWhales} unique whales
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        {isLong
                          ? <TrendingUp className="size-4" style={{ color: directionColor }} />
                          : <TrendingDown className="size-4" style={{ color: directionColor }} />
                        }
                        <span className="font-mono font-bold text-lg tabular-nums" style={{ color: directionColor }}>
                          {isLong ? "+" : ""}{formatUsd(flow.netFlowUsd)}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#8892b0] mt-0.5">
                        Net into {isLong ? "YES" : "NO"}
                      </div>
                    </div>
                  </div>

                  {/* YES / NO flow bars */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#22c55e] font-mono w-6">YES</span>
                      <div className="flex-1 h-3.5 bg-[#0d1117] rounded-sm overflow-hidden">
                        <div className="h-full bg-[#22c55e]/60 rounded-sm transition-all" style={{ width: `${yesPct}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-[#22c55e] w-16 text-right tabular-nums">
                        {formatUsd(flow.yesValueUsd)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#ef4444] font-mono w-6">NO</span>
                      <div className="flex-1 h-3.5 bg-[#0d1117] rounded-sm overflow-hidden">
                        <div className="h-full bg-[#ef4444]/60 rounded-sm transition-all" style={{ width: `${noPct}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-[#ef4444] w-16 text-right tabular-nums">
                        {formatUsd(flow.noValueUsd)}
                      </span>
                    </div>
                  </div>

                  {/* Top markets */}
                  {flow.topMarkets.length > 0 && (
                    <div className="border-t border-[#21262d] pt-3">
                      <div className="text-[10px] text-[#8892b0] uppercase tracking-wide mb-2">
                        Top markets by flow
                      </div>
                      <div className="space-y-1">
                        {flow.topMarkets.slice(0, 3).map((m) => (
                          <Link
                            key={m.id}
                            href={`/markets/${m.id}`}
                            className="flex items-center justify-between gap-2 text-[11px] text-[#ccd6f6] hover:text-[#57D7BA] transition-colors group"
                          >
                            <span className="truncate flex-1">{m.question}</span>
                            <span className={`font-mono shrink-0 tabular-nums ${m.flowUsd >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                              {m.flowUsd >= 0 ? "+" : ""}{formatUsd(m.flowUsd)}
                            </span>
                            <ArrowRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <footer className="flex items-center justify-between py-4 border-t border-[#21262d] text-[10px] text-[#8892b0]">
        <span>© 2026 Quiver Markets. Not financial advice. Data from Polymarket.</span>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
