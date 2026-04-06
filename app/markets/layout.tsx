import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Markets | Quiver Markets",
  description: "Browse prediction markets from Polymarket and Kalshi. Filter by category, sort by volume or price, and discover trading opportunities.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
