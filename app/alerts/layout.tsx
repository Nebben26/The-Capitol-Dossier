import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Signals | Quiver Markets",
  description: "Real-time whale alerts, price movers, volume spikes, and market resolutions. Never miss a signal in prediction markets.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
