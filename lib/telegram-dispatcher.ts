// lib/telegram-dispatcher.ts
// Dispatches alert messages to all eligible Telegram subscribers.
// Called from scripts/ingest.ts after new disagreements or whale positions are found.
// Uses service role to bypass RLS — only call from server-side / ingest context.

import { createClient } from "@supabase/supabase-js";
import { sendMessage } from "@/lib/telegram";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ArbAlert {
  type: "arb_spread";
  marketId: string;
  question: string;
  spreadPt: number;
  polyPrice: number;
  kalshiPrice: number;
  category: string;
  url: string;
}

export interface WhaleAlert {
  type: "whale_position";
  whaleName: string;
  marketQuestion: string;
  positionUsd: number;
  side: "yes" | "no";
  category: string;
  url: string;
}

export type TelegramAlert = ArbAlert | WhaleAlert;

export async function dispatchAlert(alert: TelegramAlert): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  const now = new Date();

  // Find all active subscribers (not paused or past pause window)
  const { data: subscribers, error } = await supabase
    .from("telegram_subscribers")
    .select("*")
    .eq("active", true)
    .gt("chat_id", 0); // exclude placeholder rows that haven't been linked yet

  if (error) {
    console.error("[telegram-dispatcher] fetch subscribers error:", error.message);
    return { sent, failed };
  }

  if (!subscribers || subscribers.length === 0) return { sent, failed };

  for (const sub of subscribers) {
    // Skip paused subscribers
    if (sub.paused_until && new Date(sub.paused_until) > now) continue;

    // Reset daily counter if the reset window has passed (24h)
    const resetTime = new Date(sub.alerts_today_reset_at);
    let alertsToday = sub.alerts_today;
    if (now.getTime() - resetTime.getTime() > 24 * 60 * 60 * 1000) {
      await supabase
        .from("telegram_subscribers")
        .update({ alerts_today: 0, alerts_today_reset_at: now.toISOString() })
        .eq("id", sub.id);
      alertsToday = 0;
    }

    // Enforce daily limit
    if (alertsToday >= sub.max_alerts_per_day) continue;

    // Check alert type preferences
    if (alert.type === "arb_spread" && !sub.alert_arb_spreads) continue;
    if (alert.type === "whale_position" && !sub.alert_whale_activity) continue;

    // Check thresholds
    if (alert.type === "arb_spread" && alert.spreadPt < sub.min_spread_pt) continue;
    if (alert.type === "whale_position" && alert.positionUsd < sub.min_whale_position_usd) continue;

    // Check category filter (null/empty means all categories)
    if (sub.categories && sub.categories.length > 0) {
      if (!sub.categories.includes(alert.category)) continue;
    }

    // Format and send
    const text = formatAlertMessage(alert);
    const result = await sendMessage({
      chat_id: sub.chat_id,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });

    // Log delivery regardless of success/failure
    await supabase.from("telegram_alerts_sent").insert({
      subscriber_id: sub.id,
      alert_type: alert.type,
      payload: alert as unknown as Record<string, unknown>,
      delivery_status: result.success ? "sent" : "failed",
      telegram_message_id: result.messageId ?? null,
      error_message: result.error ?? null,
    });

    if (result.success) {
      sent++;
      await supabase
        .from("telegram_subscribers")
        .update({ alerts_today: alertsToday + 1 })
        .eq("id", sub.id);
    } else {
      failed++;
      // If Telegram says the chat was blocked/deleted, deactivate the subscriber
      if (result.error?.includes("bot was blocked") || result.error?.includes("chat not found")) {
        await supabase
          .from("telegram_subscribers")
          .update({ active: false })
          .eq("id", sub.id);
      }
    }
  }

  return { sent, failed };
}

function formatAlertMessage(alert: TelegramAlert): string {
  if (alert.type === "arb_spread") {
    const spread = alert.spreadPt.toFixed(1);
    const poly = alert.polyPrice;
    const kalshi = alert.kalshiPrice;
    const higher = poly > kalshi ? "Polymarket" : "Kalshi";
    const lower = poly > kalshi ? "Kalshi" : "Polymarket";
    return (
      `🎯 *New Arb Spread — ${alert.category}*\n\n` +
      `*${spread}pt spread*\n` +
      `${alert.question}\n\n` +
      `${higher}: ${Math.max(poly, kalshi)}¢   ${lower}: ${Math.min(poly, kalshi)}¢\n\n` +
      `[View on Quiver](${alert.url})`
    );
  }

  if (alert.type === "whale_position") {
    const sizeK = (alert.positionUsd / 1000).toFixed(0);
    const side = alert.side.toUpperCase();
    return (
      `🐋 *Whale Activity — ${alert.category}*\n\n` +
      `*${alert.whaleName}* took a *$${sizeK}K ${side}* position\n\n` +
      `${alert.marketQuestion}\n\n` +
      `[View on Quiver](${alert.url})`
    );
  }

  return "Unknown alert type";
}
