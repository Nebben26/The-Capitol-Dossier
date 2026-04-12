import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const minStrength = Math.max(0, Math.min(1, Number(searchParams.get("minStrength") ?? 0.7)));
  const direction = searchParams.get("direction") ?? "all"; // positive | negative | all
  const category = searchParams.get("category") ?? "";
  const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") ?? 50)));
  const sort = searchParams.get("sort") ?? "strength"; // strength | recent

  // Try market_correlations first (richer schema), fall back to correlations
  const { data, error } = await supabase
    .from("market_correlations")
    .select("market_a_id, market_b_id, correlation, sample_count, category_a, category_b, question_a, question_b, price_a, price_b, computed_at")
    .gte("correlation", direction === "negative" ? -1 : minStrength)
    .lte("correlation", direction === "positive" ? 1 : -minStrength * (direction === "negative" ? 1 : 0) + (direction === "negative" ? 0 : 1))
    .order(sort === "recent" ? "computed_at" : "correlation", { ascending: false })
    .limit(limit * 3); // over-fetch for client-side filtering

  if (error) {
    // Table may not exist yet
    if (error.message.includes("does not exist")) {
      return NextResponse.json(
        { correlations: [], status: "table_missing", message: "Run session25-price-history.sql migration first." },
        { headers: { "Cache-Control": "public, max-age=60" } }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let rows = (data ?? []).map((r) => ({
    ...r,
    correlation: Number(r.correlation),
    price_a: r.price_a != null ? Number(r.price_a) : null,
    price_b: r.price_b != null ? Number(r.price_b) : null,
  }));

  // Apply direction filter
  if (direction === "positive") rows = rows.filter((r) => r.correlation >= minStrength);
  else if (direction === "negative") rows = rows.filter((r) => r.correlation <= -minStrength);
  else rows = rows.filter((r) => Math.abs(r.correlation) >= minStrength);

  // Apply category filter
  if (category) {
    const cat = category.toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.category_a ?? "").toLowerCase() === cat ||
        (r.category_b ?? "").toLowerCase() === cat
    );
  }

  // Sort by absolute strength if requested
  if (sort === "strength") {
    rows.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  return NextResponse.json(
    { correlations: rows.slice(0, limit), total: rows.length },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
  );
}
