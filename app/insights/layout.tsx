import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News Catalysts",
  description: "The latest news moving prediction markets — curated from Bloomberg, Reuters, AP, and more.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
