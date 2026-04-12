// ─── Quiver Markets — Historical Backtester ──────────────────────────────────
// Simulates a mechanical arb strategy over signal_history data.
// IMPORTANT: This is a simulation. See BacktestResult.disclaimer.

export interface BacktestConfig {
  minSpread: number;           // minimum spread to enter (default 10)
  capitalPerTrade: number;     // dollars deployed on cheap leg per trade (default 100)
  maxConcurrentTrades: number; // max open positions at once (default 20)
  startDate?: string;
  endDate?: string;
  categories?: string[];
}

export interface BacktestSignal {
  id: number;
  disagreementId: string;
  question: string;
  category: string | null;
  detectedAt: string;
  spread: number;
  polyPrice: number;
  kalshiPrice: number;
  resolved: boolean;
  resolvedAt: string | null;
  resolutionOutcome: string | null;
  polyFinalPrice: number | null;
  kalshiFinalPrice: number | null;
  arbProfitPct: number | null;
  wouldHaveProfited: boolean | null;
  // Computed by backtest
  contracts: number;
  totalCost: number;
  grossProfit: number;
  fees: number;
  netProfit: number;
  returnPct: number;
  status: "open" | "won" | "lost";
  holdDays: number | null;
}

export interface BacktestResult {
  config: BacktestConfig;
  totalSignals: number;
  tradesEntered: number;
  resolvedTrades: number;
  openTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalCapitalDeployed: number;
  totalGrossProfit: number;
  totalNetProfit: number;
  totalReturn: number;
  averageReturnPerTrade: number;
  averageHoldDays: number;
  maxDrawdown: number;
  sharpeApprox: number;
  equityCurve: Array<{ date: string; equity: number; tradeCount: number }>;
  signals: BacktestSignal[];
  byCategory: Record<string, { trades: number; winRate: number; totalReturn: number; netProfit: number }>;
  disclaimer: string;
}

// Fee constants (from Session 16 corrected formulas)
const POLY_WITHDRAWAL_PER_CONTRACT = 0.02;
const KALSHI_FEE_PER_CONTRACT = 0.01;
const FEES_PER_CONTRACT = POLY_WITHDRAWAL_PER_CONTRACT + KALSHI_FEE_PER_CONTRACT;

export const BACKTEST_DISCLAIMER =
  "This backtest is a simulation using historical signal data. It does not account for slippage, " +
  "partial fills, platform outages, or execution delays. Past performance does not guarantee future results. " +
  "Prediction markets carry risk of total loss. This is not financial advice.";

