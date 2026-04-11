import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Money Signals",
  description: "Real-time smart money signals — whale consensus, concentration, and position spikes detected across 200+ tracked wallets.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
