import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Markets | Quiver Markets",
  description: "Advanced prediction market screener. Filter markets by price, volume, category, platform, and resolution date.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
