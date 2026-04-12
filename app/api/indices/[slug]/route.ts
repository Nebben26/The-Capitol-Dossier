import { NextResponse } from "next/server";
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
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [indexRes, historyRes] = await Promise.all([
    supabase
      .from("quiver_indices")
      .select("slug, name, description, category, current_value, previous_value, change_24h, component_count, methodology, updated_at")
      .eq("slug", slug)
      .maybeSingle(),
    supabase
      .from("quiver_index_history")
      .select("value, recorded_at")
      .eq("index_slug", slug)
      .gte("recorded_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("recorded_at", { ascending: true })
      .limit(1440), // 30 days × 48 readings/day
  ]);

  if (indexRes.error) {
    if (indexRes.error.message.includes("does not exist")) {
      return NextResponse.json({ status: "table_missing" }, { headers: corsHeaders });
    }
    return NextResponse.json({ error: indexRes.error.message }, { status: 500, headers: corsHeaders });
  }

  if (!indexRes.data) {
    return NextResponse.json({ error: "Index not found" }, { status: 404, headers: corsHeaders });
  }

  const idx = indexRes.data;
  const history = (historyRes.data ?? []).map((h) => ({
    value: Number(h.value),
    recorded_at: h.recorded_at,
  }));

  // Compute all-time high/low from history
  const allValues = history.map((h) => h.value);
  const allTimeHigh = allValues.length ? Math.max(...allValues) : Number(idx.current_value);
  const allTimeLow = allValues.length ? Math.min(...allValues) : Number(idx.current_value);

  return NextResponse.json(
    {
      index: {
        ...idx,
        current_value: Number(idx.current_value),
        previous_value: idx.previous_value != null ? Number(idx.previous_value) : null,
        change_24h: idx.change_24h != null ? Number(idx.change_24h) : null,
        all_time_high: allTimeHigh,
        all_time_low: allTimeLow,
      },
      history,
    },
    { headers: corsHeaders }
  );
}
