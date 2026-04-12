import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://quivermarkets.com").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticPages = [
    { url: "",             priority: 1.0, changeFrequency: "daily"   as const },
    { url: "/disagrees",   priority: 0.9, changeFrequency: "hourly"  as const },
    { url: "/whales",      priority: 0.9, changeFrequency: "daily"   as const },
    { url: "/screener",    priority: 0.9, changeFrequency: "hourly"  as const },
    { url: "/leaderboard", priority: 0.8, changeFrequency: "daily"   as const },
    { url: "/calendar",    priority: 0.8, changeFrequency: "daily"   as const },
    { url: "/compare",     priority: 0.7, changeFrequency: "weekly"  as const },
    { url: "/insights",    priority: 0.7, changeFrequency: "daily"   as const },
    { url: "/stories",     priority: 0.7, changeFrequency: "daily"   as const },
    { url: "/morning-brief", priority: 0.7, changeFrequency: "daily" as const },
    { url: "/pricing",     priority: 0.8, changeFrequency: "weekly"  as const },
    { url: "/about",       priority: 0.6, changeFrequency: "monthly" as const },
    { url: "/about-data",  priority: 0.6, changeFrequency: "monthly" as const },
    { url: "/methodology", priority: 0.6, changeFrequency: "monthly" as const },
    { url: "/blog",        priority: 0.6, changeFrequency: "weekly"  as const },
    { url: "/api-docs",    priority: 0.5, changeFrequency: "monthly" as const },
    { url: "/changelog",   priority: 0.4, changeFrequency: "weekly"  as const },
    { url: "/resolved",    priority: 0.4, changeFrequency: "daily"   as const },
    { url: "/terms",       priority: 0.3, changeFrequency: "yearly"  as const },
    { url: "/privacy",     priority: 0.3, changeFrequency: "yearly"  as const },
    { url: "/refunds",     priority: 0.3, changeFrequency: "yearly"  as const },
    { url: "/cookies",     priority: 0.3, changeFrequency: "yearly"  as const },
    { url: "/dmca",        priority: 0.3, changeFrequency: "yearly"  as const },
  ];

  return staticPages.map((page) => ({
    url: `${SITE_URL}${page.url}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
