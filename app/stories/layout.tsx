import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stories",
  description: "Deep-dive market intelligence stories — whale moves, arbitrage plays, and resolution analysis.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
