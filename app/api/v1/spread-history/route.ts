import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  validateApiKey,
  logApiRequest,
  CORS_HEADERS,
  rateLimitHeaders,
  errorResponse,
  tierBlocked,
} from "@/lib/api-auth";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const t0 = Date.now();
  const auth = await validateApiKey(req);
  if (!auth.ok) {
    await logApiRequest(null, null, "/api/v1/spread-history", auth.status);
    return errorResponse(auth.status, auth.error);
  }

  const { key } = auth;

  if (tierBlocked(key.tier, "pro")) {
    await logApiRequest(key.id, key.key_prefix, "/api/v1/spread-history", 403, Date.now() - t0);
    return errorResponse(403, "Upgrade to Pro to access spread history. Visit quivermarkets.com/pricing");
  }

  const params = req.nextUrl.searchParams;
  const marketId = params.get("market_id");
  if (!marketId) return errorResponse(400, "market_id query parameter is required");

  const maxHours = key.tier === "premium" ? 168 * 4 : 168; // 4 weeks for premium, 7 days for pro
  const hours = Math.min(Number(params.get("hours") ?? maxHours), maxHours);
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("spread_snapshots")
    .select("market_id, polymarket_price, kalshi_price, spread, direction, captured_at")
    .eq("market_id", marketId)
    .gte("captured_at", since)
    .order("captured_at", { ascending: true })
    .limit(5000);

  if (error) {
    // Graceful fallback: table may not exist yet
    if (error.message?.includes("does not exist")) {
      await logApiRequest(key.id, key.key_prefix, "/api/v1/spread-history", 200, Date.now() - t0);
      return Response.json(
        { data: [], meta: { count: 0, market_id: marketId, hours_requested: hours, note: "Spread history accumulating — check back after the next ingest cycle.", generated_at: new Date().toISOString(), tier: key.tier } },
        { headers: { ...CORS_HEADERS, ...rateLimitHeaders(key) } }
      );
    }
    await logApiRequest(key.id, key.key_prefix, "/api/v1/spread-history", 500, Date.now() - t0);
    return errorResponse(500, "Database error");
  }

  const ms = Date.now() - t0;
  await logApiRequest(key.id, key.key_prefix, "/api/v1/spread-history", 200, ms);

  return Response.json(
    {
      data: data ?? [],
      meta: {
        count: (data ?? []).length,
        market_id: marketId,
        hours_requested: hours,
        hours_available: maxHours,
        generated_at: new Date().toISOString(),
        tier: key.tier,
      },
    },
    { headers: { ...CORS_HEADERS, ...rateLimitHeaders(key) } }
  );
}
