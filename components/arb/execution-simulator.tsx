"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Clock,
  ExternalLink,
  Shield,
  TrendingUp,
  Calculator,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  BarChart3,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SimDisagreement {
  id: string;
  question: string;
  category: string;
  polyPrice: number;       // cents (0-100)
  kalshiPrice: number;     // cents (0-100)
  spread: number;          // pts
  polyVol?: string;        // e.g. "$12.4M"
  kalshiVol?: string;
  daysLeft?: number;
  direction?: "poly-higher" | "kalshi-higher";
  resolution?: string;
}

interface HistoryRow {
  detected_at: string;
  spread: number;
  poly_price: number;
  kalshi_price: number;
}

// ─── Fee constants ────────────────────────────────────────────────────────────
const POLY_FEE_PER_CONTRACT = 0.00;    // no maker/taker fee on Polymarket
const POLY_WITHDRAWAL_PER_CONTRACT = 0.02;
const KALSHI_FEE_PER_CONTRACT = 0.01;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseVol(v?: string): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[$KM,]/g, ""));
  if (v.includes("M")) return n * 1_000_000;
  if (v.includes("K")) return n * 1_000;
  return n;
}

function fmtUsd(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function riskColor(level: "green" | "yellow" | "red") {
  return level === "green" ? "#3fb950" : level === "yellow" ? "#d29922" : "#f85149";
}

function riskBg(level: "green" | "yellow" | "red") {
  return level === "green" ? "bg-[#3fb950]/10 border-[#3fb950]/30" : level === "yellow" ? "bg-[#d29922]/10 border-[#d29922]/30" : "bg-[#f85149]/10 border-[#f85149]/30";
}

// ─── Collapsible step ─────────────────────────────────────────────────────────

function Step({
  num, title, open, onToggle, children,
}: {
  num: number; title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#21262d] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left bg-[#161b27] hover:bg-[#1c2333] transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-[#57D7BA]/15 border border-[#57D7BA]/30 flex items-center justify-center shrink-0 text-[#57D7BA] text-xs font-bold">
          {num}
        </div>
        <span className="flex-1 text-sm font-semibold text-[#f0f6fc]">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-[#484f58]" /> : <ChevronDown className="w-4 h-4 text-[#484f58]" />}
      </button>
      {open && <div className="px-4 py-4 bg-[#0d1117] space-y-3">{children}</div>}
    </div>
  );
}

// ─── Risk row ─────────────────────────────────────────────────────────────────

function RiskRow({ label, level, desc }: { label: string; level: "green" | "yellow" | "red"; desc: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border p-3 ${riskBg(level)}`}>
      <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: riskColor(level) }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-[#f0f6fc]">{label}</div>
        <div className="text-[11px] text-[#8d96a0] leading-relaxed mt-0.5">{desc}</div>
      </div>
      <span
        className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0"
        style={{ color: riskColor(level), backgroundColor: `${riskColor(level)}20` }}
      >
        {level === "green" ? "LOW" : level === "yellow" ? "MED" : "HIGH"}
      </span>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ExecutionSimulator({ disagreement: d }: { disagreement: SimDisagreement }) {
  const [openStep, setOpenStep] = useState<number | null>(1);
  const [capital, setCapital] = useState(100);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Which platform is cheaper / expensive
  const cheaperIsPoly = (d.direction === "kalshi-higher") || (!d.direction && d.polyPrice < d.kalshiPrice);
  const cheapPrice = cheaperIsPoly ? d.polyPrice : d.kalshiPrice;
  const expPrice = cheaperIsPoly ? d.kalshiPrice : d.polyPrice;
  const cheapPlatform = cheaperIsPoly ? "Polymarket" : "Kalshi";
  const expPlatform = cheaperIsPoly ? "Kalshi" : "Polymarket";
  const cheapVol = cheaperIsPoly ? parseVol(d.polyVol) : parseVol(d.kalshiVol);
  const expVol = cheaperIsPoly ? parseVol(d.kalshiVol) : parseVol(d.polyVol);

  // Gross return %
  const grossReturn = cheapPrice > 0 ? (d.spread / cheapPrice) * 100 : 0;

  // Position size calculator
  const contracts = capital / (cheapPrice / 100);
  const cheapCost = contracts * (cheapPrice / 100);
  const expCost = contracts * ((100 - expPrice) / 100);          // buy NO on expensive side
  const totalCost = cheapCost + expCost;
  const grossProfit = contracts * (d.spread / 100);
  const feesTotal = contracts * (POLY_WITHDRAWAL_PER_CONTRACT + KALSHI_FEE_PER_CONTRACT);
  const netProfit = grossProfit - feesTotal;
  const netReturnPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  // Risk assessment
  const minVol = Math.min(cheapVol, expVol);
  const liqLevel: "green" | "yellow" | "red" = minVol > 100_000 ? "green" : minVol > 10_000 ? "yellow" : "red";
  const daysLeft = d.daysLeft ?? 0;
  const timingLevel: "green" | "yellow" | "red" = daysLeft > 30 ? "green" : daysLeft > 7 ? "yellow" : "red";

  // Historical spread frequency
  const spreadFreq = history.filter((h) => h.spread >= d.spread).length;
  const stabilityLevel: "green" | "yellow" | "red" = spreadFreq >= 3 ? "green" : spreadFreq >= 1 ? "yellow" : "red";

  // Fetch signal history
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("signal_history")
          .select("detected_at, spread, poly_price, kalshi_price")
          .eq("disagreement_id", d.id)
          .order("detected_at", { ascending: true })
          .limit(90);
        setHistory(data ?? []);
      } catch {
        // non-fatal
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [d.id]);

  const toggleStep = (n: number) => setOpenStep((prev) => (prev === n ? null : n));

  const spreadChartData = history.map((h) => ({
    t: new Date(h.detected_at).getTime(),
    spread: Number(h.spread),
  }));

  const peakRow = history.reduce<HistoryRow | null>((best, h) =>
    !best || h.spread > best.spread ? h : best, null);

  return (
    <div className="space-y-4 pt-2">
      {/* ─── Hero: Trade Summary ────────────────────────────────────────── */}
      <div className="rounded-xl bg-gradient-to-r from-[#57D7BA]/10 to-[#161b27] border border-[#57D7BA]/30 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-[#57D7BA]" />
          <span className="text-xs font-bold text-[#57D7BA] uppercase tracking-widest">Arb Execution Plan</span>
        </div>
        <p className="text-sm font-semibold text-[#f0f6fc] leading-snug">{d.question}</p>

        <div className="flex items-stretch gap-3 flex-wrap">
          {/* Leg 1 */}
          <div className="flex-1 min-w-[120px] rounded-lg bg-[#0d1117] border border-[#3fb950]/30 p-3">
            <div className="text-[9px] font-bold uppercase tracking-widest text-[#3fb950] mb-1">Leg 1 — BUY</div>
            <div className="text-sm font-bold text-[#f0f6fc]">YES on {cheapPlatform}</div>
            <div className="text-2xl font-bold font-mono text-[#3fb950] mt-1">{cheapPrice}<span className="text-sm text-[#484f58]">¢</span></div>
          </div>

          <div className="flex items-center shrink-0">
            <ArrowRight className="w-5 h-5 text-[#484f58]" />
          </div>

          {/* Leg 2 */}
          <div className="flex-1 min-w-[120px] rounded-lg bg-[#0d1117] border border-[#f85149]/30 p-3">
            <div className="text-[9px] font-bold uppercase tracking-widest text-[#f85149] mb-1">Leg 2 — BUY NO</div>
            <div className="text-sm font-bold text-[#f0f6fc]">NO on {expPlatform}</div>
            <div className="text-2xl font-bold font-mono text-[#f85149] mt-1">{100 - expPrice}<span className="text-sm text-[#484f58]">¢</span></div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2 border-t border-[#21262d]">
          <div>
            <div className="text-[10px] text-[#484f58] uppercase tracking-widest">Spread</div>
            <div className="text-xl font-bold font-mono text-[#d29922]">{d.spread}pt</div>
          </div>
          <div>
            <div className="text-[10px] text-[#484f58] uppercase tracking-widest">Gross return</div>
            <div className="text-xl font-bold font-mono text-[#57D7BA]">{grossReturn.toFixed(1)}%</div>
          </div>
          {d.daysLeft && d.daysLeft > 0 && (
            <div>
              <div className="text-[10px] text-[#484f58] uppercase tracking-widest">Resolves in</div>
              <div className="text-xl font-bold font-mono text-[#f0f6fc]">{d.daysLeft}d</div>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-[#d29922]/10 border border-[#d29922]/20 px-3 py-2 text-[11px] text-[#d29922] flex items-start gap-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>This is not financial advice. Prediction market prices can move rapidly and these trades carry real risk. Read all risk factors below before executing.</span>
        </div>
      </div>

      {/* ─── Step-by-step ───────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-widest flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#57D7BA]" />
          Step-by-Step Execution
        </h3>

        {/* Step 1 */}
        <Step num={1} title={`Open ${cheapPlatform} — Buy YES at ${cheapPrice}¢`} open={openStep === 1} onToggle={() => toggleStep(1)}>
          <p className="text-xs text-[#8d96a0] leading-relaxed">
            Navigate to the market on <strong className="text-[#f0f6fc]">{cheapPlatform}</strong> and place a YES buy order at <strong className="text-[#57D7BA]">{cheapPrice}¢</strong> per contract.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg bg-[#161b27] border border-[#21262d] p-2">
              <div className="text-[#484f58] uppercase tracking-widest text-[9px] mb-1">Side</div>
              <div className="font-bold text-[#3fb950]">BUY YES</div>
            </div>
            <div className="rounded-lg bg-[#161b27] border border-[#21262d] p-2">
              <div className="text-[#484f58] uppercase tracking-widest text-[9px] mb-1">Price</div>
              <div className="font-bold font-mono text-[#f0f6fc]">{cheapPrice}¢</div>
            </div>
            <div className="rounded-lg bg-[#161b27] border border-[#21262d] p-2">
              <div className="text-[#484f58] uppercase tracking-widest text-[9px] mb-1">Volume ({cheapPlatform})</div>
              <div className="font-bold font-mono text-[#f0f6fc]">{cheapVol > 0 ? fmtUsd(cheapVol) : "—"}</div>
            </div>
            <div className="rounded-lg bg-[#161b27] border border-[#21262d] p-2">
              <div className="text-[#484f58] uppercase tracking-widest text-[9px] mb-1">Slippage risk</div>
              <div className={`font-bold ${cheapVol < 10_000 ? "text-[#f85149]" : cheapVol < 100_000 ? "text-[#d29922]" : "text-[#3fb950]"}`}>
                {cheapVol < 10_000 ? "HIGH" : cheapVol < 100_000 ? "MEDIUM" : "LOW"}
              </div>
            </div>
          </div>
          {cheapVol < 10_000 && (
            <div className="rounded-lg bg-[#f85149]/10 border border-[#f85149]/20 px-3 py-2 text-[11px] text-[#f85149] flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Low volume — your order may move the price. Use a limit order and consider splitting into smaller tranches.
            </div>
          )}
        </Step>

        {/* Step 2 */}
        <Step num={2} title={`Open ${expPlatform} — Buy NO at ${100 - expPrice}¢`} open={openStep === 2} onToggle={() => toggleStep(2)}>
          <p className="text-xs text-[#8d96a0] leading-relaxed">
            On <strong className="text-[#f0f6fc]">{expPlatform}</strong>, buy the NO side at <strong className="text-[#57D7BA]">{100 - expPrice}¢</strong>. This is equivalent to selling YES at {expPrice}¢ — it creates the hedge.
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg bg-[#161b27] border border-[#21262d] p-2">
              <div className="text-[#484f58] uppercase tracking-widest text-[9px] mb-1">Side</div>
              <div className="font-bold text-[#f85149]">BUY NO</div>
            </div>
            <div className="rounded-lg bg-[#161b27] border border-[#21262d] p-2">
              <div className="text-[#484f58] uppercase tracking-widest text-[9px] mb-1">Effective price</div>
              <div className="font-bold font-mono text-[#f0f6fc]">{100 - expPrice}¢</div>
            </div>
          </div>
          <div className="rounded-lg bg-[#388bfd]/10 border border-[#388bfd]/20 px-3 py-2 text-[11px] text-[#8d96a0] flex items-start gap-2">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#388bfd]" />
            <span>Time these two orders as close together as possible. Spreads can move in seconds — enter both legs within the same minute if you can.</span>
          </div>
        </Step>

        {/* Step 3 */}
        <Step num={3} title="Wait for resolution" open={openStep === 3} onToggle={() => toggleStep(3)}>
          <p className="text-xs text-[#8d96a0] leading-relaxed mb-3">
            Once both legs are filled, hold until the market resolves. Your profit is locked in at the spread regardless of the outcome — that's what makes it an arbitrage.
          </p>
          <div className="space-y-2 text-[11px]">
            <div className="rounded-lg bg-[#161b27] border border-[#21262d] p-3 space-y-1">
              <div className="font-semibold text-[#3fb950]">If YES resolves:</div>
              <div className="text-[#8d96a0]">
                Collect $1.00/contract on {cheapPlatform} (paid out). Lose NO payout on {expPlatform}. Net ≈ <span className="font-mono text-[#57D7BA]">{d.spread}pt</span> per contract.
              </div>
            </div>
            <div className="rounded-lg bg-[#161b27] border border-[#21262d] p-3 space-y-1">
              <div className="font-semibold text-[#f85149]">If NO resolves:</div>
              <div className="text-[#8d96a0]">
                Lose {cheapPrice}¢ on {cheapPlatform}. Collect $1.00/contract on {expPlatform} NO. Net ≈ <span className="font-mono text-[#57D7BA]">{d.spread}pt</span> per contract.
              </div>
            </div>
          </div>
          {d.resolution && (
            <div className="flex items-center gap-2 text-[11px] text-[#8d96a0] mt-2">
              <Clock className="w-3.5 h-3.5 text-[#484f58]" />
              Expected resolution: <span className="font-semibold text-[#f0f6fc]">{d.resolution}</span>
              {d.daysLeft && d.daysLeft > 0 && <span className="text-[#484f58]">({d.daysLeft}d)</span>}
            </div>
          )}
        </Step>

        {/* Step 4 */}
        <Step num={4} title="Collect proceeds" open={openStep === 4} onToggle={() => toggleStep(4)}>
          <div className="space-y-3 text-[11px] text-[#8d96a0] leading-relaxed">
            <p>After resolution, winning contracts are automatically credited to your balance on each platform. Withdrawal to your bank or wallet typically takes 1-5 business days.</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-[#161b27] border border-[#21262d] p-3">
                <div className="font-semibold text-[#f0f6fc] mb-1">Polymarket</div>
                <div className="text-[#8d96a0]">No trading fee. $0.02 withdrawal per contract. Payouts in USDC.</div>
              </div>
              <div className="rounded-lg bg-[#161b27] border border-[#21262d] p-3">
                <div className="font-semibold text-[#f0f6fc] mb-1">Kalshi</div>
                <div className="text-[#8d96a0]">$0.01/contract fee. US-regulated, ACH withdrawal in USD.</div>
              </div>
            </div>
            <div className="rounded-lg bg-[#484f58]/10 border border-[#484f58]/20 px-3 py-2 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#484f58]" />
              <span>Tax implications vary by jurisdiction. Consult a tax professional — prediction market gains may be treated as ordinary income or capital gains depending on where you live. This is not tax advice.</span>
            </div>
          </div>
        </Step>
      </div>

      {/* ─── Risk Assessment ─────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-widest flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-[#d29922]" />
          Risk Assessment
        </h3>
        <RiskRow
          label="Liquidity Risk"
          level={liqLevel}
          desc={
            minVol > 100_000
              ? `Both platforms have healthy volume (${fmtUsd(cheapVol)} / ${fmtUsd(expVol)}). Slippage should be minimal.`
              : minVol > 10_000
              ? `Volume is moderate (${fmtUsd(cheapVol)} / ${fmtUsd(expVol)}). Use limit orders to avoid unfavorable fills.`
              : `Low volume detected (${fmtUsd(cheapVol)} / ${fmtUsd(expVol)}). Large orders may move the price significantly — size down.`
          }
        />
        <RiskRow
          label="Resolution Risk"
          level="yellow"
          desc="Verify that the resolution criteria are identical on both platforms before executing. Even small wording differences can cause one platform to resolve differently."
        />
        <RiskRow
          label="Timing Risk"
          level={timingLevel}
          desc={
            daysLeft > 30
              ? `${daysLeft} days to resolution. Plenty of time for spreads to converge.`
              : daysLeft > 7
              ? `${daysLeft} days to resolution. Monitor closely — spreads may close suddenly near resolution.`
              : daysLeft > 0
              ? `Only ${daysLeft} days to resolution. Spread may not converge in time to be actionable.`
              : "No resolution date available. Treat as indefinite duration."
          }
        />
        <RiskRow
          label="Spread Stability"
          level={stabilityLevel}
          desc={
            history.length === 0
              ? "No historical data available — this may be the first time this spread has been detected."
              : spreadFreq >= 3
              ? `This spread has been detected at this level or higher ${spreadFreq} times. Suggests structural, persistent mispricing.`
              : spreadFreq >= 1
              ? `Detected at this level ${spreadFreq} time(s). Watch for a few more confirmations before sizing up.`
              : "First detection at this spread level. Could be transient noise — confirm before executing."
          }
        />
        <RiskRow
          label="Counterparty Risk"
          level="yellow"
          desc="Both Polymarket (CFTC-registered) and Kalshi (CFTC-regulated) are legitimate platforms, but smart contracts and platform settlement mechanics carry non-zero risk. Only trade amounts you can afford to lose."
        />
      </div>

      {/* ─── Position Size Calculator ────────────────────────────────────── */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-4">
        <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-widest flex items-center gap-2">
          <Calculator className="w-3.5 h-3.5 text-[#388bfd]" />
          Position Size Calculator
        </h3>

        <div className="flex items-center gap-3">
          <label className="text-xs text-[#8d96a0] whitespace-nowrap">Capital to allocate</label>
          <div className="relative flex-1 max-w-[180px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484f58] text-sm">$</span>
            <input
              type="number"
              min={1}
              max={1_000_000}
              value={capital}
              onChange={(e) => setCapital(Math.max(1, Number(e.target.value) || 100))}
              className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg pl-7 pr-3 py-2 text-sm font-mono text-[#f0f6fc] focus:outline-none focus:border-[#388bfd]/50 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
          {[
            { label: "Contracts", value: contracts.toFixed(0), color: "#f0f6fc" },
            { label: `Cost on ${cheapPlatform}`, value: fmtUsd(cheapCost), color: "#f0f6fc" },
            { label: `Cost on ${expPlatform}`, value: fmtUsd(expCost), color: "#f0f6fc" },
            { label: "Total invested", value: fmtUsd(totalCost), color: "#f0f6fc" },
            { label: "Gross profit", value: fmtUsd(grossProfit), color: "#3fb950" },
            { label: "Fees", value: `-${fmtUsd(feesTotal)}`, color: "#f85149" },
            { label: "Net profit", value: fmtUsd(netProfit), color: netProfit >= 0 ? "#3fb950" : "#f85149" },
            { label: "Net return %", value: `${netReturnPct.toFixed(2)}%`, color: netReturnPct >= 0 ? "#3fb950" : "#f85149" },
            { label: "Break-even spread", value: `${(feesTotal / (contracts / 100)).toFixed(1)}pt`, color: "#8d96a0" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-[#0d1117] border border-[#21262d] p-2.5">
              <div className="text-[#484f58] uppercase tracking-widest text-[9px] mb-1">{s.label}</div>
              <div className="font-bold font-mono text-sm" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-[#484f58]">
          Fees: Polymarket $0.02 withdrawal/contract · Kalshi $0.01/contract · No Polymarket trading fee · Assumes full fill at displayed prices.
        </p>
      </div>

      {/* ─── Historical Context ──────────────────────────────────────────── */}
      {!historyLoading && (
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-3">
          <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#57D7BA]" />
            Historical Context
          </h3>

          {history.length === 0 ? (
            <p className="text-xs text-[#484f58]">No historical data yet — this spread will be recorded starting from the next ingestion run.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
                <div className="rounded-lg bg-[#0d1117] border border-[#21262d] p-2.5">
                  <div className="text-[#484f58] uppercase tracking-widest text-[9px] mb-1">First detected</div>
                  <div className="font-semibold text-[#f0f6fc]">
                    {new Date(history[0].detected_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
                <div className="rounded-lg bg-[#0d1117] border border-[#21262d] p-2.5">
                  <div className="text-[#484f58] uppercase tracking-widest text-[9px] mb-1">Snapshots</div>
                  <div className="font-bold font-mono text-[#f0f6fc]">{history.length}</div>
                </div>
                {peakRow && (
                  <div className="rounded-lg bg-[#0d1117] border border-[#21262d] p-2.5">
                    <div className="text-[#484f58] uppercase tracking-widest text-[9px] mb-1">Peak spread</div>
                    <div className="font-bold font-mono text-[#d29922]">{Number(peakRow.spread).toFixed(1)}pt</div>
                  </div>
                )}
              </div>

              {spreadChartData.length > 1 && (
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spreadChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="spreadGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#d29922" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#d29922" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="t" tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} tick={{ fill: "#484f58", fontSize: 9 }} />
                      <YAxis tick={{ fill: "#484f58", fontSize: 9 }} />
                      <RechartsTooltip
                        contentStyle={{ background: "#161b27", border: "1px solid #21262d", borderRadius: 8, fontSize: 11 }}
                        labelFormatter={(v) => new Date(Number(v)).toLocaleDateString()}
                        formatter={(v: any) => [`${Number(v).toFixed(1)}pt`, "Spread"]}
                      />
                      <Area type="monotone" dataKey="spread" stroke="#d29922" strokeWidth={2} fill="url(#spreadGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
