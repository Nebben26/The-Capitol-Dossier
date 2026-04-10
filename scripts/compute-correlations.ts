import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) { console.error("Missing env"); process.exit(1); }
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Returns-based Pearson: computes correlation on price DIFFERENCES (changes between
// adjacent points), not raw price levels. This is the standard approach in quant finance
// and removes spurious correlations from co-drift.
function pearsonOfReturns(xs: number[], ys: number[]): number {
  if (xs.length < 3) return 0;
  const dx: number[] = [];
  const dy: number[] = [];
  for (let i = 1; i < xs.length; i++) {
    dx.push(xs[i] - xs[i - 1]);
    dy.push(ys[i] - ys[i - 1]);
  }
  const n = dx.length;
  const mX = dx.reduce((a, b) => a + b, 0) / n;
  const mY = dy.reduce((a, b) => a + b, 0) / n;
  let num = 0, dX = 0, dY = 0;
  for (let i = 0; i < n; i++) {
    const ex = dx[i] - mX;
    const ey = dy[i] - mY;
    num += ex * ey;
    dX += ex * ex;
    dY += ey * ey;
  }
  const den = Math.sqrt(dX * dY);
  return den === 0 ? 0 : num / den;
}

function stdev(arr: number[]): number {
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) * (b - m), 0) / arr.length);
}

// Bonferroni-adjusted critical value for Pearson correlation.
// Given n observations and m comparisons, returns the |r| threshold for p < alpha.
function bonferroniCritical(n: number, m: number, alpha: number = 0.05): number {
  if (n < 4) return 1;
  const adjusted = alpha / m;
  // Approximate Fisher z critical value using inverse normal
  // For p/2 two-tailed, we want z such that P(Z > z) = p/2
  const p = adjusted / 2;
  // Abramowitz-Stegun rational approximation for inverse normal
  const c0 = 2.515517, c1 = 0.802853, c2 = 0.010328;
  const d1 = 1.432788, d2 = 0.189269, d3 = 0.001308;
  const t = Math.sqrt(-2 * Math.log(p));
  const z = t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
  // Convert z to r via inverse Fisher transformation
  const se = 1 / Math.sqrt(n - 3);
  const zCrit = z * se;
  return (Math.exp(2 * zCrit) - 1) / (Math.exp(2 * zCrit) + 1);
}

function alignSeries(
  a: { t: number; p: number }[],
  b: { t: number; p: number }[]
): { xs: number[]; ys: number[]; ts: number[] } {
  const tsSet = new Set<number>();
  for (const pt of a) tsSet.add(pt.t);
  for (const pt of b) tsSet.add(pt.t);
  const timestamps = Array.from(tsSet).sort((x, y) => x - y);
  const xs: number[] = [];
  const ys: number[] = [];
  const ts: number[] = [];
  for (const t of timestamps) {
    let pa: number | null = null;
    for (let i = a.length - 1; i >= 0; i--) if (a[i].t <= t) { pa = a[i].p; break; }
    let pb: number | null = null;
    for (let i = b.length - 1; i >= 0; i--) if (b[i].t <= t) { pb = b[i].p; break; }
    if (pa === null || pb === null) continue;
    xs.push(pa);
    ys.push(pb);
    ts.push(t);
  }
  return { xs, ys, ts };
}

// Category compatibility: which pairs are meaningful enough to even compute.
// Same-category is always allowed. Cross-category only for plausibly related pairs.
const ALLOWED_CROSS: Record<string, string[]> = {
  "Elections": ["Geopolitics", "Economics", "Culture"],
  "Geopolitics": ["Elections", "Economics", "Crypto"],
  "Economics": ["Elections", "Geopolitics", "Crypto", "Climate"],
  "Crypto": ["Economics", "Geopolitics", "Tech"],
  "Climate": ["Economics", "Science"],
  "Tech": ["Crypto", "Science"],
  "Science": ["Climate", "Tech"],
  "Culture": ["Elections"],
};

function categoriesCompatible(catA: string, catB: string): boolean {
  if (catA === catB) return true;
  const allowed = ALLOWED_CROSS[catA];
  return allowed ? allowed.includes(catB) : false;
}

