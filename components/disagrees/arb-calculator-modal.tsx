"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, TrendingUp, TrendingDown, X } from "lucide-react";
import type { Disagreement } from "@/lib/mockData";
import { calcAnnReturn, formatAnnReturn } from "@/components/ui/spread-execution-calculator";

interface Props {
  d: Disagreement;
  open: boolean;
  onClose: () => void;
}

function sidesFor(d: Disagreement): { polymarketSide: "YES" | "NO"; kalshiSide: "YES" | "NO" } {
  if (d.direction === "poly-higher") {
    return { polymarketSide: "NO", kalshiSide: "YES" };
  }
  return { polymarketSide: "YES", kalshiSide: "NO" };
}

export function ArbCalculatorModal({ d, open, onClose }: Props) {
  const [capital, setCapital] = useState("1000");

  if (!open) return null;

  const capitalNum = parseFloat(capital) || 0;
  const { polymarketSide, kalshiSide } = sidesFor(d);
  const daysToRes = d.daysLeft > 0 ? d.daysLeft : null;
  const annReturn = calcAnnReturn(d.polyPrice, d.kalshiPrice, d.spread, daysToRes);
  const formatted = formatAnnReturn(annReturn, daysToRes);

  const polyLeg = capitalNum / 2;
  const kalshiLeg = capitalNum / 2;
  const spreadPct = d.spread / 100;
  const grossProfit = capitalNum * spreadPct;
  const fees = capitalNum * 0.01;
  const netProfit = grossProfit - fees;
  const netPct = capitalNum > 0 ? (netProfit / capitalNum) * 100 : 0;
  const annNetPct = daysToRes && daysToRes > 0
    ? (netPct / daysToRes) * 365
    : null;
  const isProfit = netProfit > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md bg-[#161b27] border border-[#21262d] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262d]">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#57D7BA]/15 flex items-center justify-center">
              <Calculator className="size-4 text-[#57D7BA]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#f0f6fc]">One-Click Arb Calculator</div>
              <div className="text-[10px] text-[#8d96a0] truncate max-w-[250px]">{d.question}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-lg bg-[#21262d] flex items-center justify-center text-[#8d96a0] hover:text-[#f0f6fc] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Capital input */}
          <div>
            <label className="text-[11px] font-semibold text-[#8d96a0] uppercase tracking-wide mb-1.5 block">
              Capital to Deploy
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#8d96a0]">$</span>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="flex-1 bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-sm font-mono text-[#f0f6fc] focus:outline-none focus:border-[#57D7BA]/50"
                min="0"
                step="100"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[500, 1000, 5000, 10000].map((v) => (
                <button
                  key={v}
                  onClick={() => setCapital(String(v))}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                    capitalNum === v
                      ? "bg-[#57D7BA]/20 text-[#57D7BA] border border-[#57D7BA]/30"
                      : "bg-[#0d1117] text-[#8d96a0] border border-[#21262d] hover:text-[#f0f6fc]"
                  }`}
                >
                  ${v >= 1000 ? `${v / 1000}K` : v}
                </button>
              ))}
            </div>
          </div>

          {/* Trade breakdown */}
          <div className="rounded-xl bg-[#0d1117] border border-[#21262d] overflow-hidden">
            <div className="px-3 py-2 border-b border-[#21262d]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Trade Breakdown</span>
            </div>
            <div className="divide-y divide-[#21262d]">
              <div className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <div className="text-[10px] text-[#8d96a0]">Polymarket leg</div>
                  <div className="text-sm font-semibold text-[#f0f6fc]">Buy {polymarketSide} @ {d.polyPrice}¢</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-[#f0f6fc]">${polyLeg.toFixed(2)}</div>
                  <div className="text-[9px] text-[#484f58]">~50% of capital</div>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5">
                <div>
                  <div className="text-[10px] text-[#8d96a0]">Kalshi leg</div>
                  <div className="text-sm font-semibold text-[#f0f6fc]">Buy {kalshiSide} @ {d.kalshiPrice}¢</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-[#f0f6fc]">${kalshiLeg.toFixed(2)}</div>
                  <div className="text-[9px] text-[#484f58]">~50% of capital</div>
                </div>
              </div>
            </div>
          </div>

          {/* P&L summary */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{
              borderColor: isProfit ? "rgba(63,185,80,0.3)" : "rgba(248,81,73,0.3)",
              backgroundColor: isProfit ? "rgba(63,185,80,0.06)" : "rgba(248,81,73,0.06)",
            }}
          >
            <div className="px-3 py-2 border-b" style={{ borderColor: isProfit ? "rgba(63,185,80,0.15)" : "rgba(248,81,73,0.15)" }}>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isProfit ? "#3fb950" : "#f85149" }}>
                Projected P&amp;L
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: isProfit ? "rgba(63,185,80,0.1)" : "rgba(248,81,73,0.1)" }}>
              <div className="flex justify-between items-center px-3 py-2">
                <span className="text-[11px] text-[#8d96a0]">Gross profit (full convergence)</span>
                <span className="text-sm font-mono font-bold" style={{ color: isProfit ? "#3fb950" : "#f85149" }}>+${grossProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2">
                <span className="text-[11px] text-[#8d96a0]">Est. fees (~1%)</span>
                <span className="text-sm font-mono text-[#f85149]">-${fees.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center px-3 py-2.5">
                <span className="text-[11px] font-semibold text-[#f0f6fc]">Net profit</span>
                <span className="text-base font-mono font-bold" style={{ color: isProfit ? "#3fb950" : "#f85149" }}>
                  {isProfit ? "+" : ""}{netProfit.toFixed(2)} ({netPct.toFixed(1)}%)
                </span>
              </div>
              {annNetPct !== null && (
                <div className="flex justify-between items-center px-3 py-2 bg-[#0d1117]/50">
                  <div className="flex items-center gap-1">
                    {annNetPct > 0 ? <TrendingUp className="size-3 text-[#3fb950]" /> : <TrendingDown className="size-3 text-[#f85149]" />}
                    <span className="text-[11px] text-[#8d96a0]">Annualized ({daysToRes}d)</span>
                  </div>
                  <span className="text-sm font-mono font-bold" style={{ color: formatted.color }}>{formatted.text}</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-[#484f58] leading-relaxed">
            * Assumes full spread convergence at resolution. Not financial advice.
          </div>

          <Button className="w-full bg-[#57D7BA] text-[#0d1117] hover:bg-[#57D7BA]/80 font-semibold" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
