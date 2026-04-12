import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { ShortcutsDrawer } from "@/components/ui/shortcuts-drawer";
import { PostHogProvider } from "@/components/analytics/posthog-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// Update SITE_URL when custom domain is purchased
const SITE_URL = "https://quivermarkets.com";
const SITE_NAME = "Quiver Markets";
const SITE_DESCRIPTION =
  "The intelligence layer for prediction markets. Cross-platform arbitrage, whale tracking, and live signals from Polymarket and Kalshi.";

export const viewport: Viewport = {
  themeColor: "#57D7BA",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "prediction markets",
    "polymarket",
    "kalshi",
    "arbitrage",
    "whale tracking",
    "prediction market analytics",
    "polymarket alerts",
    "kalshi alerts",
    "cross-platform spreads",
    "market intelligence",
  ],
  authors: [{ name: "Quiver Markets" }],
  creator: "Quiver Markets",
  publisher: "Quiver Markets",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Prediction market intelligence`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    // Update @quivermarkets when the account is created
    creator: "@quivermarkets",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
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
          <PostHogProvider>
            <AppShell>{children}</AppShell>
            <ShortcutsDrawer />
          </PostHogProvider>
        </TooltipProvider>

        {/* Schema.org structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Quiver Markets",
              url: "https://quivermarkets.com",
              logo: "https://quivermarkets.com/icon.svg",
              description: "The intelligence layer for prediction markets.",
              foundingDate: "2026",
              founders: [{ "@type": "Person", name: "Ben Horch" }],
              sameAs: [], // add social URLs when accounts exist
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Quiver Markets",
              url: "https://quivermarkets.com",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://quivermarkets.com/screener?search={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Quiver Markets",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                description:
                  "Free tier with paid Pro and Trader plans available",
              },
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
