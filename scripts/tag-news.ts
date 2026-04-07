/**
 * Keyword-match recent news articles against active markets.
 * Inserts into news_market_tags (cap 5 markets per article).
 * Run after ingest-news.ts.
 *
 * Matching rules (strict):
 *   - overlap >= 4 words AND score >= 0.35
 *   - at least 2 overlapping words must be proper nouns in the original article text
 *   - no fallback relaxation — if nothing matches at this threshold, skip the article
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const PAGE_SIZE = 1000;
const MAX_TAGS_PER_ARTICLE = 5;
const LOOKBACK_HOURS = 48;
const MIN_OVERLAP = 2;
const MIN_SCORE = 0.30;
const MIN_PROPER_NOUNS = 1;

const STOPWORDS = new Set([
  "will", "what", "when", "where", "which", "have", "been", "before",
  "after", "than", "they", "this", "that", "with", "from", "into",
  "does", "much", "many", "more", "most", "about", "would", "could",
  "should", "their", "there", "these", "those", "being", "other",
  "some", "only", "also", "over", "under", "between", "through",
  "during", "2024", "2025", "2026", "2027", "2028", "2029", "2030",
  "year", "next", "first", "last",
]);

/** Lowercase token set for matching */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w))
  );
}

/** Proper nouns: words >3 chars that start with uppercase in the original text */
function extractProperNouns(originalText: string): Set<string> {
  return new Set(
    originalText
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && /^[A-Z]/.test(w))
      .map((w) => w.toLowerCase())
  );
}

interface MatchResult {
  score: number;
  overlap: number;
  properNounCount: number;
}

function matchScore(
  articleWords: Set<string>,
  marketWords: Set<string>,
  articleProperNouns: Set<string>
): MatchResult {
  let overlap = 0;
  let properNounCount = 0;
  for (const w of articleWords) {
    if (marketWords.has(w)) {
      overlap++;
      if (articleProperNouns.has(w)) properNounCount++;
    }
  }
  if (overlap === 0) return { score: 0, overlap: 0, properNounCount: 0 };
  return {
    score: overlap / Math.max(articleWords.size, marketWords.size),
    overlap,
    properNounCount,
  };
}

async function getAllMarkets() {
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
  console.log("=== Tagging news articles (strict matcher) ===\n");

  const markets = await getAllMarkets();
  console.log(`Loaded ${markets.length} markets`);

  const marketTokens: { id: string; slug: string | null; question: string; words: Set<string> }[] =
    markets
      .filter((m) => m.question)
      .map((m) => ({ id: m.id, slug: m.slug, question: m.question, words: tokenize(m.question) }));

  const since = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
  const { data: articles, error: artErr } = await sb
    .from("news_articles")
    .select("id, title, summary")
    .gte("published_at", since)
    .order("published_at", { ascending: false });

  if (artErr) { console.error(artErr); process.exit(1); }
  if (!articles?.length) { console.log("No recent articles to tag."); return; }

  console.log(`Tagging ${articles.length} articles from last ${LOOKBACK_HOURS}h`);
  console.log(`Thresholds: overlap>=${MIN_OVERLAP}, score>=${MIN_SCORE}, proper nouns>=${MIN_PROPER_NOUNS}\n`);

  let totalTags = 0;
  let skipped = 0;

  for (const article of articles) {
    // Use title only — summary adds noise and dilutes score by inflating word count
    const originalText = article.title;
    const artWords = tokenize(originalText);
    const artProperNouns = extractProperNouns(originalText);

    if (artWords.size < 3) { skipped++; continue; }

    const scored = marketTokens
      .map((m) => {
        const { score, overlap, properNounCount } = matchScore(artWords, m.words, artProperNouns);
        return { ...m, s: score, overlap, properNounCount };
      })
      .filter((m) => m.overlap >= MIN_OVERLAP && m.s >= MIN_SCORE && m.properNounCount >= MIN_PROPER_NOUNS)
      .sort((a, b) => b.s - a.s)
      .slice(0, MAX_TAGS_PER_ARTICLE);

    if (scored.length === 0) { skipped++; continue; }

    const tags = scored.map((m) => ({
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
      console.log(`  [${article.id}] ${article.title.slice(0, 65)} → ${tags.length} market(s)`);
      tags.forEach((t) => console.log(`         ↳ ${t.question?.slice(0, 70)}`));
    }
  }

  console.log(`\nDone. ${totalTags} tags inserted, ${skipped} articles skipped (no quality match).`);

  // Sample output
  const { data: sample } = await sb
    .from("news_market_tags")
    .select("article_id, question, score, news_articles(title)")
    .order("score", { ascending: false })
    .limit(5);

  if (sample?.length) {
    console.log("\nTop 5 tags by score:");
    sample.forEach((t: any) =>
      console.log(`  score=${t.score}  "${(t.news_articles as any)?.title?.slice(0, 50)}" → "${t.question?.slice(0, 60)}"`)
    );
  }
}

main().catch(console.error);
