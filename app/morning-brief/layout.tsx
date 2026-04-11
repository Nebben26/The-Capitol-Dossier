import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Morning Brief",
  description: "Your daily prediction market intelligence digest — movers, arbitrage, and whale signals.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
