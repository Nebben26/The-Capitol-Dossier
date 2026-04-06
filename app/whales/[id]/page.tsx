import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import WhaleProfilePage from "./whale-profile-client";
import { whaleById } from "@/lib/mockData";

const MOCK_IDS = ["w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8", "w9", "w10", "w11", "w12", "w13", "w14", "w15"];

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
        const ids = new Set([...data.map((r: { address: string }) => r.address), ...MOCK_IDS]);
        console.log(`[generateStaticParams] Whales: ${ids.size} pages (${data.length} from Supabase + ${MOCK_IDS.length} mock)`);
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
  const whale = whaleById[id];
  if (!whale) {
    return {
      title: "Whale Profile | Quiver Markets",
      description: "Prediction market whale trader profile and analytics.",
    };
  }

  const title = `${whale.name} | Rank #${whale.rank} | Quiver Markets`;
  const description = `${whale.name} — ${whale.totalPnl} lifetime P&L, ${whale.accuracy}% accuracy, ${whale.totalTrades} trades.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile", images: [{ url: "/og-image.svg", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-image.svg"] },
  };
}

export default function Page() {
  return <WhaleProfilePage />;
}
