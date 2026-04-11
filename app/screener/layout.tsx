import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Market Screener",
  description:
    "Filter and search 6,500+ live prediction markets across Polymarket and Kalshi. Sort by volume, change, spread, or resolution date.",
  openGraph: {
    title: "Market Screener · Quiver Markets",
    description:
      "Filter and search 6,500+ live prediction markets across Polymarket and Kalshi.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
