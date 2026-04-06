import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard | Quiver Markets",
  description: "Top prediction market traders ranked by P&L, accuracy, and calibration. Track the smartest money in the market.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
