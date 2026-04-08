/**
 * lib/signals.ts — Smart Signal Detection Library
 * Analyzes whale_positions data to produce typed Signal objects.
 */

import { supabase } from "./supabase";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type SignalType =
  | "whale_consensus"
  | "smart_money_concentration"
  | "size_spike"
  | "whale_divergence";

export interface Signal {
  signal_id: string;
  type: SignalType;
  confidence: number; // 1-10
  market_id: string;
  market_question: string;
  headline: string;
  detail: string;
  detected_at: string; // ISO
  stats: Record<string, unknown>;
}

// ─── INTERNAL TYPES ──────────────────────────────────────────────────────────

interface RawPosition {
  whale_id: string;
  market_id: string;
  outcome: string;
  current_value: number;
  pnl: number;
  updated_at: string;
}

interface MarketMeta {
  id: string;
  question: string;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

function isYes(outcome: string): boolean {
  return String(outcome || "").toLowerCase().startsWith("y");
}

function hoursAgo(isoString: string): number {
  return (Date.now() - new Date(isoString).getTime()) / 3_600_000;
}

// ─── DETECTOR 1: WHALE CONSENSUS ─────────────────────────────────────────────

/**
 * 3+ top-50 whales (by total P&L) took the same outcome on a market within 6h.
 * Confidence: 3 whales → 6, 4-5 → 7, 6+ → 8-9
 */
export function detectWhaleConsensus(
  positions: RawPosition[],
  questionMap: Map<string, string>
): Signal[] {
  const cutoff = 6; // hours

  // Group recent positions by market
  const byMarket: Record<
    string,
    { yes: RawPosition[]; no: RawPosition[] }
  > = {};

  for (const p of positions) {
    if (hoursAgo(p.updated_at) > cutoff) continue;
    if (!byMarket[p.market_id]) byMarket[p.market_id] = { yes: [], no: [] };
    if (isYes(p.outcome)) byMarket[p.market_id].yes.push(p);
    else byMarket[p.market_id].no.push(p);
  }

  const signals: Signal[] = [];

  for (const [market_id, sides] of Object.entries(byMarket)) {
    for (const [side, group] of [["YES", sides.yes], ["NO", sides.no]] as const) {
      if (group.length < 3) continue;

      const totalValue = group.reduce((s, p) => s + p.current_value, 0);
      const uniqueWhales = new Set(group.map((p) => p.whale_id)).size;
      if (uniqueWhales < 3) continue;

      const confidence =
        uniqueWhales >= 6 ? Math.min(9, 7 + Math.floor((uniqueWhales - 6) / 2))
          : uniqueWhales >= 4 ? 7
          : 6;

      const question = questionMap.get(market_id) || market_id;
      const signal_id = `whale_consensus_${market_id}_${side}`;

      signals.push({
        signal_id,
        type: "whale_consensus",
        confidence,
        market_id,
        market_question: question,
        headline: `${uniqueWhales} whales piling into ${side} in the last 6h`,
        detail: `${fmtUsd(totalValue)} total position size on ${side}. Whales in consensus: ${uniqueWhales}.`,
        detected_at: new Date().toISOString(),
        stats: {
          whale_count: uniqueWhales,
          side,
          total_value_usd: totalValue,
          window_hours: cutoff,
        },
      });
    }
  }

  return signals;
}

// ─── DETECTOR 2: SMART MONEY CONCENTRATION ───────────────────────────────────

/**
 * Top-10 whales by total P&L have >70% of their positions in one direction
 * on a market, AND total position size >$500K.
 * Confidence: scales with concentration %.
 */
export function detectSmartMoneyConcentration(
  positions: RawPosition[],
  topWhaleIds: Set<string>,
  questionMap: Map<string, string>
): Signal[] {
  const MIN_TOTAL = 500_000;
  const MIN_CONCENTRATION = 70;

  // Filter to top-whale positions only
  const topPositions = positions.filter((p) => topWhaleIds.has(p.whale_id));

  // Group by market
  const byMarket: Record<
    string,
    { yesValue: number; noValue: number; whaleSet: Set<string> }
  > = {};

  for (const p of topPositions) {
    if (!byMarket[p.market_id])
      byMarket[p.market_id] = { yesValue: 0, noValue: 0, whaleSet: new Set() };
    const bucket = byMarket[p.market_id];
    bucket.whaleSet.add(p.whale_id);
    if (isYes(p.outcome)) bucket.yesValue += p.current_value;
    else bucket.noValue += p.current_value;
  }

  const signals: Signal[] = [];

  for (const [market_id, data] of Object.entries(byMarket)) {
    const total = data.yesValue + data.noValue;
    if (total < MIN_TOTAL) continue;

    const yesPct = (data.yesValue / total) * 100;
    const noPct = 100 - yesPct;
    const [leadPct, leadSide] =
      yesPct >= noPct ? [yesPct, "YES"] : [noPct, "NO"];

    if (leadPct < MIN_CONCENTRATION) continue;

    const confidence = Math.min(9, Math.floor(6 + (leadPct - 70) / 10));
    const question = questionMap.get(market_id) || market_id;

    signals.push({
      signal_id: `smart_money_concentration_${market_id}`,
      type: "smart_money_concentration",
      confidence,
      market_id,
      market_question: question,
      headline: `Smart money ${Math.round(leadPct)}% concentrated on ${leadSide}`,
      detail: `Top whales have ${fmtUsd(total)} total exposure — ${Math.round(leadPct)}% on ${leadSide}. ${data.whaleSet.size} of the top-10 whales involved.`,
      detected_at: new Date().toISOString(),
      stats: {
        yes_value_usd: data.yesValue,
        no_value_usd: data.noValue,
        total_value_usd: total,
        lead_side: leadSide,
        concentration_pct: Math.round(leadPct),
        top_whale_count: data.whaleSet.size,
      },
    });
  }

  return signals;
}

// ─── DETECTOR 3: SIZE SPIKE ───────────────────────────────────────────────────

/**
 * An individual position is >3x the whale's own average position size,
 * AND was updated within the last 2h.
 */
export function detectSizeSpike(
  positions: RawPosition[],
  questionMap: Map<string, string>
): Signal[] {
  const SPIKE_MULTIPLIER = 3;
  const WINDOW_HOURS = 2;

  // Compute each whale's average position size
  const whaleAvg: Record<string, { total: number; count: number }> = {};
  for (const p of positions) {
    if (!whaleAvg[p.whale_id]) whaleAvg[p.whale_id] = { total: 0, count: 0 };
    whaleAvg[p.whale_id].total += p.current_value;
    whaleAvg[p.whale_id].count += 1;
  }

  const signals: Signal[] = [];
  const seen = new Set<string>();

  for (const p of positions) {
    if (hoursAgo(p.updated_at) > WINDOW_HOURS) continue;
    if (p.current_value < 10_000) continue; // ignore tiny positions

    const avg = whaleAvg[p.whale_id];
    if (!avg || avg.count < 3) continue; // need enough history

    const whaleAvgSize = avg.total / avg.count;
    const multiplier = p.current_value / whaleAvgSize;

    if (multiplier < SPIKE_MULTIPLIER) continue;

    const dedup = `size_spike_${p.whale_id}_${p.market_id}`;
    if (seen.has(dedup)) continue;
    seen.add(dedup);

    const confidence = Math.min(9, Math.floor(5 + multiplier));
    const side = isYes(p.outcome) ? "YES" : "NO";
    const shortWhale = `${p.whale_id.slice(0, 6)}…${p.whale_id.slice(-4)}`;
    const question = questionMap.get(p.market_id) || p.market_id;

    signals.push({
      signal_id: `size_spike_${p.whale_id}_${p.market_id}`,
      type: "size_spike",
      confidence,
      market_id: p.market_id,
      market_question: question,
      headline: `Whale ${shortWhale} placed ${multiplier.toFixed(1)}x their average bet on ${side}`,
      detail: `${fmtUsd(p.current_value)} position (avg: ${fmtUsd(whaleAvgSize)}) — unusually large move in the last 2h.`,
      detected_at: new Date().toISOString(),
      stats: {
        whale_id: p.whale_id,
        position_value_usd: p.current_value,
        whale_avg_size_usd: whaleAvgSize,
        multiplier: Math.round(multiplier * 10) / 10,
        side,
        updated_at: p.updated_at,
      },
    });
  }

  return signals;
}

// ─── DETECTOR 4: WHALE DIVERGENCE ────────────────────────────────────────────

/**
 * Top-20 most accurate whales (by win rate) are betting the OPPOSITE direction
 * from the broader whale herd on a given market.
 * Confidence: scales with accuracy gap between smart vs herd.
 */
export function detectWhaleDivergence(
  positions: RawPosition[],
  accuracyMap: Map<string, { accuracy: number; total: number }>,
  questionMap: Map<string, string>
): Signal[] {
  // Rank whales by accuracy; take top 20 with >=5 resolved positions
  const ranked = [...accuracyMap.entries()]
    .filter(([, a]) => a.total >= 5)
    .sort((a, b) => b[1].accuracy - a[1].accuracy)
    .slice(0, 20)
    .map(([id]) => id);

  const smartSet = new Set(ranked);

  // Per market: smart vs herd direction
  const byMarket: Record<
    string,
    {
      smartYes: number; smartNo: number;
      herdYes: number; herdNo: number;
    }
  > = {};

  for (const p of positions) {
    if (!byMarket[p.market_id])
      byMarket[p.market_id] = { smartYes: 0, smartNo: 0, herdYes: 0, herdNo: 0 };

    const isSmart = smartSet.has(p.whale_id);
    const yes = isYes(p.outcome);

    if (isSmart) {
      if (yes) byMarket[p.market_id].smartYes += p.current_value;
      else byMarket[p.market_id].smartNo += p.current_value;
    } else {
      if (yes) byMarket[p.market_id].herdYes += p.current_value;
      else byMarket[p.market_id].herdNo += p.current_value;
    }
  }

  const signals: Signal[] = [];

  for (const [market_id, data] of Object.entries(byMarket)) {
    const smartTotal = data.smartYes + data.smartNo;
    const herdTotal = data.herdYes + data.herdNo;
    if (smartTotal < 50_000 || herdTotal < 50_000) continue;

    const smartLeadYes = data.smartYes >= data.smartNo;
    const herdLeadYes = data.herdYes >= data.herdNo;

    // Divergence: smart money disagrees with herd
    if (smartLeadYes === herdLeadYes) continue;

    const smartSide = smartLeadYes ? "YES" : "NO";
    const herdSide = smartLeadYes ? "NO" : "YES";

    const smartPct = (Math.max(data.smartYes, data.smartNo) / smartTotal) * 100;
    const herdPct = (Math.max(data.herdYes, data.herdNo) / herdTotal) * 100;
    const avgSmartAccuracy =
      ranked
        .filter((id) => accuracyMap.has(id))
        .reduce((s, id) => s + (accuracyMap.get(id)?.accuracy ?? 0), 0) / ranked.length;

    const confidence = Math.min(9, Math.floor(5 + (avgSmartAccuracy - 50) / 10));
    const question = questionMap.get(market_id) || market_id;

    signals.push({
      signal_id: `whale_divergence_${market_id}`,
      type: "whale_divergence",
      confidence,
      market_id,
      market_question: question,
      headline: `Smart money on ${smartSide} while the herd bets ${herdSide}`,
      detail: `Top-20 accurate whales: ${Math.round(smartPct)}% ${smartSide} (${fmtUsd(smartTotal)}). Broader herd: ${Math.round(herdPct)}% ${herdSide} (${fmtUsd(herdTotal)}).`,
      detected_at: new Date().toISOString(),
      stats: {
        smart_side: smartSide,
        herd_side: herdSide,
        smart_total_usd: smartTotal,
        herd_total_usd: herdTotal,
        smart_concentration_pct: Math.round(smartPct),
        herd_concentration_pct: Math.round(herdPct),
        avg_smart_accuracy: Math.round(avgSmartAccuracy),
      },
    });
  }

  return signals;
}

// ─── MASTER FUNCTION ─────────────────────────────────────────────────────────

/**
 * Pull all data from Supabase, run all 4 detectors, dedup, sort, return top 50.
 */
export async function detectAllSignals(): Promise<Signal[]> {
  // 1. Fetch all whale positions (paginated)
  const allPositions: RawPosition[] = [];
  const PAGE_SIZE = 1000;
  for (let page = 0; page < 20; page++) {
    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .from("whale_positions")
      .select("whale_id, market_id, outcome, current_value, pnl, updated_at")
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) { if (page === 0) throw error; break; }
    if (!data || data.length === 0) break;
    allPositions.push(...(data as RawPosition[]));
    if (data.length < PAGE_SIZE) break;
  }

