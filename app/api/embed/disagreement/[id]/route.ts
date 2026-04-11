import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=60, s-maxage=60",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: d } = await supabase
      .from("disagreements")
      .select("id, question, poly_price, kalshi_price, spread, category, score, poly_market_id, kalshi_market_id")
      .eq("id", id)
      .maybeSingle();

    if (!d) {
      return NextResponse.json({ error: "Disagreement not found" }, { status: 404, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    supabaseAdmin.from("embed_views").insert({
      widget_type: "arb",
      resource_id: id,
      referrer: req.headers.get("referer") ?? null,
      user_agent: req.headers.get("user-agent") ?? null,
    }).then(() => undefined, () => undefined);

    return NextResponse.json({
      id: d.id,
      question: d.question,
      polyPrice: Number(d.poly_price ?? 0),
      kalshiPrice: Number(d.kalshi_price ?? 0),
      spread: Number(d.spread ?? 0),
      category: d.category,
      score: Number(d.score ?? 0),
      polyUrl: d.poly_market_id ? `https://polymarket.com/event/${d.poly_market_id}` : null,
      kalshiUrl: d.kalshi_market_id ? `https://kalshi.com/markets/${d.kalshi_market_id}` : null,
      disagreeUrl: `https://quivermarkets.com/disagrees`,
      fetchedAt: new Date().toISOString(),
    }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
