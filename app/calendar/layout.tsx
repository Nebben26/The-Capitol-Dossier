import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalyst Calendar",
  description: "Upcoming market-resolving events ranked by volume, spread, and trader activity.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
