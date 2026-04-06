import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import WhaleProfilePage from "./whale-profile-client";

export async function generateStaticParams() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key && !url.includes("your-project")) {
      const sb = createClient(url, key);
      const { data, error } = await sb
        .from("whales")
        .select("address")
        .order("total_pnl", { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        console.log(`[generateStaticParams] Whales: ${data.length} pages from Supabase (zero mock)`);
        return data.map((r: { address: string }) => ({ id: r.address }));
      }
    }
  } catch (err) {
    console.error("[generateStaticParams] Supabase fetch failed:", err);
  }
  return [];
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Whale Profile | Quiver Markets",
    description: "Prediction market whale trader profile and analytics.",
    openGraph: { title: "Whale Profile | Quiver Markets", type: "profile", images: [{ url: "/og-image.svg", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: "Whale Profile | Quiver Markets", images: ["/og-image.svg"] },
  };
}

export default function Page() {
  return <WhaleProfilePage />;
}
