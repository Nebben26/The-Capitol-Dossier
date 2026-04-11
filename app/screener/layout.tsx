import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Market Screener",
  description: "Browse all 6,500+ prediction markets across Polymarket and Kalshi. Filter by category, volume, or price movement.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
