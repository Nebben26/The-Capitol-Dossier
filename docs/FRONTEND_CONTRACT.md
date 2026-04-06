# Frontend Type Contract

These are the TypeScript interfaces the frontend components consume. Your API transforms in `lib/api.ts` MUST output data matching these shapes exactly. If a field is missing, the component will show `undefined` or crash.

Check the actual types in `lib/mockData.ts` as the source of truth — this file documents the expected shape but the codebase types may have evolved. **Always verify against the actual code before making changes.**

---

## Core Types

### Market
Used by: Homepage, /markets, /markets/[id], /screener, /watchlist, /alerts, /disagrees

```typescript
interface Market {
  id: string;                    // Unique identifier (Polymarket conditionId, Kalshi ticker, etc.)
  title: string;                 // Display name
  category: string;              // "politics" | "crypto" | "sports" | "science" | "culture" | "economics"
  probability: number;           // 0-1 (e.g., 0.62 = 62%)
  previousProbability?: number;  // For computing change (optional, compute from history)
  volume: number;                // USD lifetime volume
  volume24h?: number;            // USD 24h volume (if available)
  liquidity: number;             // Current liquidity/open interest in USD
  endDate: string;               // ISO 8601 date string
  platform: string;              // "polymarket" | "kalshi" | "manifold"
  url?: string;                  // Direct link to market on source platform
  
  // Optional enrichment fields
  outcomes?: string[];           // ["Yes", "No"] or ["Trump", "Biden", "Other"]
  outcomePrices?: number[];      // Corresponding prices for each outcome
  clobTokenIds?: string[];       // Polymarket-specific: token IDs for CLOB API
  slug?: string;                 // URL-friendly identifier
  description?: string;          // Market description/rules
  resolved?: boolean;            // Whether market has resolved
  resolution?: string;           // "Yes" | "No" | outcome name
  
  // Chart data (populated by separate fetch)
  priceHistory?: { t: number; p: number }[];  // Unix ms timestamp, price 0-1
  
  // Cross-platform (populated by matching engine)
  crossPlatformData?: {
    platform: string;
    probability: number;
    volume: number;
    url: string;
  }[];
}
```

### Whale
Used by: /whales, /whales/[id], /alerts (whale alerts tab), Homepage whale section

```typescript
interface Whale {
  id: string;                    // Wallet address (0x...) or platform username
  name: string;                  // Display name or ENS name or truncated address
  address: string;               // Full wallet address
  avatar?: string;               // Avatar URL (from ENS or generated)
  totalPnl: number;              // Lifetime P&L in USD
  winRate: number;               // 0-1 (e.g., 0.72 = 72%)
  totalTrades: number;           // Lifetime trade count
  activeBets: number;            // Current open positions count
  portfolioValue: number;        // Current portfolio value in USD
  rank?: number;                 // Leaderboard position
  recentTrades?: Trade[];        // Most recent trades
  positions?: Position[];        // Current open positions
  brierScore?: number;           // Calibration score (lower = better)
  platforms?: string[];          // Which platforms they trade on
}
```

### Trade
Used by: Whale profiles, alert feeds, market detail whale tab

```typescript
interface Trade {
  id: string;
  marketId: string;
  marketTitle: string;
  side: "BUY" | "SELL";
  outcome: string;               // "Yes" | "No" | outcome name
  amount: number;                // USD value
  price: number;                 // 0-1 execution price
  timestamp: string;             // ISO 8601
  walletAddress: string;
  platform: string;
}
```

### Position
Used by: Whale profile positions tab

```typescript
interface Position {
  marketId: string;
  marketTitle: string;
  side: string;                  // "YES" | "NO"
  size: number;                  // Contract count or USD value
  avgPrice: number;              // Average entry price 0-1
  currentPrice: number;          // Current market price 0-1
  pnl: number;                   // Unrealized P&L in USD
  platform: string;
}
```

### Disagreement (Cross-Platform Spread)
Used by: /disagrees, Homepage "Market Disagrees" feed

