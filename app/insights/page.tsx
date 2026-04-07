"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import {
  Newspaper,
  ExternalLink,
  RefreshCw,
  Clock,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NewsArticle {
  id: number;
  url: string;
  title: string;
  summary: string | null;
  source: string;
  published_at: string;
  image_url: string | null;
  tags: MarketTag[];
}

interface MarketTag {
  market_id: string;
  market_slug: string | null;
  question: string | null;
  score: number;
  change_24h: number | null;
  price: number | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_SOURCES = ["Reuters", "AP News", "BBC", "Politico", "FiveThirtyEight", "The Economist", "Bloomberg", "Axios"];

const SOURCE_COLORS: Record<string, string> = {
  Reuters:         "bg-[#ff8000]/10 text-[#ff8000] border-[#ff8000]/20",
  "AP News":       "bg-[#c00]/10 text-[#ff4444] border-[#ff4444]/20",
  BBC:             "bg-[#bb1919]/10 text-[#ff6666] border-[#ff6666]/20",
  Politico:        "bg-[#6366f1]/10 text-[#818cf8] border-[#818cf8]/20",
  FiveThirtyEight: "bg-[#e04726]/10 text-[#f97316] border-[#f97316]/20",
  "The Economist": "bg-[#e3120b]/10 text-[#f87171] border-[#f87171]/20",
  Bloomberg:       "bg-[#3b82f6]/10 text-[#60a5fa] border-[#60a5fa]/20",
  Axios:           "bg-[#57D7BA]/10 text-[#57D7BA] border-[#57D7BA]/20",
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string>("All");
  const [displayCount, setDisplayCount] = useState(20);

  async function fetchArticles() {
    setLoading(true);
    setError(null);
    try {
      // Fetch recent articles
      const { data: rawArticles, error: artErr } = await supabase
        .from("news_articles")
        .select("id, url, title, summary, source, published_at, image_url")
        .order("published_at", { ascending: false })
        .limit(200);

      if (artErr) throw artErr;
      if (!rawArticles?.length) {
        setArticles([]);
        return;
      }

      // Fetch tags for these articles
      const articleIds = rawArticles.map((a) => a.id);
      const { data: rawTags } = await supabase
        .from("news_market_tags")
        .select("article_id, market_id, market_slug, question, score")
        .in("article_id", articleIds)
        .order("score", { ascending: false });

      // Option B: fetch price data for all unique market_ids
      const uniqueMarketIds = [...new Set((rawTags || []).map((t) => t.market_id))];
      const marketPriceMap: Record<string, { change_24h: number | null; price: number | null }> = {};

      if (uniqueMarketIds.length > 0) {
        const { data: marketData } = await supabase
          .from("markets")
          .select("id, change_24h, price")
          .in("id", uniqueMarketIds);

        for (const m of marketData || []) {
          marketPriceMap[m.id] = {
            change_24h: m.change_24h ?? null,
            price: m.price ?? null,
          };
        }
      }

      // Group tags by article, merging price data
      const tagsByArticle: Record<number, MarketTag[]> = {};
      for (const t of rawTags || []) {
        if (!tagsByArticle[t.article_id]) tagsByArticle[t.article_id] = [];
        const priceData = marketPriceMap[t.market_id] || { change_24h: null, price: null };
        tagsByArticle[t.article_id].push({
          market_id: t.market_id,
          market_slug: t.market_slug,
          question: t.question,
          score: t.score,
          change_24h: priceData.change_24h,
          price: priceData.price,
        });
      }

      const merged: NewsArticle[] = rawArticles.map((a) => ({
        ...a,
        tags: tagsByArticle[a.id] || [],
      }));

      setArticles(merged);
    } catch (e: any) {
      setError(e.message || "Failed to load articles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchArticles();
  }, []);

  // Step 1: only articles with at least one tagged market
  const taggedArticles = useMemo(() => articles.filter((a) => a.tags.length > 0), [articles]);

  const sources = useMemo(() => {
    const found = new Set(taggedArticles.map((a) => a.source));
    return ["All", ...ALL_SOURCES.filter((s) => found.has(s))];
  }, [taggedArticles]);

  const filtered = useMemo(() => {
    if (activeSource === "All") return taggedArticles;
    return taggedArticles.filter((a) => a.source === activeSource);
  }, [taggedArticles, activeSource]);

  const visible = filtered.slice(0, displayCount);

  // ── Empty / Loading states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-5">
        <div className="flex items-center justify-center py-24">
          <div className="text-center space-y-3">
            <RefreshCw className="size-8 text-[#57D7BA] animate-spin mx-auto" />
            <p className="text-sm text-[#8892b0]">Loading catalysts…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || taggedArticles.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-5">
        <div className="flex items-center justify-center py-24">
          <div className="text-center max-w-md space-y-4">
            <div className="size-16 rounded-2xl bg-[#6366f1]/10 flex items-center justify-center mx-auto">
              <Newspaper className="size-8 text-[#6366f1]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Catalysts</h1>
            <p className="text-sm text-[#8892b0] leading-relaxed">
              {error
                ? `Error: ${error}`
                : "The news pipeline is warming up. Catalysts will appear after the next ingest run (every 30 min)."}
            </p>
            <Button
              onClick={fetchArticles}
              variant="outline"
              className="border-[#2f374f] text-[#8892b0] hover:text-[#57D7BA] hover:border-[#57D7BA]/30 gap-2"
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Main feed ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Catalysts</h1>
          <p className="text-xs text-[#8892b0] mt-0.5">
            {filtered.length} news events affecting prediction markets right now
          </p>
        </div>
        <Button
          onClick={fetchArticles}
          variant="outline"
          size="sm"
          className="border-[#2f374f] text-[#8892b0] hover:text-[#57D7BA] hover:border-[#57D7BA]/30 gap-1.5"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {/* Source filter pills */}
      <div className="flex flex-wrap gap-2">
        {sources.map((src) => (
          <button
            key={src}
            onClick={() => { setActiveSource(src); setDisplayCount(20); }}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              activeSource === src
                ? "bg-[#57D7BA]/10 text-[#57D7BA] border-[#57D7BA]/30"
                : "bg-[#222638] text-[#8892b0] border-[#2f374f] hover:text-[#57D7BA] hover:border-[#57D7BA]/20"
            }`}
          >
            {src}
          </button>
        ))}
      </div>

      {/* Article cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {/* Load more */}
      {displayCount < filtered.length && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={() => setDisplayCount((n) => n + 20)}
            variant="outline"
            className="border-[#2f374f] text-[#8892b0] hover:text-[#57D7BA] hover:border-[#57D7BA]/30"
          >
            Load more ({filtered.length - displayCount} remaining)
          </Button>
        </div>
      )}

      <Footer />
    </div>
  );
}

// ─── Article Card ─────────────────────────────────────────────────────────────

function PriceChange({ change }: { change: number | null }) {
  if (change === null || change === undefined) return null;
  const abs = Math.abs(change).toFixed(1);
  if (change > 0) return <span className="text-green-400 font-mono whitespace-nowrap">↑{abs}%</span>;
  if (change < 0) return <span className="text-red-400 font-mono whitespace-nowrap">↓{abs}%</span>;
  return <span className="text-[#8892b0] font-mono whitespace-nowrap">0%</span>;
}

function ArticleCard({ article }: { article: NewsArticle }) {
  const sourceClass = SOURCE_COLORS[article.source] || "bg-[#2f374f] text-[#8892b0] border-[#2f374f]";

  return (
    <div className="bg-[#222638] border border-[#2f374f] rounded-xl p-4 flex flex-col gap-3 hover:border-[#57D7BA]/30 transition-colors">
      {/* Source + time */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sourceClass}`}>
          {article.source}
        </span>
        <span className="text-[10px] text-[#8892b0] flex items-center gap-1">
          <Clock className="size-3" />
          {timeAgo(article.published_at)}
        </span>
      </div>

      {/* Title */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold text-[#ccd6f6] leading-snug hover:text-[#57D7BA] transition-colors flex items-start gap-1.5 group"
      >
        <span className="flex-1">{article.title}</span>
        <ExternalLink className="size-3 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>

      {/* Summary */}
      {article.summary && (
        <p className="text-xs text-[#8892b0] leading-relaxed line-clamp-2">
          {article.summary}
        </p>
      )}

      {/* Tagged markets with price movement */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-[#2f374f]">
        <span className="text-[10px] text-[#8892b0] flex items-center gap-1">
          <Tag className="size-3" />
          Markets moving
        </span>
        <div className="flex flex-col gap-1">
          {article.tags.slice(0, 3).map((tag) => (
            <Link
              key={tag.market_id}
              href={`/markets/${tag.market_id}`}
              className="flex items-center justify-between gap-2 text-[10px] bg-[#1a1e2e] border border-[#2f374f] text-[#8892b0] hover:text-[#57D7BA] hover:border-[#57D7BA]/30 rounded px-2 py-1 transition-colors"
              title={tag.question || tag.market_id}
            >
              <span className="truncate">
                {(tag.question || tag.market_id).slice(0, 55)}
                {(tag.question || "").length > 55 ? "…" : ""}
              </span>
              <PriceChange change={tag.change_24h} />
            </Link>
          ))}
          {article.tags.length > 3 && (
            <span className="text-[10px] text-[#8892b0]/50 px-1">
              +{article.tags.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="flex items-center justify-between py-4 border-t border-[#2f374f] text-[10px] text-[#8892b0]">
      <span>© 2026 Quiver Markets. Not financial advice. Data from Polymarket &amp; Kalshi.</span>
      <div className="flex items-center gap-3">
        <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
        <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
      </div>
    </footer>
  );
}
