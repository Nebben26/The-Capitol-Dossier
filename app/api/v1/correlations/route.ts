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
    await logApiRequest(null, null, "/api/v1/correlations", auth.status);
    return errorResponse(auth.status, auth.error);
  }

  const { key } = auth;
  const params = req.nextUrl.searchParams;
  const minStrength = Math.max(0, Math.min(1, Number(params.get("min_strength") ?? 0.5)));
  const category = params.get("category") ?? null;
  const direction = params.get("direction"); // "positive" | "negative" | null
  const maxLimit = tierLimit(key.tier, { free: 25, pro: 200, premium: 2000 });
  const limit = Math.min(Number(params.get("limit") ?? maxLimit), maxLimit);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from("market_correlations")
    .select("market_a_id, market_b_id, question_a, question_b, category_a, category_b, correlation, sample_count, computed_at")
    .order("correlation", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (minStrength > 0) query = query.gte("correlation", minStrength);
  if (category) query = query.or(`category_a.eq.${category},category_b.eq.${category}`);
  if (direction === "negative") query = query.lt("correlation", 0);
  if (direction === "positive") query = query.gt("correlation", 0);

  const { data, error } = await query;

  if (error) {
    await logApiRequest(key.id, key.key_prefix, "/api/v1/correlations", 500, Date.now() - t0);
    return errorResponse(500, "Database error");
  }

  const ms = Date.now() - t0;
  await logApiRequest(key.id, key.key_prefix, "/api/v1/correlations", 200, ms);

  return Response.json(
    {
      data: data ?? [],
      meta: {
        count: (data ?? []).length,
        filters: { min_strength: minStrength, category, direction },
        note: "Pearson correlations computed on 30-day returns. Bonferroni-adjusted p < 0.05 threshold.",
        generated_at: new Date().toISOString(),
        source: "Quiver Markets API v1",
      },
    },
    { headers: { ...CORS_HEADERS, ...rateLimitHeaders(key) } }
  );
}
