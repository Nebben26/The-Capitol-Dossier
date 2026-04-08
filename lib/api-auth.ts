/**
 * lib/api-auth.ts — API Key Auth + Rate Limiting Middleware
 * Used by every /api/v1/* route handler.
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import type { NextRequest } from "next/server";

// Service-role client — server-side only, never exposed to browser
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: number;
  key_hash: string;
  key_prefix: string;
  name: string;
  tier: "free" | "pro" | "premium";
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  requests_today: number;
  requests_total: number;
  last_used_at: string | null;
  active: boolean;
}

export type ValidateResult =
  | { ok: true; key: ApiKey }
  | { ok: false; status: number; error: string };

// ─── IN-MEMORY PER-MINUTE COUNTERS ───────────────────────────────────────────
// Tracks request count per key within the current 60s window.
// Not shared across serverless instances — good enough for initial launch.

const perMinuteMap = new Map<number, { count: number; windowStart: number }>();

function checkPerMinute(keyId: number, limit: number): boolean {
  const now = Date.now();
  const entry = perMinuteMap.get(keyId);

  if (!entry || now - entry.windowStart > 60_000) {
    perMinuteMap.set(keyId, { count: 1, windowStart: now });
    return true; // within limit
  }

  entry.count += 1;
  return entry.count <= limit;
}

// ─── MAIN VALIDATOR ──────────────────────────────────────────────────────────

export async function validateApiKey(req: NextRequest): Promise<ValidateResult> {
  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return { ok: false, status: 401, error: "Missing Authorization header. Use: Authorization: Bearer qm_xxx" };
  }

  const rawKey = match[1].trim();
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const supabase = getServiceSupabase();

  const { data: keyRow, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .eq("active", true)
    .maybeSingle();

  if (error || !keyRow) {
    return { ok: false, status: 401, error: "Invalid API key" };
  }

  const key = keyRow as ApiKey;

  // Check expiry
  if (key.last_used_at !== null && keyRow.expires_at) {
    if (new Date(keyRow.expires_at) < new Date()) {
      return { ok: false, status: 401, error: "API key expired" };
    }
  }

  // Reset daily counter if last use was a different calendar day
  const todayStr = new Date().toISOString().slice(0, 10);
  const lastStr = key.last_used_at ? new Date(key.last_used_at).toISOString().slice(0, 10) : null;
  let requestsToday = key.requests_today;

  if (lastStr !== todayStr) {
    requestsToday = 0;
  }

  // Check per-day limit
  if (requestsToday >= key.rate_limit_per_day) {
    return {
      ok: false,
      status: 429,
      error: `Daily rate limit exceeded (${key.rate_limit_per_day} req/day). Resets at midnight UTC.`,
    };
  }

  // Check per-minute limit (in-memory)
  if (!checkPerMinute(key.id, key.rate_limit_per_minute)) {
    return {
      ok: false,
      status: 429,
      error: `Per-minute rate limit exceeded (${key.rate_limit_per_minute} req/min).`,
    };
  }

  // Increment counters async (fire and forget — don't block the response)
  supabase
    .from("api_keys")
    .update({
      requests_today: requestsToday + 1,
      requests_total: key.requests_total + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", key.id)
    .then(() => {});

  // Return key with updated today count so routes can compute remaining
  return { ok: true, key: { ...key, requests_today: requestsToday } };
}

// ─── REQUEST LOGGER ───────────────────────────────────────────────────────────

export async function logApiRequest(
  keyId: number | null,
  keyPrefix: string | null,
  endpoint: string,
  statusCode: number,
  responseMs?: number
): Promise<void> {
  try {
    const supabase = getServiceSupabase();
    await supabase.from("api_request_logs").insert({
      key_id: keyId,
      key_prefix: keyPrefix,
      endpoint,
      status_code: statusCode,
      response_ms: responseMs ?? null,
    });
  } catch {
    // Non-fatal — never block response for logging
  }
}

// ─── RESPONSE HELPERS ─────────────────────────────────────────────────────────

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export function rateLimitHeaders(key: ApiKey): Record<string, string> {
  const remaining = Math.max(0, key.rate_limit_per_day - key.requests_today - 1);
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  return {
    "X-RateLimit-Limit": String(key.rate_limit_per_day),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.floor(tomorrow.getTime() / 1000)),
    "X-RateLimit-Tier": key.tier,
  };
}

export function errorResponse(
  status: number,
  message: string,
  extra?: Record<string, string>
): Response {
  return Response.json(
    { error: message },
    { status, headers: { ...CORS_HEADERS, ...extra } }
  );
}

export function tierLimit(
  tier: string,
  limits: { free: number; pro: number; premium: number }
): number {
  return (limits as Record<string, number>)[tier] ?? limits.free;
}

export function tierBlocked(tier: string, minTier: "pro" | "premium"): boolean {
  const order = { free: 0, pro: 1, premium: 2 };
  return (order[tier as keyof typeof order] ?? 0) < order[minTier];
}
