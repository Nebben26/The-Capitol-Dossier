// lib/telegram.ts
// Thin wrapper around the Telegram Bot API.
// No SDK — direct HTTP calls to api.telegram.org.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export function isTelegramConfigured(): boolean {
  return !!BOT_TOKEN && !BOT_TOKEN.includes("PLACEHOLDER");
}

interface SendMessageOptions {
  chat_id: number | string;
  text: string;
  parse_mode?: "Markdown" | "MarkdownV2" | "HTML";
  disable_web_page_preview?: boolean;
  reply_markup?: unknown;
}

export async function sendMessage(
  options: SendMessageOptions
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  if (!isTelegramConfigured()) {
    return { success: false, error: "Telegram bot not configured" };
  }

  try {
    const response = await fetch(`${API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();

    if (!data.ok) {
      return { success: false, error: data.description || "Unknown Telegram error" };
    }

    return { success: true, messageId: data.result.message_id };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function setWebhook(
  url: string,
  secretToken: string
): Promise<{ success: boolean; error?: string }> {
  if (!isTelegramConfigured()) {
    return { success: false, error: "Bot token not configured" };
  }

  try {
    const response = await fetch(`${API_BASE}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        secret_token: secretToken,
        allowed_updates: ["message", "callback_query"],
      }),
    });
    const data = await response.json();
    return { success: data.ok, error: data.description };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function setBotCommands(): Promise<void> {
  if (!isTelegramConfigured()) return;

  await fetch(`${API_BASE}/setMyCommands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      commands: [
        { command: "start", description: "Link your account and start receiving alerts" },
        { command: "status", description: "View your alert subscription status" },
        { command: "pause", description: "Pause alerts for 1 hour, 1 day, or until you resume" },
        { command: "resume", description: "Resume paused alerts" },
        { command: "settings", description: "View and change your alert preferences" },
        { command: "help", description: "Show available commands" },
      ],
    }),
  });
}

/** Escape special characters for Telegram MarkdownV2 */
export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}
