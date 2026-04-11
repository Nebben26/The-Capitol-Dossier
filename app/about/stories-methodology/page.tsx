"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Zap, Eye, Filter, Lock } from "lucide-react";

export default function StoriesMethodologyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <Link
        href="/stories"
        className="inline-flex items-center gap-1.5 text-sm text-[#8892b0] hover:text-[#57D7BA] transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to Stories
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[#e2e8f0]">How Market Insights Work</h1>
        <p className="text-sm text-[#8892b0]">
          Stories are generated automatically — no human editor, no sponsored content.
        </p>
      </div>

      <div className="space-y-6 text-sm text-[#8892b0] leading-relaxed">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-[#57D7BA] shrink-0" />
            <h2 className="text-base font-semibold text-[#e2e8f0]">Event Detection</h2>
          </div>
          <p>
            Every 30 minutes, after the market ingest cycle completes, a detection pass scans live data for
            noteworthy events. Currently four event types are monitored:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><span className="text-[#e2e8f0] font-medium">Large Spread Emerged</span> — cross-platform spread ≥ 8 points with both sides showing ≥ $50k volume.</li>
            <li><span className="text-[#e2e8f0] font-medium">Daily Widest Spreads</span> — top 5 disagreements consolidated into a single digest story.</li>
            <li><span className="text-[#e2e8f0] font-medium">Whale Position Alert</span> — a tracked wallet holds ≥ $100k in a single market and the position was updated in the last hour.</li>
            <li><span className="text-[#e2e8f0] font-medium">Resolution Nearing</span> — a market crosses the 7-day, 3-day, or 1-day threshold before close.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-[#57D7BA] shrink-0" />
            <h2 className="text-base font-semibold text-[#e2e8f0]">Quality Scoring</h2>
          </div>
          <p>
            Each story receives a quality score from 0–100 based on signal strength — spread magnitude, volume depth,
            and event rarity. Only events that clear a template-specific minimum threshold are published. Stories are
            deduplicated within 24 hours per market to prevent noise.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-[#57D7BA] shrink-0" />
            <h2 className="text-base font-semibold text-[#e2e8f0]">Content Generation</h2>
          </div>
          <p>
            Headlines and body copy are produced by deterministic prose templates, not a language model. Each template
            fills structured slots (market question, spread, prices, causation tag) and expands them into readable
            sentences. This means every factual claim can be traced back to the underlying data row.
          </p>
          <p>
            Causation analysis (Information Lag, Liquidity Gap, Resolution Mismatch, etc.) is computed by a rule-based
            heuristic engine in{" "}
            <code className="text-[10px] font-mono bg-[#0d1117] px-1.5 py-0.5 rounded text-[#57D7BA]">
              lib/causation.ts
            </code>{" "}
            — seven ordered rules applied to spread age, volume ratio, convergence velocity, and market category.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-[#fbbf24] shrink-0" />
            <h2 className="text-base font-semibold text-[#e2e8f0]">Access Tiers</h2>
          </div>
          <p>
            Free stories (quality score &lt; 70) cover broad digest events and daily summaries. Pro stories cover
            individual large-spread and whale events with full body analysis. The RSS feed publishes free stories only.
          </p>
        </section>
      </div>

      <p className="text-[11px] text-[#4a5168] pt-4 border-t border-[#21262d]">
        Stories are generated automatically and do not constitute financial or investment advice.{" "}
        <Link href="/stories" className="hover:text-[#57D7BA] transition-colors">
          Browse stories →
        </Link>
      </p>
    </div>
  );
}
