import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calibration",
  description: "Test your prediction calibration with Brier scores. Compare your forecasting accuracy to top whale traders.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
