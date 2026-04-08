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

export async function GET(req: NextRequest) {
  const t0 = Date.now();
  const auth = await validateApiKey(req);
  if (!auth.ok) {
    await logApiRequest(null, null, "/api/v1/flow", auth.status);
    return errorResponse(auth.status, auth.error);
  }

  const { key } = auth;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Pull all positions and aggregate by market category
  const PAGE_SIZE = 1000;
  const allPositions: any[] = [];
  for (let page = 0; page < 20; page++) {
    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .from("whale_positions")
      .select("whale_id, market_id, outcome, current_value")
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error || !data?.length) break;
    allPositions.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  // Get market categories
  const marketIds = [...new Set(allPositions.map((p) => p.market_id).filter(Boolean))];
  const categoryMap: Record<string, string> = {};
  const CHUNK = 200;
  for (let i = 0; i < marketIds.length; i += CHUNK) {
    const { data } = await supabase
      .from("markets")
      .select("id, category")
      .in("id", marketIds.slice(i, i + CHUNK));
    for (const m of data ?? []) categoryMap[m.id] = m.category || "Other";
  }

  // Aggregate
  const byCat: Record<string, { yes: number; no: number; positions: number; whales: Set<string> }> = {};
  for (const p of allPositions) {
    const cat = categoryMap[p.market_id] || "Other";
    const val = Number(p.current_value) || 0;
    if (val <= 0) continue;
    const isYes = String(p.outcome || "").toLowerCase().startsWith("y");
    if (!byCat[cat]) byCat[cat] = { yes: 0, no: 0, positions: 0, whales: new Set() };
    if (isYes) byCat[cat].yes += val; else byCat[cat].no += val;
    byCat[cat].positions += 1;
    if (p.whale_id) byCat[cat].whales.add(p.whale_id);
  }

  const flow = Object.entries(byCat)
    .map(([category, d]) => ({
      category,
      yes_value_usd: Math.round(d.yes),
      no_value_usd: Math.round(d.no),
      net_flow_usd: Math.round(d.yes - d.no),
      total_value_usd: Math.round(d.yes + d.no),
      position_count: d.positions,
      unique_whales: d.whales.size,
      direction: d.yes >= d.no ? "YES" : "NO",
    }))
    .sort((a, b) => Math.abs(b.net_flow_usd) - Math.abs(a.net_flow_usd));

  const ms = Date.now() - t0;
  await logApiRequest(key.id, key.key_prefix, "/api/v1/flow", 200, ms);

  return Response.json(
    {
      data: flow,
      meta: {
        count: flow.length,
        total_positions_analyzed: allPositions.length,
        generated_at: new Date().toISOString(),
        tier: key.tier,
      },
    },
    { headers: { ...CORS_HEADERS, ...rateLimitHeaders(key) } }
  );
}
