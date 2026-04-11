// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────
export const sparkGen = (base: number, trend: number, len = 12) =>
  Array.from({ length: len }, (_, i) => ({
    d: i,
    v: Math.max(1, base + trend * i + (Math.random() - 0.5) * Math.abs(trend) * 3),
  }));

export const calibGen = () =>
  Array.from({ length: 8 }, (_, i) => {
    const p = (i + 1) * 12;
    return { predicted: p, actual: p + (Math.random() - 0.5) * 14 };
  });

export const genPriceHistory = (base: number, points: number, volatility: number) => {
  const now = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return Array.from({ length: points }, (_, i) => {
    const trend = Math.sin(i / (points / 4)) * 15;
    const noise = (Math.random() - 0.5) * volatility;
    const price = Math.max(3, Math.min(97, base + trend + noise + (i / points) * 10));
    const vol = 500000 + Math.random() * 2000000;
    const d = new Date(now.getTime() - (points - i) * 86400000);
    return {
      time: `${months[d.getMonth()]} ${d.getDate()}`,
      price: Math.round(price),
      vol: Math.round(vol),
      open: Math.round(price + (Math.random() - 0.5) * 3),
      high: Math.round(price + Math.random() * 4),
      low: Math.round(price - Math.random() * 4),
      close: Math.round(price),
    };
  });
};

// ─── SHARED TYPES ─────────────────────────────────────────────────────
export interface Market {
  id: string;
  question: string;
  price: number;
  change: number;
  volume: string;
  volNum: number;
  category: string;
  platform: string;
  resolution: string;
  daysLeft: number;
  trending: boolean;
  whaleCount: number;
  traders: number;
  spark: { d: number; v: number }[];
  // Detail-level fields
  desc: string;
  creator: string;
  created: string;
  liquidity: string;
  // Optional enrichment fields (populated by API layer)
  clobTokenIds?: string[];
  ticker?: string;
  platformUrl?: string;
  priceHistory?: { time: string; price: number; vol: number; open: number; high: number; low: number; close: number }[];
  volAnomaly?: boolean;
  resolved?: boolean;
  resolvesAt?: string | null;
}

export interface Whale {
  id: string;
  name: string;
  rank: number;
  accuracy: number;
  winRate: number;
  totalPnl: string;
  totalPnlNum: number;
  totalVolume: string;
  volumeNum: number;
  positionsValue: string;
  openPositions: number;
  totalTrades: number;
  memberSince: string;
  bestCategory: string;
  bestCatColor: string;
  worstCategory: string;
  streak: number;
  bio: string;
  verified: boolean;
  smart: boolean;
  brier: number;
  activeMarkets: number;
  change24h: number;
  spark: { d: number; v: number }[];
  calibration: { predicted: number; actual: number }[];
  topMarkets: { name: string; pnl: string }[];
}

export interface Strategy {
  id: string;
  name: string;
  desc: string;
  category: string;
  cagr: number;
  sharpe: number;
  winRate: number;
  maxDD: number;
  trades: number;
  timeframe: string;
  spark: { d: number; v: number }[];
  color: string;
  premium: boolean;
  followers: number;
  author: string;
  authorId: string;
}

export interface WhaleAlert {
  id: string;
  wallet: string;
  walletId: string;
  rank: number;
  accuracy: number;
  market: string;
  marketId: string;
  side: "YES" | "NO";
  size: string;
  price: string;
  time: string;
  seconds: number;
  isNew: boolean;
}

export interface PriceMover {
  id: string;
  market: string;
  marketId: string;
  price: number;
  change5m: number;
  change15m: number;
  change1h: number;
  volume: string;
  volSpike: boolean;
  spark: { d: number; v: number }[];
}

export interface ResolutionItem {
  id: string;
  market: string;
  marketId: string;
  price: number;
  volume: string;
  resolves: string;
  daysLeft: number;
  hoursLeft: number;
  highConviction: boolean;
  whaleCount: number;
  yesPercent: number;
}

export interface WhaleFlow {
  id: string;
  wallet: string;
  walletId: string;
  rank: number;
  side: "YES" | "NO";
  size: string;
  price: string;
  acc: number;
  pnl: string;
  time: string;
}

export interface CrossPlatformPrice {
  platform: string;
  price: number;
  change: number;
  vol: string;
  liquidity: string;
  traders: string;
  link: string;
}

export interface OrderbookLevel {
  price: number;
  size: number;
  total: number;
}

export interface ResolutionRecord {
  q: string;
  resolved: "YES" | "NO";
  finalPrice: number;
  accuracy: string;
  date: string;
}

export interface Position {
  id: string;
  marketId: string;
  market: string;
  side: "YES" | "NO";
  size: string;
  entry: string;
  current: string;
  unrealizedPnl: string;
  pnlPct: string;
}

export interface HistoricalTrade {
  id: string;
  marketId: string;
  market: string;
  side: "YES" | "NO";
  size: string;
  entry: string;
  exit: string;
  realizedPnl: string;
  pnlPct: string;
  accImpact: string;
  date: string;
}

export interface CategoryPerf {
  category: string;
  winRate: number;
  trades: number;
  pnl: string;
  color: string;
}

// ─── SHARED CONSTANTS ─────────────────────────────────────────────────
export const CATEGORIES = ["All", "Trending", "Elections", "Economics", "Crypto", "Sports", "Tech", "Geopolitics", "Climate", "Science", "Policy"];
export const PLATFORMS = ["All", "Polymarket", "Kalshi"];
export const TIME_FILTERS = ["All Time", "30 Days", "7 Days", "24 Hours"] as const;
export const HOMEPAGE_CATEGORIES = ["All", "Elections", "Crypto", "Economics", "Geopolitics", "Tech", "Climate", "Culture"];
export const STRAT_CATEGORIES = ["All", "Elections", "Economics", "Crypto", "Sports", "Geopolitics"];