export async function runBacktest(
  config: BacktestConfig,
  rawSignals: any[]
): Promise<BacktestResult> {
  const {
    minSpread = 10,
    capitalPerTrade = 100,
    maxConcurrentTrades = 20,
    startDate,
    endDate,
  } = config;

  // ── Filter and sort signals ────────────────────────────────────────────────
  let filtered = rawSignals
    .filter((s) => Number(s.spread) >= minSpread)
    .sort((a, b) => new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime());

  if (startDate) {
    filtered = filtered.filter((s) => s.detected_at >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter((s) => s.detected_at <= endDate);
  }
  if (config.categories?.length) {
    filtered = filtered.filter((s) =>
      config.categories!.some((c) => c.toLowerCase() === (s.category ?? "").toLowerCase())
    );
  }

  // Deduplicate: one entry per disagreement_id (use the most recent per disagreement)
  const deduped = new Map<string, any>();
  for (const s of filtered) {
    const existing = deduped.get(s.disagreement_id);
    if (!existing || s.detected_at > existing.detected_at) {
      deduped.set(s.disagreement_id, s);
    }
  }
  const signals = Array.from(deduped.values())
    .sort((a, b) => new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime());

  // ── Simulate trades with concurrency limit ─────────────────────────────────
  const openPositions = new Set<string>();
  const tradeResults: BacktestSignal[] = [];

  for (const s of signals) {
    // Enforce concurrency cap
    if (openPositions.size >= maxConcurrentTrades) {
      // Remove any resolved ones first
      for (const id of openPositions) {
        const t = tradeResults.find((r) => r.disagreementId === id);
        if (t && t.resolved) openPositions.delete(id);
      }
      if (openPositions.size >= maxConcurrentTrades) continue;
    }

    openPositions.add(s.disagreement_id);

    const spread = Number(s.spread);
    const polyPrice = Number(s.poly_price);
    const kalshiPrice = Number(s.kalshi_price);
    const cheapPrice = polyPrice < kalshiPrice ? polyPrice : kalshiPrice;
    const expPrice = polyPrice < kalshiPrice ? kalshiPrice : polyPrice;

    // Contracts = capitalPerTrade / cost-per-cheap-contract
    const contracts = cheapPrice > 0 ? capitalPerTrade / (cheapPrice / 100) : 0;
    // Total cost = cheap leg + expensive NO leg
    const cheapCost = contracts * (cheapPrice / 100);
    const expCost = contracts * ((100 - expPrice) / 100);
    const totalCost = cheapCost + expCost;
    const grossProfit = contracts * (spread / 100);
    const fees = contracts * FEES_PER_CONTRACT;
    const netProfit = grossProfit - fees;
    const returnPct = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

    // P&L status
    let status: "open" | "won" | "lost" = "open";
    let computedGross = grossProfit;
    let computedNet = netProfit;
    let computedReturn = returnPct;

    const isResolved = Boolean(s.resolved);

    if (isResolved) {
      // For resolved signals: arb profit = spread - fees regardless of direction
      // (market-neutral: winning leg offsets losing leg, net = spread per contract)
      const profit = s.arb_profit_pct != null
        ? (Number(s.arb_profit_pct) / 100) * totalCost
        : netProfit;  // fallback to computed

      computedGross = profit + fees;
      computedNet = profit;
      computedReturn = totalCost > 0 ? (profit / totalCost) * 100 : 0;
      status = computedNet >= 0 ? "won" : "lost";
      openPositions.delete(s.disagreement_id);
    } else {
      // Open: mark at 0 P&L (unrealized, no resolution yet)
      computedGross = 0;
      computedNet = 0;
      computedReturn = 0;
      status = "open";
    }

    // Hold time
    let holdDays: number | null = null;
    if (isResolved && s.resolved_at) {
      holdDays = Math.max(0, Math.round(
        (new Date(s.resolved_at).getTime() - new Date(s.detected_at).getTime()) / 86_400_000
      ));
    }

    tradeResults.push({
      id: Number(s.id) || 0,
      disagreementId: s.disagreement_id,
      question: s.question,
      category: s.category ?? null,
      detectedAt: s.detected_at,
      spread,
      polyPrice,
      kalshiPrice,
      resolved: isResolved,
      resolvedAt: s.resolved_at ?? null,
      resolutionOutcome: s.resolution_outcome ?? null,
      polyFinalPrice: s.poly_final_price != null ? Number(s.poly_final_price) : null,
      kalshiFinalPrice: s.kalshi_final_price != null ? Number(s.kalshi_final_price) : null,
      arbProfitPct: s.arb_profit_pct != null ? Number(s.arb_profit_pct) : null,
      wouldHaveProfited: s.would_have_profited ?? null,
      contracts,
      totalCost,
      grossProfit: computedGross,
      fees,
      netProfit: computedNet,
      returnPct: computedReturn,
      status,
      holdDays,
    });
  }

  // ── Aggregate stats ────────────────────────────────────────────────────────
  const resolved = tradeResults.filter((t) => t.resolved);
  const open = tradeResults.filter((t) => !t.resolved);
  const won = resolved.filter((t) => t.status === "won");
  const lost = resolved.filter((t) => t.status === "lost");

  const totalCapitalDeployed = tradeResults.reduce((sum, t) => sum + t.totalCost, 0);
  const totalGrossProfit = resolved.reduce((sum, t) => sum + t.grossProfit, 0);
  const totalNetProfit = resolved.reduce((sum, t) => sum + t.netProfit, 0);
  const totalReturn = totalCapitalDeployed > 0 ? (totalNetProfit / totalCapitalDeployed) * 100 : 0;

  const avgReturnPerTrade =
    resolved.length > 0
      ? resolved.reduce((sum, t) => sum + t.returnPct, 0) / resolved.length
      : 0;

  const avgHoldDays =
    resolved.filter((t) => t.holdDays != null).length > 0
      ? resolved
          .filter((t) => t.holdDays != null)
          .reduce((sum, t) => sum + (t.holdDays ?? 0), 0) /
        resolved.filter((t) => t.holdDays != null).length
      : 0;

  const winRate = resolved.length > 0 ? (won.length / resolved.length) * 100 : 0;

  // ── Equity curve ──────────────────────────────────────────────────────────
  // Daily cumulative closed P&L
  const equityMap = new Map<string, { net: number; count: number }>();
  for (const t of resolved) {
    const day = t.resolvedAt ? t.resolvedAt.slice(0, 10) : t.detectedAt.slice(0, 10);
    const prev = equityMap.get(day) ?? { net: 0, count: 0 };
    equityMap.set(day, { net: prev.net + t.netProfit, count: prev.count + 1 });
  }

  const sortedDays = Array.from(equityMap.keys()).sort();
  let cumEquity = 0;
  let cumCount = 0;
  const equityCurve = sortedDays.map((date) => {
    const { net, count } = equityMap.get(date)!;
    cumEquity += net;
    cumCount += count;
    return { date, equity: Math.round(cumEquity * 100) / 100, tradeCount: cumCount };
  });

  // ── Max drawdown ──────────────────────────────────────────────────────────
  let peak = 0;
  let maxDrawdown = 0;
  for (const pt of equityCurve) {
    if (pt.equity > peak) peak = pt.equity;
    const dd = peak > 0 ? ((peak - pt.equity) / peak) * 100 : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // ── Simplified Sharpe (daily returns) ────────────────────────────────────
  let sharpeApprox = 0;
  if (equityCurve.length > 2) {
    const dailyReturns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prev = equityCurve[i - 1].equity;
      const curr = equityCurve[i].equity;
      if (prev !== 0) dailyReturns.push((curr - prev) / Math.abs(prev));
    }
    if (dailyReturns.length > 1) {
      const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
      const variance = dailyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / dailyReturns.length;
      const stdDev = Math.sqrt(variance);
      sharpeApprox = stdDev > 0 ? (mean / stdDev) * Math.sqrt(252) : 0;
    }
  }

  // ── Category breakdown ────────────────────────────────────────────────────
  const catMap = new Map<string, { total: number; wins: number; net: number }>();
  for (const t of resolved) {
    const cat = t.category ?? "Other";
    const prev = catMap.get(cat) ?? { total: 0, wins: 0, net: 0 };
    catMap.set(cat, {
      total: prev.total + 1,
      wins: prev.wins + (t.status === "won" ? 1 : 0),
      net: prev.net + t.netProfit,
    });
  }
  const byCategory: BacktestResult["byCategory"] = {};
  for (const [cat, stats] of catMap) {
    byCategory[cat] = {
      trades: stats.total,
      winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
      totalReturn: totalCapitalDeployed > 0 ? (stats.net / totalCapitalDeployed) * 100 : 0,
      netProfit: stats.net,
    };
  }

  return {
    config: { minSpread, capitalPerTrade, maxConcurrentTrades },
    totalSignals: signals.length,
    tradesEntered: tradeResults.length,
    resolvedTrades: resolved.length,
    openTrades: open.length,
    winningTrades: won.length,
    losingTrades: lost.length,
    winRate,
    totalCapitalDeployed,
    totalGrossProfit,
    totalNetProfit,
    totalReturn,
    averageReturnPerTrade: avgReturnPerTrade,
    averageHoldDays: avgHoldDays,
    maxDrawdown,
    sharpeApprox,
    equityCurve,
    signals: tradeResults,
    byCategory,
    disclaimer: BACKTEST_DISCLAIMER,
  };
}
