import type { Metadata } from "next";
import MarketDetailPage from "./market-detail-client";
import { marketById } from "@/lib/mockData";

export function generateStaticParams() {
  return [
    { id: "recession-2026" }, { id: "fed-rate-cut" }, { id: "trump-2028" },
    { id: "btc-150k" }, { id: "ai-agi" }, { id: "china-taiwan" },
    { id: "spacex-mars" }, { id: "student-debt" }, { id: "nvidia-split" },
    { id: "eu-tariff" }, { id: "apple-ai" }, { id: "ufc-309" },
    { id: "pandemic-2026" }, { id: "dem-nominee" },
    { id: "fed-hike" }, { id: "uk-election" }, { id: "eth-10k" },
    { id: "openai-ipo" }, { id: "canada-election" }, { id: "drought-2026" },
    { id: "nfl-mvp" }, { id: "scotus-ruling" }, { id: "iran-deal" }, { id: "mars-life" },
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const market = marketById[id];
  if (!market) {
    return {
      title: "Market Not Found | Quiver Markets",
      description: "This prediction market could not be found.",
    };
  }

  const title = `${market.question} | ${market.price}% | Quiver Markets`;
  const description = `${market.question} — Currently trading at ${market.price}¢ on ${market.platform}. ${market.volume} volume, ${market.traders.toLocaleString()} traders. ${market.desc}`;

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
