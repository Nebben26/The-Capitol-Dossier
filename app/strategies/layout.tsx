import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Strategies | Quiver Markets",
  description: "Curated prediction market trading strategies with backtested returns. Whale shadow, dip hunter, election alpha, and more.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
