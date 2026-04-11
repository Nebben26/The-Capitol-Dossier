import { supabase } from "@/lib/supabase";
import { clampPercent } from "@/lib/clamp";

export interface MarketPulse {
  score: number; // 0–100
  label: "extreme-fear" | "fear" | "neutral" | "greed" | "extreme-greed";
  computedAt: string;
  components: {
    spreadScore: number;
    volumeScore: number;
    whaleScore: number;
    movementScore: number;
  };
}

export async function computeMarketPulse(): Promise<MarketPulse> {
  // Component 1: Average active disagreement spread (inverted — wider spread = more fear)
  let spreadScore = 50;
  try {
    const { data: disagreements } = await supabase
      .from("disagreements")
      .select("spread")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (disagreements && disagreements.length > 0) {
      const avgSpread = disagreements.reduce((sum, d) => sum + (d.spread || 0), 0) / disagreements.length;
      // Normalize: 0pt spread = 80 (greed), 30pt spread = 20 (fear)
      spreadScore = Math.max(0, Math.min(100, 80 - avgSpread * 2));
    }
  } catch {
    // leave at 50
  }

  // Component 2: Recent volume vs typical — greed if high, fear if low
  let volumeScore = 50;
  try {
    const { data: markets } = await supabase
      .from("markets")
      .select("volume")
      .not("volume", "is", null)
      .order("volume", { ascending: false })
      .limit(100);
    if (markets && markets.length > 0) {
      const totalVolume = markets.reduce((sum, m) => sum + (Number(m.volume) || 0), 0);
      // Normalize to 0–100 using log scale
      volumeScore = Math.max(0, Math.min(100, (Math.log10(totalVolume + 1) - 5) * 15 + 50));
    }
  } catch {
    // leave at 50
  }

  // Component 3: Whale position concentration — high concentration = greed
  let whaleScore = 50;
  try {
    const { data: whales } = await supabase
      .from("whales")
      .select("pnl")
      .order("pnl", { ascending: false })
      .limit(50);
    if (whales && whales.length > 0) {
      const topQuartile = whales.slice(0, Math.floor(whales.length / 4));
      const topPnl = topQuartile.reduce((sum, w) => sum + (Number(w.pnl) || 0), 0);
      const totalPnl = whales.reduce((sum, w) => sum + Math.abs(Number(w.pnl) || 0), 0);
      const concentration = totalPnl > 0 ? Math.abs(topPnl) / totalPnl : 0.5;
      whaleScore = Math.max(0, Math.min(100, concentration * 100));
    }
  } catch {
    // leave at 50
  }

  // Component 4: Price movement across top markets — lots of movement = greed
  let movementScore = 50;
  try {
    const { data: recentPrices } = await supabase
      .from("price_history")
      .select("market_id, price, timestamp")
      .gte("timestamp", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("timestamp", { ascending: false })
      .limit(500);
    if (recentPrices && recentPrices.length > 0) {
      const byMarket = new Map<string, number[]>();
      for (const row of recentPrices) {
        if (!byMarket.has(row.market_id)) byMarket.set(row.market_id, []);
        byMarket.get(row.market_id)!.push(Number(row.price));
      }
      let totalDelta = 0;
      let marketCount = 0;
      byMarket.forEach((prices) => {
        if (prices.length >= 2) {
          totalDelta += Math.abs(prices[0] - prices[prices.length - 1]);
          marketCount++;
        }
      });
      const avgDelta = marketCount > 0 ? totalDelta / marketCount : 0;
      // Normalize: 0 delta = 30 (fear), 10+ delta = 80 (greed)
      movementScore = Math.max(0, Math.min(100, 30 + avgDelta * 5));
    }
  } catch {
    // leave at 50
  }

  // If all four components stayed at 50, every query failed — return null-like result
  const allDefault =
    spreadScore === 50 && volumeScore === 50 && whaleScore === 50 && movementScore === 50;

  // Weighted average: spread 30%, volume 25%, whale 20%, movement 25%
  const rawScore = spreadScore * 0.3 + volumeScore * 0.25 + whaleScore * 0.2 + movementScore * 0.25;
  const score = allDefault ? -1 : clampPercent(Math.round(rawScore));

  let label: MarketPulse["label"] = "neutral";
  if (score >= 0) {
    if (score < 20) label = "extreme-fear";
    else if (score < 40) label = "fear";
    else if (score < 60) label = "neutral";
    else if (score < 80) label = "greed";
    else label = "extreme-greed";
  }

  return {
    score,
    label,
    computedAt: new Date().toISOString(),
    components: {
      spreadScore: Math.round(spreadScore),
      volumeScore: Math.round(volumeScore),
      whaleScore: Math.round(whaleScore),
      movementScore: Math.round(movementScore),
    },
  };
}

export function pulseLabel(label: MarketPulse["label"]): string {
  return {
    "extreme-fear": "Extreme Fear",
    fear: "Fear",
    neutral: "Neutral",
    greed: "Greed",
    "extreme-greed": "Extreme Greed",
  }[label];
}

export function pulseColor(score: number): string {
  if (score < 0) return "#484f58"; // unknown
  if (score < 20) return "#f85149"; // extreme fear
  if (score < 40) return "#d29922"; // fear
  if (score < 60) return "#8d96a0"; // neutral
  if (score < 80) return "#57D7BA"; // greed
  return "#3fb950"; // extreme greed
}
