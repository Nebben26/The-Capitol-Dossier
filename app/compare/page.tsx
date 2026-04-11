"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Search,
  X,
} from "lucide-react";
import { useTopMarkets } from "@/hooks/useData";
import { sparkGen } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import type { Market } from "@/lib/mockData";

// Build 14-day chart data by merging two price series
function buildCompareData(
  historyA: { d: number; v: number }[],
  historyB: { d: number; v: number }[],
  labelA: string,
  labelB: string
) {
  const len = Math.min(historyA.length, historyB.length, 14);
  const sliceA = historyA.slice(-len);
  const sliceB = historyB.slice(-len);
  return sliceA.map((pt, i) => ({
    day: `D-${len - i}`,
    [labelA]: Math.round(pt.v),
    [labelB]: Math.round(sliceB[i]?.v ?? 50),
  }));
}

function StatRow({ label, a, b }: { label: string; a: React.ReactNode; b: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2 border-b border-[#21262d] last:border-0">
      <div className="text-right text-sm font-mono tabular-nums text-[#e2e8f0]">{a}</div>
      <div className="text-[10px] text-[#484f58] uppercase tracking-widest text-center w-20">{label}</div>
      <div className="text-left text-sm font-mono tabular-nums text-[#e2e8f0]">{b}</div>
    </div>
  );
}

function MarketPicker({
  value,
  onChange,
  markets,
  placeholder,
  color,
}: {
  value: Market | null;
  onChange: (m: Market | null) => void;
  markets: Market[];
  placeholder: string;
  color: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return markets.slice(0, 8);
    return markets
      .filter((m) => m.question.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);
  }, [query, markets]);

  function select(m: Market) {
    onChange(m);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative">
      {value ? (
        <div
          className="flex items-start gap-2 p-3 rounded-xl border-2 cursor-pointer hover:opacity-90 transition-all"
          style={{ borderColor: color, backgroundColor: `${color}10` }}
          onClick={() => onChange(null)}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#f0f6fc] leading-snug line-clamp-2">{value.question}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
                {value.platform}
              </span>
              <span className="text-[10px] text-[#8d96a0]">{value.category}</span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="text-[#8d96a0] hover:text-[#f0f6fc] transition-colors shrink-0 mt-0.5"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8d96a0] z-10 pointer-events-none" />
          <input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="w-full h-11 pl-9 pr-4 rounded-xl border-2 bg-[#161b27] text-sm text-[#e2e8f0] placeholder:text-[#484f58] focus:outline-none transition-all"
            style={{ borderColor: `${color}50` }}
          />
          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#161b27] border border-[#21262d] rounded-xl shadow-xl z-50 overflow-hidden">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-[#8d96a0]">No markets found</div>
              ) : (
                filtered.map((m) => (
                  <button
                    key={m.id}
                    onMouseDown={() => select(m)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#57D7BA]/5 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#e2e8f0] truncate">{m.question}</p>
                      <span className="text-[9px] text-[#8d96a0]">{m.category} · {m.platform}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#e2e8f0] shrink-0">{m.price}¢</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const { markets } = useTopMarkets();
  const [marketA, setMarketA] = useState<Market | null>(null);
  const [marketB, setMarketB] = useState<Market | null>(null);
  const [histA, setHistA] = useState<{ d: number; v: number }[]>([]);
  const [histB, setHistB] = useState<{ d: number; v: number }[]>([]);

  // Auto-select top two markets once data loads
  useEffect(() => {
    if (markets.length >= 2 && !marketA && !marketB) {
      setMarketA(markets[0]);
      setMarketB(markets[1]);
    }
  }, [markets, marketA, marketB]);

  // Fetch or generate price history for selected markets
  useEffect(() => {
    async function fetchHistory(market: Market, setter: (h: { d: number; v: number }[]) => void) {
      try {
        const { data } = await supabase
          .from("price_history")
          .select("price, timestamp")
          .eq("market_id", market.id)
          .gte("timestamp", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
          .order("timestamp", { ascending: true })
          .limit(200);
        if (data && data.length >= 2) {
          setter(data.map((r, i) => ({ d: i, v: Number(r.price) * 100 })));
          return;
        }
      } catch {
        // fall through
      }
      setter(sparkGen(market.price - 10, 0, 14));
    }

    if (marketA) fetchHistory(marketA, setHistA);
    else setHistA([]);
    if (marketB) fetchHistory(marketB, setHistB);
    else setHistB([]);
  }, [marketA?.id, marketB?.id]);

  const chartData = useMemo(() => {
    if (!marketA || !marketB || histA.length === 0 || histB.length === 0) return [];
    const labelA = marketA.question.slice(0, 20) + "…";
    const labelB = marketB.question.slice(0, 20) + "…";
    return buildCompareData(histA, histB, labelA, labelB);
  }, [marketA, marketB, histA, histB]);

  const COLOR_A = "#57D7BA";
  const COLOR_B = "#8b5cf6";

  const labelA = marketA ? marketA.question.slice(0, 20) + "…" : "Market A";
  const labelB = marketB ? marketB.question.slice(0, 20) + "…" : "Market B";

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-5 space-y-5">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
          <ArrowLeftRight className="size-7 text-[#57D7BA]" />
          Market Compare
        </h1>
        <p className="text-sm text-[#8d96a0] mt-1">
          Side-by-side 14-day price chart and key stats for any two markets
        </p>
      </div>

      {/* Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: COLOR_A }}>
            Market A
          </div>
          <MarketPicker
            value={marketA}
            onChange={setMarketA}
            markets={markets.filter((m) => m.id !== marketB?.id)}
            placeholder="Search for Market A…"
            color={COLOR_A}
          />
        </div>
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: COLOR_B }}>
            Market B
          </div>
          <MarketPicker
            value={marketB}
            onChange={setMarketB}
            markets={markets.filter((m) => m.id !== marketA?.id)}
            placeholder="Search for Market B…"
            color={COLOR_B}
          />
        </div>
      </div>

      {/* Chart */}
      <Card className="bg-[#161b27] border-[#21262d]">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="size-4 text-[#57D7BA]" />
            14-Day Price History
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {!marketA || !marketB ? (
            <div className="h-64 flex items-center justify-center text-sm text-[#484f58]">
              Select two markets above to compare them
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-[#484f58]">
              Loading price history…
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis dataKey="day" tick={{ fill: "#484f58", fontSize: 10 }} />
                  <YAxis
                    tick={{ fill: "#484f58", fontSize: 10 }}
                    tickFormatter={(v) => `${v}¢`}
                    domain={[0, 100]}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: "#161b27",
                      border: "1px solid #21262d",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                    labelStyle={{ color: "#8d96a0" }}
                    formatter={(value, name) => [`${value}¢`, name as string]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={(value, entry) => (
                      <span style={{ color: (entry as any).color }}>{value}</span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey={labelA}
                    stroke={COLOR_A}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={labelB}
                    stroke={COLOR_B}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side-by-side stats */}
      {marketA && marketB && (
        <Card className="bg-[#161b27] border-[#21262d]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ArrowLeftRight className="size-4 text-[#57D7BA]" />
              Side-by-Side Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 mb-3">
              <div
                className="text-right text-[10px] font-bold uppercase tracking-widest truncate"
                style={{ color: COLOR_A }}
              >
                {marketA.question.slice(0, 30)}…
              </div>
              <div className="w-20" />
              <div
                className="text-left text-[10px] font-bold uppercase tracking-widest truncate"
                style={{ color: COLOR_B }}
              >
                {marketB.question.slice(0, 30)}…
              </div>
            </div>

            <StatRow
              label="Price"
              a={<span className="text-[#f0f6fc]">{marketA.price}¢</span>}
              b={<span className="text-[#f0f6fc]">{marketB.price}¢</span>}
            />
            <StatRow
              label="24h"
              a={
                <span
                  className={`flex items-center justify-end gap-0.5 ${marketA.change >= 0 ? "text-[#3fb950]" : "text-[#f85149]"}`}
                >
                  {marketA.change >= 0 ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {marketA.change >= 0 ? "+" : ""}
                  {marketA.change}pt
                </span>
              }
              b={
                <span
                  className={`flex items-center gap-0.5 ${marketB.change >= 0 ? "text-[#3fb950]" : "text-[#f85149]"}`}
                >
                  {marketB.change >= 0 ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {marketB.change >= 0 ? "+" : ""}
                  {marketB.change}pt
                </span>
              }
            />
            <StatRow
              label="Volume"
              a={<span className="text-[#f0f6fc]">{marketA.volume}</span>}
              b={<span className="text-[#f0f6fc]">{marketB.volume}</span>}
            />
            <StatRow
              label="Platform"
              a={<span className="text-[#8d96a0]">{marketA.platform}</span>}
              b={<span className="text-[#8d96a0]">{marketB.platform}</span>}
            />
            <StatRow
              label="Category"
              a={<span className="text-[#8d96a0]">{marketA.category}</span>}
              b={<span className="text-[#8d96a0]">{marketB.category}</span>}
            />
            <StatRow
              label="Resolves"
              a={
                <span className="flex items-center justify-end gap-1 text-[#8d96a0]">
                  <Clock className="size-3" />
                  {marketA.daysLeft > 0 ? `${marketA.daysLeft}d` : marketA.resolution}
                </span>
              }
              b={
                <span className="flex items-center gap-1 text-[#8d96a0]">
                  <Clock className="size-3" />
                  {marketB.daysLeft > 0 ? `${marketB.daysLeft}d` : marketB.resolution}
                </span>
              }
            />
            <StatRow
              label="Whales"
              a={<span className="text-[#f0f6fc]">{marketA.whaleCount}</span>}
              b={<span className="text-[#f0f6fc]">{marketB.whaleCount}</span>}
            />
            <StatRow
              label="Traders"
              a={<span className="text-[#f0f6fc]">{marketA.traders.toLocaleString()}</span>}
              b={<span className="text-[#f0f6fc]">{marketB.traders.toLocaleString()}</span>}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
