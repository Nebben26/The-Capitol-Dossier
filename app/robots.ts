import type { MetadataRoute } from "next";

// TODO: update to custom domain when purchased
const SITE_URL = "https://quivermarkets.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/debug/",
          "/settings",
          "/watchlist",
          "/monitoring-tunnel",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
