import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Quiver Markets",
  description: "Quiver Markets pricing plans. Free tier with core analytics, Pro tier with whale tracking, alerts, and advanced screeners.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
