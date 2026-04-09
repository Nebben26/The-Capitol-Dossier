import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Money Flow — Quiver Markets",
  description: "Where the smart money is flowing today. Aggregated whale capital across prediction market categories.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
