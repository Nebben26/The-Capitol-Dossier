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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const t0 = Date.now();
  const auth = await validateApiKey(req);
  if (!auth.ok) {
    await logApiRequest(null, null, "/api/v1/whales/:address", auth.status);
    return errorResponse(auth.status, auth.error);
  }

  const { key } = auth;
  const { address } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Whale summary
  const { data: whale, error: wErr } = await supabase
    .from("whales")
    .select("address, display_name, total_pnl, total_volume, accuracy, win_rate, positions_count, markets_traded, rank, updated_at")
    .eq("address", address)
    .maybeSingle();

  if (wErr) {
    await logApiRequest(key.id, key.key_prefix, "/api/v1/whales/:address", 500, Date.now() - t0);
    return errorResponse(500, "Database error");
  }

  if (!whale) {
    await logApiRequest(key.id, key.key_prefix, "/api/v1/whales/:address", 404, Date.now() - t0);
    return errorResponse(404, `Whale '${address}' not found`);
  }

  // Positions (limited by tier)
  const posLimit = tierLimit(key.tier, { free: 10, pro: 100, premium: 1000 });
  const { data: positions } = await supabase
    .from("whale_positions")
    .select("market_id, outcome, current_value, pnl, avg_price, updated_at")
    .eq("whale_id", address)
    .order("current_value", { ascending: false })
    .limit(posLimit);

  const ms = Date.now() - t0;
  await logApiRequest(key.id, key.key_prefix, "/api/v1/whales/:address", 200, ms);

  return Response.json(
    {
      data: {
        ...whale,
        positions: positions ?? [],
      },
      meta: {
        positions_count: (positions ?? []).length,
        positions_limit: posLimit,
        generated_at: new Date().toISOString(),
        source: "Quiver Markets API v1",
      },
    },
    { headers: { ...CORS_HEADERS, ...rateLimitHeaders(key) } }
  );
}