```typescript
interface Disagreement {
  id: string;
  title: string;                 // Normalized question title
  category: string;
  platforms: {
    name: string;                // "polymarket" | "kalshi" | "manifold"
    probability: number;         // 0-1
    volume: number;
    url: string;
    marketId: string;
  }[];
  spread: number;                // Absolute difference between highest and lowest probability
  spreadHistory?: { t: number; spread: number }[];  // Historical spread data
  convergenceRate?: number;      // How fast spreads close (positive = converging)
}
```

### Alert
Used by: /alerts (4 tabs)

```typescript
interface Alert {
  id: string;
  type: "whale_trade" | "price_mover" | "resolution_near" | "resolution";
  title: string;
  description: string;
  timestamp: string;             // ISO 8601
  marketId?: string;
  whaleId?: string;
  
  // Type-specific fields
  priceChange?: number;          // For price movers (e.g., 0.15 = 15% move)
  tradeAmount?: number;          // For whale trades
  daysUntilClose?: number;       // For resolution near
  resolution?: string;           // For resolved markets
  wasCorrect?: boolean;          // "Market Was Right/Wrong" framing
}
```

### Strategy
Used by: /strategies

```typescript
interface Strategy {
  id: string;
  name: string;
  description: string;
  type: string;                  // "momentum" | "contrarian" | "arbitrage" | "whale_follow"
  backtestedReturn: number;      // e.g., 0.23 = 23% return
  winRate: number;
  avgHoldDays: number;
  riskLevel: "low" | "medium" | "high";
  markets?: Market[];            // Current markets matching this strategy
}
```

### Insight
Used by: /insights

```typescript
interface Insight {
  id: string;
  title: string;
  summary: string;
  source: string;                // News source name
  url: string;                   // Link to article
  publishedAt: string;           // ISO 8601
  relatedMarkets: string[];      // Market IDs affected by this news
  sentiment?: "bullish" | "bearish" | "neutral";
  impactScore?: number;          // 0-1 estimated market impact
}
```

---

## Hook Interfaces

### useMarkets()
```typescript
function useMarkets(): {
  markets: Market[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: Date | null;
}
// Auto-refreshes every 45 seconds
// Falls back to mockData on error
```

### useWhales()
```typescript
function useWhales(): {
  whales: Whale[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}
// Auto-refreshes every 60 seconds
```

### useMarketDetail(id: string)
```typescript
function useMarketDetail(id: string): {
  market: Market | null;         // Includes priceHistory, crossPlatformData
  loading: boolean;
  error: string | null;
}
```

---

## API Function Signatures (in lib/api.ts)

These are the functions the hooks call. Your job is to make these return real data:

```typescript
// Market data
export async function getAllMarkets(): Promise<Market[]>
export async function getMarketById(id: string): Promise<Market | null>
export async function getMarketPriceHistory(tokenId: string): Promise<{t: number; p: number}[]>

// Whale data
export async function getWhales(): Promise<Whale[]>
export async function getWhaleById(address: string): Promise<Whale | null>
export async function getWhaleTrades(address: string): Promise<Trade[]>

// Cross-platform
export async function getDisagreements(): Promise<Disagreement[]>

// Leaderboard
export async function getLeaderboard(): Promise<Whale[]>

// Alerts (derived from trades + price changes + resolution dates)
export async function getAlerts(): Promise<Alert[]>
```

---

## Validation Checklist

After implementing real data, verify these pages render correctly:

- [ ] Homepage: Market Disagrees feed shows real spreads, treemap shows real categories
- [ ] /markets: Grid shows real market cards with real prices, volumes, categories
- [ ] /markets/[id]: Overview tab shows real probability, chart tab shows real price history
- [ ] /whales: Real wallet addresses, real P&L numbers
- [ ] /whales/[id]: Real positions, real trade history
- [ ] /leaderboard: Real ranked traders from Polymarket leaderboard
- [ ] /disagrees: Real cross-platform matches with real spreads
- [ ] /screener: Filters work on real data (category, price range, volume)
- [ ] /alerts: Real whale trades and price movers populate the feed
