import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { ShortcutsDrawer } from "@/components/ui/shortcuts-drawer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#57D7BA",
};

export const metadata: Metadata = {
  title: {
    default: "Quiver Markets — Prediction Market Intelligence",
    template: "%s · Quiver Markets",
  },
  description: "Track whale positions, cross-platform arbitrage, and smart money moves on Polymarket and Kalshi.",
  metadataBase: new URL("https://amazing-kitsune-139d51.netlify.app"),
  openGraph: {
    title: "Quiver Markets — Prediction Market Intelligence",
    description: "Real-time prediction market analytics, whale tracking, and cross-platform arbitrage detection.",
    siteName: "Quiver Markets",
    type: "website",
    locale: "en_US",
    images: [{ url: "/og-image", width: 1200, height: 630, alt: "Quiver Markets — Prediction Market Intelligence" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quiver Markets — Prediction Market Intelligence",
    description: "Real-time prediction market analytics, whale tracking, and cross-platform arbitrage detection.",
    creator: "@quivermarkets",
    images: ["/og-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
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
      <body className="min-h-full flex flex-col bg-[#0d1117] text-[#e2e8f0]">
        <NextTopLoader
          color="#57D7BA"
          initialPosition={0.08}
          crawlSpeed={200}
          height={2}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #57D7BA,0 0 5px #57D7BA"
        />
        <TooltipProvider>
          <AppShell>{children}</AppShell>
          <ShortcutsDrawer />
        </TooltipProvider>

        {/* Schema.org Organization structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Quiver Markets",
              "url": "https://amazing-kitsune-139d51.netlify.app",
              "description": "The intelligence layer for prediction markets",
              "sameAs": ["https://twitter.com/quivermarkets"],
            }),
          }}
        />

        {/* Cloudflare Web Analytics — privacy-first, no cookies */}
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="afterInteractive"
          data-cf-beacon='{"token": "37b115799bea4e308abd23bafe3c2955"}'
        />
      </body>
    </html>
  );
}
