import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Whale Tracker",
  description: "Track the biggest prediction market whales. Real-time P&L, accuracy scores, and position tracking from Polymarket.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
