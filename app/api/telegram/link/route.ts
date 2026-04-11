import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the caller is a logged-in user
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate a one-time link token (15-minute TTL)
    const linkToken = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Check if a subscriber row already exists for this user
    const { data: existing } = await supabase
      .from("telegram_subscribers")
      .select("id, chat_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      // Update the existing row with a fresh link token
      const { error: updateError } = await supabase
        .from("telegram_subscribers")
        .update({
          link_token: linkToken,
          link_token_expires_at: expiresAt.toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;
    } else {
      // Create a new subscriber row (chat_id placeholder = 0 until linked)
      const { error: insertError } = await supabase
        .from("telegram_subscribers")
        .insert({
          user_id: user.id,
          chat_id: 0,
          link_token: linkToken,
          link_token_expires_at: expiresAt.toISOString(),
          active: false,
        });

      if (insertError) throw insertError;
    }

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "quivermarkets_bot";
    const telegramUrl = `https://t.me/${botUsername}?start=${linkToken}`;

    return NextResponse.json({
      success: true,
      link: telegramUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[telegram/link] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
