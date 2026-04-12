import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  validateApiKey,
  logApiRequest,
  CORS_HEADERS,
  rateLimitHeaders,
  errorResponse,
} from "@/lib/api-auth";

export const runtime = "edge";

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const t0 = Date.now();
  const auth = await validateApiKey(req);
  if (!auth.ok) {
    await logApiRequest(null, null, "/api/v1/indices", auth.status);
    return errorResponse(auth.status, auth.error);
  }

  const { key } = auth;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("quiver_indices")
    .select("slug, name, current_value, change_24h, component_count, methodology, updated_at")
    .order("slug");

  if (error) {
    await logApiRequest(key.id, key.key_prefix, "/api/v1/indices", 500, Date.now() - t0);
    return errorResponse(500, "Database error");
  }

  const ms = Date.now() - t0;
  await logApiRequest(key.id, key.key_prefix, "/api/v1/indices", 200, ms);

  return Response.json(
    {
      data: data ?? [],
      meta: {
        count: (data ?? []).length,
        note: "Values on a 0–100 scale. Updated every ~30 minutes during ingestion cycles.",
        generated_at: new Date().toISOString(),
        source: "Quiver Markets API v1",
      },
    },
    { headers: { ...CORS_HEADERS, ...rateLimitHeaders(key) } }
  );
}