// ─── MARKETS ──────────────────────────────────────────────────────────
export const markets: Market[] = [
  { id: "recession-2026", question: "Will there be a US recession by Dec 2026?", price: 68, change: 12.4, volume: "$24.1M", volNum: 24100000, category: "Economics", platform: "Polymarket", resolution: "Dec 31, 2026", daysLeft: 271, trending: true, whaleCount: 22, traders: 18420, spark: sparkGen(52, 1.4), desc: "This market resolves YES if the NBER officially declares a US recession with a start date on or before December 31, 2026.", creator: "PolyMarket Official", created: "Jan 15, 2026", liquidity: "$4.2M" },
  { id: "fed-rate-cut", question: "Will the Fed cut rates before July 2026?", price: 42, change: -8.2, volume: "$18.7M", volNum: 18700000, category: "Economics", platform: "Kalshi", resolution: "Jul 1, 2026", daysLeft: 88, trending: true, whaleCount: 14, traders: 12890, spark: sparkGen(50, -0.7), desc: "Resolves YES if the Federal Reserve announces a federal funds rate cut at any FOMC meeting before July 1, 2026.", creator: "Kalshi Markets", created: "Feb 3, 2026", liquidity: "$3.1M" },
  { id: "trump-2028", question: "Will Trump win the 2028 presidential election?", price: 31, change: 5.7, volume: "$45.2M", volNum: 45200000, category: "Elections", platform: "Polymarket", resolution: "Nov 5, 2028", daysLeft: 950, trending: true, whaleCount: 18, traders: 42100, spark: sparkGen(24, 0.6), desc: "Resolves YES if Donald Trump wins the 2028 US presidential election.", creator: "PolyMarket Official", created: "Nov 20, 2025", liquidity: "$8.9M" },
  { id: "btc-150k", question: "Will Bitcoin trade above $150K by end of 2026?", price: 23, change: -3.1, volume: "$32.8M", volNum: 32800000, category: "Crypto", platform: "Polymarket", resolution: "Dec 31, 2026", daysLeft: 271, trending: true, whaleCount: 18, traders: 31200, spark: sparkGen(26, -0.3), desc: "Resolves YES if Bitcoin (BTC/USD) trades at or above $150,000 on any major exchange before December 31, 2026.", creator: "PolyMarket Official", created: "Jan 1, 2026", liquidity: "$6.4M" },
  { id: "ai-agi", question: "Will AGI be announced by a major lab by 2027?", price: 15, change: 2.8, volume: "$12.4M", volNum: 12400000, category: "Tech", platform: "Polymarket", resolution: "Dec 31, 2027", daysLeft: 636, trending: false, whaleCount: 8, traders: 8900, spark: sparkGen(11, 0.25), desc: "Resolves YES if a major AI lab (OpenAI, DeepMind, Anthropic, etc.) officially claims to have achieved AGI by end of 2027.", creator: "Metaculus", created: "Mar 10, 2026", liquidity: "$1.8M" },
  { id: "china-taiwan", question: "Will there be a China-Taiwan military conflict in 2026?", price: 8, change: -1.2, volume: "$28.9M", volNum: 28900000, category: "Geopolitics", platform: "Kalshi", resolution: "Dec 31, 2026", daysLeft: 271, trending: false, whaleCount: 12, traders: 15600, spark: sparkGen(9, -0.1), desc: "Resolves YES if there is a military confrontation between China and Taiwan in 2026.", creator: "Kalshi Markets", created: "Jan 5, 2026", liquidity: "$5.2M" },
  { id: "spacex-mars", question: "Will SpaceX launch a crewed Mars mission by 2030?", price: 19, change: 4.1, volume: "$8.3M", volNum: 8300000, category: "Tech", platform: "Polymarket", resolution: "Dec 31, 2030", daysLeft: 2098, trending: false, whaleCount: 5, traders: 6200, spark: sparkGen(14, 0.4), desc: "Resolves YES if SpaceX launches a crewed mission to Mars by December 31, 2030.", creator: "PolyMarket Official", created: "Feb 14, 2026", liquidity: "$1.2M" },
  { id: "student-debt", question: "Will a student debt relief bill pass in 2026?", price: 37, change: -6.5, volume: "$5.1M", volNum: 5100000, category: "Elections", platform: "Kalshi", resolution: "Dec 31, 2026", daysLeft: 271, trending: false, whaleCount: 4, traders: 3800, spark: sparkGen(44, -0.6), desc: "Resolves YES if the US Congress passes a student debt relief bill signed into law in 2026.", creator: "Kalshi Markets", created: "Mar 1, 2026", liquidity: "$820K" },
  { id: "nvidia-split", question: "Will NVIDIA announce a 10:1 stock split in 2026?", price: 72, change: 6.3, volume: "$8.2M", volNum: 8200000, category: "Economics", platform: "Kalshi", resolution: "Dec 31, 2026", daysLeft: 271, trending: true, whaleCount: 11, traders: 9400, spark: sparkGen(60, 1.0), desc: "Resolves YES if NVIDIA announces a 10:1 stock split in 2026.", creator: "Kalshi Markets", created: "Mar 5, 2026", liquidity: "$1.6M" },
  { id: "eu-tariff", question: "Will the EU impose retaliatory tariffs by Q3 2026?", price: 54, change: 3.9, volume: "$6.1M", volNum: 6100000, category: "Geopolitics", platform: "Polymarket", resolution: "Sep 30, 2026", daysLeft: 179, trending: false, whaleCount: 8, traders: 5100, spark: sparkGen(45, 0.8), desc: "Resolves YES if the EU imposes retaliatory tariffs against any major trade partner by September 30, 2026.", creator: "PolyMarket Official", created: "Feb 20, 2026", liquidity: "$1.1M" },
  { id: "pandemic-2026", question: "Will the WHO declare a new pandemic in 2026?", price: 6, change: -0.8, volume: "$11.8M", volNum: 11800000, category: "Climate", platform: "Polymarket", resolution: "Dec 31, 2026", daysLeft: 271, trending: false, whaleCount: 6, traders: 7200, spark: sparkGen(7, -0.08), desc: "Resolves YES if the WHO officially declares a new pandemic in 2026.", creator: "PolyMarket Official", created: "Jan 10, 2026", liquidity: "$2.4M" },
  { id: "dem-nominee", question: "Will Harris be the 2028 Democratic nominee?", price: 44, change: -2.1, volume: "$7.9M", volNum: 7900000, category: "Elections", platform: "Polymarket", resolution: "Aug 30, 2028", daysLeft: 879, trending: false, whaleCount: 6, traders: 8900, spark: sparkGen(48, -0.3), desc: "Resolves YES if Kamala Harris is the Democratic nominee for the 2028 presidential election.", creator: "PolyMarket Official", created: "Jan 25, 2026", liquidity: "$1.4M" },
  { id: "ufc-309", question: "Will Jones win UFC 309?", price: 61, change: 0.5, volume: "$3.2M", volNum: 3200000, category: "Sports", platform: "Kalshi", resolution: "Apr 19, 2026", daysLeft: 15, trending: false, whaleCount: 3, traders: 4100, spark: sparkGen(58, 0.25), desc: "Resolves YES if Jon Jones wins the UFC 309 main event.", creator: "Kalshi Markets", created: "Mar 1, 2026", liquidity: "$640K" },
  { id: "apple-ai", question: "Will Apple release a standalone AI device in 2026?", price: 28, change: 1.2, volume: "$4.7M", volNum: 4700000, category: "Tech", platform: "Kalshi", resolution: "Dec 31, 2026", daysLeft: 271, trending: false, whaleCount: 5, traders: 3200, spark: sparkGen(24, 0.35), desc: "Resolves YES if Apple releases a standalone AI-focused hardware device in 2026.", creator: "Kalshi Markets", created: "Feb 15, 2026", liquidity: "$780K" },
  { id: "inflation-3pct", question: "Will US inflation fall below 3% by mid-2026?", price: 71, change: 2.3, volume: "$9.4M", volNum: 9400000, category: "Economics", platform: "Kalshi", resolution: "Jun 30, 2026", daysLeft: 87, trending: false, whaleCount: 9, traders: 7800, spark: sparkGen(64, 0.6), desc: "Resolves YES if CPI inflation falls below 3% by June 30, 2026.", creator: "Kalshi Markets", created: "Jan 20, 2026", liquidity: "$1.9M" },
  { id: "senate-flip", question: "Will the Senate flip in 2026 midterms?", price: 38, change: 1.8, volume: "$14.2M", volNum: 14200000, category: "Elections", platform: "Polymarket", resolution: "Nov 3, 2026", daysLeft: 213, trending: true, whaleCount: 10, traders: 11200, spark: sparkGen(34, 0.35), desc: "Resolves YES if the opposing party gains control of the US Senate in 2026 midterms.", creator: "PolyMarket Official", created: "Dec 1, 2025", liquidity: "$2.8M" },
  { id: "eth-8k", question: "Will ETH trade above $8,000 by end of 2026?", price: 14, change: -1.9, volume: "$6.8M", volNum: 6800000, category: "Crypto", platform: "Polymarket", resolution: "Dec 31, 2026", daysLeft: 271, trending: false, whaleCount: 7, traders: 5400, spark: sparkGen(17, -0.25), desc: "Resolves YES if Ethereum trades above $8,000 on a major exchange by December 31, 2026.", creator: "PolyMarket Official", created: "Jan 5, 2026", liquidity: "$1.1M" },
  { id: "world-cup-host", question: "Will any World Cup 2026 venue change?", price: 9, change: -0.3, volume: "$2.4M", volNum: 2400000, category: "Sports", platform: "Kalshi", resolution: "Jun 1, 2026", daysLeft: 58, trending: false, whaleCount: 2, traders: 2800, spark: sparkGen(10, -0.08), desc: "Resolves YES if any FIFA World Cup 2026 venue is officially changed.", creator: "Kalshi Markets", created: "Feb 1, 2026", liquidity: "$420K" },
  { id: "oil-100", question: "Will oil prices exceed $100/barrel in 2026?", price: 33, change: 3.4, volume: "$7.1M", volNum: 7100000, category: "Economics", platform: "Kalshi", resolution: "Dec 31, 2026", daysLeft: 271, trending: false, whaleCount: 6, traders: 4600, spark: sparkGen(28, 0.4), desc: "Resolves YES if Brent crude oil exceeds $100/barrel at any point in 2026.", creator: "Kalshi Markets", created: "Jan 15, 2026", liquidity: "$1.3M" },
  { id: "climate-1-5c", question: "Will 2026 be the hottest year on record?", price: 62, change: 1.1, volume: "$3.8M", volNum: 3800000, category: "Climate", platform: "Polymarket", resolution: "Jan 15, 2027", daysLeft: 286, trending: false, whaleCount: 4, traders: 3100, spark: sparkGen(58, 0.35), desc: "Resolves YES if 2026 is declared the hottest year on record by NASA or NOAA.", creator: "PolyMarket Official", created: "Feb 10, 2026", liquidity: "$620K" },
  { id: "openai-revenue", question: "Will OpenAI hit $10B annual revenue by mid-2026?", price: 55, change: 4.2, volume: "$5.6M", volNum: 5600000, category: "Tech", platform: "Polymarket", resolution: "Jul 1, 2026", daysLeft: 88, trending: true, whaleCount: 7, traders: 4800, spark: sparkGen(46, 0.75), desc: "Resolves YES if OpenAI reaches $10B in annualized revenue by July 1, 2026.", creator: "PolyMarket Official", created: "Mar 1, 2026", liquidity: "$940K" },
  { id: "nato-expand", question: "Will another country join NATO in 2026?", price: 22, change: -0.9, volume: "$3.1M", volNum: 3100000, category: "Geopolitics", platform: "Kalshi", resolution: "Dec 31, 2026", daysLeft: 271, trending: false, whaleCount: 3, traders: 2100, spark: sparkGen(24, -0.15), desc: "Resolves YES if any new country officially joins NATO in 2026.", creator: "Kalshi Markets", created: "Jan 30, 2026", liquidity: "$540K" },
  { id: "nba-finals", question: "Will the Celtics win the 2026 NBA Finals?", price: 18, change: 2.7, volume: "$4.2M", volNum: 4200000, category: "Sports", platform: "Kalshi", resolution: "Jun 20, 2026", daysLeft: 77, trending: false, whaleCount: 4, traders: 5600, spark: sparkGen(13, 0.4), desc: "Resolves YES if the Boston Celtics win the 2026 NBA Finals.", creator: "Kalshi Markets", created: "Feb 20, 2026", liquidity: "$720K" },
  { id: "sol-flip-eth", question: "Will Solana's market cap flip Ethereum in 2026?", price: 11, change: -2.4, volume: "$8.9M", volNum: 8900000, category: "Crypto", platform: "Polymarket", resolution: "Dec 31, 2026", daysLeft: 271, trending: false, whaleCount: 9, traders: 6700, spark: sparkGen(14, -0.25), desc: "Resolves YES if Solana's market cap exceeds Ethereum's at any point in 2026.", creator: "PolyMarket Official", created: "Jan 12, 2026", liquidity: "$1.5M" },
];

