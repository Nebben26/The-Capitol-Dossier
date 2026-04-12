import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ marketId: string }> }
) {
  const { marketId } = await params;

  // Query both sides: market_a_id = marketId OR market_b_id = marketId
  const [resA, resB] = await Promise.all([
    supabase
      .from("market_correlations")
      .select("market_a_id, market_b_id, correlation, sample_count, category_a, category_b, question_a, question_b, price_a, price_b, computed_at")
      .eq("market_a_id", marketId)
      .order("correlation", { ascending: false })
      .limit(50),
    supabase
      .from("market_correlations")
      .select("market_a_id, market_b_id, correlation, sample_count, category_a, category_b, question_a, question_b, price_a, price_b, computed_at")
      .eq("market_b_id", marketId)
      .order("correlation", { ascending: false })
      .limit(50),
  ]);

  if (resA.error && resA.error.message.includes("does not exist")) {
    return NextResponse.json(
      { correlations: [], status: "table_missing" },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  }

  // Normalise so the anchor market is always "other" — flip A/B when market is B
  const rowsA = (resA.data ?? []).map((r) => ({
    otherId: r.market_b_id,
    otherQuestion: r.question_b,
    otherCategory: r.category_b,
    otherPrice: r.price_b != null ? Number(r.price_b) : null,
    anchorQuestion: r.question_a,
    anchorPrice: r.price_a != null ? Number(r.price_a) : null,
    correlation: Number(r.correlation),
    sampleCount: r.sample_count,
    computedAt: r.computed_at,
  }));

  const rowsB = (resB.data ?? []).map((r) => ({
    otherId: r.market_a_id,
    otherQuestion: r.question_a,
    otherCategory: r.category_a,
    otherPrice: r.price_a != null ? Number(r.price_a) : null,
    anchorQuestion: r.question_b,
    anchorPrice: r.price_b != null ? Number(r.price_b) : null,
    correlation: Number(r.correlation),
    sampleCount: r.sample_count,
    computedAt: r.computed_at,
  }));

  const combined = [...rowsA, ...rowsB].sort(
    (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)
  );

  // Anchor market info from first row
  const anchor = combined[0]
    ? { id: marketId, question: combined[0].anchorQuestion, price: combined[0].anchorPrice }
    : { id: marketId, question: null, price: null };

  return NextResponse.json(
    { anchor, correlations: combined },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
  );
}
