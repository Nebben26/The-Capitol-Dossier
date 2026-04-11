// ─── Market Thesis TL;DR ─────────────────────────────────────────────────────
// Derives a one-line market thesis from available market data.
// Purely client-side — no API call — deterministic from market fields.

export interface MarketThesisTLDR {
  text: string;
  signal: "bullish" | "bearish" | "neutral" | "volatile";
}

export function generateThesis(m: {
  question: string;
  price: number;
  change: number;
  volNum: number;
  whaleCount?: number;
  daysLeft?: number;
  category?: string;
}): MarketThesisTLDR {
  const { price, change, volNum, whaleCount = 0, daysLeft = 0, category = "" } = m;

  const highConviction = price >= 75 || price <= 25;
  const midRange = price > 35 && price < 65;
  const bigMove = Math.abs(change) >= 5;
  const recentBigUp = change >= 5;
  const recentBigDown = change <= -5;
  const nearRes = daysLeft > 0 && daysLeft <= 7;
  const highVol = volNum > 100_000;
  const whalePile = whaleCount >= 5;

  let text: string;
  let signal: MarketThesisTLDR["signal"] = "neutral";

  if (nearRes && highConviction && price >= 75) {
    text = `Market strongly pricing YES at ${price}¢ with resolution in ${daysLeft}d — follow the money.`;
    signal = "bullish";
  } else if (nearRes && highConviction && price <= 25) {
    text = `Market leans heavily NO at ${price}¢ heading into resolution — contrarian opportunity slim.`;
    signal = "bearish";
  } else if (recentBigUp && whalePile) {
    text = `Whale pile-on (+${change.toFixed(1)}pp move) suggests coordinated positioning — momentum building.`;
    signal = "bullish";
  } else if (recentBigDown && whalePile) {
    text = `Smart money exiting (${change.toFixed(1)}pp drop) across ${whaleCount} whale positions — watch for further downside.`;
    signal = "bearish";
  } else if (bigMove && highVol) {
    text = `High-conviction ${change > 0 ? "upside" : "downside"} move on ${(volNum / 1000).toFixed(0)}K volume — reassess your priors.`;
    signal = change > 0 ? "bullish" : "bearish";
  } else if (midRange && highVol) {
    text = `Contested market at ${price}¢ — high volume with no clear consensus, toss-up still live.`;
    signal = "volatile";
  } else if (midRange) {
    text = `Genuine uncertainty at ${price}¢ — market has no strong lean, edge lies in research.`;
    signal = "neutral";
  } else if (price >= 80) {
    text = `Near-certainty at ${price}¢ — late-stage opportunity only if you see tail risk the market misses.`;
    signal = "bullish";
  } else if (price <= 20) {
    text = `Market pricing near-zero at ${price}¢ — only relevant if you have strong contrarian thesis.`;
    signal = "bearish";
  } else if (category === "Crypto" && bigMove) {
    text = `Crypto market absorbing ${Math.abs(change).toFixed(1)}pp volatility — price still finding equilibrium.`;
    signal = "volatile";
  } else {
    text = `Trending at ${price}¢ with ${change >= 0 ? "+" : ""}${change.toFixed(1)}pp 24h move — no dominant signal yet.`;
    signal = change > 0 ? "bullish" : change < 0 ? "bearish" : "neutral";
  }

  return { text, signal };
}

export function thesisSignalColor(signal: MarketThesisTLDR["signal"]): string {
  switch (signal) {
    case "bullish":  return "#3fb950";
    case "bearish":  return "#f85149";
    case "volatile": return "#d29922";
    case "neutral":  return "#8d96a0";
  }
}
