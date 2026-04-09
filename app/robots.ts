import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/watchlist", "/calibration"],
    },
    sitemap: "https://amazing-kitsune-139d51.netlify.app/sitemap.xml",
  };
}
