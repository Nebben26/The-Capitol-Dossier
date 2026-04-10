"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createChart, ColorType, LineSeries } from "lightweight-charts";
import type { IChartApi } from "lightweight-charts";
import { getSpreadSnapshots } from "@/lib/api";
import type { SpreadSnapshot } from "@/lib/api";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

type TimeWindow = "24H" | "3D" | "7D";

const WINDOW_HOURS: Record<TimeWindow, number> = {
  "24H": 24,
  "3D":  72,
  "7D": 168,
};

export interface SpreadHistoryChartProps {
  marketId: string;
  question: string;
  heightPx?: number;
}

export function SpreadHistoryChart({ marketId, question, heightPx = 200 }: SpreadHistoryChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const [snapshots, setSnapshots]   = useState<SpreadSnapshot[]>([]);
  const [loading, setLoading]       = useState(true);
  const [window, setWindow]         = useState<TimeWindow>("7D");

  const load = useCallback(async (win: TimeWindow) => {
    setLoading(true);
    const data = await getSpreadSnapshots(marketId, WINDOW_HOURS[win]);
    setSnapshots(data);
    setLoading(false);
  }, [marketId]);

  useEffect(() => { load(window); }, [load, window]);

  // Build / update chart
  useEffect(() => {
    const el = containerRef.current;
    if (!el || snapshots.length === 0) {
      // Remove chart if data disappears
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
      return;
    }

    // Remove previous chart before recreating
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "#1a1e2e" },
        textColor: "#8892b0",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#2f374f" },
        horzLines: { color: "#2f374f" },
      },
      rightPriceScale: { borderColor: "#2f374f" },
      timeScale: { borderColor: "#2f374f", timeVisible: true, secondsVisible: false },
      crosshair: {
        vertLine: { color: "#57D7BA", width: 1, labelBackgroundColor: "#222638" },
        horzLine: { color: "#57D7BA", width: 1, labelBackgroundColor: "#222638" },
      },
      width: el.clientWidth,
      height: heightPx,
    });
    chartRef.current = chart;

    const lineSeries = chart.addSeries(LineSeries, {
      color: "#fbbf24",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: "Spread (pts)",
    });

    lineSeries.setData(
      snapshots.map((s) => ({
        time: Math.floor(new Date(s.captured_at).getTime() / 1000) as any,
        value: s.spread,
      }))
    );

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    globalThis.addEventListener?.("resize", handleResize);

    return () => {
      globalThis.removeEventListener?.("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [snapshots, heightPx]);

  // Summary stats
  const current  = snapshots.length > 0 ? snapshots[snapshots.length - 1].spread : null;
  const first24h = snapshots.filter((s) => new Date(s.captured_at).getTime() >= Date.now() - 24 * 3600000);
  const change24h = first24h.length >= 2 ? first24h[first24h.length - 1].spread - first24h[0].spread : null;
  const maxSpread = snapshots.length > 0 ? Math.max(...snapshots.map((s) => s.spread)) : null;
  const minSpread = snapshots.length > 0 ? Math.min(...snapshots.map((s) => s.spread)) : null;

  return (
    <div className="space-y-2">
      {/* Window pills */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] text-[#8892b0] uppercase tracking-wide font-semibold">
          Spread History
        </div>
        <div className="flex items-center gap-1">
          {(["24H", "3D", "7D"] as TimeWindow[]).map((w) => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                window === w
                  ? "bg-[#fbbf24] text-[#0f1119]"
                  : "bg-[#2f374f] text-[#8892b0] hover:text-[#e2e8f0]"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      {loading ? (
        <div className="rounded-lg bg-[#1a1e2e] border border-[#2f374f] animate-pulse flex items-center justify-center" style={{ height: heightPx }}>
          <div className="space-y-2 w-3/4">
            {[0.6, 0.9, 0.7, 0.8, 0.5].map((w, i) => (
              <div key={i} className="h-1.5 rounded bg-[#2f374f]" style={{ width: `${w * 100}%` }} />
            ))}
          </div>
        </div>
      ) : snapshots.length === 0 ? (
        <div className="rounded-lg bg-[#1a1e2e] border border-[#2f374f] flex items-center justify-center p-6" style={{ height: heightPx }}>
          <div className="text-center max-w-xs">
            <div className="text-[11px] text-[#8892b0] leading-relaxed">
              Historical spread data accumulating. Chart will populate as the ingest pipeline captures snapshots over the next few hours.
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div ref={containerRef} className="rounded-lg overflow-hidden border border-[#2f374f]" style={{ height: heightPx }} />
          {snapshots.length < 3 && (
            <div className="absolute top-1 left-2 bg-[#222638]/90 px-1.5 py-0.5 rounded text-[9px] text-[#8892b0]">
              Limited history — chart will fill out as more data accumulates.
            </div>
          )}
        </div>
      )}

      {/* Summary stats */}
      {!loading && snapshots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2 rounded-lg bg-[#1a1e2e] border border-[#2f374f]">
            <div className="text-[9px] text-[#8892b0] mb-0.5">Current Spread</div>
            <div className="font-mono font-bold text-[#fbbf24] tabular-nums">{current}pt</div>
          </div>
          <div className="p-2 rounded-lg bg-[#1a1e2e] border border-[#2f374f]">
            <div className="text-[9px] text-[#8892b0] mb-0.5">24h Change</div>
            {change24h === null ? (
              <div className="font-mono text-[#8892b0] text-xs">—</div>
            ) : (
              <div className={`font-mono font-bold tabular-nums flex items-center gap-0.5 ${change24h > 0 ? "text-[#ef4444]" : change24h < 0 ? "text-[#22c55e]" : "text-[#8892b0]"}`}>
                {change24h > 0 ? <TrendingUp className="size-3" /> : change24h < 0 ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
                {change24h > 0 ? "+" : ""}{change24h}pt
              </div>
            )}
          </div>
          <div className="p-2 rounded-lg bg-[#1a1e2e] border border-[#2f374f]">
            <div className="text-[9px] text-[#8892b0] mb-0.5">Max in Window</div>
            <div className="font-mono font-bold text-[#ef4444] tabular-nums">{maxSpread}pt</div>
          </div>
          <div className="p-2 rounded-lg bg-[#1a1e2e] border border-[#2f374f]">
            <div className="text-[9px] text-[#8892b0] mb-0.5">Data Points</div>
            <div className="font-mono font-bold text-[#e2e8f0] tabular-nums">{snapshots.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
