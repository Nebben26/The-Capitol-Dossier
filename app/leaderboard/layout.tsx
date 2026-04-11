import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Whale Leaderboard",
  description:
    "The most accurate prediction market traders ranked by historical settlement accuracy and total P&L.",
  openGraph: {
    title: "Whale Leaderboard · Quiver Markets",
    description:
      "The most accurate prediction market traders ranked by historical settlement accuracy and total P&L.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
