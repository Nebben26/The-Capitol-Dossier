import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Money Watch",
  description: "Smart Money Watch — track a custom portfolio of top whale positions in real time.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
