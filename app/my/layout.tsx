import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Quiver",
  description:
    "Track your Polymarket portfolio with Quiver's intelligence layer applied to your real trades.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
