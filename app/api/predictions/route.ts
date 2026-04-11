import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/predictions — submit a new prediction
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // User must have a profile
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Create a public profile first." }, { status: 403 });
  }

  const body = await req.json();
  const market_id = (body.market_id ?? "").trim();
  const market_question = (body.market_question ?? "").trim().slice(0, 500);
  const outcome = (body.outcome ?? "").trim().slice(0, 100);
  const predicted_prob = Number(body.predicted_prob);
  const conviction = body.conviction ?? "medium";
  const reasoning = (body.reasoning ?? "").trim().slice(0, 1000) || null;

  if (!market_id || !market_question || !outcome) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!Number.isInteger(predicted_prob) || predicted_prob < 1 || predicted_prob > 99) {
    return NextResponse.json({ error: "predicted_prob must be 1-99." }, { status: 400 });
  }
  if (!["low", "medium", "high"].includes(conviction)) {
    return NextResponse.json({ error: "conviction must be low, medium, or high." }, { status: 400 });
  }

  // Prevent duplicate predictions on the same market
  const { data: existing } = await supabaseAdmin
    .from("user_predictions")
    .select("id")
    .eq("user_id", user.id)
    .eq("market_id", market_id)
    .eq("is_resolved", false)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You already have an open prediction for this market." }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from("user_predictions")
    .insert({
      user_id: user.id,
      profile_id: profile.id,
      market_id,
      market_question,
      outcome,
      predicted_prob,
      conviction,
      reasoning,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prediction: data }, { status: 201 });
}

// DELETE /api/predictions?id=<uuid> — delete own prediction
export async function DELETE(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("user_predictions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);  // scoped to owner

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
