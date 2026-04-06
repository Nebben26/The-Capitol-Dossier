# Coding Rules

## Error Handling
- Every `fetch()` call must be in a try-catch
- Every catch block must fall back to mock data, never throw to the UI
- Log errors to console.error with context: `console.error('[getAllMarkets] Gamma API failed:', error)`

## Data Transformation
- Always validate API responses before transforming (check for expected fields)
- Use optional chaining for nested fields: `event?.markets?.[0]?.outcomePrices`
- Parse JSON strings defensively: `try { JSON.parse(field) } catch { return defaultValue }`
- Convert all prices to numbers immediately at the API boundary, not in components

## Caching
- Use the `cachedFetch` pattern from API_REFERENCE.md
- Cache keys should be descriptive: `"polymarket-markets"`, `"kalshi-markets"`, `"whale-trades-${address}"`
- Never cache errors — only cache successful responses

## Performance
- Paginate API calls with reasonable limits (100-200 per page)
- Stop paginating after 1000 results total to avoid hammering APIs
- Use Promise.all for independent parallel fetches (e.g., Polymarket + Kalshi simultaneously)
- Never fetch in a loop without batching

## Types
- Do not create new type files — extend existing types in `lib/mockData.ts`
- Add new optional fields (with `?`) to preserve backward compatibility
- Never change a required field to optional or vice versa without updating all consumers

## Testing
- After every change, run `npm run build`
- If build fails, fix the error before moving on
- Check browser console for runtime errors after testing a page

## Git
- Commit after each successful day's work with message: `feat: day N - [what was added]`
- Do not commit broken builds
