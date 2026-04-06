# Prediction Market API Reference

Read this ENTIRE file before writing any API integration code. Every field name, response shape, and gotcha is here so you don't have to guess.

---

## 1. Polymarket — Gamma API (Market Discovery)

**Base URL:** `https://gamma-api.polymarket.com`
**Auth:** None required
**Rate Limit:** 500 requests / 10 seconds
**CORS:** Allowed (client-side OK)

### GET /events
Returns events (questions) with nested markets (outcomes).

**Params:**
| Param | Type | Example | Notes |
|-------|------|---------|-------|
| active | bool | `true` | Only active events |
| closed | bool | `false` | Exclude resolved |
| limit | int | `100` | Max per page |
| offset | int | `0` | Pagination offset |
| order | string | `volume` | Sort field |
| ascending | bool | `false` | Sort direction |

**Example:** `GET /events?active=true&closed=false&limit=100&offset=0&order=volume&ascending=false`

**Response shape:**
```json
[
  {
    "id": "event-uuid",
    "title": "2024 Presidential Election Winner",
    "slug": "2024-presidential-election-winner",
    "description": "Who will win...",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-11-05T00:00:00Z",
    "category": "politics",
    "volume": 45000000,
    "liquidity": 2500000,
    "markets": [
      {
        "id": "market-condition-id",
        "question": "Will Trump win?",
        "slug": "will-trump-win",
        "outcomes": "[\"Yes\",\"No\"]",          // ⚠️ JSON STRING — must JSON.parse()
        "outcomePrices": "[\"0.62\",\"0.38\"]",  // ⚠️ JSON STRING — must JSON.parse()
        "volume": 45000000,
        "liquidity": 2500000,
        "active": true,
        "closed": false,
        "endDate": "2024-11-05T00:00:00Z",
        "clobTokenIds": "[\"token-yes-id\",\"token-no-id\"]",  // ⚠️ JSON STRING
        "conditionId": "0xabc123...",
        "acceptingOrders": true
      }
    ]
  }
]
```

**CRITICAL GOTCHAS:**
- `outcomes`, `outcomePrices`, and `clobTokenIds` are **JSON-encoded strings**, not arrays. You MUST `JSON.parse()` them.
- Multi-outcome markets have >2 entries in outcomes/outcomePrices (e.g., "Trump", "Biden", "Other").
- `volume` is lifetime USD volume, not 24h. There is no native 24h volume field.
- Binary markets: outcomePrices[0] is Yes price, outcomePrices[1] is No price. They sum to ~1.0.
- Events with multiple markets are multi-outcome questions (e.g., "Who will win?" has one market per candidate).
- Paginate by incrementing `offset` by `limit` until you get an empty array back.

### GET /markets
Same data but flat (no event grouping). Less useful for discovery but simpler.

**Params:** Same as /events plus `tag`, `slug`.

### GET /markets/{conditionId}
Single market by condition ID.

### GET /events/{slug}
Single event by slug (URL-friendly identifier).

---

## 2. Polymarket — CLOB API (Orderbook & Prices)

**Base URL:** `https://clob.polymarket.com`
**Auth:** None required for reads
**Rate Limit:** 1500 requests / 10 seconds

### GET /prices-history
Historical probability data for charts.

**Params:**
| Param | Type | Example | Notes |
|-------|------|---------|-------|
| market | string | `token-id` | The clobTokenId (from Gamma) |
| interval | string | `max` | `1d`, `1w`, `1m`, `max` |
| fidelity | int | `60` | Data points returned (60 = hourly for 1d) |

**Example:** `GET /prices-history?market=TOKEN_YES_ID&interval=max&fidelity=60`

**Response shape:**
```json
{
  "history": [
    { "t": 1700000000, "p": "0.45" }  // Unix timestamp, price as string
  ]
}
```

**GOTCHAS:**
- `market` param takes the `clobTokenId`, NOT the market/condition ID. Get this from Gamma API's `clobTokenIds` field (JSON.parse it first).
- Price `p` is a string, not a number. `parseFloat()` it.
- `t` is Unix seconds, not milliseconds. Multiply by 1000 for JS Date.

### GET /book
Live orderbook for a market.

**Params:** `token_id` (the clobTokenId)

**Response:**
```json
{
  "market": "token-id",
  "asset_id": "token-id",
  "bids": [{ "price": "0.60", "size": "1500.00" }],
  "asks": [{ "price": "0.62", "size": "800.00" }]
}
```

### GET /midpoint
Current midpoint price. **Params:** `token_id`

**Response:**
```json
{ "mid": "0.6100" }
```

