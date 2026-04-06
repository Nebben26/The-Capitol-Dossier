import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Insights | Quiver Markets",
  description: "Market-moving news and catalysts for prediction markets. Track events that impact probabilities across platforms.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
