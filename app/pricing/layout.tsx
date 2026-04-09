import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Quiver Markets",
  description: "Three tiers: Free forever, Pro at $60/mo, Enterprise at $500/mo. Intelligence layer for prediction markets.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
