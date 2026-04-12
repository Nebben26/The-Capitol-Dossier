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

export const runtime = "edge";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const t0 = Date.now();
  const auth = await validateApiKey(req);
  if (!auth.ok) {
    await logApiRequest(null, null, "/api/v1/indices/:slug", auth.status);
    return errorResponse(auth.status, auth.error);
  }

  const { key } = auth;
  const { slug } = await params;
  const days = Math.min(Number(req.nextUrl.searchParams.get("days") ?? 30), tierLimit(key.tier, { free: 7, pro: 30, premium: 365 }));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [indexRes, historyRes] = await Promise.all([
    supabase
      .from("quiver_indices")
      .select("*")
      .eq("slug", slug)
      .maybeSingle(),
    supabase
      .from("quiver_index_history")
      .select("value, recorded_at")
      .eq("slug", slug)
      .gte("recorded_at", new Date(Date.now() - days * 86400000).toISOString())
      .order("recorded_at", { ascending: true })
      .limit(1000),
  ]);

  if (indexRes.error) {
    await logApiRequest(key.id, key.key_prefix, "/api/v1/indices/:slug", 500, Date.now() - t0);
    return errorResponse(500, "Database error");
  }

  if (!indexRes.data) {
    await logApiRequest(key.id, key.key_prefix, "/api/v1/indices/:slug", 404, Date.now() - t0);
    return errorResponse(404, `Index '${slug}' not found`);
  }

  const ms = Date.now() - t0;
  await logApiRequest(key.id, key.key_prefix, "/api/v1/indices/:slug", 200, ms);

  return Response.json(
    {
      data: {
        ...indexRes.data,
        history: historyRes.data ?? [],
      },
      meta: {
        history_days: days,
        history_points: (historyRes.data ?? []).length,
        generated_at: new Date().toISOString(),
        source: "Quiver Markets API v1",
      },
    },
    { headers: { ...CORS_HEADERS, ...rateLimitHeaders(key) } }
  );
}
