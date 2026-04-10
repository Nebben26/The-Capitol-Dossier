import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  let stories: Array<{
    slug: string;
    headline: string;
    summary: string;
    category: string | null;
    published_at: string;
  }> = [];

  try {
    const { data } = await supabase
      .from("stories")
      .select("slug, headline, summary, category, published_at")
      .eq("tier", "free")
      .order("published_at", { ascending: false })
      .limit(50);
    stories = data ?? [];
  } catch {
    // Return empty feed on error
  }

  const baseUrl = "https://quivermarkets.com";
  const now = new Date().toUTCString();

  const items = stories
    .map(s => {
      const url = `${baseUrl}/stories/${s.slug}`;
      const pubDate = new Date(s.published_at).toUTCString();
      return [
        "    <item>",
        `      <title><![CDATA[${s.headline}]]></title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description><![CDATA[${s.summary}]]></description>`,
        s.category ? `      <category>${s.category}</category>` : "",
        `      <pubDate>${pubDate}</pubDate>`,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Quiver Markets — Market Insights</title>
    <link>${baseUrl}/stories</link>
    <description>Auto-generated stories from live prediction market events — spread moves, whale activity, and resolution alerts.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/stories/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
