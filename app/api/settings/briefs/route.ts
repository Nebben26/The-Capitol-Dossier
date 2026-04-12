import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify the user
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = userData.user.id;

  // Verify tier
  const { data: tierData } = await supabaseAdmin
    .from("user_tiers")
    .select("tier")
    .eq("user_id", userId)
    .maybeSingle();

  const TIER_RANK: Record<string, number> = { free: 0, pro: 1, trader: 1, signal_desk: 2, quant: 3 };
  const tier = tierData?.tier ?? "free";
  if ((TIER_RANK[tier] ?? 0) < 1) {
    return Response.json({ error: "Pro subscription required for custom branding" }, { status: 403 });
  }

  const body = await req.json();
  const { category, delivery_method, custom_branding, active } = body;

  const VALID_CATEGORIES = ["Elections", "Crypto", "Economics", "Geopolitics", "Sports"];
  if (!VALID_CATEGORIES.includes(category)) {
    return Response.json({ error: "Invalid category" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("brief_subscriptions")
    .upsert(
      {
        user_id: userId,
        category,
        delivery_method: delivery_method ?? "rss",
        custom_branding: custom_branding || null,
        active: active ?? true,
      },
      { onConflict: "user_id,category" }
    );

  if (error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
