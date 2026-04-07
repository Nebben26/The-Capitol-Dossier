/**
 * Keyword-match recent news articles against active markets.
 * Inserts into news_market_tags (cap 5 markets per article).
 * Run after ingest-news.ts.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const PAGE_SIZE = 1000;
const MAX_TAGS_PER_ARTICLE = 5;
const LOOKBACK_HOURS = 48; // only tag articles from last 48h

const STOPWORDS = new Set([
  "will", "what", "when", "where", "which", "have", "been", "before",
  "after", "than", "they", "this", "that", "with", "from", "into",
  "does", "much", "many", "more", "most", "about", "would", "could",
  "should", "their", "there", "these", "those", "being", "other",
  "some", "only", "also", "over", "under", "between", "through",
  "during", "2024", "2025", "2026", "2027", "2028", "2029", "2030",
  "year", "next", "first", "last",
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w))
  );
}

function score(articleWords: Set<string>, marketWords: Set<string>): number {
  let overlap = 0;
  for (const w of articleWords) {
    if (marketWords.has(w)) overlap++;
  }
  if (overlap === 0) return 0;
  return overlap / Math.max(articleWords.size, marketWords.size);
}

async function getAllMarkets() {
  // Count first
  const { count } = await sb
    .from("markets")
    .select("*", { count: "exact", head: true });

  if (!count) return [];

  const numPages = Math.ceil(count / PAGE_SIZE);
  const allRows: any[] = [];

  for (let i = 0; i < numPages; i++) {
    const from = i * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await sb
      .from("markets")
      .select("id, slug, question")
      .order("id", { ascending: true })
      .range(from, to);
    if (data) allRows.push(...data);
  }

  return allRows;
}

async function main() {
  console.log("=== Tagging news articles ===\n");

  // Load markets
  const markets = await getAllMarkets();
  console.log(`Loaded ${markets.length} markets`);

  // Pre-tokenize market questions
  const marketTokens: { id: string; slug: string | null; question: string; words: Set<string> }[] = markets
    .filter((m) => m.question)
    .map((m) => ({
      id: m.id,
      slug: m.slug,
      question: m.question,
      words: tokenize(m.question),
    }));

  // Load recent untagged articles
  const since = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
  const { data: articles, error: artErr } = await sb
    .from("news_articles")
    .select("id, title, summary")
    .gte("published_at", since)
    .order("published_at", { ascending: false });

  if (artErr) { console.error(artErr); process.exit(1); }
  if (!articles?.length) { console.log("No recent articles to tag."); return; }

  console.log(`Tagging ${articles.length} articles published in last ${LOOKBACK_HOURS}h\n`);

  let totalTags = 0;

  for (const article of articles) {
    const text = `${article.title} ${article.summary || ""}`;
    const artWords = tokenize(text);
    if (artWords.size < 3) continue;

    // Score all markets
    const scored = marketTokens
      .map((m) => ({ ...m, s: score(artWords, m.words) }))
      .filter((m) => m.s >= 0.30)
      .sort((a, b) => b.s - a.s)
      .slice(0, MAX_TAGS_PER_ARTICLE);

    // Relax threshold if nothing matched
    const finalMatches = scored.length > 0
      ? scored
      : marketTokens
          .map((m) => ({ ...m, s: score(artWords, m.words) }))
          .filter((m) => m.s >= 0.15)
          .sort((a, b) => b.s - a.s)
          .slice(0, 2);

    if (finalMatches.length === 0) continue;

    const tags = finalMatches.map((m) => ({
      article_id: article.id,
      market_id: m.id,
      market_slug: m.slug,
      question: m.question,
      score: parseFloat(m.s.toFixed(3)),
    }));

    const { error } = await sb
      .from("news_market_tags")
      .upsert(tags, { onConflict: "article_id,market_id", ignoreDuplicates: true });

    if (error) {
      console.warn(`  Article ${article.id}: upsert error`, error.message);
    } else {
      totalTags += tags.length;
      console.log(`  [${article.id}] ${article.title.slice(0, 60)} → ${tags.length} markets`);
    }
  }

  console.log(`\nDone. Inserted ${totalTags} tags for ${articles.length} articles.`);
}

main().catch(console.error);
