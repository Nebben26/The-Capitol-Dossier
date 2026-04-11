import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Quiver Markets is the intelligence layer for prediction markets — independent, data-driven, built for traders.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