// Market lookup by ID
export const marketById: Record<string, Market> = Object.fromEntries(markets.map((m) => [m.id, m]));

// ─── WHALES ───────────────────────────────────────────────────────────
export const whales: Whale[] = [
  { id: "w4", name: "KalshiKing", rank: 1, accuracy: 79, winRate: 74, totalPnl: "+$5.8M", totalPnlNum: 5800000, totalVolume: "$62.4M", volumeNum: 62400000, positionsValue: "$11.2M", openPositions: 9, totalTrades: 534, memberSince: "Nov 2023", bestCategory: "Economics", bestCatColor: "#57D7BA", worstCategory: "Science", streak: 11, bio: "Kalshi-native whale who migrated cross-platform. Highest calibration score in economic markets across all tracked wallets.", verified: true, smart: true, brier: 0.11, activeMarkets: 9, change24h: 3.2, spark: sparkGen(200, 45), calibration: calibGen(), topMarkets: [{ name: "US recession by Dec 2026?", pnl: "+$1.2M" }, { name: "Fed cuts rates before July?", pnl: "+$890K" }, { name: "S&P 500 above 6000?", pnl: "+$720K" }] },
  { id: "w1", name: "DegenWhale.eth", rank: 2, accuracy: 74, winRate: 71, totalPnl: "+$4.2M", totalPnlNum: 4200000, totalVolume: "$48.3M", volumeNum: 48300000, positionsValue: "$8.1M", openPositions: 12, totalTrades: 847, memberSince: "Mar 2024", bestCategory: "Economics", bestCatColor: "#57D7BA", worstCategory: "Sports", streak: 7, bio: "Top-ranked prediction market whale. Known for large economic macro bets with consistent above-market accuracy.", verified: true, smart: true, brier: 0.14, activeMarkets: 12, change24h: 1.8, spark: sparkGen(150, 35), calibration: calibGen(), topMarkets: [{ name: "BTC above $100K by Dec 2024?", pnl: "+$2.7M" }, { name: "Biden wins 2024?", pnl: "+$2.9M" }, { name: "US recession by Dec 2026?", pnl: "+$740K" }] },
  { id: "w2", name: "PolyShark", rank: 3, accuracy: 68, winRate: 65, totalPnl: "+$2.1M", totalPnlNum: 2100000, totalVolume: "$31.7M", volumeNum: 31700000, positionsValue: "$5.4M", openPositions: 8, totalTrades: 612, memberSince: "Jun 2024", bestCategory: "Elections", bestCatColor: "#6366f1", worstCategory: "Crypto", streak: 3, bio: "Political markets specialist with deep connections to polling data. Aggressive position sizing on election contracts.", verified: true, smart: false, brier: 0.19, activeMarkets: 8, change24h: -0.5, spark: sparkGen(80, 18), calibration: calibGen(), topMarkets: [{ name: "Trump wins 2028?", pnl: "+$620K" }, { name: "Dem wins House 2024?", pnl: "+$410K" }, { name: "Harris 2028 nominee?", pnl: "+$280K" }] },
  { id: "w11", name: "Cassandra.eth", rank: 4, accuracy: 77, winRate: 73, totalPnl: "+$3.4M", totalPnlNum: 3400000, totalVolume: "$51.2M", volumeNum: 51200000, positionsValue: "$7.8M", openPositions: 7, totalTrades: 461, memberSince: "Aug 2023", bestCategory: "Economics", bestCatColor: "#57D7BA", worstCategory: "Sports", streak: 9, bio: "Deep macro researcher. Specializes in recession and rate prediction markets with a fundamental analysis approach.", verified: true, smart: true, brier: 0.12, activeMarkets: 7, change24h: 2.1, spark: sparkGen(140, 28), calibration: calibGen(), topMarkets: [{ name: "Recession 2026?", pnl: "+$1.1M" }, { name: "Rate cut Jul 2026?", pnl: "+$780K" }, { name: "Unemployment above 5%?", pnl: "+$540K" }] },
  { id: "w15", name: "QuantWhale", rank: 5, accuracy: 80, winRate: 75, totalPnl: "+$4.7M", totalPnlNum: 4700000, totalVolume: "$58.1M", volumeNum: 58100000, positionsValue: "$9.4M", openPositions: 8, totalTrades: 287, memberSince: "May 2023", bestCategory: "Economics", bestCatColor: "#57D7BA", worstCategory: "Sports", streak: 14, bio: "Algorithmic trader using proprietary quant models for prediction market pricing. Best Brier score among all tracked wallets.", verified: true, smart: true, brier: 0.10, activeMarkets: 8, change24h: 4.1, spark: sparkGen(180, 40), calibration: calibGen(), topMarkets: [{ name: "Recession 2026?", pnl: "+$1.4M" }, { name: "Fed pivot 2026?", pnl: "+$980K" }, { name: "Yield curve uninvert?", pnl: "+$720K" }] },
  { id: "w6", name: "WhaleAlert", rank: 6, accuracy: 73, winRate: 72, totalPnl: "+$1.9M", totalPnlNum: 1900000, totalVolume: "$38.6M", volumeNum: 38600000, positionsValue: "$5.6M", openPositions: 6, totalTrades: 423, memberSince: "Oct 2023", bestCategory: "Economics", bestCatColor: "#57D7BA", worstCategory: "Geopolitics", streak: 4, bio: "Large-cap prediction market trader focused on high-volume economic contracts.", verified: true, smart: true, brier: 0.15, activeMarkets: 6, change24h: 0.9, spark: sparkGen(90, 16), calibration: calibGen(), topMarkets: [{ name: "Fed hikes 2024?", pnl: "+$540K" }, { name: "Inflation below 3%?", pnl: "+$420K" }, { name: "Recession 2026?", pnl: "+$310K" }] },
  { id: "w3", name: "0xAlpha", rank: 7, accuracy: 71, winRate: 67, totalPnl: "+$1.4M", totalPnlNum: 1400000, totalVolume: "$22.1M", volumeNum: 22100000, positionsValue: "$3.2M", openPositions: 15, totalTrades: 1203, memberSince: "Jan 2024", bestCategory: "Crypto", bestCatColor: "#f59e0b", worstCategory: "Policy", streak: 5, bio: "High-frequency prediction market trader. Specializes in crypto and tech markets with a quantitative approach.", verified: false, smart: true, brier: 0.16, activeMarkets: 15, change24h: 2.4, spark: sparkGen(60, 12), calibration: calibGen(), topMarkets: [{ name: "BTC above $150K by EOY?", pnl: "+$380K" }, { name: "ETH above $8K?", pnl: "+$290K" }, { name: "SOL flips ETH?", pnl: "+$180K" }] },
  { id: "w9", name: "OracleOfPoly", rank: 8, accuracy: 76, winRate: 70, totalPnl: "+$2.6M", totalPnlNum: 2600000, totalVolume: "$42.8M", volumeNum: 42800000, positionsValue: "$6.1M", openPositions: 5, totalTrades: 389, memberSince: "Jul 2023", bestCategory: "Elections", bestCatColor: "#6366f1", worstCategory: "Crypto", streak: 8, bio: "Election markets oracle with uncanny accuracy on political outcomes. Deep Washington insider knowledge.", verified: true, smart: true, brier: 0.13, activeMarkets: 5, change24h: 1.5, spark: sparkGen(110, 22), calibration: calibGen(), topMarkets: [{ name: "Trump wins 2028?", pnl: "+$890K" }, { name: "Senate flip 2026?", pnl: "+$540K" }, { name: "UK snap election?", pnl: "+$310K" }] },
  { id: "w7", name: "PredictoorDAO", rank: 9, accuracy: 66, winRate: 64, totalPnl: "+$890K", totalPnlNum: 890000, totalVolume: "$19.2M", volumeNum: 19200000, positionsValue: "$2.8M", openPositions: 11, totalTrades: 756, memberSince: "Sep 2024", bestCategory: "Crypto", bestCatColor: "#f59e0b", worstCategory: "Policy", streak: 1, bio: "DAO-managed prediction market fund. Collective intelligence approach to market making.", verified: false, smart: false, brier: 0.20, activeMarkets: 11, change24h: 0.3, spark: sparkGen(40, 7), calibration: calibGen(), topMarkets: [{ name: "BTC above $100K?", pnl: "+$310K" }, { name: "SOL above $400?", pnl: "+$180K" }, { name: "ETH merge success?", pnl: "+$120K" }] },
  { id: "w10", name: "SigmaTrader", rank: 10, accuracy: 69, winRate: 66, totalPnl: "+$1.1M", totalPnlNum: 1100000, totalVolume: "$24.6M", volumeNum: 24600000, positionsValue: "$3.5M", openPositions: 14, totalTrades: 1102, memberSince: "Dec 2023", bestCategory: "Sports", bestCatColor: "#14b8a6", worstCategory: "Geopolitics", streak: 0, bio: "Sports betting crossover trader. Brings line movement analysis to prediction markets.", verified: false, smart: false, brier: 0.18, activeMarkets: 14, change24h: -2.3, spark: sparkGen(50, 9), calibration: calibGen(), topMarkets: [{ name: "UFC 309 Jones wins?", pnl: "+$420K" }, { name: "World Cup 2026?", pnl: "+$280K" }, { name: "NBA Finals 2026?", pnl: "+$190K" }] },
  { id: "w5", name: "SmartMoney42", rank: 11, accuracy: 63, winRate: 59, totalPnl: "+$620K", totalPnlNum: 620000, totalVolume: "$14.8M", volumeNum: 14800000, positionsValue: "$2.1M", openPositions: 18, totalTrades: 1891, memberSince: "Aug 2024", bestCategory: "Tech", bestCatColor: "#ec4899", worstCategory: "Geopolitics", streak: 2, bio: "Volume-heavy trader with a diversified approach. Trades across all categories with a slight edge in tech markets.", verified: false, smart: false, brier: 0.22, activeMarkets: 18, change24h: -1.1, spark: sparkGen(30, 5), calibration: calibGen(), topMarkets: [{ name: "AGI announced by 2027?", pnl: "+$124K" }, { name: "Apple AI device?", pnl: "+$92K" }, { name: "NVIDIA 10:1 split?", pnl: "+$78K" }] },
  { id: "w8", name: "0xBigBrain", rank: 12, accuracy: 64, winRate: 61, totalPnl: "+$540K", totalPnlNum: 540000, totalVolume: "$11.4M", volumeNum: 11400000, positionsValue: "$1.8M", openPositions: 7, totalTrades: 498, memberSince: "Feb 2024", bestCategory: "Geopolitics", bestCatColor: "#8b5cf6", worstCategory: "Sports", streak: 3, bio: "Geopolitical risk analyst turned prediction market trader. Deep expertise in conflict and diplomacy markets.", verified: false, smart: false, brier: 0.21, activeMarkets: 7, change24h: -0.2, spark: sparkGen(20, 4.5), calibration: calibGen(), topMarkets: [{ name: "China-Taiwan conflict?", pnl: "+$210K" }, { name: "Russia ceasefire?", pnl: "+$140K" }, { name: "NATO expansion?", pnl: "+$95K" }] },
  { id: "w13", name: "NateGold", rank: 13, accuracy: 72, winRate: 69, totalPnl: "+$1.7M", totalPnlNum: 1700000, totalVolume: "$29.3M", volumeNum: 29300000, positionsValue: "$4.2M", openPositions: 4, totalTrades: 312, memberSince: "Jun 2023", bestCategory: "Elections", bestCatColor: "#6366f1", worstCategory: "Crypto", streak: 6, bio: "Named after Nate Silver. Specializes in election prediction markets using proprietary polling models.", verified: true, smart: true, brier: 0.15, activeMarkets: 4, change24h: 0.7, spark: sparkGen(70, 14), calibration: calibGen(), topMarkets: [{ name: "Harris 2028 nominee?", pnl: "+$620K" }, { name: "Senate 2026?", pnl: "+$440K" }, { name: "Gov race 2026?", pnl: "+$310K" }] },
  { id: "w14", name: "ThetaGang", rank: 14, accuracy: 65, winRate: 62, totalPnl: "+$780K", totalPnlNum: 780000, totalVolume: "$16.7M", volumeNum: 16700000, positionsValue: "$2.4M", openPositions: 10, totalTrades: 678, memberSince: "Apr 2024", bestCategory: "Economics", bestCatColor: "#57D7BA", worstCategory: "Sports", streak: 2, bio: "Options trader turned prediction market specialist. Sells premium on high-implied-probability contracts.", verified: false, smart: false, brier: 0.21, activeMarkets: 10, change24h: 0.1, spark: sparkGen(35, 6.5), calibration: calibGen(), topMarkets: [{ name: "CPI below 2.5%?", pnl: "+$280K" }, { name: "GDP growth above 3%?", pnl: "+$210K" }, { name: "Oil above $100?", pnl: "+$140K" }] },
  { id: "w12", name: "FlipMaster", rank: 15, accuracy: 60, winRate: 57, totalPnl: "+$320K", totalPnlNum: 320000, totalVolume: "$8.9M", volumeNum: 8900000, positionsValue: "$1.2M", openPositions: 22, totalTrades: 2341, memberSince: "Nov 2024", bestCategory: "Crypto", bestCatColor: "#f59e0b", worstCategory: "Geopolitics", streak: 0, bio: "High-frequency micro trader. Takes many small positions across all categories.", verified: false, smart: false, brier: 0.25, activeMarkets: 22, change24h: -3.1, spark: sparkGen(15, 2.5), calibration: calibGen(), topMarkets: [{ name: "BTC above $200K?", pnl: "+$140K" }, { name: "ETH above $10K?", pnl: "+$88K" }, { name: "DOGE above $1?", pnl: "+$52K" }] },
];

