"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Copy,
  Check,
  AlertTriangle,
  BookOpen,
  Code,
  ExternalLink,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function zoneColor(v: number): string {
  if (v <= 30) return "#f85149";
  if (v <= 70) return "#d29922";
  return "#3fb950";
}

function zoneLabel(v: number): string {
  if (v <= 20) return "Extreme Low";
  if (v <= 35) return "Low";
  if (v <= 65) return "Neutral";
  if (v <= 80) return "High";
  return "Extreme High";
}

function categoryAccent(cat: string): string {
  switch (cat.toLowerCase()) {
    case "elections": return "#388bfd";
    case "crypto": return "#d29922";
    case "geopolitics": return "#f85149";
    case "economics": return "#3fb950";
    default: return "#57D7BA";
  }
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function HistoryTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const val = Number(payload[0]?.value ?? 0);
  return (
    <div className="bg-[#1c2333] border border-[#21262d] rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-[#8d96a0] mb-1">{label}</div>
      <div className="font-bold tabular-nums" style={{ color: zoneColor(val) }}>
        {val.toFixed(1)}
      </div>
    </div>
  );
}

// ─── Copy button ─────────────────────────────────────────────────────────────
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#21262d] text-xs text-[#8d96a0] hover:text-[#f0f6fc] hover:border-[#388bfd]/30 transition-colors"
    >
      {copied ? <Check className="size-3.5 text-[#3fb950]" /> : <Copy className="size-3.5" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  slug: string;
  name: string;
  description: string;
  category: string;
  currentValue: number;
  change24h: number | null;
  componentCount: number;
  methodology: string;
  updatedAt: string;
  allTimeHigh: number;
  allTimeLow: number;
  history: { value: number; recorded_at: string }[];
}

