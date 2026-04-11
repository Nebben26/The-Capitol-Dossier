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

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const category = decodeURIComponent(slug);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: markets } = await supabase
      .from("markets")
      .select("id, question, price, change_24h, volume, platform")
      .ilike("category", category)
      .eq("resolved", false)
      .order("volume", { ascending: false })
      .limit(5);

    if (!markets || markets.length === 0) {
      return NextResponse.json({ error: "No markets found for category" }, { status: 404, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    supabaseAdmin.from("embed_views").insert({
      widget_type: "category",
      resource_id: category,
      referrer: req.headers.get("referer") ?? null,
      user_agent: req.headers.get("user-agent") ?? null,
    }).then(() => undefined, () => undefined);

    return NextResponse.json({
      category,
      markets: markets.map((m) => ({
        id: m.id,
        question: m.question,
        price: Number(m.price),
        change24h: Number(m.change_24h ?? 0),
        volume: Number(m.volume ?? 0),
        platform: m.platform,
        url: `https://quivermarkets.com/markets/${m.id}`,
      })),
      fetchedAt: new Date().toISOString(),
    }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
