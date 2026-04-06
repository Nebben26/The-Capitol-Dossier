import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import MarketDetailPage from "./market-detail-client";

export async function generateStaticParams() {
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
        console.log(`[generateStaticParams] Markets: ${data.length} pages from Supabase (zero mock)`);
        return data.map((r: { id: string }) => ({ id: r.id }));
      }
    }
  } catch (err) {
    console.error("[generateStaticParams] Supabase fetch failed:", err);
  }
  // If Supabase fails, return empty — no mock slugs
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Market | Quiver Markets`,
    description: "Prediction market analytics and intelligence.",
    openGraph: { title: "Market | Quiver Markets", type: "article", images: [{ url: "/og-image.svg", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: "Market | Quiver Markets", images: ["/og-image.svg"] },
  };
}

export default function Page() {
  return <MarketDetailPage />;
}
