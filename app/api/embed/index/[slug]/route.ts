import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=300, s-maxage=300",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [indexRes, sparkRes] = await Promise.all([
    supabase
      .from("quiver_indices")
      .select("slug, name, category, current_value, change_24h, updated_at")
      .eq("slug", slug)
      .maybeSingle(),
    supabase
      .from("quiver_index_history")
      .select("value, recorded_at")
      .eq("index_slug", slug)
      .gte("recorded_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("recorded_at", { ascending: true })
      .limit(168), // 7 days × 24h = 168 hourly points max
  ]);

  if (!indexRes.data) {
    return NextResponse.json({ error: "Index not found" }, { status: 404, headers: corsHeaders });
  }

  // Log embed view (best-effort, fire-and-forget)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  supabaseAdmin.from("embed_views").insert({
    widget_type: "index",
    resource_id: slug,
    referrer: req.headers.get("referer") ?? null,
    user_agent: req.headers.get("user-agent") ?? null,
  }).then(() => undefined, () => undefined);

  const idx = indexRes.data;
  const sparkline = (sparkRes.data ?? []).map((h) => Number(h.value));

  return NextResponse.json(
    {
      slug: idx.slug,
      name: idx.name,
      category: idx.category,
      currentValue: Number(idx.current_value),
      change24h: idx.change_24h != null ? Number(idx.change_24h) : null,
      sparkline,
      updatedAt: idx.updated_at,
      url: `https://quivermarkets.com/indices/${slug}`,
    },
    { headers: corsHeaders }
  );
}
