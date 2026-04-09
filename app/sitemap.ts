import { MetadataRoute } from "next";

const BASE = "https://amazing-kitsune-139d51.netlify.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    "", "/screener", "/disagrees", "/alerts", "/flow", "/leaderboard",
    "/copy", "/watchlist", "/calibration", "/insights", "/api-docs",
    "/pricing", "/about", "/roadmap", "/contact", "/status", "/changelog",
    "/privacy", "/terms",
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1.0 : 0.8,
  }));

  try {
    const { getAllMarkets } = await import("@/lib/api");
    const { data: markets } = await getAllMarkets();
    const marketPages = markets.slice(0, 5000).map((m) => ({
      url: `${BASE}/markets/${m.id}`,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 0.6,
    }));
    return [...staticPages, ...marketPages];
  } catch {
    return staticPages;
  }
}
