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
    await logApiRequest(null, null, "/api/v1/signals", auth.status);
    return errorResponse(auth.status, auth.error);
  }

  const { key } = auth;
  const params = req.nextUrl.searchParams;
  const type = params.get("type") ?? null;
  const minConfidence = Number(params.get("min_confidence") ?? 1);
  const maxLimit = tierLimit(key.tier, { free: 5, pro: 50, premium: 500 });
  const limit = Math.min(Number(params.get("limit") ?? maxLimit), maxLimit);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from("signals")
    .select("signal_id, type, confidence, market_id, market_question, headline, detail, stats, detected_at")
    .gte("confidence", minConfidence)
    .order("confidence", { ascending: false })
    .order("detected_at", { ascending: false })
    .limit(limit);

  if (type) query = query.eq("type", type);

  const { data, error } = await query;

  if (error) {
    // If table doesn't exist yet, return empty gracefully
    if (error.message?.includes("does not exist") || error.code === "42P01") {
      await logApiRequest(key.id, key.key_prefix, "/api/v1/signals", 200, Date.now() - t0);
      return Response.json(
        { data: [], meta: { count: 0, note: "Signals table not yet created", generated_at: new Date().toISOString(), tier: key.tier } },
        { headers: { ...CORS_HEADERS, ...rateLimitHeaders(key) } }
      );
    }
    await logApiRequest(key.id, key.key_prefix, "/api/v1/signals", 500, Date.now() - t0);
    return errorResponse(500, "Database error");
  }

  const ms = Date.now() - t0;
  await logApiRequest(key.id, key.key_prefix, "/api/v1/signals", 200, ms);

  return Response.json(
    {
      data: data ?? [],
      meta: {
        count: (data ?? []).length,
        filters: { type, min_confidence: minConfidence },
        tier_limit: maxLimit,
        generated_at: new Date().toISOString(),
        tier: key.tier,
      },
    },
    { headers: { ...CORS_HEADERS, ...rateLimitHeaders(key) } }
  );
}
