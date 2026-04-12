import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category: rawCategory } = await params;
  const category = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();

  const format = req.nextUrl.searchParams.get("format") ?? "json"; // markdown | html | json

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("market_briefs")
    .select("*")
    .eq("category", category)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return Response.json(
      { error: "Database error" },
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  if (!data) {
    return Response.json(
      { error: `No brief found for category: ${category}` },
      { status: 404, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  if (format === "markdown") {
    return new Response(data.brief_markdown, {
      headers: {
        ...CORS,
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `inline; filename="${data.slug}.md"`,
      },
    });
  }

  if (format === "html") {
    return new Response(data.brief_html, {
      headers: {
        ...CORS,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

  // Default: JSON envelope
  return Response.json(
    {
      data: {
        slug: data.slug,
        category: data.category,
        title: data.title,
        generated_at: data.generated_at,
        source_market_count: data.source_market_count,
        word_count: data.word_count,
        brief: data.brief_json,
      },
    },
    { headers: { ...CORS, "Content-Type": "application/json" } }
  );
}
