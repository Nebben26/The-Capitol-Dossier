import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Market Stories",
  description:
    "In-depth analysis and narrative breakdowns of the most interesting prediction market opportunities.",
  openGraph: {
    title: "Market Stories · Quiver Markets",
    description:
      "In-depth analysis and narrative breakdowns of the most interesting prediction market opportunities.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