// Whale lookup by ID
export const whaleById: Record<string, Whale> = Object.fromEntries(whales.map((w) => [w.id, w]));

// ─── STRATEGIES ───────────────────────────────────────────────────────
export const strategies: Strategy[] = [
  { id: "s1", name: "Whale Shadow", desc: "Mirror top-5 whale YES positions within 1 hour. Closes on 15% profit or 7-day timeout.", category: "All", cagr: 142, sharpe: 2.8, winRate: 71, maxDD: -18, trades: 312, timeframe: "1H entry", spark: sparkGen(100, 6, 24), color: "#57D7BA", premium: false, followers: 4280, author: "KalshiKing", authorId: "w4" },
  { id: "s2", name: "Dip Hunter", desc: "Buy any contract that drops >15% in 24h with volume >$500K. Exit on mean reversion or 30-day cap.", category: "All", cagr: 98, sharpe: 2.1, winRate: 64, maxDD: -24, trades: 547, timeframe: "24H trigger", spark: sparkGen(100, 4, 24), color: "#22c55e", premium: false, followers: 3150, author: "DegenWhale.eth", authorId: "w1" },
  { id: "s3", name: "Election Alpha", desc: "Long contracts where Polymarket–Kalshi divergence exceeds 8pts. Bet the higher-volume platform.", category: "Elections", cagr: 186, sharpe: 3.2, winRate: 78, maxDD: -12, trades: 89, timeframe: "Event-driven", spark: sparkGen(100, 8, 24), color: "#6366f1", premium: true, followers: 1890, author: "NateGold", authorId: "w13" },
  { id: "s4", name: "Macro Momentum", desc: "Follow smart money (>70% accuracy wallets) into economic contracts when volume spikes 3x above 7-day avg.", category: "Economics", cagr: 124, sharpe: 2.5, winRate: 68, maxDD: -21, trades: 198, timeframe: "Daily", spark: sparkGen(100, 5.2, 24), color: "#f59e0b", premium: false, followers: 2740, author: "Cassandra.eth", authorId: "w11" },
  { id: "s5", name: "Crypto Sentiment Fade", desc: "Short crypto prediction markets when Twitter sentiment hits 90th percentile bullish. 48h hold.", category: "Crypto", cagr: 76, sharpe: 1.7, winRate: 59, maxDD: -31, trades: 421, timeframe: "48H hold", spark: sparkGen(100, 3, 24), color: "#ec4899", premium: true, followers: 960, author: "0xAlpha", authorId: "w3" },
  { id: "s6", name: "Resolution Fade", desc: "Buy NO on contracts with <10 days to resolution trading above 85¢. Captures late mean reversion.", category: "All", cagr: 64, sharpe: 1.9, winRate: 72, maxDD: -15, trades: 283, timeframe: "10D window", spark: sparkGen(100, 2.6, 24), color: "#14b8a6", premium: false, followers: 1540, author: "PolyShark", authorId: "w2" },
  { id: "s7", name: "Geopolitical Hedge", desc: "Long geopolitical risk contracts as portfolio insurance. Rebalance monthly based on VIX proxy.", category: "Geopolitics", cagr: 42, sharpe: 1.3, winRate: 55, maxDD: -28, trades: 96, timeframe: "Monthly", spark: sparkGen(100, 1.8, 24), color: "#8b5cf6", premium: true, followers: 720, author: "0xBigBrain", authorId: "w8" },
  { id: "s8", name: "Sports Edge", desc: "Aggregate line movement from 5+ sportsbooks vs prediction market price. Bet when divergence > 5pts.", category: "Sports", cagr: 88, sharpe: 2.0, winRate: 62, maxDD: -22, trades: 634, timeframe: "Pre-event", spark: sparkGen(100, 3.6, 24), color: "#ef4444", premium: false, followers: 2100, author: "SigmaTrader", authorId: "w10" },
];

