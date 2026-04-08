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
    await logApiRequest(null, null, "/api/v1/disagreements", auth.status);
    return errorResponse(auth.status, auth.error);
  }

  const { key } = auth;
  const params = req.nextUrl.searchParams;
  const minSpread = Number(params.get("min_spread") ?? 0);
  const category = params.get("category") ?? null;
  const maxLimit = tierLimit(key.tier, { free: 10, pro: 100, premium: 1000 });
  const limit = Math.min(Number(params.get("limit") ?? maxLimit), maxLimit);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from("disagreements")
    .select("id, question, poly_market_id, kalshi_market_id, poly_price, kalshi_price, spread, category, direction, spread_trend, convergence_rate, updated_at")
    .order("spread", { ascending: false })
    .limit(limit);

  if (minSpread > 0) query = query.gte("spread", minSpread);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;

  if (error) {
    await logApiRequest(key.id, key.key_prefix, "/api/v1/disagreements", 500, Date.now() - t0);
    return errorResponse(500, "Database error");
  }

  const ms = Date.now() - t0;
  await logApiRequest(key.id, key.key_prefix, "/api/v1/disagreements", 200, ms);

  return Response.json(
    {
      data: data ?? [],
      meta: {
        count: (data ?? []).length,
        generated_at: new Date().toISOString(),
        tier: key.tier,
        tier_limit: maxLimit,
        filters: { min_spread: minSpread, category },
      },
    },
    { headers: { ...CORS_HEADERS, ...rateLimitHeaders(key) } }
  );
}
