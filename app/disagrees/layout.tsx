import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cross-Platform Arbitrage — Quiver Markets",
  description: "Live cross-platform arbitrage opportunities. See where Polymarket and Kalshi disagree on the same question.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