// ─── ALERTS ──────────────────────────────────────────────────────��────
export const initialWhaleAlerts: WhaleAlert[] = [
  { id: "wa1", wallet: "KalshiKing", walletId: "w4", rank: 1, accuracy: 79, market: "US recession by Dec 2026?", marketId: "recession-2026", side: "YES", size: "$3.1M", price: "68¢", time: "12s ago", seconds: 12, isNew: true },
  { id: "wa2", wallet: "DegenWhale.eth", walletId: "w1", rank: 2, accuracy: 74, market: "Fed cuts rates before July?", marketId: "fed-rate-cut", side: "NO", size: "$1.8M", price: "42¢", time: "47s ago", seconds: 47, isNew: true },
  { id: "wa3", wallet: "Cassandra.eth", walletId: "w11", rank: 4, accuracy: 77, market: "Trump wins 2028 election?", marketId: "trump-2028", side: "YES", size: "$2.2M", price: "31¢", time: "1m ago", seconds: 82, isNew: false },
  { id: "wa4", wallet: "QuantWhale", walletId: "w15", rank: 5, accuracy: 80, market: "US recession by Dec 2026?", marketId: "recession-2026", side: "YES", size: "$4.1M", price: "67¢", time: "2m ago", seconds: 140, isNew: false },
  { id: "wa5", wallet: "0xAlpha", walletId: "w3", rank: 7, accuracy: 71, market: "Bitcoin above $150K by EOY?", marketId: "btc-150k", side: "NO", size: "$950K", price: "24¢", time: "3m ago", seconds: 195, isNew: false },
  { id: "wa6", wallet: "WhaleAlert", walletId: "w6", rank: 6, accuracy: 73, market: "AGI announced by 2027?", marketId: "ai-agi", side: "YES", size: "$1.4M", price: "15¢", time: "5m ago", seconds: 310, isNew: false },
  { id: "wa7", wallet: "PolyShark", walletId: "w2", rank: 3, accuracy: 68, market: "EU retaliatory tariffs by Q3?", marketId: "eu-tariff", side: "YES", size: "$890K", price: "54¢", time: "7m ago", seconds: 420, isNew: false },
  { id: "wa8", wallet: "OracleOfPoly", walletId: "w9", rank: 8, accuracy: 76, market: "Harris is 2028 Dem nominee?", marketId: "dem-nominee", side: "NO", size: "$1.6M", price: "44¢", time: "9m ago", seconds: 560, isNew: false },
  { id: "wa9", wallet: "NateGold", walletId: "w13", rank: 13, accuracy: 72, market: "China-Taiwan conflict 2026?", marketId: "china-taiwan", side: "NO", size: "$720K", price: "8¢", time: "12m ago", seconds: 740, isNew: false },
  { id: "wa10", wallet: "SmartMoney42", walletId: "w5", rank: 11, accuracy: 63, market: "SpaceX crewed Mars by 2030?", marketId: "spacex-mars", side: "YES", size: "$540K", price: "19¢", time: "14m ago", seconds: 880, isNew: false },
];

export const incomingAlerts: Omit<WhaleAlert, "isNew">[] = [
  { id: "wa-new1", wallet: "QuantWhale", walletId: "w15", rank: 5, accuracy: 80, market: "Fed cuts rates before July?", marketId: "fed-rate-cut", side: "YES", size: "$5.2M", price: "43¢", time: "just now", seconds: 0 },
  { id: "wa-new2", wallet: "Cassandra.eth", walletId: "w11", rank: 4, accuracy: 77, market: "Student debt relief bill passes?", marketId: "student-debt", side: "YES", size: "$1.9M", price: "38¢", time: "just now", seconds: 0 },
  { id: "wa-new3", wallet: "KalshiKing", walletId: "w4", rank: 1, accuracy: 79, market: "Bitcoin above $150K by EOY?", marketId: "btc-150k", side: "YES", size: "$2.8M", price: "24¢", time: "just now", seconds: 0 },
];

export const priceMovers: PriceMover[] = [
  { id: "pm1", market: "US recession by Dec 2026?", marketId: "recession-2026", price: 68, change5m: 3.2, change15m: 5.8, change1h: 12.4, volume: "$4.2M", volSpike: true, spark: sparkGen(55, 1.1) },
  { id: "pm2", market: "NVIDIA announces 10:1 stock split?", marketId: "nvidia-split", price: 72, change5m: 2.1, change15m: 4.5, change1h: 8.3, volume: "$2.1M", volSpike: true, spark: sparkGen(60, 1.0) },
  { id: "pm3", market: "EU retaliatory tariffs by Q3?", marketId: "eu-tariff", price: 54, change5m: 1.8, change15m: 3.9, change1h: 6.1, volume: "$1.8M", volSpike: false, spark: sparkGen(45, 0.8) },
  { id: "pm4", market: "Fed cuts rates before July?", marketId: "fed-rate-cut", price: 42, change5m: -2.4, change15m: -4.1, change1h: -8.2, volume: "$3.4M", volSpike: true, spark: sparkGen(50, -0.7) },
  { id: "pm5", market: "Bitcoin above $150K by EOY?", marketId: "btc-150k", price: 23, change5m: -1.1, change15m: -2.8, change1h: -3.1, volume: "$2.8M", volSpike: false, spark: sparkGen(26, -0.3) },
  { id: "pm6", market: "AGI announced by 2027?", marketId: "ai-agi", price: 15, change5m: 0.9, change15m: 1.7, change1h: 2.8, volume: "$980K", volSpike: false, spark: sparkGen(12, 0.25) },
  { id: "pm7", market: "Trump wins 2028 election?", marketId: "trump-2028", price: 31, change5m: 1.4, change15m: 3.2, change1h: 5.7, volume: "$5.1M", volSpike: true, spark: sparkGen(24, 0.6) },
  { id: "pm8", market: "WHO declares new pandemic 2026?", marketId: "pandemic-2026", price: 6, change5m: -0.3, change15m: -0.5, change1h: -0.8, volume: "$1.2M", volSpike: false, spark: sparkGen(7, -0.08) },
  { id: "pm9", market: "Student debt relief bill passes?", marketId: "student-debt", price: 37, change5m: -1.8, change15m: -3.4, change1h: -6.5, volume: "$720K", volSpike: false, spark: sparkGen(44, -0.6) },
  { id: "pm10", market: "SpaceX crewed Mars by 2030?", marketId: "spacex-mars", price: 19, change5m: 0.6, change15m: 2.1, change1h: 4.1, volume: "$540K", volSpike: false, spark: sparkGen(14, 0.4) },
];

export const resolutionNearing: ResolutionItem[] = [
  { id: "rn1", market: "Fed cuts rates before July?", marketId: "fed-rate-cut", price: 42, volume: "$18.7M", resolves: "Jul 1, 2026", daysLeft: 88, hoursLeft: 2112, highConviction: true, whaleCount: 14, yesPercent: 42 },
  { id: "rn2", market: "Jones wins UFC 309?", marketId: "ufc-309", price: 61, volume: "$3.2M", resolves: "Apr 19, 2026", daysLeft: 15, hoursLeft: 360, highConviction: false, whaleCount: 3, yesPercent: 61 },
  { id: "rn3", market: "EU retaliatory tariffs by Q3?", marketId: "eu-tariff", price: 54, volume: "$6.1M", resolves: "Sep 30, 2026", daysLeft: 179, hoursLeft: 4296, highConviction: true, whaleCount: 8, yesPercent: 54 },
  { id: "rn4", market: "NVIDIA announces 10:1 stock split?", marketId: "nvidia-split", price: 72, volume: "$8.2M", resolves: "Jun 15, 2026", daysLeft: 72, hoursLeft: 1728, highConviction: true, whaleCount: 11, yesPercent: 72 },
  { id: "rn5", market: "Apple releases standalone AI device?", marketId: "apple-ai", price: 28, volume: "$4.7M", resolves: "Dec 31, 2026", daysLeft: 271, hoursLeft: 6504, highConviction: false, whaleCount: 5, yesPercent: 28 },
  { id: "rn6", market: "US recession by Dec 2026?", marketId: "recession-2026", price: 68, volume: "$24.1M", resolves: "Dec 31, 2026", daysLeft: 271, hoursLeft: 6504, highConviction: true, whaleCount: 22, yesPercent: 68 },
  { id: "rn7", market: "Bitcoin above $150K by EOY?", marketId: "btc-150k", price: 23, volume: "$32.8M", resolves: "Dec 31, 2026", daysLeft: 271, hoursLeft: 6504, highConviction: true, whaleCount: 18, yesPercent: 23 },
  { id: "rn8", market: "Harris is 2028 Dem nominee?", marketId: "dem-nominee", price: 44, volume: "$7.9M", resolves: "Aug 30, 2028", daysLeft: 879, hoursLeft: 21096, highConviction: false, whaleCount: 6, yesPercent: 44 },
];

// ─── MARKET-DETAIL SUPPLEMENTARY DATA ─────────────────────────────────
export const whaleFlows: WhaleFlow[] = [
  { id: "wf1", wallet: "DegenWhale.eth", walletId: "w1", rank: 2, side: "YES", size: "$2.4M", price: "64¢", acc: 74, pnl: "+$340K", time: "3m ago" },
  { id: "wf2", wallet: "PolyShark", walletId: "w2", rank: 3, side: "YES", size: "$1.1M", price: "66¢", acc: 68, pnl: "+$88K", time: "18m ago" },
  { id: "wf3", wallet: "0xAlpha", walletId: "w3", rank: 7, side: "NO", size: "$950K", price: "33¢", acc: 71, pnl: "-$42K", time: "45m ago" },
  { id: "wf4", wallet: "KalshiKing", walletId: "w4", rank: 1, side: "YES", size: "$3.1M", price: "61¢", acc: 79, pnl: "+$620K", time: "1h ago" },
  { id: "wf5", wallet: "SmartMoney42", walletId: "w5", rank: 11, side: "NO", size: "$720K", price: "35¢", acc: 63, pnl: "-$18K", time: "2h ago" },
  { id: "wf6", wallet: "WhaleAlert", walletId: "w6", rank: 6, side: "YES", size: "$1.8M", price: "58¢", acc: 73, pnl: "+$270K", time: "3h ago" },
  { id: "wf7", wallet: "PredictoorDAO", walletId: "w7", rank: 9, side: "YES", size: "$540K", price: "67¢", acc: 66, pnl: "+$32K", time: "5h ago" },
  { id: "wf8", wallet: "0xBigBrain", walletId: "w8", rank: 12, side: "NO", size: "$380K", price: "31¢", acc: 64, pnl: "+$14K", time: "8h ago" },
];

