import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import MarketDetailPage from "./market-detail-client";
import { marketById } from "@/lib/mockData";

const MOCK_IDS = [
  "recession-2026", "fed-rate-cut", "trump-2028", "btc-150k", "ai-agi",
  "china-taiwan", "spacex-mars", "student-debt", "nvidia-split", "eu-tariff",
  "apple-ai", "ufc-309", "pandemic-2026", "dem-nominee", "fed-hike",
  "uk-election", "eth-10k", "openai-ipo", "canada-election", "drought-2026",
  "nfl-mvp", "scotus-ruling", "iran-deal", "mars-life",
];

export async function generateStaticParams() {
  // Try to fetch all market IDs from Supabase at build time
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key && !url.includes("your-project")) {
      const sb = createClient(url, key);
      const { data, error } = await sb
        .from("markets")
        .select("id")
        .order("volume", { ascending: false })
        .limit(500);

      if (!error && data && data.length > 0) {
        // Merge Supabase IDs with mock IDs to ensure both work
        const ids = new Set([...data.map((r: { id: string }) => r.id), ...MOCK_IDS]);
        console.log(`[generateStaticParams] Markets: ${ids.size} pages (${data.length} from Supabase + ${MOCK_IDS.length} mock)`);
        return Array.from(ids).map((id) => ({ id }));
      }
    }
  } catch (err) {
    console.error("[generateStaticParams] Supabase fetch failed, using mock IDs:", err);
  }

  return MOCK_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const market = marketById[id];
  if (!market) {
    return {
      title: "Market | Quiver Markets",
      description: "Prediction market analytics and intelligence.",
    };
  }

  const title = `${market.question} | ${market.price}% | Quiver Markets`;
  const description = `${market.question} — Currently trading at ${market.price}¢ on ${market.platform}. ${market.volume} volume, ${market.traders.toLocaleString()} traders.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [{ url: "/og-image.svg", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.svg"],
    },
  };
}

export default function Page() {
  return <MarketDetailPage />;
}
