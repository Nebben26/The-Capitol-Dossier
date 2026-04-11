import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalyst Calendar",
  description:
    "Upcoming prediction market resolution events. Track which markets are about to close and what is driving them.",
  openGraph: {
    title: "Catalyst Calendar · Quiver Markets",
    description:
      "Upcoming prediction market resolution events. Track which markets are about to close.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