export function IndexDetailClient({
  slug,
  name,
  description,
  category,
  currentValue,
  change24h,
  componentCount,
  methodology,
  updatedAt,
  allTimeHigh,
  allTimeLow,
  history,
}: Props) {
  const color = zoneColor(currentValue);
  const accent = categoryAccent(category);
  const label = zoneLabel(currentValue);

  // Decimate history for chart (keep at most 200 points)
  const N = Math.max(1, Math.ceil(history.length / 200));
  const chartData = history
    .filter((_, i) => i % N === 0)
    .map((h) => ({
      date: new Date(h.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Number(h.value.toFixed(2)),
    }));

  const embedCode =
    `<div data-quiver-widget="index" data-id="${slug}" data-theme="dark"></div>\n` +
    `<script src="https://quivermarkets.com/embed.js" async><\/script>`;

  const citeText = `According to the Quiver ${name.replace("Quiver ", "")}, currently at ${currentValue.toFixed(1)}/100 as of ${new Date(updatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} — quivermarkets.com/indices/${slug}`;

  return (
    <div className="space-y-6">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#161b27] border border-[#21262d] p-6 space-y-4">
        <div className="flex items-start gap-3 justify-between">
          <div className="space-y-1">
            <span
              className="inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border"
              style={{ color: accent, borderColor: `${accent}30`, backgroundColor: `${accent}10` }}
            >
              {category}
            </span>
            <h1 className="text-xl font-black text-[#f0f6fc] leading-snug">{name}</h1>
            <p className="text-sm text-[#8d96a0] leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Big value */}
        <div className="flex items-end gap-4">
          <div className="text-8xl font-black tabular-nums tracking-tight leading-none" style={{ color }}>
            {currentValue.toFixed(1)}
          </div>
          <div className="flex flex-col gap-1 pb-2">
            <span
              className="text-sm font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ color, backgroundColor: `${color}15` }}
            >
              {label}
            </span>
            {change24h != null && (
              <div className={`flex items-center gap-1 text-sm font-bold tabular-nums ${change24h >= 0 ? "text-[#3fb950]" : "text-[#f85149]"}`}>
                {change24h >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                {change24h >= 0 ? "+" : ""}{change24h.toFixed(1)} 24h
              </div>
            )}
            <div className="text-[10px] text-[#484f58]">{componentCount} markets · Updated {new Date(updatedAt).toLocaleTimeString()}</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[#21262d]">
          {[
            { label: "30-Day High", value: allTimeHigh.toFixed(1), color: "#3fb950" },
            { label: "30-Day Low", value: allTimeLow.toFixed(1), color: "#f85149" },
            { label: "Components", value: String(componentCount), color: "#8d96a0" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-xs font-bold tabular-nums" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-[#484f58] uppercase tracking-widest mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 30-day chart ──────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-4 space-y-3">
        <h2 className="text-sm font-bold text-[#f0f6fc]">30-Day History</h2>
        {chartData.length > 1 ? (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id={`grad-${slug}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                <ReferenceLine y={70} stroke="#3fb950" strokeDasharray="3 3" strokeOpacity={0.4} />
                <ReferenceLine y={30} stroke="#f85149" strokeDasharray="3 3" strokeOpacity={0.4} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#484f58", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#484f58", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip content={<HistoryTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#grad-${slug})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-xs text-[#484f58]">
            Not enough history yet. Values accumulate each ingest cycle (~30 min).
          </div>
        )}
        <div className="flex items-center gap-4 text-[9px] text-[#484f58]">
          <div className="flex items-center gap-1"><div className="w-3 h-px bg-[#3fb950]" /> Zone ≥ 70 (High)</div>
          <div className="flex items-center gap-1"><div className="w-3 h-px bg-[#f85149]" /> Zone ≤ 30 (Low)</div>
        </div>
      </div>

      {/* ── Methodology ───────────────────────────────────────────────────── */}
      {methodology && (
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-[#57D7BA]" />
            <h2 className="text-sm font-bold text-[#f0f6fc]">Methodology</h2>
          </div>
          <p className="text-xs text-[#8d96a0] leading-relaxed whitespace-pre-wrap">{methodology}</p>
          <Link
            href="/methodology#indices"
            className="inline-flex items-center gap-1.5 text-[11px] text-[#57D7BA] hover:text-[#57D7BA]/80 transition-colors"
          >
            Full methodology documentation <ExternalLink className="size-3" />
          </Link>
        </div>
      )}

      {/* ── Cite this index ───────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-4 space-y-3">
        <h2 className="text-sm font-bold text-[#f0f6fc]">Cite This Index</h2>
        <p className="text-xs text-[#8d96a0]">
          Journalists and analysts: use this phrasing when citing the index in articles or reports.
        </p>
        <div className="rounded-lg bg-[#0d1117] border border-[#21262d] p-3 font-mono text-xs text-[#f0f6fc] leading-relaxed">
          {citeText}
        </div>
        <CopyButton text={citeText} label="Copy citation" />
      </div>

      {/* ── Embed widget ─────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Code className="size-4 text-[#388bfd]" />
          <h2 className="text-sm font-bold text-[#f0f6fc]">Embed This Index</h2>
        </div>
        <p className="text-xs text-[#8d96a0]">
          Drop this snippet into any webpage to show a live, auto-updating widget for this index.
        </p>
        <div className="rounded-lg bg-[#0d1117] border border-[#21262d] p-3 font-mono text-xs text-[#f0f6fc] leading-relaxed whitespace-pre">
          {embedCode}
        </div>
        <div className="flex items-center gap-2">
          <CopyButton text={embedCode} label="Copy embed code" />
          <Link
            href="/embed/builder"
            className="flex items-center gap-1.5 text-[11px] text-[#388bfd] hover:text-[#388bfd]/80 transition-colors"
          >
            Embed builder <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#d29922]/8 border border-[#d29922]/20 p-4 flex gap-3 items-start">
        <AlertTriangle className="size-4 text-[#d29922] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#d29922] leading-relaxed">
          This index is derived from prediction market prices and reflects aggregate market consensus,
          not ground-truth outcomes or professional forecasts. Index values may lag real-world events
          by up to one ingest cycle (~30 minutes). Not financial advice.
        </p>
      </div>
    </div>
  );
}
