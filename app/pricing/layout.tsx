import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Five tiers: Free forever, Pro at $49/mo, Trader at $149/mo, Signal Desk at $199/mo, Quant API at $399/mo. Intelligence layer for prediction markets.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
