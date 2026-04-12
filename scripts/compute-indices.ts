import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface IndexDef {
  slug: string;
  name: string;
  category: string;
  /** How to compute value from markets */
  compute: (markets: { price: number; volume: number }[]) => number;
}

// ─── Index definitions ─────────────────────────────────────────────────────

function volumeWeightedMean(markets: { price: number; volume: number }[]): number {
  if (!markets.length) return 50;
  const totalVol = markets.reduce((s, m) => s + m.volume, 0);
  if (totalVol === 0) {
    // Equal-weight fallback
    return markets.reduce((s, m) => s + m.price, 0) / markets.length;
  }
  return markets.reduce((s, m) => s + m.price * m.volume, 0) / totalVol;
}

const INDEX_DEFS: IndexDef[] = [
  {
    slug: "election-confidence",
    name: "Quiver Election Confidence Index",
    category: "Elections",
    compute(markets) {
      // |price - 50| * 2 measures "decisiveness". 90¢ market → 80pt, 50¢ market → 0pt.
      if (!markets.length) return 50;
      const totalVol = markets.reduce((s, m) => s + m.volume, 0);
      if (totalVol === 0) {
        const mean = markets.reduce((s, m) => s + Math.abs(m.price - 50) * 2, 0) / markets.length;
        return Math.round(Math.min(100, Math.max(0, mean)));
      }
      const weighted = markets.reduce((s, m) => s + Math.abs(m.price - 50) * 2 * m.volume, 0) / totalVol;
      return Math.round(Math.min(100, Math.max(0, weighted)));
    },
  },
  {
    slug: "crypto-sentiment",
    name: "Quiver Crypto Sentiment Index",
    category: "Crypto",
    compute(markets) {
      return Math.round(Math.min(100, Math.max(0, volumeWeightedMean(markets))));
    },
  },
  {
    slug: "geopolitical-risk",
    name: "Quiver Geopolitical Risk Index",
    category: "Geopolitics",
    compute(markets) {
      return Math.round(Math.min(100, Math.max(0, volumeWeightedMean(markets))));
    },
  },
  {
    slug: "economic-outlook",
    name: "Quiver Economic Outlook Index",
    category: "Economics",
    // Inverted: high raw price = high recession/inflation probability = lower outlook
    compute(markets) {
      const raw = volumeWeightedMean(markets);
      return Math.round(Math.min(100, Math.max(0, 100 - raw)));
    },
  },
];

// ─── Fetch 24h-ago value from history ─────────────────────────────────────
async function get24hAgoValue(slug: string): Promise<number | null> {
  const since = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(); // 25h ago window
  const until = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(); // 23h ago window
  const { data } = await supabase
    .from("quiver_index_history")
    .select("value")
    .eq("index_slug", slug)
    .gte("recorded_at", since)
    .lte("recorded_at", until)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? Number(data.value) : null;
}

// ─── Main ──────────────────────────────────────────────────────────────────
export async function computeIndices(): Promise<void> {
  console.log("\n=== Computing Quiver Indices ===");

  // Fetch all non-resolved markets with price + volume
  const { data: allMarkets, error: mErr } = await supabase
    .from("markets")
    .select("id, category, price, volume")
    .eq("resolved", false)
    .not("price", "is", null);

  if (mErr) {
    console.error("  Failed to fetch markets:", mErr.message);
    return;
  }

  const markets = (allMarkets ?? []).map((m) => ({
    id: m.id as string,
    category: (m.category ?? "Other") as string,
    price: Number(m.price ?? 0),
    volume: Number(m.volume ?? 0),
  }));

  for (const def of INDEX_DEFS) {
    try {
      const catMarkets = markets.filter(
        (m) => m.category.toLowerCase() === def.category.toLowerCase()
      );

      const value = catMarkets.length > 0 ? def.compute(catMarkets) : 50;

      // Get previous value for 24h change
      const prev24h = await get24hAgoValue(def.slug);

      // Fetch current stored value for previous_value field
      const { data: existing } = await supabase
        .from("quiver_indices")
        .select("current_value")
        .eq("slug", def.slug)
        .maybeSingle();

      const previousValue = existing ? Number(existing.current_value) : null;
      const change24h = prev24h != null ? Number((value - prev24h).toFixed(2)) : null;

      // Upsert index record
      const { error: uErr } = await supabase
        .from("quiver_indices")
        .upsert(
          {
            slug: def.slug,
            name: def.name,
            description: "",  // Preserved from migration seed
            category: def.category,
            current_value: value,
            previous_value: previousValue,
            change_24h: change24h,
            component_count: catMarkets.length,
            methodology: "",  // Preserved from migration seed
            updated_at: new Date().toISOString(),
          },
          { onConflict: "slug", ignoreDuplicates: false }
        );

      if (uErr) {
        console.error(`  Upsert error for ${def.slug}:`, uErr.message);
        continue;
      }

      // Append to history
      const { error: hErr } = await supabase
        .from("quiver_index_history")
        .insert({ index_slug: def.slug, value });

      if (hErr) {
        console.warn(`  History insert warning for ${def.slug}:`, hErr.message);
      }

      const changeStr = change24h != null
        ? ` (${change24h >= 0 ? "+" : ""}${change24h} 24h)`
        : "";
      console.log(`  ${def.slug}: ${value}${changeStr} · ${catMarkets.length} components`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  Error computing ${def.slug}:`, msg);
    }
  }

  console.log("  ✓ Indices computed");
}

// ─── Standalone entry point ────────────────────────────────────────────────
if (require.main === module) {
  computeIndices()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}
