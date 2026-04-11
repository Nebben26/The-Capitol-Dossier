import posthog from "posthog-js";

function isConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  return !!key && !key.includes("PLACEHOLDER");
}

/**
 * Track a custom event. Safe to call even if PostHog is not configured —
 * it will silently no-op.
 */
export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!isConfigured()) return;
  try {
    posthog.capture(event, properties);
  } catch (err) {
    console.warn("Analytics capture failed:", err);
  }
}

/**
 * Identify a user so their events are associated with their account.
 * Call after login or signup.
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!isConfigured()) return;
  try {
    posthog.identify(userId, traits);
  } catch (err) {
    console.warn("Analytics identify failed:", err);
  }
}

/**
 * Reset user identity on logout.
 */
export function resetAnalytics(): void {
  if (typeof window === "undefined") return;
  if (!isConfigured()) return;
  try {
    posthog.reset();
  } catch (err) {
    console.warn("Analytics reset failed:", err);
  }
}

/**
 * Common event names — use these instead of raw strings for consistency.
 */
export const AnalyticsEvents = {
  // Discovery
  VIEW_DISAGREEMENT: "viewed_disagreement",
  VIEW_MARKET: "viewed_market",
  VIEW_WHALE: "viewed_whale",

  // Actions
  OPEN_ARB_CALCULATOR: "opened_arb_calculator",
  COPY_WHALE_ADDRESS: "copied_whale_address",
  EXPORT_CSV: "exported_csv",
  SAVE_SEARCH: "saved_search",
  FOLLOW_WHALE: "followed_whale",

  // Funnel
  VIEW_PRICING: "viewed_pricing",
  CLICK_SUBSCRIBE: "clicked_subscribe",
  SUBSCRIBE_MORNING_BRIEF: "subscribed_morning_brief",
  COMPLETE_CHECKOUT: "completed_checkout",

  // Auth
  SIGN_UP: "signed_up",
  SIGN_IN: "signed_in",
  SIGN_OUT: "signed_out",

  // Alerts
  CREATE_ALERT: "created_alert",
  ALERT_TRIGGERED: "alert_triggered",
} as const;