export const crossPlatformPrices: CrossPlatformPrice[] = [
  { platform: "Polymarket", price: 68, change: 12.4, vol: "$24.1M", liquidity: "$4.2M", traders: "18.4K", link: "#" },
  { platform: "Kalshi", price: 60, change: 9.1, vol: "$8.3M", liquidity: "$1.8M", traders: "6.2K", link: "#" },
  { platform: "PredictIt", price: 65, change: 11.0, vol: "$2.1M", liquidity: "$420K", traders: "3.8K", link: "#" },
  { platform: "Metaculus", price: 64, change: 10.2, vol: "N/A", liquidity: "N/A", traders: "1.2K", link: "#" },
];

export const orderbookBids: OrderbookLevel[] = [
  { price: 67, size: 142000, total: 142000 },
  { price: 66, size: 238000, total: 380000 },
  { price: 65, size: 310000, total: 690000 },
  { price: 64, size: 185000, total: 875000 },
  { price: 63, size: 420000, total: 1295000 },
  { price: 62, size: 290000, total: 1585000 },
  { price: 61, size: 510000, total: 2095000 },
  { price: 60, size: 180000, total: 2275000 },
];

export const orderbookAsks: OrderbookLevel[] = [
  { price: 69, size: 195000, total: 195000 },
  { price: 70, size: 280000, total: 475000 },
  { price: 71, size: 165000, total: 640000 },
  { price: 72, size: 340000, total: 980000 },
  { price: 73, size: 220000, total: 1200000 },
  { price: 74, size: 410000, total: 1610000 },
  { price: 75, size: 150000, total: 1760000 },
  { price: 76, size: 300000, total: 2060000 },
];

export const resolutionHistory: ResolutionRecord[] = [
  { q: "US recession by Dec 2024?", resolved: "NO", finalPrice: 12, accuracy: "Correct — no recession declared", date: "Jan 2025" },
  { q: "US recession by Dec 2023?", resolved: "NO", finalPrice: 8, accuracy: "Correct — GDP growth positive", date: "Jan 2024" },
  { q: "US recession by Dec 2022?", resolved: "NO", finalPrice: 35, accuracy: "Correct — but market was uncertain", date: "Jan 2023" },
  { q: "US recession by Dec 2020?", resolved: "YES", finalPrice: 91, accuracy: "Correct — COVID recession", date: "Jan 2021" },
];

// ─── RECENTLY RESOLVED MARKETS ────────────────────────────────────────
export interface ResolvedMarket {
  id: string;
  question: string;
  marketId: string;
  resolved: "YES" | "NO";
  finalPrice: number;
  marketPrice: number;
  correct: boolean;
  traders: number;
  volume: string;
  category: string;
  resolvedDate: string;
}

export const recentlyResolved: ResolvedMarket[] = [
  { id: "rm1", question: "Will the Fed raise rates in Q1 2026?", marketId: "fed-hike-q1", resolved: "NO", finalPrice: 3, marketPrice: 18, correct: true, traders: 8420, volume: "$6.2M", category: "Economics", resolvedDate: "Mar 31, 2026" },
  { id: "rm2", question: "Will UK call a snap election before April 2026?", marketId: "uk-snap", resolved: "NO", finalPrice: 5, marketPrice: 22, correct: true, traders: 3100, volume: "$1.8M", category: "Elections", resolvedDate: "Mar 28, 2026" },
  { id: "rm3", question: "Will Bitcoin hit $200K by March 2026?", marketId: "btc-200k-mar", resolved: "NO", finalPrice: 2, marketPrice: 8, correct: true, traders: 14200, volume: "$18.4M", category: "Crypto", resolvedDate: "Mar 31, 2026" },
  { id: "rm4", question: "Will TikTok be banned in the US by March 2026?", marketId: "tiktok-ban", resolved: "YES", finalPrice: 94, marketPrice: 62, correct: false, traders: 28400, volume: "$42.1M", category: "Tech", resolvedDate: "Mar 15, 2026" },
  { id: "rm5", question: "Will inflation drop below 2.5% by Feb 2026?", marketId: "inflation-2-5", resolved: "NO", finalPrice: 8, marketPrice: 45, correct: false, traders: 6800, volume: "$4.9M", category: "Economics", resolvedDate: "Feb 28, 2026" },
  { id: "rm6", question: "Will Starship achieve orbit by Q1 2026?", marketId: "starship-orbit", resolved: "YES", finalPrice: 92, marketPrice: 78, correct: true, traders: 9200, volume: "$7.3M", category: "Tech", resolvedDate: "Mar 22, 2026" },
];

// ─── WHALE-PROFILE SUPPLEMENTARY DATA ────────────────────────────���─────
export const pnlHistory = [
  { month: "Apr", pnl: 120 }, { month: "May", pnl: 340 }, { month: "Jun", pnl: 280 },
  { month: "Jul", pnl: 510 }, { month: "Aug", pnl: 390 }, { month: "Sep", pnl: 720 },
  { month: "Oct", pnl: 680 }, { month: "Nov", pnl: 890 }, { month: "Dec", pnl: 1100 },
  { month: "Jan", pnl: 1450 }, { month: "Feb", pnl: 1820 }, { month: "Mar", pnl: 2400 },
];

export const currentPositions: Position[] = [
  { id: "p1", marketId: "recession-2026", market: "US recession by Dec 2026?", side: "YES", size: "$2.4M", entry: "52¢", current: "68¢", unrealizedPnl: "+$740K", pnlPct: "+30.8%" },
  { id: "p2", marketId: "fed-rate-cut", market: "Fed cuts rates before July?", side: "NO", size: "$1.1M", entry: "62¢", current: "58¢", unrealizedPnl: "+$72K", pnlPct: "+6.5%" },
  { id: "p3", marketId: "trump-2028", market: "Trump wins 2028 election?", side: "YES", size: "$820K", entry: "24¢", current: "31¢", unrealizedPnl: "+$239K", pnlPct: "+29.2%" },
  { id: "p4", marketId: "btc-150k", market: "Bitcoin above $150K by EOY?", side: "NO", size: "$650K", entry: "28¢", current: "23¢", unrealizedPnl: "+$116K", pnlPct: "+17.9%" },
  { id: "p5", marketId: "ai-agi", market: "AGI announced by 2027?", side: "YES", size: "$340K", entry: "11¢", current: "15¢", unrealizedPnl: "+$124K", pnlPct: "+36.4%" },
  { id: "p6", marketId: "china-taiwan", market: "China-Taiwan conflict 2026?", side: "NO", size: "$1.8M", entry: "12¢", current: "8¢", unrealizedPnl: "+$600K", pnlPct: "+33.3%" },
  { id: "p7", marketId: "spacex-mars", market: "SpaceX crewed Mars by 2030?", side: "YES", size: "$290K", entry: "14¢", current: "19¢", unrealizedPnl: "+$104K", pnlPct: "+35.7%" },
];

export const historicalTrades: HistoricalTrade[] = [
  { id: "h1", marketId: "election-2024", market: "Biden wins 2024 election?", side: "NO", size: "$3.2M", entry: "55¢", exit: "4¢", realizedPnl: "+$2.9M", pnlPct: "+92.7%", accImpact: "+2.1%", date: "Nov 2024" },
  { id: "h2", marketId: "btc-100k-2024", market: "BTC above $100K by Dec 2024?", side: "YES", size: "$1.8M", entry: "38¢", exit: "96¢", realizedPnl: "+$2.7M", pnlPct: "+152.6%", accImpact: "+1.8%", date: "Dec 2024" },
  { id: "h3", marketId: "fed-hike-2024", market: "Fed hikes rates in 2024?", side: "NO", size: "$900K", entry: "22¢", exit: "3¢", realizedPnl: "+$775K", pnlPct: "+86.4%", accImpact: "+0.9%", date: "Dec 2024" },
  { id: "h4", marketId: "russ-ukr-ceasefire", market: "Russia-Ukraine ceasefire by mid-2025?", side: "YES", size: "$1.1M", entry: "31¢", exit: "12¢", realizedPnl: "-$614K", pnlPct: "-61.3%", accImpact: "-1.2%", date: "Jun 2025" },
  { id: "h5", marketId: "twitter-ipo", market: "X/Twitter IPO by 2025?", side: "YES", size: "$420K", entry: "18¢", exit: "2¢", realizedPnl: "-$373K", pnlPct: "-88.9%", accImpact: "-0.8%", date: "Dec 2025" },
  { id: "h6", marketId: "sp500-5500", market: "S&P 500 above 5500 by mid-2025?", side: "YES", size: "$2.1M", entry: "44¢", exit: "91¢", realizedPnl: "+$2.2M", pnlPct: "+106.8%", accImpact: "+1.5%", date: "Jun 2025" },
  { id: "h7", marketId: "nvidia-top", market: "NVIDIA highest market cap 2025?", side: "YES", size: "$780K", entry: "62¢", exit: "88¢", realizedPnl: "+$327K", pnlPct: "+41.9%", accImpact: "+0.6%", date: "Mar 2025" },
  { id: "h8", marketId: "dem-house-2024", market: "Democrats win House 2024?", side: "NO", size: "$1.4M", entry: "48¢", exit: "8¢", realizedPnl: "+$1.2M", pnlPct: "+83.3%", accImpact: "+1.4%", date: "Nov 2024" },
  { id: "h9", marketId: "openai-ipo", market: "OpenAI IPO by end 2025?", side: "NO", size: "$550K", entry: "35¢", exit: "9¢", realizedPnl: "+$407K", pnlPct: "+74.3%", accImpact: "+0.7%", date: "Dec 2025" },
  { id: "h10", marketId: "inflation-3pct", market: "US inflation below 3% by mid-2025?", side: "YES", size: "$1.6M", entry: "56¢", exit: "82¢", realizedPnl: "+$743K", pnlPct: "+46.4%", accImpact: "+0.9%", date: "Jun 2025" },
];