  console.log(`[detectAllSignals] ${allPositions.length} positions loaded`);
  if (allPositions.length === 0) return [];

  // 2. Fetch top-50 whales by total PnL
  const { data: whaleRows } = await supabase
    .from("whales")
    .select("address, total_pnl")
    .order("total_pnl", { ascending: false })
    .limit(50);

  const topWhaleIds = new Set((whaleRows || []).map((w: any) => w.address as string));
  const top10WhaleIds = new Set((whaleRows || []).slice(0, 10).map((w: any) => w.address as string));

  // 3. Compute accuracy map from positions with non-zero pnl
  const accuracyMap = new Map<string, { accuracy: number; total: number }>();
  const whaleStats: Record<string, { wins: number; losses: number }> = {};
  for (const p of allPositions) {
    if (!p.pnl || p.pnl === 0) continue;
    if (!whaleStats[p.whale_id]) whaleStats[p.whale_id] = { wins: 0, losses: 0 };
    if (p.pnl > 0) whaleStats[p.whale_id].wins++;
    else whaleStats[p.whale_id].losses++;
  }
  for (const [id, { wins, losses }] of Object.entries(whaleStats)) {
    const total = wins + losses;
    accuracyMap.set(id, { accuracy: total > 0 ? Math.round((wins / total) * 100) : 0, total });
  }

