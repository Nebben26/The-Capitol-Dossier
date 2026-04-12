import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category: rawCategory } = await params;
  const category = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("market_briefs")
    .select("slug, category, title, brief_json, generated_at, source_market_count, word_count")
    .eq("category", category)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return Response.json({ error: "Database error" }, { status: 500, headers: CORS });
  }

  if (!data) {
    return Response.json(
      { error: `No brief found for category: ${category}` },
      { status: 404, headers: CORS }
    );
  }

  const json = data.brief_json as any;
  const topMover = json?.movers?.[0] ?? null;

  return Response.json(
    {
      category: data.category,
      title: data.title,
      generatedAt: data.generated_at,
      sourceMarketCount: data.source_market_count,
      wordCount: data.word_count,
      index: json?.index ?? null,
      topMover: topMover
        ? { question: topMover.question, change24h: topMover.change_24h, price: topMover.price }
        : null,
      topArb: json?.top_arb ?? null,
      url: `https://quivermarkets.com/briefs/${category.toLowerCase()}`,
    },
    {
      headers: {
        ...CORS,
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    }
  );
}
