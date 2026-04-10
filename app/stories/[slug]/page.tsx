"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Share2, BookOpen } from "lucide-react";
import { getStoryBySlug, getStories, type Story } from "@/lib/api";
import { useAuth } from "@/components/layout/AuthContext";

function PaywallBanner({ tier }: { tier: "pro" | "trader" }) {
  return (
    <div className="mt-6 rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/5 p-6 text-center space-y-3">
      <div className="flex justify-center">
        <Lock className="size-6 text-[#fbbf24]" />
      </div>
      <h3 className="text-base font-semibold text-[#e2e8f0]">
        {tier === "trader" ? "Trader" : "Pro"} story
      </h3>
      <p className="text-sm text-[#8892b0] max-w-xs mx-auto">
        Upgrade to {tier === "trader" ? "Trader ($149/mo)" : "Pro ($49/mo)"} to read the full analysis.
      </p>
      <Link
        href="/pricing"
        className="inline-block px-5 py-2 rounded-lg bg-[#57D7BA] text-[#0d1117] text-sm font-bold hover:bg-[#3ec9a7] transition-colors"
      >
        View pricing →
      </Link>
    </div>
  );
}

function RelatedStoryCard({ story }: { story: Story }) {
  const date = new Date(story.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <Link
      href={`/stories/${story.slug}`}
      className="block group rounded-lg border border-[#2f374f] bg-[#222638] p-3 hover:border-[#57D7BA]/40 transition-colors"
    >
      <p className="text-xs font-medium text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors line-clamp-2 leading-snug">
        {story.headline}
      </p>
      <p className="mt-1 text-[10px] text-[#4a5168]">{date}</p>
    </Link>
  );
}

export default function StoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isPro } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [related, setRelated] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const [s, recent] = await Promise.all([
        getStoryBySlug(slug),
        getStories({ limit: 5 }),
      ]);
      setStory(s);
      setRelated(recent.filter(r => r.slug !== slug).slice(0, 4));
      setLoading(false);
    })();
  }, [slug]);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Determine if user can read the full body
  const canReadFull = !story || story.tier === "free" || isPro;

  // Split body into paragraphs; show first 2 for gated readers
  const paragraphs = story?.body.split(/\n\n+/).filter(Boolean) ?? [];
  const visibleParagraphs = canReadFull ? paragraphs : paragraphs.slice(0, 2);
  const isGated = !canReadFull && paragraphs.length > 2;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        <div className="h-6 w-40 bg-[#222638] rounded animate-pulse" />
        <div className="h-8 bg-[#222638] rounded animate-pulse" />
        <div className="h-4 bg-[#222638] rounded animate-pulse" />
        <div className="space-y-2 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-[#222638] rounded animate-pulse" style={{ width: `${85 + (i % 3) * 5}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/stories" className="inline-flex items-center gap-1.5 text-sm text-[#8892b0] hover:text-[#57D7BA] transition-colors mb-6">
          <ArrowLeft className="size-4" /> Stories
        </Link>
        <p className="text-[#8892b0] text-sm">Story not found.</p>
      </div>
    );
  }

  const date = new Date(story.published_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Back */}
      <Link href="/stories" className="inline-flex items-center gap-1.5 text-sm text-[#8892b0] hover:text-[#57D7BA] transition-colors">
        <ArrowLeft className="size-4" /> Stories
      </Link>

      {/* Meta */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {story.category && (
            <span className="text-[10px] font-medium text-[#8892b0] uppercase tracking-wide">
              {story.category}
            </span>
          )}
          <span className="text-[10px] text-[#4a5168]">·</span>
          <span className="text-[10px] text-[#4a5168] capitalize">{story.event_type.replace(/_/g, " ")}</span>
          {story.tier !== "free" && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wide text-[#fbbf24] bg-[#fbbf24]/10 border border-[#fbbf24]/20 px-1.5 py-0.5 rounded-full">
              <Lock className="size-2.5" />
              {story.tier === "pro" ? "Pro" : "Trader"}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-[#e2e8f0] leading-tight">{story.headline}</h1>
        <p className="text-sm text-[#8892b0] leading-relaxed">{story.summary}</p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#4a5168]">{date}</span>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs text-[#8892b0] hover:text-[#57D7BA] border border-[#2f374f] hover:border-[#57D7BA]/40 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Share2 className="size-3" />
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#2f374f]" />

      {/* Body */}
      <div className="space-y-4">
        {visibleParagraphs.map((p, i) => (
          <p key={i} className="text-sm text-[#c8d3e8] leading-relaxed">
            {p}
          </p>
        ))}
        {isGated && <PaywallBanner tier={story.tier as "pro" | "trader"} />}
      </div>

      {/* Source markets */}
      {story.source_market_ids.length > 0 && canReadFull && (
        <div className="pt-4 border-t border-[#2f374f]">
          <p className="text-[10px] text-[#4a5168] font-medium uppercase tracking-wide mb-2">Source markets</p>
          <div className="flex flex-wrap gap-2">
            {story.source_market_ids.map(id => (
              <Link
                key={id}
                href={`/markets/${id}`}
                className="text-xs text-[#8892b0] hover:text-[#57D7BA] border border-[#2f374f] hover:border-[#57D7BA]/40 px-2 py-1 rounded-md font-mono transition-colors"
              >
                {id.length > 20 ? `${id.slice(0, 8)}…` : id}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related */}
      {related.length > 0 && (
        <div className="pt-4 border-t border-[#2f374f] space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-3.5 text-[#57D7BA]" />
            <p className="text-xs font-semibold text-[#8892b0] uppercase tracking-wide">More stories</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {related.map(s => (
              <RelatedStoryCard key={s.id} story={s} />
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-[#4a5168] pt-4 border-t border-[#2f374f]">
        Auto-generated from live market data. Not financial advice.{" "}
        <Link href="/about/stories-methodology" className="hover:text-[#57D7BA] transition-colors">
          Methodology →
        </Link>
      </p>
    </div>
  );
}
