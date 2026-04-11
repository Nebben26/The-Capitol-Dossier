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

export async function GET(req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await params;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: whale } = await supabase
      .from("whales")
      .select("address, name, pnl, open_positions, accuracy_pct, volume")
      .eq("address", address)
      .maybeSingle();

    if (!whale) {
      return NextResponse.json({ error: "Whale not found" }, { status: 404, headers: corsHeaders });
    }

    // Grab top 3 recent trades
    const { data: trades } = await supabase
      .from("whale_trades")
      .select("market_id, outcome, size, price, side, created_at")
      .eq("whale_id", address)
      .order("created_at", { ascending: false })
      .limit(3);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    supabaseAdmin.from("embed_views").insert({
      widget_type: "whale",
      resource_id: address,
      referrer: req.headers.get("referer") ?? null,
      user_agent: req.headers.get("user-agent") ?? null,
    }).then(() => undefined, () => undefined);

    const shortAddr = `${address.slice(0, 6)}…${address.slice(-4)}`;

    return NextResponse.json({
      address: whale.address,
      displayName: whale.name ?? shortAddr,
      totalPnl: Number(whale.pnl ?? 0),
      openPositions: Number(whale.open_positions ?? 0),
      accuracyPct: whale.accuracy_pct != null ? Number(whale.accuracy_pct) : null,
      volume: Number(whale.volume ?? 0),
      recentTrades: (trades ?? []).map((t) => ({
        marketId: t.market_id,
        outcome: t.outcome,
        size: Number(t.size ?? 0),
        price: Number(t.price ?? 0),
        side: t.side,
        at: t.created_at,
      })),
      url: `https://quivermarkets.com/whales/${address}`,
      fetchedAt: new Date().toISOString(),
    }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