  // 4. Fetch market questions for all referenced market IDs
  const marketIds = [...new Set(allPositions.map((p) => p.market_id).filter(Boolean))];
  const questionMap = new Map<string, string>();
  const CHUNK = 200;
  for (let i = 0; i < marketIds.length; i += CHUNK) {
    const slice = marketIds.slice(i, i + CHUNK);
    const { data: mData } = await supabase
      .from("markets")
      .select("id, question")
      .in("id", slice);
    for (const m of mData || []) {
      questionMap.set(m.id, m.question || m.id);
    }
  }

  // 5. Run all 4 detectors
  const [consensus, concentration, spikes, divergence] = await Promise.all([
    Promise.resolve(detectWhaleConsensus(allPositions, questionMap)),
    Promise.resolve(detectSmartMoneyConcentration(allPositions, top10WhaleIds, questionMap)),
    Promise.resolve(detectSizeSpike(allPositions, questionMap)),
    Promise.resolve(detectWhaleDivergence(allPositions, accuracyMap, questionMap)),
  ]);

  // 6. Dedup by signal_id, sort by confidence desc, limit 50
  const seen = new Set<string>();
  const all: Signal[] = [];
  for (const s of [...consensus, ...concentration, ...spikes, ...divergence]) {
    if (!seen.has(s.signal_id)) {
      seen.add(s.signal_id);
      all.push(s);
    }
  }

  all.sort((a, b) => b.confidence - a.confidence);
  const top50 = all.slice(0, 50);

  console.log(
    `[detectAllSignals] ${consensus.length} consensus, ${concentration.length} concentration, ` +
    `${spikes.length} spikes, ${divergence.length} divergence → ${top50.length} total`
  );

  return top50;
}
