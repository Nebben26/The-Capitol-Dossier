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
    await logApiRequest(null, null, "/api/v1/disagreements/history", auth.status);
    return errorResponse(auth.status, auth.error);
  }

  const { key } = auth;

  if (tierBlocked(key.tier, "pro")) {
    await logApiRequest(key.id, key.key_prefix, "/api/v1/disagreements/history", 403, Date.now() - t0);
    return errorResponse(403, "Upgrade to Pro to access spread history. Visit quivermarkets.com/pricing");
  }

  const params = req.nextUrl.searchParams;
  const marketId = params.get("market_id");
  if (!marketId) return errorResponse(400, "market_id query parameter is required");

  const maxDays = key.tier === "premium" ? 90 : 7;
  const days = Math.min(Number(params.get("days") ?? maxDays), maxDays);
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("disagreement_snapshots")
    .select("poly_market_id, kalshi_market_id, spread, captured_at")
    .eq("poly_market_id", marketId)
    .gte("captured_at", since)
    .order("captured_at", { ascending: true })
    .limit(5000);

  if (error) {
    await logApiRequest(key.id, key.key_prefix, "/api/v1/disagreements/history", 500, Date.now() - t0);
    return errorResponse(500, "Database error");
  }

  const ms = Date.now() - t0;
  await logApiRequest(key.id, key.key_prefix, "/api/v1/disagreements/history", 200, ms);

  return Response.json(
    {
      data: data ?? [],
      meta: {
        count: (data ?? []).length,
        market_id: marketId,
        days_requested: days,
        days_available: maxDays,
        generated_at: new Date().toISOString(),
        tier: key.tier,
      },
    },
    { headers: { ...CORS_HEADERS, ...rateLimitHeaders(key) } }
  );
}
