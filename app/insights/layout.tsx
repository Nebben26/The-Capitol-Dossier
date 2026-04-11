import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Market Insights",
  description:
    "News, catalyst analysis, and AI-generated intelligence for Polymarket and Kalshi prediction markets.",
  openGraph: {
    title: "Market Insights · Quiver Markets",
    description:
      "News, catalyst analysis, and AI-generated intelligence for Polymarket and Kalshi prediction markets.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
