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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const t0 = Date.now();
  const auth = await validateApiKey(req);
  const endpoint = "/api/v1/whales/{address}/positions";

  if (!auth.ok) {
    await logApiRequest(null, null, endpoint, auth.status);
    return errorResponse(auth.status, auth.error);
  }

  const { key } = auth;

  if (tierBlocked(key.tier, "pro")) {
    await logApiRequest(key.id, key.key_prefix, endpoint, 403, Date.now() - t0);
    return errorResponse(403, "Upgrade to Pro to access whale positions. Visit quivermarkets.com/pricing");
  }

  const { address } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: positions, error } = await supabase
    .from("whale_positions")
    .select("market_id, outcome, size, avg_price, current_value, pnl, updated_at")
    .eq("whale_id", address)
    .order("current_value", { ascending: false })
    .limit(key.tier === "premium" ? 1000 : 200);

  if (error) {
    await logApiRequest(key.id, key.key_prefix, endpoint, 500, Date.now() - t0);
    return errorResponse(500, "Database error");
  }

  // Enrich with market questions
  const marketIds = [...new Set((positions ?? []).map((p: any) => p.market_id))];
  let questionMap: Record<string, string> = {};

  if (marketIds.length > 0) {
    const { data: markets } = await supabase
      .from("markets")
      .select("id, question")
      .in("id", marketIds.slice(0, 200));
    questionMap = Object.fromEntries((markets ?? []).map((m: any) => [m.id, m.question]));
  }

  const enriched = (positions ?? []).map((p: any) => ({
    market_id: p.market_id,
    market_question: questionMap[p.market_id] || null,
    outcome: p.outcome,
    size: p.size,
    avg_price: p.avg_price,
    current_value: p.current_value,
    pnl: p.pnl,
    updated_at: p.updated_at,
  }));

  const ms = Date.now() - t0;
  await logApiRequest(key.id, key.key_prefix, endpoint, 200, ms);

  return Response.json(
    {
      data: enriched,
      meta: {
        address,
        count: enriched.length,
        generated_at: new Date().toISOString(),
        tier: key.tier,
      },
    },
    { headers: { ...CORS_HEADERS, ...rateLimitHeaders(key) } }
  );
}
