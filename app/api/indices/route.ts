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

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("quiver_indices")
    .select("slug, name, description, category, current_value, previous_value, change_24h, component_count, methodology, updated_at")
    .order("slug");

  if (error) {
    if (error.message.includes("does not exist")) {
      return NextResponse.json(
        { indices: [], status: "table_missing" },
        { headers: corsHeaders }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }

  return NextResponse.json(
    {
      indices: (data ?? []).map((r) => ({
        ...r,
        current_value: Number(r.current_value),
        previous_value: r.previous_value != null ? Number(r.previous_value) : null,
        change_24h: r.change_24h != null ? Number(r.change_24h) : null,
      })),
    },
    { headers: corsHeaders }
  );
}
