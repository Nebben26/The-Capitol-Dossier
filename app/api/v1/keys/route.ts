import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateApiKey, CORS_HEADERS } from "@/lib/api-auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ─── GET — list caller's keys (prefix only, never the raw key) ───────────────
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim() ?? "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: keys, error } = await supabaseAdmin
    .from("api_keys")
    .select("id, key_prefix, name, tier, rate_limit_per_minute, rate_limit_per_day, requests_today, requests_total, last_used_at, created_at, active, expires_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ keys: keys ?? [] }, { headers: CORS_HEADERS });
}

// ─── POST — create a new key (shows full key ONCE) ───────────────────────────
export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim() ?? "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name ?? "Default Key").toString().trim().slice(0, 80);

  // Enforce per-user key limit (max 5 active keys)
  const { count } = await supabaseAdmin
    .from("api_keys")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("active", true);

  if ((count ?? 0) >= 5) {
    return NextResponse.json(
      { error: "Maximum 5 active keys per user. Revoke an existing key first." },
      { status: 400 }
    );
  }

  // Determine tier from user_tiers table
  const { data: tierRow } = await supabaseAdmin
    .from("user_tiers")
    .select("tier")
    .eq("user_id", user.id)
    .maybeSingle();

  const rawTier = tierRow?.tier ?? "free";
  const tier = ["free", "pro", "premium"].includes(rawTier) ? rawTier : "free";
  const rateMinute = tier === "premium" ? 300 : tier === "pro" ? 60 : 30;
  const rateDay = tier === "premium" ? 50000 : tier === "pro" ? 5000 : 1000;

  const { key, prefix, hash } = generateApiKey();

  const { data: row, error: insertErr } = await supabaseAdmin
    .from("api_keys")
    .insert({
      user_id: user.id,
      key_hash: hash,
      key_prefix: prefix,
      name,
      tier,
      rate_limit_per_minute: rateMinute,
      rate_limit_per_day: rateDay,
    })
    .select("id, key_prefix, name, tier, rate_limit_per_minute, rate_limit_per_day, created_at")
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Return the full key ONCE — never retrievable again after this response
  return NextResponse.json(
    { key, meta: row },
    { status: 201, headers: CORS_HEADERS }
  );
}

// ─── DELETE ?id=X — revoke a key ─────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "").trim() ?? "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("api_keys")
    .update({ active: false })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}
