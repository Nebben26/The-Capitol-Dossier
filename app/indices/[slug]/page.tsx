import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { IndexDetailClient } from "./index-detail-client";
import { ArrowLeft } from "lucide-react";

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getIndex(slug: string) {
  const { data } = await supabaseAnon
    .from("quiver_indices")
    .select("slug, name, description, category, current_value, previous_value, change_24h, component_count, methodology, updated_at")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

async function getHistory(slug: string) {
  const { data } = await supabaseAnon
    .from("quiver_index_history")
    .select("value, recorded_at")
    .eq("index_slug", slug)
    .gte("recorded_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("recorded_at", { ascending: true })
    .limit(1440);
  return data ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const idx = await getIndex(slug);
  if (!idx) return { title: "Index not found — Quiver Markets" };

  const val = Number(idx.current_value).toFixed(1);
  const chg = idx.change_24h != null ? ` (${Number(idx.change_24h) >= 0 ? "+" : ""}${Number(idx.change_24h).toFixed(1)} 24h)` : "";
  const title = `${idx.name}: ${val}${chg}`;
  const description = `${idx.description} Currently at ${val}/100. ${idx.component_count} prediction markets aggregated. Updated every 30 minutes.`;

  return {
    title: `${title} — Quiver Markets`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "Quiver Markets",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function IndexDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [idx, history] = await Promise.all([getIndex(slug), getHistory(slug)]);

  if (!idx) notFound();

  const historyPoints = history.map((h) => ({
    value: Number(h.value),
    recorded_at: h.recorded_at,
  }));

  const allValues = historyPoints.map((h) => h.value);
  const allTimeHigh = allValues.length ? Math.max(...allValues) : Number(idx.current_value);
  const allTimeLow = allValues.length ? Math.min(...allValues) : Number(idx.current_value);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Back nav */}
      <div>
        <Link
          href="/indices"
          className="inline-flex items-center gap-1.5 text-xs text-[#8d96a0] hover:text-[#f0f6fc] transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          All indices
        </Link>
      </div>

      <IndexDetailClient
        slug={slug}
        name={idx.name}
        description={idx.description}
        category={idx.category}
        currentValue={Number(idx.current_value)}
        change24h={idx.change_24h != null ? Number(idx.change_24h) : null}
        componentCount={Number(idx.component_count)}
        methodology={idx.methodology}
        updatedAt={idx.updated_at}
        allTimeHigh={allTimeHigh}
        allTimeLow={allTimeLow}
        history={historyPoints}
      />
    </div>
  );
}
