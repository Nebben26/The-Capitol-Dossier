import type { Metadata } from "next";
import MarketDetailPage from "./market-detail-client";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  void id;
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
