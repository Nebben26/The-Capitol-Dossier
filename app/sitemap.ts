import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://quivermarkets.com").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticPages = [
    { url: "",             priority: 1.0, changeFrequency: "daily"   as const },
    { url: "/disagrees",   priority: 0.9, changeFrequency: "hourly"  as const },
    { url: "/whales",      priority: 0.9, changeFrequency: "daily"   as const },
    { url: "/indices",     priority: 0.9, changeFrequency: "hourly"  as const },
    { url: "/markets",     priority: 0.7, changeFrequency: "daily"   as const },
    { url: "/about",       priority: 0.6, changeFrequency: "monthly" as const },
    { url: "/methodology", priority: 0.6, changeFrequency: "monthly" as const },
    { url: "/blog",        priority: 0.6, changeFrequency: "weekly"  as const },
    { url: "/contact",     priority: 0.5, changeFrequency: "yearly"  as const },
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
