import type { Metadata } from "next";
import WhaleProfilePage from "./whale-profile-client";
import { whaleById } from "@/lib/mockData";

export function generateStaticParams() {
  return [
    { id: "w1" }, { id: "w2" }, { id: "w3" }, { id: "w4" }, { id: "w5" },
    { id: "w6" }, { id: "w7" }, { id: "w8" }, { id: "w9" }, { id: "w10" },
    { id: "w11" }, { id: "w12" }, { id: "w13" }, { id: "w14" }, { id: "w15" },
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const whale = whaleById[id];
  if (!whale) {
    return {
      title: "Whale Profile | Quiver Markets",
      description: "Prediction market whale trader profile.",
    };
  }

  const title = `${whale.name} | Rank #${whale.rank} | Quiver Markets`;
  const description = `${whale.name} — ${whale.totalPnl} lifetime P&L, ${whale.accuracy}% accuracy, ${whale.totalTrades} trades. ${whale.bio}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
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
  return <WhaleProfilePage />;
}
