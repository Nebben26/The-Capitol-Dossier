"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface IndexRow {
  slug: string;
  name: string;
  description: string;
  category: string;
  current_value: number;
  change_24h: number | null;
  component_count: number;
  updated_at: string;
}

interface IndexWithSpark extends IndexRow {
  sparkline: number[];
}

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

// ─── Sparkline ────────────────────────────────────────────────────────────────
function IndexSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) {
    return <div className="h-12 w-full rounded bg-[#0d1117]" />;
  }
  const points = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Index Card ───────────────────────────────────────────────────────────────
function IndexCard({ idx }: { idx: IndexWithSpark }) {
  const color = zoneColor(idx.current_value);
  const accent = categoryAccent(idx.category);
  const change = idx.change_24h;
  const updated = new Date(idx.updated_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/indices/${idx.slug}`}
      className="group rounded-2xl bg-[#161b27] border border-[#21262d] hover:border-[#388bfd]/30 p-5 flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span
            className="inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border mb-2"
            style={{ color: accent, borderColor: `${accent}30`, backgroundColor: `${accent}10` }}
          >
            {idx.category}
          </span>
          <h2 className="text-sm font-bold text-[#f0f6fc] leading-snug group-hover:text-[#388bfd] transition-colors line-clamp-2">
            {idx.name}
          </h2>
        </div>
        <ChevronRight className="size-4 text-[#484f58] shrink-0 mt-0.5 group-hover:text-[#388bfd] transition-colors" />
      </div>

      {/* Value */}
      <div className="flex items-end gap-3">
        <div
          className="text-5xl font-black tabular-nums tracking-tight"
          style={{ color }}
        >
          {idx.current_value.toFixed(1)}
        </div>
        <div className="flex flex-col gap-0.5 pb-1">
          <span
            className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{ color, backgroundColor: `${color}15` }}
          >
            {zoneLabel(idx.current_value)}
          </span>
          {change != null && (
            <div className={`flex items-center gap-0.5 text-xs font-bold tabular-nums ${change >= 0 ? "text-[#3fb950]" : "text-[#f85149]"}`}>
              {change >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {change >= 0 ? "+" : ""}{change.toFixed(1)} 24h
            </div>
          )}
        </div>
      </div>

      {/* Sparkline */}
      <IndexSparkline data={idx.sparkline} color={color} />

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-[#484f58]">
        <span>{idx.component_count} markets</span>
        <span>Updated {updated}</span>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function IndicesPage() {
  const [indices, setIndices] = useState<IndexWithSpark[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"ok" | "empty" | "table_missing">("ok");

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/indices");
      const json = await res.json();

      if (json.status === "table_missing") {
        setStatus("table_missing");
        setLoading(false);
        return;
      }

      if (!json.indices?.length) {
        setStatus("empty");
        setLoading(false);
        return;
      }

      // Fetch 7-day sparklines for each index in parallel
      const withSparks: IndexWithSpark[] = await Promise.all(
        json.indices.map(async (idx: IndexRow) => {
          try {
            const r = await fetch(`/api/embed/index/${idx.slug}`);
            const d = await r.json();
            return { ...idx, sparkline: d.sparkline ?? [] };
          } catch {
            return { ...idx, sparkline: [] };
          }
        })
      );

      setIndices(withSparks);
      setStatus("ok");
    } catch {
      setStatus("empty");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#57D7BA]/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#57D7BA]" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-[#f0f6fc]">Quiver Indices</h1>
            </div>
            <p className="text-sm text-[#8d96a0] leading-relaxed max-w-2xl">
              Proprietary composite indices built from prediction market data. Each index aggregates
              dozens of markets into a single, citeable number — updated every 30 minutes.
            </p>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#21262d] text-xs text-[#8d96a0] hover:text-[#f0f6fc] hover:border-[#388bfd]/30 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Media callout */}
        <div className="rounded-xl bg-[#57D7BA]/5 border border-[#57D7BA]/20 p-4 space-y-1.5">
          <div className="text-xs font-bold text-[#57D7BA] uppercase tracking-widest">For journalists &amp; analysts</div>
          <p className="text-[11px] text-[#8d96a0] leading-relaxed">
            These indices are freely citeable. When referencing prediction market data, use the phrasing:{" "}
            <span className="text-[#f0f6fc] font-medium italic">
              &quot;According to the Quiver [Index Name], currently at [value]...&quot;
            </span>{" "}
            Each index detail page includes a methodology section and citation template.
          </p>
        </div>
      </div>

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#161b27] border border-[#21262d] animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Table missing ─────────────────────────────────────────────────── */}
      {!loading && status === "table_missing" && (
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-12 text-center space-y-3">
          <BarChart3 className="size-10 text-[#484f58] mx-auto" />
          <div className="text-sm font-semibold text-[#f0f6fc]">Indices not yet initialized</div>
          <p className="text-xs text-[#8d96a0] max-w-sm mx-auto">
            Run <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">session26-indices.sql</code> in
            Supabase, then <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">npx tsx scripts/compute-indices.ts</code> to seed initial values.
          </p>
        </div>
      )}

      {/* ── Empty (table exists, no data yet) ────────────────────────────── */}
      {!loading && status === "empty" && (
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-12 text-center space-y-3">
          <BarChart3 className="size-10 text-[#484f58] mx-auto" />
          <div className="text-sm font-semibold text-[#f0f6fc]">Computing indices…</div>
          <p className="text-xs text-[#8d96a0] max-w-sm mx-auto">
            Run <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">npx tsx scripts/compute-indices.ts</code> to populate values, or wait for the next ingest cycle.
          </p>
        </div>
      )}

      {/* ── Index cards ───────────────────────────────────────────────────── */}
      {!loading && status === "ok" && indices.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {indices.map((idx) => (
              <IndexCard key={idx.slug} idx={idx} />
            ))}
          </div>

          <div className="rounded-xl bg-[#d29922]/8 border border-[#d29922]/20 p-4 flex gap-3 items-start">
            <AlertTriangle className="size-4 text-[#d29922] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#d29922] leading-relaxed">
              These indices are computed from prediction market data and reflect market consensus, not
              ground-truth outcomes. They update every ~30 minutes during active ingest cycles.
              Values between 0–30 indicate low/bearish readings; 30–70 neutral; 70–100 high/bullish.
              See each index&apos;s methodology page for formula details.{" "}
              <Link href="/methodology#indices" className="underline hover:opacity-80 transition-opacity">
                Full methodology →
              </Link>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
