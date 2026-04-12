import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  validateApiKey,
  logApiRequest,
  CORS_HEADERS,
  rateLimitHeaders,
  errorResponse,
} from "@/lib/api-auth";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const t0 = Date.now();
  const auth = await validateApiKey(req);
  if (!auth.ok) {
    await logApiRequest(null, null, "/api/v1/markets/:id", auth.status);
    return errorResponse(auth.status, auth.error);
  }

  const { key } = auth;
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("markets")
    .select("id, question, category, platform, price, volume, change_24h, end_date, days_left, resolved, resolution, created_at, description, poly_url, kalshi_url")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    await logApiRequest(key.id, key.key_prefix, "/api/v1/markets/:id", 500, Date.now() - t0);
    return errorResponse(500, "Database error");
  }

  if (!data) {
    await logApiRequest(key.id, key.key_prefix, "/api/v1/markets/:id", 404, Date.now() - t0);
    return errorResponse(404, `Market '${id}' not found`);
  }

  const ms = Date.now() - t0;
  await logApiRequest(key.id, key.key_prefix, "/api/v1/markets/:id", 200, ms);

  return Response.json(
    {
      data,
      meta: {
        generated_at: new Date().toISOString(),
        source: "Quiver Markets API v1",
      },
    },
    { headers: { ...CORS_HEADERS, ...rateLimitHeaders(key) } }
  );
}
