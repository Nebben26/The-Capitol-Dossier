Test that all prediction market APIs are reachable and returning expected data shapes.

Run these curl commands and verify responses:

1. Polymarket Gamma API:
```bash
curl -s "https://gamma-api.polymarket.com/events?active=true&closed=false&limit=1" | head -c 500
```
Verify: Returns JSON array with events containing nested `markets` array. Check that `outcomePrices` is a JSON string (has escaped quotes).

2. Polymarket CLOB API:
```bash
curl -s "https://clob.polymarket.com/midpoint?token_id=21742633143463906290569050155826241533067272736897614950488156847949938836455" | head -c 200
```
Verify: Returns JSON with `mid` field as string.

3. Polymarket Data API:
```bash
curl -s "https://data-api.polymarket.com/trades?limit=3" | head -c 500
```
Verify: Returns JSON array of trade objects with `size`, `price`, `side` fields.

4. Kalshi API:
```bash
curl -s "https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=1" | head -c 500
```
Verify: Returns JSON with `markets` array and `cursor` field.

5. Manifold API:
```bash
curl -s "https://api.manifold.markets/v0/markets?limit=1" | head -c 500
```
Verify: Returns JSON array with `probability` as a number.

Report which APIs are working and which are down. If any are down, note that the code must handle this gracefully with mock fallback.
