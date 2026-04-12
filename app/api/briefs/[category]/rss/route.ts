import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://quivermarkets.com";

function escXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category: rawCategory } = await params;
  const category = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("market_briefs")
    .select("slug, category, title, brief_markdown, generated_at, source_market_count, word_count")
    .eq("category", category)
    .order("generated_at", { ascending: false })
    .limit(30);

  if (error || !data) {
    return new Response("Database error", { status: 500 });
  }

  const channelUrl = `${BASE_URL}/briefs/${category.toLowerCase()}`;
  const feedUrl = `${BASE_URL}/api/briefs/${category.toLowerCase()}/rss`;

  const items = data
    .map((brief) => {
      const pubDate = new Date(brief.generated_at).toUTCString();
      const link = `${BASE_URL}/briefs/${brief.category.toLowerCase()}`;
      // Truncate markdown to first 500 chars as description
      const desc = escXml((brief.brief_markdown ?? "").slice(0, 500).trim() + "…");
      return `    <item>
      <title>${escXml(brief.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${BASE_URL}/briefs/${escXml(brief.slug)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
      <category>${escXml(brief.category)}</category>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Quiver Markets — ${escXml(category)} Brief</title>
    <link>${channelUrl}</link>
    <description>Daily ${escXml(category)} prediction market intelligence from Quiver Markets.</description>
    <language>en-us</language>
    <lastBuildDate>${data[0] ? new Date(data[0].generated_at).toUTCString() : new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
