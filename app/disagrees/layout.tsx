import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cross-Platform Arbitrage",
  description:
    "Live arbitrage opportunities between Polymarket and Kalshi. Find spreads before they close. Updated every 30 minutes.",
  openGraph: {
    title: "Cross-Platform Arbitrage · Quiver Markets",
    description:
      "Live arbitrage opportunities between Polymarket and Kalshi. Find spreads before they close.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
