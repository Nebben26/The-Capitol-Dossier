import type { Market } from "@/lib/mockData";

/**
 * Returns up to `limit` markets related to `market`, excluding itself.
 * Strategy (in order):
 *   1. Same category, sorted by overlap in question keywords
 *   2. Same platform
 *   3. Fallback: highest-volume markets
 */
export function getRelatedMarkets(
  market: Market,
  allMarkets: Market[],
  limit = 5
): Market[] {
  const id = market.id;
  const cat = market.category;

  // Tokenise the question into significant words (4+ chars, lowercase)
  const tokens = market.question
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length >= 4);

  function score(m: Market): number {
    let s = 0;
    if (m.category === cat) s += 10;
    if (m.platform === market.platform) s += 2;
    const mTokens = m.question.toLowerCase().split(/\W+/);
    for (const tok of tokens) {
      if (mTokens.includes(tok)) s += 3;
    }
    return s;
  }

  return allMarkets
    .filter((m) => m.id !== id)
    .map((m) => ({ m, s: score(m) }))
    .sort((a, b) => b.s - a.s || b.m.volNum - a.m.volNum)
    .slice(0, limit)
    .map(({ m }) => m);
}
