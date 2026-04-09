/**
 * Webhook delivery — fires registered webhooks for a given event type.
 * Never throws — webhook delivery is best-effort and must never break signal generation.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createClient } from "@supabase/supabase-js";

const TIMEOUT_MS = 5_000;

/**
 * Fire all active webhooks matching the given event type.
 * Call this after inserting new signals or other notable events.
 */
export async function fireWebhooks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const { data: hooks, error } = await supabase
      .from("webhooks")
      .select("id, url")
      .eq("event_type", eventType)
      .eq("active", true);

    if (error) {
      console.error(`[webhooks] query failed for event=${eventType}:`, error.message);
      return;
    }

    if (!hooks || hooks.length === 0) return;

    const body = JSON.stringify({ event: eventType, ...payload, timestamp: new Date().toISOString() });
    const now = new Date().toISOString();

    await Promise.allSettled(
      hooks.map(async (hook: { id: string; url: string }) => {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
          const res = await fetch(hook.url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Quiver-Event": eventType },
            body,
            signal: controller.signal,
          });
          clearTimeout(timer);

          if (!res.ok) {
            console.warn(`[webhooks] ${hook.url} returned HTTP ${res.status}`);
          }

          // Update last_triggered_at regardless of HTTP status
          await supabase
            .from("webhooks")
            .update({ last_triggered_at: now })
            .eq("id", hook.id);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[webhooks] delivery failed for ${hook.url}:`, msg);
        }
      })
    );
  } catch (err) {
    // Absolute safety net — never propagate
    console.error("[webhooks] fireWebhooks crashed (non-fatal):", err);
  }
}
