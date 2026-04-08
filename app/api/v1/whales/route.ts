import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  validateApiKey,
  logApiRequest,
  CORS_HEADERS,
  rateLimitHeaders,
  errorResponse,
  tierLimit,
} from "@/lib/api-auth";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const t0 = Date.now();
  const auth = await validateApiKey(req);
  if (!auth.ok) {
    await logApiRequest(null, null, "/api/v1/whales", auth.status);
    return errorResponse(auth.status, auth.error);
  }

  const { key } = auth;
  const params = req.nextUrl.searchParams;
  const sort = params.get("sort") === "accuracy" ? "accuracy" : "total_pnl";
  const category = params.get("category") ?? null;
  const maxLimit = tierLimit(key.tier, { free: 25, pro: 100, premium: 1000 });
  const limit = Math.min(Number(params.get("limit") ?? maxLimit), maxLimit);
  const includePositions = key.tier !== "free" && params.get("include_positions") === "true";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from("whales")
    .select("address, display_name, total_pnl, total_volume, accuracy, win_rate, positions_count, markets_traded, rank")
    .order(sort, { ascending: false })
    .limit(limit);

  const { data: whaleRows, error } = await query;

  if (error) {
    await logApiRequest(key.id, key.key_prefix, "/api/v1/whales", 500, Date.now() - t0);
    return errorResponse(500, "Database error");
  }

  let whales: any[] = (whaleRows ?? []).map((w: any) => ({
    address: w.address,
    display_name: w.display_name || null,
    total_pnl: w.total_pnl,
    total_volume: w.total_volume,
    accuracy: w.accuracy,
    win_rate: w.win_rate,
    positions_count: w.positions_count,
    markets_traded: w.markets_traded,
    rank: w.rank,
  }));

  // Optionally attach position count per whale (pro+)
  if (includePositions && whales.length > 0) {
    const addresses = whales.map((w: any) => w.address);
    const { data: posCounts } = await supabase
      .from("whale_positions")
      .select("whale_id")
      .in("whale_id", addresses);

    const countMap: Record<string, number> = {};
    for (const p of posCounts ?? []) {
      countMap[p.whale_id] = (countMap[p.whale_id] || 0) + 1;
    }
    whales = whales.map((w: any) => ({ ...w, position_count: countMap[w.address] ?? 0 }));
  }

  const ms = Date.now() - t0;
  await logApiRequest(key.id, key.key_prefix, "/api/v1/whales", 200, ms);

  return Response.json(
    {
      data: whales,
      meta: {
        count: whales.length,
        sort,
        tier_limit: maxLimit,
        generated_at: new Date().toISOString(),
        tier: key.tier,
      },
    },
    { headers: { ...CORS_HEADERS, ...rateLimitHeaders(key) } }
  );
}