export const categoryPerformance: CategoryPerf[] = [
  { category: "Economics", winRate: 82, trades: 124, pnl: "+$2.8M", color: "#57D7BA" },
  { category: "Elections", winRate: 78, trades: 86, pnl: "+$1.9M", color: "#6366f1" },
  { category: "Crypto", winRate: 69, trades: 198, pnl: "+$1.1M", color: "#f59e0b" },
  { category: "Tech", winRate: 65, trades: 142, pnl: "+$620K", color: "#ec4899" },
  { category: "Geopolitics", winRate: 58, trades: 67, pnl: "-$180K", color: "#8b5cf6" },
  { category: "Policy", winRate: 55, trades: 91, pnl: "+$240K", color: "#14b8a6" },
  { category: "Science", winRate: 52, trades: 43, pnl: "+$80K", color: "#64748b" },
  { category: "Sports", winRate: 48, trades: 96, pnl: "-$340K", color: "#ef4444" },
];

export const calibrationData = [
  { predicted: 10, actual: 8 }, { predicted: 15, actual: 12 },
  { predicted: 20, actual: 22 }, { predicted: 25, actual: 18 },
  { predicted: 30, actual: 28 }, { predicted: 35, actual: 40 },
  { predicted: 40, actual: 38 }, { predicted: 45, actual: 42 },
  { predicted: 50, actual: 55 }, { predicted: 55, actual: 52 },
  { predicted: 60, actual: 58 }, { predicted: 65, actual: 70 },
  { predicted: 70, actual: 68 }, { predicted: 75, actual: 78 },
  { predicted: 80, actual: 82 }, { predicted: 85, actual: 80 },
  { predicted: 90, actual: 92 }, { predicted: 95, actual: 88 },
];

export const biggestWins = [
  { market: "BTC above $100K by Dec 2024?", marketId: "btc-100k-2024", pnl: "+$2.7M" },
  { market: "Biden wins 2024 election?", marketId: "election-2024", pnl: "+$2.9M" },
  { market: "S&P 500 above 5500 by mid-2025?", marketId: "sp500-5500", pnl: "+$2.2M" },
];

export const biggestLosses = [
  { market: "Russia-Ukraine ceasefire by mid-2025?", marketId: "russ-ukr-ceasefire", pnl: "-$614K" },
  { market: "X/Twitter IPO by 2025?", marketId: "twitter-ipo", pnl: "-$373K" },
  { market: "World Cup 2026 host change?", marketId: "wc-host", pnl: "-$210K" },
];

// ─── BACKTEST DATA ────────────────────────────────────────────────────
export const backtestEquity = Array.from({ length: 90 }, (_, i) => {
  const base = 10000;
  const growth = base * Math.pow(1.003, i);
  const noise = (Math.random() - 0.4) * 300;
  return {
    day: i + 1,
    equity: Math.round(growth + noise),
    benchmark: Math.round(base + i * 15 + (Math.random() - 0.5) * 100),
  };
});

export const backtestTrades = [
  { id: "bt1", market: "US recession by Dec 2026?", marketId: "recession-2026", side: "YES" as const, entry: "52¢", exit: "68¢", pnl: "+$3,200", pnlPct: "+30.8%", date: "Mar 15" },
  { id: "bt2", market: "Fed cuts rates before July?", marketId: "fed-rate-cut", side: "NO" as const, entry: "62¢", exit: "58¢", pnl: "+$640", pnlPct: "+6.5%", date: "Mar 12" },
  { id: "bt3", market: "Trump wins 2028?", marketId: "trump-2028", side: "YES" as const, entry: "24¢", exit: "31¢", pnl: "+$1,400", pnlPct: "+29.2%", date: "Mar 8" },
  { id: "bt4", market: "Bitcoin above $150K?", marketId: "btc-150k", side: "NO" as const, entry: "28¢", exit: "23¢", pnl: "+$500", pnlPct: "+17.9%", date: "Mar 5" },
  { id: "bt5", market: "AGI announced by 2027?", marketId: "ai-agi", side: "YES" as const, entry: "11¢", exit: "15¢", pnl: "+$364", pnlPct: "+36.4%", date: "Feb 28" },
  { id: "bt6", market: "EU retaliatory tariffs?", marketId: "eu-tariff", side: "YES" as const, entry: "42¢", exit: "54¢", pnl: "+$1,200", pnlPct: "+28.6%", date: "Feb 22" },
  { id: "bt7", market: "NVIDIA 10:1 split?", marketId: "nvidia-split", side: "YES" as const, entry: "58¢", exit: "72¢", pnl: "+$1,400", pnlPct: "+24.1%", date: "Feb 18" },
  { id: "bt8", market: "WHO new pandemic 2026?", marketId: "pandemic-2026", side: "NO" as const, entry: "10¢", exit: "6¢", pnl: "+$400", pnlPct: "+40.0%", date: "Feb 10" },
];

// ─── HOMEPAGE DERIVED DATA ────────────────────────────────────────────
export const treemapData = [
  { name: "Recession 2026", size: 2410, change: 12.4 },
  { name: "Trump 2028", size: 4520, change: 5.7 },
  { name: "BTC $150K", size: 3280, change: -3.1 },
  { name: "Fed Rate Cut", size: 1870, change: -8.2 },
  { name: "AGI 2027", size: 1240, change: 2.8 },
  { name: "Taiwan Conflict", size: 2890, change: -1.2 },
  { name: "NVIDIA Split", size: 820, change: 6.3 },
  { name: "EU Tariffs", size: 610, change: 3.9 },
  { name: "Mars Mission", size: 830, change: 4.1 },
  { name: "Student Debt", size: 510, change: -6.5 },
  { name: "Pandemic 2026", size: 1180, change: -0.8 },
  { name: "Apple AI", size: 470, change: 1.2 },
  { name: "UFC 309", size: 320, change: 0.5 },
  { name: "Harris 2028", size: 790, change: -2.1 },
];

// Top 8 movers for homepage (derived from markets, sorted by absolute change)
export const biggestMovers = [...markets]
  .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  .slice(0, 8)
  .map((m) => ({
    id: m.id,
    q: m.question,
    price: m.price,
    change: m.change,
    vol: m.volume.replace("$", ""),
    spark: sparkGen(m.price - 15, m.change > 0 ? 2.5 : -1.2, 7),
    cat: m.category,
  }));

// Breaking markets for homepage
export const breakingMarkets = [
  { id: "nvidia-split", title: "NVIDIA announces 10:1 stock split", price: 72, vol: "8.2M", time: "2m ago", hot: true },
  { id: "eu-tariff", title: "EU retaliatory tariffs by Q3?", price: 54, vol: "6.1M", time: "8m ago", hot: true },
  { id: "apple-ai", title: "Apple releases standalone AI device?", price: 28, vol: "4.7M", time: "15m ago", hot: false },
  { id: "ufc-309", title: "Jones wins UFC 309?", price: 61, vol: "3.2M", time: "22m ago", hot: false },
  { id: "pandemic-2026", title: "WHO declares new pandemic 2026?", price: 6, vol: "11.8M", time: "34m ago", hot: true },
  { id: "dem-nominee", title: "Harris is 2028 Dem nominee?", price: 44, vol: "7.9M", time: "41m ago", hot: false },
];

// ─── DISAGREES (cross-platform spreads) ───────────────────────────────
export interface Disagreement {
  id: string;
  question: string;
  marketId: string;
  polyPrice: number;
  kalshiPrice: number;
  spread: number;
  polyVol: string;
  kalshiVol: string;
  category: string;
  resolution: string;
  daysLeft: number;
  direction: "poly-higher" | "kalshi-higher";
  spreadTrend?: "converging" | "diverging" | "stable";
  convergenceRate?: number;
  opportunityScore?: number;
  matchConfidence?: number;
}

