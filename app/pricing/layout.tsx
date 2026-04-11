import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Three tiers: Free forever, Pro at $49/mo, Trader at $149/mo. Intelligence layer for prediction markets.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
