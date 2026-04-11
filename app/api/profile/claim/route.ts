import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const RESERVED = new Set([
  "admin","api","app","auth","blog","calendar","calibration","changelog",
  "compare","copy","disagrees","embed","flow","help","home","insights",
  "leaderboard","login","markets","me","methodology","morning-brief",
  "my","p","pipelines","pricing","profile","resolved","screener","settings",
  "signals","signup","status","stories","support","terms","watchlist","whales",
]);

function validUsername(u: string): string | null {
  if (u.length < 3 || u.length > 20) return "Username must be 3-20 characters.";
  if (!/^[a-z0-9_]+$/.test(u)) return "Only lowercase letters, numbers, and underscores.";
  if (RESERVED.has(u)) return "That username is reserved.";
  return null;
}

// GET /api/profile/claim?username=foo — availability check
export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username")?.toLowerCase().trim() ?? "";
  const err = validUsername(username);
  if (err) return NextResponse.json({ available: false, error: err });

  const { data } = await supabaseAdmin
    .from("user_profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  return NextResponse.json({ available: !data });
}

// POST /api/profile/claim — claim or update profile
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const username = (body.username ?? "").toLowerCase().trim();
  const display_name = (body.display_name ?? "").trim().slice(0, 60) || null;
  const bio = (body.bio ?? "").trim().slice(0, 280) || null;
  const twitter_handle = (body.twitter_handle ?? "").replace(/^@/, "").trim().slice(0, 50) || null;
  const website_url = (body.website_url ?? "").trim().slice(0, 200) || null;

  const err = validUsername(username);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  // Check if the username is taken by someone else
  const { data: existing } = await supabaseAdmin
    .from("user_profiles")
    .select("id, user_id")
    .eq("username", username)
    .maybeSingle();

  if (existing && existing.user_id !== user.id) {
    return NextResponse.json({ error: "Username already taken." }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .upsert(
      { user_id: user.id, username, display_name, bio, twitter_handle, website_url },
      { onConflict: "user_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
