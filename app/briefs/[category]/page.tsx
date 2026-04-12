import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ArrowLeft, Clock, Database, FileText } from "lucide-react";
import { BriefDetailClient } from "./brief-detail-client";

const CATEGORY_EMOJIS: Record<string, string> = {
  elections: "🗳️",
  crypto: "₿",
  economics: "📈",
  geopolitics: "🌍",
  sports: "🏆",
};

const CATEGORY_COLORS: Record<string, string> = {
  elections: "#388bfd",
  crypto: "#f59e0b",
  economics: "#3fb950",
  geopolitics: "#a371f7",
  sports: "#f85149",
};

export async function generateMetadata(
  { params }: { params: Promise<{ category: string }> }
): Promise<Metadata> {
  const { category: rawCategory } = await params;
  const category = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();

  return {
    title: `${category} Market Brief — Quiver Markets`,
    description: `Daily ${category} prediction market intelligence: top movers, arbitrage spreads, and recent resolutions.`,
    openGraph: {
      title: `${category} Market Brief — Quiver Markets`,
      description: `Daily ${category} prediction market intelligence. Pull via RSS, JSON API, or embed widget.`,
    },
  };
}

export default async function BriefCategoryPage(
  { params }: { params: Promise<{ category: string }> }
) {
  const { category: rawCategory } = await params;
  const categoryLower = rawCategory.toLowerCase();
  const category = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();

  const color = CATEGORY_COLORS[categoryLower] ?? "#57D7BA";
  const emoji = CATEGORY_EMOJIS[categoryLower] ?? "📊";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: brief } = await supabase
    .from("market_briefs")
    .select("*")
    .eq("category", category)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Breadcrumb */}
      <Link
        href="/briefs"
        className="inline-flex items-center gap-1.5 text-xs text-[#8d96a0] hover:text-[#57D7BA] transition-colors"
      >
        <ArrowLeft className="size-3" />
        All Briefs
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">{category} Market Brief</h1>
            {brief && (
              <p className="text-xs text-[#8d96a0] mt-0.5">
                {new Date(brief.generated_at).toLocaleDateString("en-US", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        {brief && (
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-[#8d96a0]">
              <Database className="size-3" />
              {brief.source_market_count} source markets
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#8d96a0]">
              <FileText className="size-3" />
              {brief.word_count} words
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#8d96a0]">
              <Clock className="size-3" />
              Generated {new Date(brief.generated_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        )}
      </div>

      {/* Color accent bar */}
      <div className="h-1 w-full rounded-full" style={{ backgroundColor: color }} />

      {/* Content */}
      {brief ? (
        <BriefDetailClient brief={brief} />
      ) : (
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-10 text-center space-y-3">
          <p className="text-2xl">{emoji}</p>
          <p className="text-sm font-semibold text-[#f0f6fc]">No brief yet for {category}</p>
          <p className="text-xs text-[#8d96a0]">
            Briefs are generated automatically after each ingest cycle. Check back soon, or{" "}
            <code className="text-[#57D7BA] bg-[#0d1117] px-1 rounded text-[11px]">
              npx tsx scripts/generate-briefs.ts
            </code>{" "}
            to trigger manually.
          </p>
          <Link
            href="/briefs"
            className="inline-flex items-center gap-1.5 text-xs text-[#57D7BA] hover:underline mt-2"
          >
            ← Back to all briefs
          </Link>
        </div>
      )}
    </div>
  );
}
