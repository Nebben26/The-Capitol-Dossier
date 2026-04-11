import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMessage } from "@/lib/telegram";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  // Verify the secret token from Telegram
  const headerSecret = req.headers.get("x-telegram-bot-api-secret-token");
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expectedSecret || headerSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update = await req.json();
    const message = update.message;

    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId: number = message.chat.id;
    const text: string = message.text.trim();
    const username: string | undefined = message.from?.username;
    const firstName: string | undefined = message.from?.first_name;

    // ── /start [token] ────────────────────────────────────────────────────
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const linkToken = parts[1];

      if (linkToken) {
        // User clicked a link from the website with their token
        const { data: subscriber } = await supabase
          .from("telegram_subscribers")
          .select("id, user_id, link_token_expires_at")
          .eq("link_token", linkToken)
          .single();

        if (!subscriber) {
          await sendMessage({
            chat_id: chatId,
            text: "❌ Invalid or expired link. Visit https://quivermarkets.com/settings/telegram to generate a new one.",
          });
          return NextResponse.json({ ok: true });
        }

        if (
          subscriber.link_token_expires_at &&
          new Date(subscriber.link_token_expires_at) < new Date()
        ) {
          await sendMessage({
            chat_id: chatId,
            text: "❌ This link has expired. Visit https://quivermarkets.com/settings/telegram to generate a new one.",
          });
          return NextResponse.json({ ok: true });
        }

        // Link the chat to the user account
        await supabase
          .from("telegram_subscribers")
          .update({
            chat_id: chatId,
            telegram_username: username ?? null,
            first_name: firstName ?? null,
            link_token: null,
            link_token_expires_at: null,
            active: true,
            linked_at: new Date().toISOString(),
          })
          .eq("id", subscriber.id);

        await sendMessage({
          chat_id: chatId,
          text: `✅ *Linked successfully!*\n\nYou'll now receive alerts for:\n• Cross-platform arbitrage spreads ≥ 10pt\n• Whale positions ≥ $50K\n\nUse /settings to open the web preferences page.\nUse /pause to take a break.`,
          parse_mode: "Markdown",
        });
      } else {
        // /start without token — first contact, explain how to link
        await sendMessage({
          chat_id: chatId,
          text: `👋 Welcome to *Quiver Markets Alerts*\n\nTo link your account and start receiving real-time prediction market alerts, visit:\nhttps://quivermarkets.com/settings/telegram\n\nThen click *Connect Telegram* to get your personalized link.`,
          parse_mode: "Markdown",
        });
      }

      return NextResponse.json({ ok: true });
    }

    // ── /status ───────────────────────────────────────────────────────────
    if (text === "/status") {
      const { data: sub } = await supabase
        .from("telegram_subscribers")
        .select("*")
        .eq("chat_id", chatId)
        .single();

      if (!sub || !sub.active) {
        await sendMessage({
          chat_id: chatId,
          text: "Not linked. Visit https://quivermarkets.com/settings/telegram to link your account.",
        });
      } else {
        const now = new Date();
        const isPaused = sub.paused_until && new Date(sub.paused_until) > now;
        const pauseStatus = isPaused
          ? `⏸ Paused until ${new Date(sub.paused_until).toLocaleString()}`
          : "✅ Active";

        await sendMessage({
          chat_id: chatId,
          text: `*Your Alert Status*\n\n${pauseStatus}\n\nMin spread: ${sub.min_spread_pt}pt\nMin whale position: $${Number(sub.min_whale_position_usd).toLocaleString()}\nAlerts today: ${sub.alerts_today}/${sub.max_alerts_per_day}\n\nManage preferences at:\nhttps://quivermarkets.com/settings/telegram`,
          parse_mode: "Markdown",
        });
      }
      return NextResponse.json({ ok: true });
    }

    // ── /pause [1h|1d|forever] ────────────────────────────────────────────
    if (text.startsWith("/pause")) {
      const parts = text.split(" ");
      const duration = parts[1] || "1h";

      let pausedUntil: Date;
      if (duration === "1d") pausedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      else if (duration === "forever") pausedUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      else pausedUntil = new Date(Date.now() + 60 * 60 * 1000); // default 1h

      await supabase
        .from("telegram_subscribers")
        .update({ paused_until: pausedUntil.toISOString() })
        .eq("chat_id", chatId);

      await sendMessage({
        chat_id: chatId,
        text: `⏸ Alerts paused until ${pausedUntil.toLocaleString()}.\nUse /resume to enable them sooner.`,
      });
      return NextResponse.json({ ok: true });
    }

    // ── /resume ───────────────────────────────────────────────────────────
    if (text === "/resume") {
      await supabase
        .from("telegram_subscribers")
        .update({ paused_until: null, active: true })
        .eq("chat_id", chatId);

      await sendMessage({
        chat_id: chatId,
        text: "✅ Alerts resumed. You'll start receiving notifications again.",
      });
      return NextResponse.json({ ok: true });
    }

    // ── /settings ─────────────────────────────────────────────────────────
    if (text === "/settings") {
      await sendMessage({
        chat_id: chatId,
        text: "⚙️ Manage your alert preferences at:\nhttps://quivermarkets.com/settings/telegram",
      });
      return NextResponse.json({ ok: true });
    }

    // ── /help ─────────────────────────────────────────────────────────────
    if (text === "/help") {
      await sendMessage({
        chat_id: chatId,
        text: `*Available commands:*\n\n/start — Link your account\n/status — View subscription status\n/pause [1h|1d|forever] — Pause alerts\n/resume — Resume alerts\n/settings — Open web preferences\n/help — Show this message`,
        parse_mode: "Markdown",
      });
      return NextResponse.json({ ok: true });
    }

    // ── Unknown command ───────────────────────────────────────────────────
    await sendMessage({
      chat_id: chatId,
      text: "Unknown command. Use /help to see available commands.",
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[telegram/webhook] error:", message);
    // Return 200 to Telegram even on error — otherwise Telegram retries endlessly
    return NextResponse.json({ ok: true, error: message });
  }
}
