import MarketDetailPage from "./market-detail-client";

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

export default function Page() {
  return <MarketDetailPage />;
}