---

## 3. Polymarket — Data API (Trades, Whales, Leaderboard)

**Base URL:** `https://data-api.polymarket.com`
**Auth:** None required
**Rate Limit:** 200 requests / 10 seconds (strictest — be careful)

### GET /trades
Recent trades, filterable by size for whale detection.

**Params:**
| Param | Type | Example | Notes |
|-------|------|---------|-------|
| market | string | condition-id | Filter by market |
| maker | string | `0xabc...` | Filter by wallet |
| limit | int | `100` | Max results |
| offset | int | `0` | Pagination |

**For whale detection, use large trade filter:**
`GET /trades?limit=100&offset=0` then filter client-side by `size` > threshold (e.g., $10,000).

**Response shape:**
```json
[
  {
    "id": "trade-id",
    "taker_order_id": "order-id",
    "market": "condition-id",
    "asset_id": "token-id",
    "side": "BUY",
    "size": "15000.00",        // USD size as string
    "price": "0.62",
    "status": "MATCHED",
    "match_time": "2024-01-15T10:30:00Z",
    "maker_address": "0xabc...",
    "outcome": "Yes",
    "owner": "0xdef...",       // Taker address
    "transaction_hash": "0x..."
  }
]
```

### GET /positions
Portfolio positions for a wallet.

**Params:** `user` (wallet address, required)

**Response:**
```json
[
  {
    "asset": {
      "id": "token-id",
      "condition_id": "condition-id"
    },
    "market": {
      "id": "event-id",
      "question": "Will X happen?",
      "slug": "will-x-happen"
    },
    "size": "5000.00",        // Position size in contracts
    "avgPrice": "0.45",       // Average entry price
    "currentPrice": "0.62",   // Current market price
    "pnl": "850.00",          // Unrealized P&L
    "side": "YES"
  }
]
```

### GET /holders
Top holders for a specific market.

**Params:** `market` (condition-id), `limit`, `offset`

### GET /leaderboard
Top traders by P&L.

**Response:**
```json
[
  {
    "address": "0xabc...",
    "pnl": "125000.00",
    "volume": "500000.00",
    "positions_count": 45,
    "markets_traded": 23,
    "rank": 1
  }
]
```

### GET /activity
Recent activity for a wallet.

**Params:** `user` (wallet address)

---

## 4. Kalshi — Public API

**Base URL:** `https://api.elections.kalshi.com/trade-api/v2`
**Auth:** None required for market reads
**Rate Limit:** 10 requests / second
**CORS:** Allowed

### GET /markets
Browse active markets.

**Params:**
| Param | Type | Example | Notes |
|-------|------|---------|-------|
| status | string | `open` | `open`, `closed`, `settled` |
| limit | int | `200` | Max 1000 |
| cursor | string | (from prev response) | ⚠️ Cursor pagination, NOT offset |
| series_ticker | string | `KXPRES` | Filter by series |
| event_ticker | string | `PRES-2024` | Filter by event |

**Example:** `GET /markets?status=open&limit=200`

**Response shape:**
```json
{
  "markets": [
    {
      "ticker": "KXPRESWIN-24-DT",
      "event_ticker": "PRES-2024",
      "title": "Will Trump win the 2024 presidential election?",
      "subtitle": "",
      "status": "open",
      "yes_ask": "0.6200",    // ⚠️ Dollar strings, not numbers
      "yes_bid": "0.6100",
      "no_ask": "0.3900",
      "no_bid": "0.3800",
      "last_price": "0.6200",
      "volume": 45000,         // Contract count (NOT dollars)
      "dollar_volume": 2800000,
      "open_interest": 12000,
      "close_time": "2024-11-05T00:00:00Z",
      "category": "Politics",
      "result": "",
      "yes_sub_title": "Yes",
      "no_sub_title": "No",
      "open_time": "2024-01-01T00:00:00Z",
      "rules_primary": "...",
      "settlement_timer_seconds": 0
    }
  ],
  "cursor": "abc123nextpage"   // ⚠️ Use this for next page, NOT offset
}
```

