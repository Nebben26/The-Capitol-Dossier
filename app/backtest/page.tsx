"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { BacktestResult, BacktestConfig, BacktestSignal } from "@/lib/backtester";

// ─── Formatting helpers ────────────────────────────────────────────────────
function fmt$(n: number) {
  return (n >= 0 ? "+" : "") + "$" + Math.abs(n).toFixed(2);
}
function fmtPct(n: number, signed = true) {
  return (signed && n >= 0 ? "+" : "") + n.toFixed(1) + "%";
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Stat card ────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  positive,
  large,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  large?: boolean;
}) {
  const color =
    positive === undefined
      ? "#f0f6fc"
      : positive
      ? "#3fb950"
      : "#f85149";
  return (
    <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-4 space-y-1">
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">{label}</div>
      <div
        className={`font-bold tabular-nums ${large ? "text-3xl" : "text-xl"}`}
        style={{ color }}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-[#8d96a0]">{sub}</div>}
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────
function EquityTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const equity = payload[0]?.value ?? 0;
  return (
    <div className="bg-[#1c2333] border border-[#21262d] rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-[#8d96a0] mb-1">{label}</div>
      <div className={`font-bold tabular-nums ${equity >= 0 ? "text-[#3fb950]" : "text-[#f85149]"}`}>
        {fmt$(equity)}
      </div>
      <div className="text-[#484f58] text-[10px]">{payload[1]?.value ?? 0} trades closed</div>
    </div>
  );
}

// ─── Signal row ───────────────────────────────────────────────────────────
function SignalRow({ signal }: { signal: BacktestSignal }) {
  const statusColor =
    signal.status === "won"
      ? "#3fb950"
      : signal.status === "lost"
      ? "#f85149"
      : "#8d96a0";
  const statusIcon =
    signal.status === "won" ? (
      <CheckCircle className="size-3.5" style={{ color: statusColor }} />
    ) : signal.status === "lost" ? (
      <XCircle className="size-3.5" style={{ color: statusColor }} />
    ) : (
      <Clock className="size-3.5" style={{ color: statusColor }} />
    );

  return (
    <tr className="border-b border-[#21262d] hover:bg-[#1c2333]/50 transition-colors">
      <td className="py-2.5 pl-4 pr-2">
        <Link
          href={`/simulate/${signal.disagreementId}`}
          className="text-xs text-[#f0f6fc] hover:text-[#388bfd] transition-colors line-clamp-1 max-w-[280px] block"
        >
          {signal.question}
        </Link>
        <div className="text-[10px] text-[#484f58] mt-0.5">
          {signal.category ?? "Other"} · Detected {fmtDate(signal.detectedAt)}
        </div>
      </td>
      <td className="py-2.5 px-2 text-center">
        <span className="text-xs font-mono font-bold text-[#d29922]">{signal.spread}pt</span>
      </td>
      <td className="py-2.5 px-2 text-right">
        <span className="text-xs font-mono text-[#8d96a0]">${signal.totalCost.toFixed(0)}</span>
      </td>
      <td className="py-2.5 px-2 text-right">
        <span
          className="text-xs font-mono font-semibold tabular-nums"
          style={{ color: signal.netProfit >= 0 ? "#3fb950" : "#f85149" }}
        >
          {signal.status === "open" ? "—" : fmt$(signal.netProfit)}
        </span>
      </td>
      <td className="py-2.5 px-2 text-right">
        <span
          className="text-xs font-mono tabular-nums"
          style={{ color: signal.returnPct >= 0 ? "#3fb950" : "#f85149" }}
        >
          {signal.status === "open" ? "—" : fmtPct(signal.returnPct)}
        </span>
      </td>
      <td className="py-2.5 px-2 text-center">
        <span className="text-[10px] text-[#8d96a0]">
          {signal.holdDays != null ? `${signal.holdDays}d` : "—"}
        </span>
      </td>
      <td className="py-2.5 pl-2 pr-4 text-center">
        <div className="flex items-center justify-center gap-1">
          {statusIcon}
          <span className="text-[10px] capitalize" style={{ color: statusColor }}>
            {signal.status}
          </span>
        </div>
      </td>
    </tr>
  );
}

const PAGE_SIZE = 25;

export default function BacktestPage() {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);

  // Config state
  const [minSpread, setMinSpread] = useState(10);
  const [capital, setCapital] = useState(100);
  const [maxConcurrent, setMaxConcurrent] = useState(20);

  // Table pagination + sort
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<"detectedAt" | "spread" | "netProfit" | "returnPct">("detectedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState<"all" | "won" | "lost" | "open">("all");

  const fetchBacktest = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        minSpread: String(minSpread),
        capital: String(capital),
        maxConcurrent: String(maxConcurrent),
      });
      const res = await fetch(`/api/backtest?${params}`);
      if (!res.ok) throw new Error("Failed to load backtest data.");
      const data: BacktestResult = await res.json();
      setResult(data);
      setPage(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [minSpread, capital, maxConcurrent]);

  useEffect(() => {
    fetchBacktest();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sorted + filtered signals for table
  const tableSignals = result
    ? [...result.signals]
        .filter((s) => filterStatus === "all" || s.status === filterStatus)
        .sort((a, b) => {
          let av: number, bv: number;
          if (sortBy === "detectedAt") {
            av = new Date(a.detectedAt).getTime();
            bv = new Date(b.detectedAt).getTime();
          } else {
            av = a[sortBy] ?? 0;
            bv = b[sortBy] ?? 0;
          }
          return sortDir === "asc" ? av - bv : bv - av;
        })
    : [];

  const totalPages = Math.ceil(tableSignals.length / PAGE_SIZE);
  const pageSignals = tableSignals.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
    setPage(0);
  }

  function SortIcon({ col }: { col: typeof sortBy }) {
    if (sortBy !== col) return <span className="text-[#484f58]">↕</span>;
    return <span className="text-[#388bfd]">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const isPositive = result ? result.totalNetProfit >= 0 : true;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#3fb950]/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#3fb950]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">Arb Backtester</h1>
            <p className="text-xs text-[#8d96a0]">Simulated P&amp;L across all Quiver arb signals.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-[#d29922]/10 border border-[#d29922]/20 px-3 py-2 text-[11px] text-[#d29922]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Simulation only. Does not model slippage, partial fills, or platform outages. Not financial advice.
        </div>
      </div>

      {/* ── Config panel ────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#f0f6fc] hover:bg-[#1c2333] transition-colors"
          onClick={() => setConfigOpen((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-[#8d96a0]" />
            Configure backtest
          </div>
          {configOpen ? (
            <ChevronUp className="size-4 text-[#8d96a0]" />
          ) : (
            <ChevronDown className="size-4 text-[#8d96a0]" />
          )}
        </button>

        {configOpen && (
          <div className="px-4 pb-4 space-y-4 border-t border-[#21262d]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              {/* Min spread */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#8d96a0]">Min Spread</label>
                  <span className="text-xs font-mono font-bold text-[#57D7BA]">{minSpread}pt</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  step={1}
                  value={minSpread}
                  onChange={(e) => setMinSpread(Number(e.target.value))}
                  className="w-full accent-[#57D7BA]"
                />
                <div className="flex justify-between text-[9px] text-[#484f58]">
                  <span>0pt (all)</span>
                  <span>40pt</span>
                </div>
              </div>

              {/* Capital per trade */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#8d96a0]">Capital / Trade</label>
                  <span className="text-xs font-mono font-bold text-[#57D7BA]">${capital}</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={1000}
                  step={10}
                  value={capital}
                  onChange={(e) => setCapital(Number(e.target.value))}
                  className="w-full accent-[#57D7BA]"
                />
                <div className="flex justify-between text-[9px] text-[#484f58]">
                  <span>$10</span>
                  <span>$1,000</span>
                </div>
              </div>

              {/* Max concurrent */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#8d96a0]">Max Concurrent</label>
                  <span className="text-xs font-mono font-bold text-[#57D7BA]">{maxConcurrent}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={maxConcurrent}
                  onChange={(e) => setMaxConcurrent(Number(e.target.value))}
                  className="w-full accent-[#57D7BA]"
                />
                <div className="flex justify-between text-[9px] text-[#484f58]">
                  <span>1</span>
                  <span>50</span>
                </div>
              </div>
            </div>

            <button
              onClick={fetchBacktest}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#3fb950] hover:bg-[#3fb950]/80 disabled:opacity-50 text-[#0d1117] text-sm font-bold transition-colors"
            >
              {loading ? "Running…" : "Run Backtest"}
            </button>
          </div>
        )}
      </div>

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-[#161b27] border border-[#21262d] animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-xl bg-[#161b27] border border-[#21262d] animate-pulse" />
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="rounded-xl bg-[#f85149]/10 border border-[#f85149]/20 p-6 text-center space-y-2">
          <AlertTriangle className="size-6 text-[#f85149] mx-auto" />
          <p className="text-sm text-[#f0f6fc]">{error}</p>
          <p className="text-xs text-[#8d96a0]">The signal_history table may be empty. Run the ingest pipeline to populate data.</p>
          <button
            onClick={fetchBacktest}
            className="mt-2 px-4 py-1.5 rounded-lg border border-[#388bfd]/30 text-xs text-[#388bfd] hover:bg-[#388bfd]/10 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Empty ────────────────────────────────────────────────────────── */}
      {!loading && !error && result && result.totalSignals === 0 && (
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-10 text-center space-y-2">
          <TrendingUp className="size-8 text-[#484f58] mx-auto" />
          <p className="text-sm text-[#f0f6fc]">No signals matched your filters.</p>
          <p className="text-xs text-[#8d96a0]">
            Try lowering the minimum spread, or run the ingest pipeline to collect signal history data.
          </p>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {!loading && !error && result && result.totalSignals > 0 && (
        <>
          {/* ── Hero stats ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Total Net Profit"
              value={fmt$(result.totalNetProfit)}
              sub={`on $${result.totalCapitalDeployed.toFixed(0)} deployed`}
              positive={isPositive}
              large
            />
            <StatCard
              label="Win Rate"
              value={fmtPct(result.winRate, false)}
              sub={`${result.winningTrades}W / ${result.losingTrades}L`}
              positive={result.winRate >= 50}
              large
            />
            <StatCard
              label="Avg Return / Trade"
              value={fmtPct(result.averageReturnPerTrade)}
              sub={`${result.resolvedTrades} resolved`}
              positive={result.averageReturnPerTrade >= 0}
              large
            />
            <StatCard
              label="Avg Hold Time"
              value={`${result.averageHoldDays.toFixed(1)}d`}
              sub={`${result.openTrades} still open`}
              large
            />
          </div>

          {/* ── Secondary stats ────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Total Signals"
              value={String(result.totalSignals)}
              sub={`${result.tradesEntered} trades entered`}
            />
            <StatCard
              label="Total Return"
              value={fmtPct(result.totalReturn)}
              sub="on deployed capital"
              positive={result.totalReturn >= 0}
            />
            <StatCard
              label="Max Drawdown"
              value={fmtPct(result.maxDrawdown, false)}
              sub="peak-to-trough"
              positive={result.maxDrawdown < 10}
            />
            <StatCard
              label="Sharpe (approx)"
              value={result.sharpeApprox.toFixed(2)}
              sub="annualized, simplified"
              positive={result.sharpeApprox >= 1}
            />
          </div>

          {/* ── Equity curve ───────────────────────────────────────────── */}
          {result.equityCurve.length > 1 ? (
            <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#f0f6fc]">Cumulative P&amp;L</h2>
                <span className="text-[10px] text-[#484f58]">Closed trades only</span>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.equityCurve} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                    <defs>
                      <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? "#3fb950" : "#f85149"} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={isPositive ? "#3fb950" : "#f85149"} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#484f58", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis
                      tick={{ fill: "#484f58", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v}`}
                      width={48}
                    />
                    <Tooltip content={<EquityTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke={isPositive ? "#3fb950" : "#f85149"}
                      strokeWidth={2}
                      fill="url(#equityGrad)"
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="tradeCount"
                      stroke="transparent"
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-6 text-center text-xs text-[#484f58]">
              Not enough resolved trades to render equity curve.
            </div>
          )}

          {/* ── Category breakdown ─────────────────────────────────────── */}
          {Object.keys(result.byCategory).length > 0 && (
            <div className="rounded-xl bg-[#161b27] border border-[#21262d] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#21262d]">
                <h2 className="text-sm font-bold text-[#f0f6fc]">By Category</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#21262d]">
                      <th className="text-left text-[10px] font-bold uppercase tracking-widest text-[#484f58] py-2 pl-4 pr-2">Category</th>
                      <th className="text-right text-[10px] font-bold uppercase tracking-widest text-[#484f58] py-2 px-2">Trades</th>
                      <th className="text-right text-[10px] font-bold uppercase tracking-widest text-[#484f58] py-2 px-2">Win Rate</th>
                      <th className="text-right text-[10px] font-bold uppercase tracking-widest text-[#484f58] py-2 pl-2 pr-4">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.byCategory)
                      .sort(([, a], [, b]) => b.netProfit - a.netProfit)
                      .map(([cat, stats]) => {
                        const wr = stats.winRate;
                        const wrColor = wr >= 70 ? "#3fb950" : wr >= 50 ? "#d29922" : "#f85149";
                        return (
                          <tr key={cat} className="border-b border-[#21262d]/50 hover:bg-[#1c2333]/50 transition-colors">
                            <td className="py-2.5 pl-4 pr-2">
                              <span className="text-xs text-[#f0f6fc] font-medium">{cat}</span>
                            </td>
                            <td className="py-2.5 px-2 text-right text-xs text-[#8d96a0] tabular-nums">{stats.trades}</td>
                            <td className="py-2.5 px-2 text-right">
                              <span className="text-xs font-semibold tabular-nums" style={{ color: wrColor }}>
                                {fmtPct(wr, false)}
                              </span>
                            </td>
                            <td className="py-2.5 pl-2 pr-4 text-right">
                              <span
                                className="text-xs font-mono font-semibold tabular-nums"
                                style={{ color: stats.netProfit >= 0 ? "#3fb950" : "#f85149" }}
                              >
                                {fmt$(stats.netProfit)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Signal table ───────────────────────────────────────────── */}
          <div className="rounded-xl bg-[#161b27] border border-[#21262d] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#21262d] flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold text-[#f0f6fc]">
                Signal Log
                <span className="ml-2 text-[11px] font-normal text-[#484f58]">
                  ({tableSignals.length} signals)
                </span>
              </h2>
              {/* Status filter */}
              <div className="flex items-center gap-1">
                {(["all", "won", "lost", "open"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setFilterStatus(s); setPage(0); }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      filterStatus === s
                        ? "bg-[#388bfd]/15 text-[#388bfd] border border-[#388bfd]/30"
                        : "text-[#484f58] hover:text-[#8d96a0]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#21262d]">
                    <th className="text-left text-[10px] font-bold uppercase tracking-widest text-[#484f58] py-2 pl-4 pr-2">
                      Question
                    </th>
                    <th
                      className="text-center text-[10px] font-bold uppercase tracking-widest text-[#484f58] py-2 px-2 cursor-pointer hover:text-[#8d96a0] whitespace-nowrap"
                      onClick={() => toggleSort("spread")}
                    >
                      Spread <SortIcon col="spread" />
                    </th>
                    <th className="text-right text-[10px] font-bold uppercase tracking-widest text-[#484f58] py-2 px-2 whitespace-nowrap">
                      Cost
                    </th>
                    <th
                      className="text-right text-[10px] font-bold uppercase tracking-widest text-[#484f58] py-2 px-2 cursor-pointer hover:text-[#8d96a0] whitespace-nowrap"
                      onClick={() => toggleSort("netProfit")}
                    >
                      Net P&amp;L <SortIcon col="netProfit" />
                    </th>
                    <th
                      className="text-right text-[10px] font-bold uppercase tracking-widest text-[#484f58] py-2 px-2 cursor-pointer hover:text-[#8d96a0] whitespace-nowrap"
                      onClick={() => toggleSort("returnPct")}
                    >
                      Return <SortIcon col="returnPct" />
                    </th>
                    <th className="text-center text-[10px] font-bold uppercase tracking-widest text-[#484f58] py-2 px-2 whitespace-nowrap">
                      Hold
                    </th>
                    <th className="text-center text-[10px] font-bold uppercase tracking-widest text-[#484f58] py-2 pl-2 pr-4 whitespace-nowrap">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageSignals.map((s) => (
                    <SignalRow key={s.id || s.disagreementId} signal={s} />
                  ))}
                  {pageSignals.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-[#484f58]">
                        No signals match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-[#21262d] flex items-center justify-between">
                <span className="text-[11px] text-[#484f58]">
                  Page {page + 1} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-1.5 rounded-lg hover:bg-[#1c2333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="size-4 text-[#8d96a0]" />
                  </button>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1.5 rounded-lg hover:bg-[#1c2333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="size-4 text-[#8d96a0]" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Disclaimer ─────────────────────────────────────────────── */}
          <div className="rounded-xl bg-[#d29922]/8 border border-[#d29922]/20 p-4 text-[11px] text-[#d29922] leading-relaxed">
            <strong>Disclaimer: </strong>{result.disclaimer}
            {" "}
            <Link href="/methodology#backtester" className="underline hover:text-[#d29922]/80 transition-colors">
              See full methodology →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