export const disagreements: Disagreement[] = [
  { id: "d1", question: "Will there be a US recession by Dec 2026?", marketId: "recession-2026", polyPrice: 68, kalshiPrice: 55, spread: 13, polyVol: "$24.1M", kalshiVol: "$8.3M", category: "Economics", resolution: "Dec 31, 2026", daysLeft: 271, direction: "poly-higher" },
  { id: "d2", question: "Will Trump win the 2028 presidential election?", marketId: "trump-2028", polyPrice: 31, kalshiPrice: 19, spread: 12, polyVol: "$45.2M", kalshiVol: "$12.1M", category: "Elections", resolution: "Nov 5, 2028", daysLeft: 950, direction: "poly-higher" },
  { id: "d3", question: "Will Bitcoin trade above $150K by end of 2026?", marketId: "btc-150k", polyPrice: 23, kalshiPrice: 34, spread: 11, polyVol: "$32.8M", kalshiVol: "$9.4M", category: "Crypto", resolution: "Dec 31, 2026", daysLeft: 271, direction: "kalshi-higher" },
  { id: "d4", question: "Will the EU impose retaliatory tariffs by Q3 2026?", marketId: "eu-tariff", polyPrice: 54, kalshiPrice: 42, spread: 12, polyVol: "$6.1M", kalshiVol: "$3.8M", category: "Geopolitics", resolution: "Sep 30, 2026", daysLeft: 179, direction: "poly-higher" },
  { id: "d5", question: "Will AGI be announced by a major lab by 2027?", marketId: "ai-agi", polyPrice: 15, kalshiPrice: 5, spread: 10, polyVol: "$12.4M", kalshiVol: "$2.1M", category: "Tech", resolution: "Dec 31, 2027", daysLeft: 636, direction: "poly-higher" },
  { id: "d6", question: "Will OpenAI hit $10B annual revenue by mid-2026?", marketId: "openai-revenue", polyPrice: 55, kalshiPrice: 41, spread: 14, polyVol: "$5.6M", kalshiVol: "$2.8M", category: "Tech", resolution: "Jul 1, 2026", daysLeft: 88, direction: "poly-higher" },
  { id: "d7", question: "Will Harris be the 2028 Democratic nominee?", marketId: "dem-nominee", polyPrice: 44, kalshiPrice: 32, spread: 12, polyVol: "$7.9M", kalshiVol: "$4.2M", category: "Elections", resolution: "Aug 30, 2028", daysLeft: 879, direction: "poly-higher" },
  { id: "d8", question: "Will oil prices exceed $100/barrel in 2026?", marketId: "oil-100", polyPrice: 33, kalshiPrice: 22, spread: 11, polyVol: "$7.1M", kalshiVol: "$3.4M", category: "Economics", resolution: "Dec 31, 2026", daysLeft: 271, direction: "poly-higher" },
  { id: "d9", question: "Will Solana's market cap flip Ethereum in 2026?", marketId: "sol-flip-eth", polyPrice: 11, kalshiPrice: 22, spread: 11, polyVol: "$8.9M", kalshiVol: "$5.1M", category: "Crypto", resolution: "Dec 31, 2026", daysLeft: 271, direction: "kalshi-higher" },
  { id: "d10", question: "Will the Senate flip in 2026 midterms?", marketId: "senate-flip", polyPrice: 38, kalshiPrice: 27, spread: 11, polyVol: "$14.2M", kalshiVol: "$6.8M", category: "Elections", resolution: "Nov 3, 2026", daysLeft: 213, direction: "poly-higher" },
];

// ─── INSIGHTS / NEWS ──────────────────────────────────────────────────
export interface Insight {
  id: string;
  headline: string;
  summary: string;
  marketId: string;
  marketQuestion: string;
  impact: "bullish" | "bearish" | "neutral";
  priceMove: string;
  source: string;
  sourceType: "twitter" | "news" | "research" | "official";
  category: string;
  time: string;
  minutesAgo: number;
}

export const insights: Insight[] = [
  { id: "i1", headline: "NBER economists signal 'elevated recession risk' in Q3 outlook", summary: "The National Bureau of Economic Research published a preliminary assessment showing leading indicators pointing to significant economic slowdown by late 2026.", marketId: "recession-2026", marketQuestion: "US recession by Dec 2026?", impact: "bullish", priceMove: "+4.2%", source: "NBER", sourceType: "research", category: "Economics", time: "12m ago", minutesAgo: 12 },
  { id: "i2", headline: "Fed Governor Waller hints at 'patience' on rate cuts in CNBC interview", summary: "Federal Reserve Governor Christopher Waller suggested the central bank is in no rush to cut rates, citing persistent services inflation.", marketId: "fed-rate-cut", marketQuestion: "Fed cuts rates before July?", impact: "bearish", priceMove: "-3.1%", source: "CNBC", sourceType: "news", category: "Economics", time: "28m ago", minutesAgo: 28 },
  { id: "i3", headline: "Trump campaign announces $50M fundraising haul in Q1 2026", summary: "The Trump 2028 campaign reported its strongest fundraising quarter, significantly outpacing other potential Republican candidates.", marketId: "trump-2028", marketQuestion: "Trump wins 2028 election?", impact: "bullish", priceMove: "+2.8%", source: "@realDonaldTrump", sourceType: "twitter", category: "Elections", time: "1h ago", minutesAgo: 62 },
  { id: "i4", headline: "Bitcoin ETF inflows hit $2.1B in single week — highest since launch", summary: "Spot Bitcoin ETFs recorded their largest weekly inflows ever, driven by institutional allocation shifts and macro hedging demand.", marketId: "btc-150k", marketQuestion: "Bitcoin above $150K by EOY?", impact: "bullish", priceMove: "+1.9%", source: "Bloomberg", sourceType: "news", category: "Crypto", time: "2h ago", minutesAgo: 124 },
  { id: "i5", headline: "EU Commission formally begins retaliatory tariff process against US goods", summary: "The European Commission voted to initiate a formal tariff response process targeting $18B in US agricultural and tech exports.", marketId: "eu-tariff", marketQuestion: "EU retaliatory tariffs by Q3?", impact: "bullish", priceMove: "+6.1%", source: "Reuters", sourceType: "news", category: "Geopolitics", time: "3h ago", minutesAgo: 185 },
  { id: "i6", headline: "OpenAI CFO confirms 'significant revenue acceleration' in earnings call leak", summary: "An alleged transcript from an internal OpenAI board meeting shows the company tracking toward $12B annualized revenue by mid-2026.", marketId: "openai-revenue", marketQuestion: "OpenAI hits $10B revenue by mid-2026?", impact: "bullish", priceMove: "+3.4%", source: "@theinformation", sourceType: "twitter", category: "Tech", time: "4h ago", minutesAgo: 248 },
  { id: "i7", headline: "Polymarket whale drops $4.1M YES on recession contract", summary: "QuantWhale, one of the platform's most accurate traders (80% accuracy), placed the largest single bet of the week on the recession market.", marketId: "recession-2026", marketQuestion: "US recession by Dec 2026?", impact: "bullish", priceMove: "+1.2%", source: "On-chain data", sourceType: "research", category: "Economics", time: "5h ago", minutesAgo: 310 },
  { id: "i8", headline: "Senate Majority Leader signals bipartisan support for student debt compromise", summary: "In a floor speech, the Senate Majority Leader indicated willingness to negotiate a reduced student debt relief package, boosting passage odds.", marketId: "student-debt", marketQuestion: "Student debt relief bill passes?", impact: "bullish", priceMove: "+5.8%", source: "C-SPAN", sourceType: "official", category: "Elections", time: "6h ago", minutesAgo: 370 },
  { id: "i9", headline: "NVIDIA CEO teases 'major announcement' at upcoming GTC keynote", summary: "Jensen Huang posted a cryptic teaser on social media hinting at a significant corporate action, fueling stock split speculation.", marketId: "nvidia-split", marketQuestion: "NVIDIA 10:1 stock split?", impact: "bullish", priceMove: "+2.1%", source: "@JensenHuang", sourceType: "twitter", category: "Economics", time: "8h ago", minutesAgo: 480 },
  { id: "i10", headline: "Kalshi sees 40% volume surge on political markets ahead of midterms", summary: "Kalshi reported record trading volume on 2026 midterm election contracts, with Senate control markets leading the activity.", marketId: "senate-flip", marketQuestion: "Senate flips in 2026 midterms?", impact: "neutral", priceMove: "+0.3%", source: "Kalshi Blog", sourceType: "official", category: "Elections", time: "10h ago", minutesAgo: 600 },
];

// Homepage whale activity (top 5 recent whale moves)
export const homepageWhaleActivity = [
  { id: "w1", name: "DegenWhale.eth", rank: 2, acc: 74, pos: "YES $2.4M", market: "US recession by Dec 2026?", marketId: "recession-2026", time: "3m ago", side: "long" as const },
  { id: "w2", name: "PolyShark", rank: 3, acc: 68, pos: "NO $1.8M", market: "Fed cuts rates before July?", marketId: "fed-rate-cut", time: "12m ago", side: "short" as const },
  { id: "w3", name: "0xAlpha", rank: 7, acc: 71, pos: "YES $950K", market: "Trump wins 2028 election?", marketId: "trump-2028", time: "28m ago", side: "long" as const },
  { id: "w4", name: "KalshiKing", rank: 1, acc: 79, pos: "NO $3.1M", market: "Bitcoin above $150K by EOY?", marketId: "btc-150k", time: "45m ago", side: "short" as const },
  { id: "w5", name: "SmartMoney42", rank: 11, acc: 63, pos: "YES $720K", market: "AGI announced by 2027?", marketId: "ai-agi", time: "1h ago", side: "long" as const },
];