**CRITICAL GOTCHAS:**
- **Cursor pagination:** Do NOT use offset. Save `cursor` from response, pass as `cursor` param for next page. When `cursor` is empty/null, you've reached the end.
- **Prices are dollar strings:** `"0.6200"` means 62 cents = 62% probability. `parseFloat()` them.
- **Volume is contract count**, not dollars. Use `dollar_volume` for USD volume or multiply `volume` by average price.
- **`close_time`** is the resolution deadline, equivalent to Polymarket's `endDate`.
- **`ticker`** is the unique ID (like Polymarket's condition ID).

### GET /markets/{ticker}
Single market by ticker.

### GET /markets/{ticker}/history
Price history for a market.

**Params:** `limit`, `cursor`, `min_ts` (unix seconds), `max_ts`

**Response:**
```json
{
  "history": [
    {
      "yes_price": "0.6200",
      "ts": 1700000000         // Unix seconds
    }
  ],
  "cursor": "..."
}
```

---

## 5. Manifold Markets — Public API

**Base URL:** `https://api.manifold.markets/v0`
**Auth:** None required for reads
**Rate Limit:** Generous (undocumented, ~100/min safe)

### GET /markets
**Params:** `limit` (max 1000), `before` (market ID for pagination), `sort` (`created-time`, `updated-time`, `last-bet-time`), `order` (`asc`, `desc`)

**Response shape:**
```json
[
  {
    "id": "abc123",
    "question": "Will X happen?",
    "url": "https://manifold.markets/user/question-slug",
    "probability": 0.62,        // ← Already a number 0-1, no parsing needed
    "pool": { "YES": 5000, "NO": 3000 },
    "totalLiquidity": 8000,
    "volume": 25000,
    "volume24Hours": 1500,       // ← Has 24h volume natively
    "isResolved": false,
    "closeTime": 1700000000000,  // ← Milliseconds (not seconds like Polymarket)
    "createdTime": 1690000000000,
    "mechanism": "cpmm-1",
    "outcomeType": "BINARY",
    "creatorUsername": "user123",
    "creatorName": "John Doe"
  }
]
```

**GOTCHAS:**
- `probability` is already a float 0-1. No parsing needed.
- `closeTime` and `createdTime` are **milliseconds**, not seconds.
- Pagination: pass the last market's `id` as `before` param.
- Some markets are `FREE_RESPONSE` or `MULTIPLE_CHOICE` — filter for `BINARY` if you only want yes/no.

---

## 6. Cross-Platform Matching Strategy

To find the same question on multiple platforms:

1. Fetch all markets from Polymarket (Gamma API) and Kalshi
2. Normalize titles: lowercase, remove punctuation, strip common words ("will", "the", "be")
3. Use fuzzy matching (npm `string-similarity` or `fuse.js`) with threshold ~0.7
4. For matched pairs, compute spread: `|polymarket_yes_price - kalshi_yes_price|`
5. Store matches with both platform IDs for the Disagrees page

**Matching tips:**
- Polymarket titles are verbose ("Will Donald Trump win the 2024 US Presidential Election?")
- Kalshi titles are shorter ("Trump wins the 2024 presidential election")
- Strip "Will" prefix from Polymarket titles before matching
- Category can help filter: only match politics↔politics, crypto↔crypto

---

## 7. Unified Market Type Mapping

When transforming API responses into the frontend's `Market` type:

| Frontend Field | Polymarket Source | Kalshi Source | Manifold Source |
|---------------|-------------------|---------------|-----------------|
| id | `market.id` (condition ID) | `ticker` | `id` |
| title | `event.title` or `market.question` | `title` | `question` |
| category | `event.category` | `category` | infer from tags |
| probability | `parseFloat(JSON.parse(outcomePrices)[0])` | `parseFloat(yes_bid)` | `probability` |
| volume | `market.volume` (USD) | `dollar_volume` (USD) | `volume` (play money) |
| liquidity | `market.liquidity` | `open_interest * 100` (approx) | `totalLiquidity` |
| endDate | `market.endDate` | `close_time` | `new Date(closeTime)` |
| platform | `"polymarket"` | `"kalshi"` | `"manifold"` |
| url | `https://polymarket.com/event/${event.slug}` | `https://kalshi.com/markets/${ticker}` | market.url |

---

## 8. WebSocket Feeds (Optional, Day 7+)

### Polymarket WebSocket
`wss://ws-subscriptions-clob.polymarket.com/ws/market`

Subscribe message:
```json
{
  "auth": {},
  "type": "market",
  "assets_id": "token-id"
}
```

Receives real-time price updates as trades execute.

### Kalshi WebSocket
`wss://api.elections.kalshi.com/trade-api/ws/v2`

Subscribe to orderbook updates for specific tickers.

---

## 9. Rate Limit Strategy

Use this caching pattern in `lib/api.ts`:

```typescript
const cache = new Map<string, { data: any; timestamp: number }>();

async function cachedFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs: number): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data as T;
  }
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

// Usage:
// Markets: 60s cache
// Whales/Leaderboard: 300s cache
// Price history: 600s cache (or longer)
// Orderbook: 15s cache
```