async function main() {
  console.log("\n=== Quiver Markets - Correlation Computation (returns-based) ===");

  console.log("\n=== Fetching top 500 non-sports markets with price history ===");
  const { data: markets, error: marketsErr } = await supabase.rpc(
    "get_top_markets_with_history",
    { limit_count: 500 }
  );
  if (marketsErr || !markets?.length) {
    console.error("Failed to fetch markets:", marketsErr?.message);
    process.exit(1);
  }
  console.log(`Loaded ${markets.length} markets`);

  console.log("\n=== Fetching 14-day price history ===");
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const historyMap = new Map<string, { t: number; p: number }[]>();
  for (let i = 0; i < markets.length; i++) {
    const m = markets[i];
    const { data: pts } = await supabase
      .from("price_history")
      .select("timestamp, price")
      .eq("market_id", m.id)
      .gte("timestamp", since)
      .order("timestamp", { ascending: true });
    if (pts?.length) {
      historyMap.set(m.id, pts.map((pt: any) => ({
        t: new Date(pt.timestamp).getTime(), p: Number(pt.price)
      })));
    }
    if ((i + 1) % 100 === 0) console.log(`Fetched history for ${i + 1}/${markets.length}`);
  }

  const withData = markets.filter((m: any) => historyMap.has(m.id));
  console.log(`${withData.length} markets have price data in window`);

  console.log("\n=== Computing returns-based correlations ===");
  const results: {
    market_a_id: string; market_b_id: string;
    correlation: number; sample_size: number;
  }[] = [];

  let totalPairs = 0;
  let passedCategory = 0;
  let passedPoints = 0;
  let passedStdev = 0;
  let passedSignificance = 0;
  let stored = 0;

  const MIN_POINTS = 30;
  const MIN_STDEV = 0.02;

  // First pass: count compatible pairs to set Bonferroni m
  let compatibleCount = 0;
  for (let i = 0; i < withData.length; i++) {
    for (let j = i + 1; j < withData.length; j++) {
      if (categoriesCompatible(withData[i].category, withData[j].category)) compatibleCount++;
    }
  }
  console.log(`${compatibleCount} category-compatible pairs to test`);

  for (let i = 0; i < withData.length; i++) {
    for (let j = i + 1; j < withData.length; j++) {
      const a = withData[i];
      const b = withData[j];
      totalPairs++;

      if (!categoriesCompatible(a.category, b.category)) continue;
      passedCategory++;

      const [aId, bId] = a.id < b.id ? [a.id, b.id] : [b.id, a.id];
      const sA = historyMap.get(aId)!;
      const sB = historyMap.get(bId)!;

      const { xs, ys } = alignSeries(sA, sB);
      if (xs.length < MIN_POINTS) continue;
      passedPoints++;

      if (stdev(xs) < MIN_STDEV || stdev(ys) < MIN_STDEV) continue;
      passedStdev++;

      const r = pearsonOfReturns(xs, ys);
      const critical = bonferroniCritical(xs.length - 1, compatibleCount, 0.05);
      if (Math.abs(r) < critical) continue;
      passedSignificance++;

      results.push({
        market_a_id: aId, market_b_id: bId,
        correlation: Number(r.toFixed(4)), sample_size: xs.length,
      });
      stored++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Total pairs considered: ${totalPairs}`);
  console.log(`Passed category compatibility: ${passedCategory}`);
  console.log(`Passed >=${MIN_POINTS} points: ${passedPoints}`);
  console.log(`Passed stddev filter: ${passedStdev}`);
  console.log(`Passed Bonferroni significance: ${passedSignificance}`);
  console.log(`Stored: ${stored}`);

  const qMap = new Map(withData.map((m: any) => [m.id, { q: m.question, c: m.category }]));
  const sorted = [...results].sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  const topPos = sorted.filter(r => r.correlation > 0).slice(0, 10);
  const topNeg = sorted.filter(r => r.correlation < 0).slice(0, 10);

  console.log("\nTop 10 positive (returns-based, Bonferroni-significant):");
  for (const r of topPos) {
    const ea = qMap.get(r.market_a_id) as any;
    const eb = qMap.get(r.market_b_id) as any;
    const qa = ea?.q ?? r.market_a_id;
    const qb = eb?.q ?? r.market_b_id;
    const ca = ea?.c ?? "?";
    const cb = eb?.c ?? "?";
    console.log(`  +${r.correlation.toFixed(4)}  n=${r.sample_size}  [${ca}/${cb}]  "${qa.slice(0, 50)}" <-> "${qb.slice(0, 50)}"`);
  }

  console.log("\nTop 10 negative:");
  for (const r of topNeg) {
    const ea = qMap.get(r.market_a_id) as any;
    const eb = qMap.get(r.market_b_id) as any;
    const qa = ea?.q ?? r.market_a_id;
    const qb = eb?.q ?? r.market_b_id;
    const ca = ea?.c ?? "?";
    const cb = eb?.c ?? "?";
    console.log(`  ${r.correlation.toFixed(4)}  n=${r.sample_size}  [${ca}/${cb}]  "${qa.slice(0, 50)}" <-> "${qb.slice(0, 50)}"`);
  }

  console.log("\n=== Writing to Supabase ===");
  const { error: delErr } = await supabase.from("correlations").delete().gte("id", 0);
  if (delErr) { console.error("Failed to clear:", delErr.message); process.exit(1); }
  console.log("Cleared existing correlations");

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < results.length; i += BATCH) {
    const chunk = results.slice(i, i + BATCH);
    const { error } = await supabase
      .from("correlations")
      .upsert(chunk, { onConflict: "market_a_id,market_b_id" });
    if (error) console.error(`  Upsert error (batch ${i}):`, error.message);
    else inserted += chunk.length;
  }
  console.log(`Upserted ${inserted}/${results.length}`);
  console.log("\nCorrelations computed");
}

main().catch((err) => { console.error(err); process.exit(1); });
