import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Markets",
  description: "Side-by-side market comparison with 14-day price chart and key stats.",
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
