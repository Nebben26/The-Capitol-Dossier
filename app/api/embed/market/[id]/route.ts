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

    const { data: market } = await supabase
      .from("markets")
      .select("id, question, price, change_24h, volume, category, platform, end_date, resolved")
      .eq("id", id)
      .maybeSingle();

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404, headers: corsHeaders });
    }

    // Best-effort view log (fire and forget)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    supabaseAdmin.from("embed_views").insert({
      widget_type: "market",
      resource_id: id,
      referrer: req.headers.get("referer") ?? null,
      user_agent: req.headers.get("user-agent") ?? null,
    }).then(() => undefined, () => undefined);

    return NextResponse.json({
      id: market.id,
      question: market.question,
      price: Number(market.price),
      change24h: Number(market.change_24h ?? 0),
      volume: Number(market.volume ?? 0),
      category: market.category,
      platform: market.platform,
      endDate: market.end_date,
      resolved: market.resolved,
      url: `https://quivermarkets.com/markets/${market.id}`,
      fetchedAt: new Date().toISOString(),
    }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
