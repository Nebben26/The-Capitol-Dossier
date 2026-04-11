import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Whale Tracker",
  description:
    "Track the most accurate prediction market traders. Live position data, historical accuracy, and Brier scores for 200+ wallets.",
  openGraph: {
    title: "Whale Tracker · Quiver Markets",
    description:
      "Track the most accurate prediction market traders. Live position data and historical accuracy for 200+ wallets.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
