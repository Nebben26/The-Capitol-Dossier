"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { BookOpen, Rss, ChevronRight, Lock } from "lucide-react";
import { getStories, type Story } from "@/lib/api";
import { useAuth } from "@/components/layout/AuthContext";

const CATEGORIES = ["All", "Economics", "Elections", "Crypto", "Tech", "Geopolitics", "Sports", "Policy"];
const TIERS = ["all", "free", "pro"] as const;
type TierFilter = typeof TIERS[number];

function StoryCard({ story, canRead }: { story: Story; canRead: boolean }) {
  const date = new Date(story.published_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return (
    <Link
      href={canRead || story.tier === "free" ? `/stories/${story.slug}` : "/pricing"}
      className="block group rounded-xl border border-[#21262d] bg-[#161b27] p-4 hover:border-[#57D7BA]/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {story.category && (
              <span className="text-[10px] font-medium text-[#8892b0] uppercase tracking-wide">
                {story.category}
              </span>
            )}
            {story.tier !== "free" && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-[#fbbf24] bg-[#fbbf24]/10 border border-[#fbbf24]/20 px-1.5 py-0.5 rounded-full">
                <Lock className="size-2.5" />
                {story.tier === "pro" ? "Pro" : "Trader"}
              </span>
            )}
          </div>
          <h2 className="text-sm font-semibold text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors leading-snug line-clamp-2">
            {story.headline}
          </h2>
          <p className="mt-1 text-xs text-[#8892b0] leading-relaxed line-clamp-2">
            {story.summary}
          </p>
        </div>
        <ChevronRight className="size-4 text-[#4a5168] group-hover:text-[#57D7BA] shrink-0 mt-0.5 transition-colors" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className="text-[10px] text-[#4a5168]">{date}</span>
        <span className="text-[10px] text-[#4a5168]">·</span>
        <span className="text-[10px] text-[#4a5168] capitalize">{story.event_type.replace(/_/g, " ")}</span>
        <span className="text-[10px] text-[#4a5168]">·</span>
        <span className="text-[10px] text-[#4a5168]">Q-score {story.quality_score}</span>
      </div>
    </Link>
  );
}

export default function StoriesPage() {
  const { isPro } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const fetchStories = useCallback(async (reset = false) => {
    setLoading(true);
    const currentOffset = reset ? 0 : offset;
    const data = await getStories({
      category: categoryFilter !== "All" ? categoryFilter : undefined,
      tier: tierFilter !== "all" ? tierFilter : undefined,
      limit: PAGE_SIZE,
      offset: currentOffset,
    });
    if (reset) {
      setStories(data);
      setOffset(PAGE_SIZE);
    } else {
      setStories(prev => [...prev, ...data]);
      setOffset(prev => prev + PAGE_SIZE);
    }
    setHasMore(data.length === PAGE_SIZE);
    setLoading(false);
  }, [categoryFilter, tierFilter, offset]);

  useEffect(() => {
    setOffset(0);
    setStories([]);
    setHasMore(true);
    fetchStories(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, tierFilter]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-[#57D7BA]" />
            <h1 className="text-2xl font-bold text-[#e2e8f0]">Market Insights</h1>
          </div>
          <p className="text-sm text-[#8892b0]">
            Auto-generated stories from live market events — spread moves, whale activity, and resolution alerts.
          </p>
        </div>
        <a
          href="/stories/rss.xml"
          className="inline-flex items-center gap-1.5 text-xs text-[#8892b0] hover:text-[#f59e0b] border border-[#21262d] hover:border-[#f59e0b]/40 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
        >
          <Rss className="size-3.5" />
          RSS
        </a>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              categoryFilter === cat
                ? "bg-[#57D7BA]/15 border-[#57D7BA]/40 text-[#57D7BA]"
                : "border-[#21262d] text-[#8892b0] hover:border-[#57D7BA]/30 hover:text-[#57D7BA]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tier filters */}
      <div className="flex gap-1.5">
        {(["all", "free", "pro"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTierFilter(t)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              tierFilter === t
                ? "bg-[#fbbf24]/10 border-[#fbbf24]/30 text-[#fbbf24]"
                : "border-[#21262d] text-[#8892b0] hover:border-[#fbbf24]/20 hover:text-[#fbbf24]"
            }`}
          >
            {t === "all" ? "All tiers" : t === "free" ? "Free" : "Pro+"}
          </button>
        ))}
      </div>

      {/* Story list */}
      {loading && stories.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-[#161b27] shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 border border-[#21262d] animate-pulse" />
          ))}
        </div>
      ) : stories.length === 0 ? (
        <div className="text-center py-16 text-[#4a5168] text-sm">
          No stories yet — check back after the next ingest cycle.
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map(s => (
            <StoryCard key={s.id} story={s} canRead={isPro} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && stories.length > 0 && (
        <div className="text-center pt-2">
          <button
            onClick={() => fetchStories(false)}
            disabled={loading}
            className="text-sm text-[#8892b0] hover:text-[#57D7BA] border border-[#21262d] hover:border-[#57D7BA]/40 px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}

      <p className="text-[10px] text-[#4a5168] pt-2 border-t border-[#21262d]">
        Stories are generated automatically from market data and do not constitute financial advice.{" "}
        <Link href="/about/stories-methodology" className="hover:text-[#57D7BA] transition-colors">
          How this works →
        </Link>
      </p>
    </div>
  );
}
