"use client";

interface InlineSparklineProps {
  data?: number[];
  positive?: boolean;
  width?: number;
  height?: number;
}

export function InlineSparkline({ data, positive = true, width = 50, height = 16 }: InlineSparklineProps) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const color = positive ? "#22c55e" : "#ef4444";
  return (
    <svg
      width={width}
      height={height}
      className="inline-block ml-2 align-middle"
      role="img"
      aria-label="trend sparkline"
    >
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
