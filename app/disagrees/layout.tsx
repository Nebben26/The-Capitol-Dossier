import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Market Disagrees | Quiver Markets",
  description: "Cross-platform arbitrage scanner. Find where Polymarket and Kalshi disagree on the same question and capture the spread.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
