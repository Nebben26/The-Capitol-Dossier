import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── helpers ──────────────────────────────────────────────────────────────────

async function recomputeConsensus(marketId: string) {
  const { data: rows } = await supabaseAdmin
    .from("community_predictions")
    .select("predicted_prob, confidence, market_question")
    .eq("market_id", marketId);

  if (!rows || rows.length === 0) {
    await supabaseAdmin
      .from("market_consensus_cache")
      .delete()
      .eq("market_id", marketId);
    return;
  }

  const totalWeight = rows.reduce((s, r) => s + r.confidence, 0);
  const weightedSum = rows.reduce((s, r) => s + r.predicted_prob * r.confidence, 0);
  const rawSum = rows.reduce((s, r) => s + r.predicted_prob, 0);
  const consensusProb = totalWeight > 0 ? weightedSum / totalWeight : rawSum / rows.length;
  const rawMean = rawSum / rows.length;
  const avgConf = totalWeight / rows.length;
  const question = rows[0]?.market_question ?? "";

  await supabaseAdmin
    .from("market_consensus_cache")
    .upsert({
      market_id: marketId,
      market_question: question,
      consensus_prob: Math.round(consensusProb * 100) / 100,
      raw_mean: Math.round(rawMean * 100) / 100,
      vote_count: rows.length,
      avg_confidence: Math.round(avgConf * 100) / 100,
      last_updated: new Date().toISOString(),
    }, { onConflict: "market_id" });
}

// ─── GET /api/community-predictions?market_id=... ────────────────────────────
// Returns consensus + (if authenticated) user's own prediction

export async function GET(req: NextRequest) {
  const marketId = req.nextUrl.searchParams.get("market_id") ?? "";
  if (!marketId) {
    return NextResponse.json({ error: "market_id required" }, { status: 400 });
  }

  // Consensus cache
  const { data: cache } = await supabaseAdmin
    .from("market_consensus_cache")
    .select("*")
    .eq("market_id", marketId)
    .maybeSingle();

  // Optional: resolve user's own prediction
  let ownPrediction: Record<string, unknown> | null = null;
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (token) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (user) {
      const { data: own } = await supabaseAdmin
        .from("community_predictions")
        .select("*")
        .eq("user_id", user.id)
        .eq("market_id", marketId)
        .maybeSingle();
      ownPrediction = own ?? null;
    }
  }

  return NextResponse.json({ consensus: cache ?? null, own: ownPrediction });
}

// ─── POST /api/community-predictions ─────────────────────────────────────────
// Upsert prediction for authenticated user

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const market_id = (body.market_id ?? "").trim();
  const market_question = (body.market_question ?? "").trim().slice(0, 500);
  const predicted_prob = Number(body.predicted_prob);
  const confidence = Number(body.confidence ?? 2);

  if (!market_id || !market_question) {
    return NextResponse.json({ error: "market_id and market_question required" }, { status: 400 });
  }
  if (!Number.isInteger(predicted_prob) || predicted_prob < 1 || predicted_prob > 99) {
    return NextResponse.json({ error: "predicted_prob must be 1–99" }, { status: 400 });
  }
  if (![1, 2, 3].includes(confidence)) {
    return NextResponse.json({ error: "confidence must be 1, 2, or 3" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("community_predictions")
    .upsert(
      { user_id: user.id, market_id, market_question, predicted_prob, confidence },
      { onConflict: "user_id,market_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recomputeConsensus(market_id);

  return NextResponse.json({ prediction: data }, { status: 200 });
}

// ─── DELETE /api/community-predictions?market_id=... ─────────────────────────

export async function DELETE(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const marketId = req.nextUrl.searchParams.get("market_id") ?? "";
  if (!marketId) return NextResponse.json({ error: "market_id required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("community_predictions")
    .delete()
    .eq("user_id", user.id)
    .eq("market_id", marketId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recomputeConsensus(marketId);

  return NextResponse.json({ ok: true });
}
