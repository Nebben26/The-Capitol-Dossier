"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineSeries,
} from "lightweight-charts";
import type { IChartApi } from "lightweight-charts";

export interface CandlePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LinePoint {
  timestamp: string;
  value: number;
}

interface CandlestickChartProps {
  candles: CandlePoint[];
  overlayLine?: LinePoint[];
  overlayLabel?: string;
  height?: number;
}

export function CandlestickChartComponent({
  candles,
  overlayLine,
  overlayLabel,
  height = 400,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || candles.length === 0) return;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "#1a1e2e" },
        textColor: "#8892b0",
      },
      grid: {
        vertLines: { color: "#2f374f" },
        horzLines: { color: "#2f374f" },
      },
      rightPriceScale: { borderColor: "#2f374f" },
      timeScale: { borderColor: "#2f374f", timeVisible: true },
      crosshair: {
        vertLine: { color: "#57D7BA", width: 1, labelBackgroundColor: "#222638" },
        horzLine: { color: "#57D7BA", width: 1, labelBackgroundColor: "#222638" },
      },
      width: el.clientWidth,
      height,
    });
    chartRef.current = chart;

    // ─── Candlestick series (v5 API) ──────────────────────────────────────
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    candleSeries.setData(
      candles.map((c) => ({
        time: (Math.floor(new Date(c.timestamp).getTime() / 1000)) as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    // ─── Overlay line series ──────────────────────────────────────────────
    if (overlayLine && overlayLine.length > 0) {
      const lineSeries = chart.addSeries(LineSeries, {
        color: "#57D7BA",
        lineWidth: 2,
        title: overlayLabel || "Counterpart",
        priceLineVisible: false,
        lastValueVisible: true,
      });

      lineSeries.setData(
        overlayLine.map((p) => ({
          time: (Math.floor(new Date(p.timestamp).getTime() / 1000)) as any,
          value: p.value,
        }))
      );
    }

    chart.timeScale().fitContent();

    // ─── Resize handler ───────────────────────────────────────────────────
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, overlayLine, overlayLabel, height]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
