/**
 * Fetch RSS feeds and upsert into news_articles.
 * Run after ingest.ts in the GitHub Actions cron.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const parser = new Parser({ timeout: 10000 });

const FEEDS: { source: string; url: string }[] = [
  { source: "Reuters",         url: "https://feeds.reuters.com/reuters/topNews" },
  { source: "AP News",         url: "https://apnews.com/rss" },
  { source: "BBC",             url: "https://feeds.bbci.co.uk/news/rss.xml" },
  { source: "Politico",        url: "https://www.politico.com/rss/politicopicks.xml" },
  { source: "FiveThirtyEight", url: "https://fivethirtyeight.com/features/feed/" },
  { source: "The Economist",   url: "https://www.economist.com/the-world-this-week/rss.xml" },
  { source: "Bloomberg",       url: "https://feeds.bloomberg.com/markets/news.rss" },
  { source: "Axios",           url: "https://api.axios.com/feed/" },
];

async function fetchFeed(source: string, url: string) {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items || []).map((item) => ({
      url: item.link || item.guid || "",
      title: (item.title || "").trim(),
      summary: (item.contentSnippet || item.content || item.summary || "").slice(0, 500).trim(),
      source,
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      image_url: (item as any).enclosure?.url || null,
    })).filter((a) => a.url && a.title);
  } catch (err: any) {
    console.warn(`  [SKIP] ${source}: ${err.message}`);
    return [];
  }
}

async function main() {
  console.log("=== Ingesting news articles ===\n");

  // Fetch all feeds in parallel
  const results = await Promise.all(
    FEEDS.map(({ source, url }) => fetchFeed(source, url))
  );

  const articles = results.flat();
  console.log(`Fetched ${articles.length} raw articles from ${FEEDS.length} feeds`);

  if (articles.length === 0) {
    console.log("Nothing to upsert.");
    return;
  }

  // Upsert — skip duplicates by URL
  const { error, count } = await sb
    .from("news_articles")
    .upsert(articles, { onConflict: "url", ignoreDuplicates: true })
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("Upsert error:", error);
    process.exit(1);
  }

  console.log(`Upserted ${articles.length} articles (${count ?? "?"} new rows)`);

  // Print sample
  const { data: sample } = await sb
    .from("news_articles")
    .select("source, title, published_at")
    .order("published_at", { ascending: false })
    .limit(5);

  console.log("\nLatest 5 articles:");
  sample?.forEach((a: any) =>
    console.log(`  [${a.source}] ${a.title.slice(0, 70)} (${a.published_at.slice(0, 10)})`)
  );
}

main().catch(console.error);
