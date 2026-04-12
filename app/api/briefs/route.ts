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

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const params = req.nextUrl.searchParams;
  const category = params.get("category");
  const limit = Math.min(Number(params.get("limit") ?? 20), 100);

  let query = supabase
    .from("market_briefs")
    .select("id, slug, category, title, generated_at, source_market_count, word_count")
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (category) {
    // normalize: capitalize first letter
    const normalized = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    query = query.eq("category", normalized);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json({ error: "Database error" }, { status: 500, headers: CORS });
  }

  return Response.json(
    {
      data: data ?? [],
      meta: {
        count: (data ?? []).length,
        generated_at: new Date().toISOString(),
      },
    },
    { headers: CORS }
  );
}
