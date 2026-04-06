import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quiver Markets — Prediction Market Intelligence",
  description: "Real-time prediction market analytics, whale tracking, and cross-platform arbitrage detection. Track the smartest money in prediction markets.",
  metadataBase: new URL("https://amazing-kitsune-139d51.netlify.app"),
  openGraph: {
    title: "Quiver Markets — Prediction Market Intelligence",
    description: "Real-time prediction market analytics, whale tracking, and cross-platform arbitrage detection.",
    siteName: "Quiver Markets",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Quiver Markets — Prediction Market Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quiver Markets — Prediction Market Intelligence",
    description: "Real-time prediction market analytics, whale tracking, and cross-platform arbitrage detection.",
    creator: "@quivermarkets",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#1a1e2e] text-[#e2e8f0]">
        <TooltipProvider>
          <AppShell>{children}</AppShell>
        </TooltipProvider>
      </body>
    </html>
  );
}
