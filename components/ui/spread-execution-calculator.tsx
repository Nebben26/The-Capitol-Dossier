"use client";

import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ─── Fee Regimes ───────────────────────────────────────────────────────────
const FEE_REGIMES = {
  polymarket_us: { label: "Polymarket (US 2%)",   polyRate: 0.02, kalshiRate: 0.07 },
  polymarket_eu: { label: "Polymarket (EU 0%)",   polyRate: 0.00, kalshiRate: 0.07 },
  kalshi_basic:  { label: "Kalshi Basic (7%)",     polyRate: 0.02, kalshiRate: 0.07 },
  kalshi_pro:    { label: "Kalshi Pro (3%)",       polyRate: 0.02, kalshiRate: 0.03 },
} as const;

type FeeKey = keyof typeof FEE_REGIMES;

// ─── Helpers ───────────────────────────────────────────────────────────────
function computeArb(
  polyPrice: number,    // cents
  kalshiPrice: number,  // cents
  spread: number,       // points
  capital: number,      // USD
  feeKey: FeeKey,
  daysToResolution: number | null,
) {
  const regime = FEE_REGIMES[feeKey];
  const low  = Math.min(polyPrice, kalshiPrice);
  const high = Math.max(polyPrice, kalshiPrice);

  // Cost per contract pair = low_YES + (100 - high_YES) = 100 - spread
  const costPerPair = (low + (100 - high)) / 100;
  const nContracts  = Math.floor(capital / costPerPair);

  if (nContracts === 0) return { tooSmall: true } as const;

  const grossProfit = nContracts * (spread / 100);
  // Fees split evenly across both legs (expected-value approach)
  const totalFees   = grossProfit * (regime.polyRate + regime.kalshiRate) / 2;
  const netProfit   = grossProfit - totalFees;
  const annReturn   = (daysToResolution && daysToResolution > 0)
    ? (netProfit / capital) * (365 / daysToResolution) * 100
    : null;

  return { tooSmall: false, nContracts, grossProfit, totalFees, netProfit, annReturn };
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

function fmtPct(n: number) {
  return n.toFixed(1) + "%";
}

// ─── Annualized return color ───────────────────────────────────────────────
function annColor(v: number | null) {
  if (v === null) return "#8892b0";
  if (v < 0)   return "#ef4444";
  if (v < 20)  return "#8892b0";
  if (v < 50)  return "#22c55e";
  return "#fbbf24";
}

// ─── Component ────────────────────────────────────────────────────────────
export interface SpreadExecutionCalculatorProps {
  polymarketPrice: number;    // cents
  kalshiPrice: number;        // cents
  spread: number;             // points
  daysToResolution: number | null;
  polymarketSide: "YES" | "NO";
  kalshiSide: "YES" | "NO";
}

export function SpreadExecutionCalculator({
  polymarketPrice,
  kalshiPrice,
  spread,
  daysToResolution,
  polymarketSide,
  kalshiSide,
}: SpreadExecutionCalculatorProps) {
  const [capital, setCapital]     = useState(1000);
  const [feeKey, setFeeKey]       = useState<FeeKey>("polymarket_us");

  // Edge case: inverted spread (no arb available)
  const isInverted = spread <= 0;

  const result = useMemo(() => {
    if (isInverted) return null;
    return computeArb(polymarketPrice, kalshiPrice, spread, capital, feeKey, daysToResolution);
  }, [polymarketPrice, kalshiPrice, spread, capital, feeKey, daysToResolution, isInverted]);

  const netProfit = (!result || result.tooSmall) ? 0 : result.netProfit;
  const isPositive = netProfit > 0;
  const isNegative = !result?.tooSmall && netProfit < 0;

  return (
    <Card
      className="bg-[#1a1e2e] transition-all"
      style={{
        borderColor: isPositive ? "rgba(87,215,186,0.2)" : "rgba(47,55,79,0.8)",
        borderWidth: 1,
      }}
    >
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <DollarSign className="size-4 text-[#57D7BA]" />
          <span className="text-sm font-semibold text-[#e2e8f0]">Spread Execution Planner</span>
          {isPositive && (
            <span className="ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">
              PROFITABLE
            </span>
          )}
        </div>

        {/* Early exits */}
        {isInverted && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 text-[11px] text-[#ef4444]">
            <AlertTriangle className="size-4 shrink-0" />
            No arbitrage available at current prices
          </div>
        )}

        {!isInverted && (
          <>
            {/* Trade instructions */}
            <div className="grid grid-cols-2 gap-2 text-center">
              {[
                { platform: "Polymarket", side: polymarketSide, price: polymarketPrice, color: "#6366f1" },
                { platform: "Kalshi",     side: kalshiSide,     price: kalshiPrice,     color: "#22c55e" },
              ].map(({ platform, side, price, color }) => (
                <div key={platform} className="p-3 rounded-lg bg-[#222638] border border-[#2f374f]">
                  <div className="text-[9px] text-[#8892b0] mb-1">{platform}</div>
                  <div className="font-mono font-bold text-lg tabular-nums" style={{ color }}>
                    Buy {side}
                  </div>
                  <div className="text-[10px] text-[#8892b0] font-mono tabular-nums">at {side === "YES" ? price : 100 - price}¢</div>
                </div>
              ))}
            </div>

            {/* Capital slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-[#8892b0]">Capital</span>
                <span className="text-[12px] font-bold font-mono tabular-nums text-[#e2e8f0]">{fmt(capital)}</span>
              </div>
              <input
                type="range"
                min={100}
                max={10000}
                step={100}
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-[#2f374f] accent-[#57D7BA] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#8892b0] mt-0.5 font-mono">
                <span>$100</span>
                <span>$10,000</span>
              </div>
            </div>

            {/* Fee regime */}
            <div>
              <div className="text-[11px] text-[#8892b0] mb-1.5">Fee Regime</div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(FEE_REGIMES) as FeeKey[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setFeeKey(k)}
                    className={`px-2 py-1 rounded text-[9px] font-medium transition-all ${
                      feeKey === k
                        ? "bg-[#57D7BA] text-[#0f1119]"
                        : "bg-[#222638] text-[#8892b0] border border-[#2f374f] hover:text-[#e2e8f0]"
                    }`}
                  >
                    {FEE_REGIMES[k].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            {result?.tooSmall ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[11px] text-[#f59e0b]">
                <AlertTriangle className="size-4 shrink-0" />
                Position size too small to execute — increase slider
              </div>
            ) : result ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-[#222638] border border-[#2f374f]">
                    <div className="text-[9px] text-[#8892b0] mb-0.5">Contracts (each side)</div>
                    <div className="font-mono font-bold tabular-nums text-[#e2e8f0]">{result.nContracts.toLocaleString()}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#222638] border border-[#2f374f]">
                    <div className="text-[9px] text-[#8892b0] mb-0.5">Gross Profit</div>
                    <div className="font-mono font-bold tabular-nums text-[#e2e8f0]">{fmt(result.grossProfit)}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#222638] border border-[#2f374f]">
                    <div className="text-[9px] text-[#8892b0] mb-0.5">Total Fees</div>
                    <div className="font-mono font-bold tabular-nums text-[#ef4444]">−{fmt(result.totalFees)}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#222638] border border-[#2f374f]">
                    <div className="text-[9px] text-[#8892b0] mb-0.5">Net Profit</div>
                    <div
                      className="font-mono font-bold tabular-nums"
                      style={{ color: result.netProfit >= 0 ? "#22c55e" : "#ef4444" }}
                    >
                      {result.netProfit >= 0 ? "+" : ""}{fmt(result.netProfit)}
                    </div>
                  </div>
                </div>

                {/* Net profit label */}
                {isNegative && (
                  <div className="text-[10px] font-semibold text-[#ef4444] flex items-center gap-1">
                    <AlertTriangle className="size-3" /> Fees exceed spread — not profitable
                  </div>
                )}

                {/* Annualized return */}
                <div className="p-3 rounded-lg bg-[#222638] border border-[#2f374f] flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-[#8892b0] mb-0.5 flex items-center gap-1">
                      <TrendingUp className="size-3" /> Annualized Return
                    </div>
                    {result.annReturn === null ? (
                      <div className="text-[11px] text-[#8892b0] italic">Annualized return unavailable (resolution date unknown)</div>
                    ) : (
                      <div className="font-mono font-bold text-lg tabular-nums" style={{ color: annColor(result.annReturn) }}>
                        {fmtPct(result.annReturn)}
                      </div>
                    )}
                  </div>
                  {daysToResolution && (
                    <div className="text-right">
                      <div className="text-[9px] text-[#8892b0]">Days to resolution</div>
                      <div className="font-mono font-bold text-[#e2e8f0] tabular-nums">{daysToResolution}d</div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* Generic disclaimer */}
        <p className="text-[9px] text-[#4a5168] leading-relaxed">
          ⚠ Verify resolution criteria on both platforms before trading. Calculator assumes simultaneous execution and does not account for slippage or liquidity constraints.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Exported helper for ann return calculation (for column/strip) ─────────
export function calcAnnReturn(
  polyPrice: number,
  kalshiPrice: number,
  spread: number,
  daysToResolution: number | null,
  capital = 1000,
  feeKey: FeeKey = "polymarket_us",
): number | null {
  if (spread <= 0 || !daysToResolution || daysToResolution <= 0) return null;
  const result = computeArb(polyPrice, kalshiPrice, spread, capital, feeKey, daysToResolution);
  if (result.tooSmall) return null;
  return result.annReturn ?? null;
}
