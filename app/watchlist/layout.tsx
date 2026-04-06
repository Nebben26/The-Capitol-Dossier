import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watchlist | Quiver Markets",
  description: "Your personalized prediction market watchlist. Track markets and whales you care about.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
