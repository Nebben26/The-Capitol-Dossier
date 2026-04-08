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
    await logApiRequest(null, null, "/api/v1/markets", auth.status);
    return errorResponse(auth.status, auth.error);
  }

  const { key } = auth;
  const params = req.nextUrl.searchParams;
  const category = params.get("category") ?? null;
  const minVolume = Number(params.get("min_volume") ?? 0);
  const sortParam = params.get("sort") ?? "volume";
  const sort = sortParam === "change_24h" ? "change_24h" : "volume";
  const maxLimit = tierLimit(key.tier, { free: 25, pro: 200, premium: 10000 });
  const limit = Math.min(Number(params.get("limit") ?? maxLimit), maxLimit);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from("markets")
    .select(
      "id, question, category, platform, price, volume, change_24h, end_date, active, created_at"
    )
    .order(sort, { ascending: false, nullsFirst: false })
    .limit(limit);

  if (category) query = query.eq("category", category);
  if (minVolume > 0) query = query.gte("volume", minVolume);

  const { data, error } = await query;

  if (error) {
    await logApiRequest(key.id, key.key_prefix, "/api/v1/markets", 500, Date.now() - t0);
    return errorResponse(500, "Database error");
  }

  const ms = Date.now() - t0;
  await logApiRequest(key.id, key.key_prefix, "/api/v1/markets", 200, ms);

  return Response.json(
    {
      data: data ?? [],
      meta: {
        count: (data ?? []).length,
        sort,
        filters: { category, min_volume: minVolume },
        tier_limit: maxLimit,
        generated_at: new Date().toISOString(),
        tier: key.tier,
      },
    },
    { headers: { ...CORS_HEADERS, ...rateLimitHeaders(key) } }
  );
}
