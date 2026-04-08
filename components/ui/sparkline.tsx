"use client";
import React from "react";

interface SparklineProps {
  data: Array<{ t: number; spread: number }>;
  width?: number;
  height?: number;
  strokeColor?: string;
}

export function Sparkline({ data, width = 120, height = 30, strokeColor = "#57D7BA" }: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[9px] text-[#8892b0]/40"
        style={{ width, height }}
      >
        no history
      </div>
    );
  }

  const minSpread = Math.min(...data.map((d) => d.spread));
  const maxSpread = Math.max(...data.map((d) => d.spread));
  const range = maxSpread - minSpread || 1;
  const minT = data[0].t;
  const maxT = data[data.length - 1].t;
  const tRange = maxT - minT || 1;

  const points = data
    .map((d) => {
      const x = ((d.t - minT) / tRange) * (width - 4) + 2;
      const y = height - 2 - ((d.spread - minSpread) / range) * (height - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const last = data[data.length - 1].spread;
  const first = data[0].spread;
  const direction = last < first ? "converging" : last > first ? "diverging" : "flat";
  const directionColor =
    direction === "converging" ? "#22c55e" : direction === "diverging" ? "#ef4444" : "#8892b0";

  const lastPoint = points.split(" ").pop()?.split(",") ?? ["0", "0"];
  const endX = lastPoint[0];
  const endY = lastPoint[1];

  return (
    <div className="flex items-center gap-1.5">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={endX} cy={endY} r="2" fill={directionColor} />
      </svg>
      <span className="text-[9px] font-mono whitespace-nowrap" style={{ color: directionColor }}>
        {direction === "converging" ? "↓" : direction === "diverging" ? "↑" : "→"}
        {Math.abs(last - first).toFixed(0)}
      </span>
    </div>
  );
}
