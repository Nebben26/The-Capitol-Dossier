/**
 * Session 28 — API Smoke Test
 * Tests all /api/v1/* endpoints with each tier key and verifies rate limiting.
 *
 * Run: npx tsx scripts/test-api.ts
 *
 * Set env vars or create scripts/output/api-keys.json:
 * { "free": "qm_free_...", "pro": "qm_pro_...", "premium": "qm_premium_..." }
 *
 * IMPORTANT: Apply scripts/migrations/session28_api_keys.sql and run
 * scripts/seed-api-keys.ts before using this script.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import * as fs from "fs";
import * as path from "path";

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";

// Load keys from env or JSON file
function loadKeys(): Record<string, string> {
  const keysFromEnv: Record<string, string> = {};
  if (process.env.API_KEY_FREE) keysFromEnv.free = process.env.API_KEY_FREE;
  if (process.env.API_KEY_PRO) keysFromEnv.pro = process.env.API_KEY_PRO;
  if (process.env.API_KEY_PREMIUM) keysFromEnv.premium = process.env.API_KEY_PREMIUM;
  if (Object.keys(keysFromEnv).length === 3) return keysFromEnv;

  const keysPath = path.join(__dirname, "output", "api-keys.json");
  if (fs.existsSync(keysPath)) {
    return JSON.parse(fs.readFileSync(keysPath, "utf8"));
  }

  console.error(
    "No API keys found.\n" +
    "Either set API_KEY_FREE / API_KEY_PRO / API_KEY_PREMIUM env vars,\n" +
    "or create scripts/output/api-keys.json with { free, pro, premium } keys.\n" +
    "Run scripts/seed-api-keys.ts first."
  );
  process.exit(1);
}

async function hit(
  endpoint: string,
  key: string,
  params?: Record<string, string>
): Promise<{ status: number; body: any; headers: Record<string, string>; ms: number }> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const t0 = Date.now();
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${key}` },
  });
  const ms = Date.now() - t0;

  let body: any;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => { headers[k] = v; });

  return { status: res.status, body, headers, ms };
}

function ok(status: number) { return status >= 200 && status < 300; }
function truncate(obj: any, maxLen = 120): string {
  const s = JSON.stringify(obj);
  return s.length > maxLen ? s.slice(0, maxLen) + "..." : s;
}

async function main() {
  const keys = loadKeys();
  console.log(`Testing against: ${BASE_URL}\n`);

  // ─── 1. Health check (no auth) ────────────────────────────────────────────
  console.log("━━━ GET /api/v1/health (no auth) ━━━");
  const health = await fetch(`${BASE_URL}/api/v1/health`);
  const healthBody = await health.json();
  console.log(`  ${health.status === 200 ? "✓" : "✗"} ${health.status} — ${JSON.stringify(healthBody)}\n`);

  // ─── 2. Endpoint tests per tier ──────────────────────────────────────────
  const tests: Array<{
    endpoint: string;
    params?: Record<string, string>;
    expectBlocked?: Record<string, boolean>;
  }> = [
    { endpoint: "/api/v1/markets", params: { limit: "5" } },
    { endpoint: "/api/v1/disagreements", params: { limit: "5" } },
    {
      endpoint: "/api/v1/disagreements/history",
      params: { market_id: "test-market-id", days: "3" },
      expectBlocked: { free: true },
    },
    { endpoint: "/api/v1/whales", params: { limit: "5" } },
    {
      endpoint: "/api/v1/whales/0x0000000000000000000000000000000000000000/positions",
      expectBlocked: { free: true },
    },
    { endpoint: "/api/v1/flow" },
    { endpoint: "/api/v1/signals", params: { limit: "3" } },
  ];

  for (const test of tests) {
    console.log(`━━━ GET ${test.endpoint} ━━━`);
    for (const [tier, key] of Object.entries(keys)) {
      const blocked = test.expectBlocked?.[tier] ?? false;
      const { status, body, headers, ms } = await hit(test.endpoint, key, test.params);

      const symbol = blocked
        ? (status === 403 ? "✓" : "✗")
        : (ok(status) ? "✓" : "✗");

      const rl = headers["x-ratelimit-remaining"]
        ? `RL remaining: ${headers["x-ratelimit-remaining"]}`
        : "";

      const sample = ok(status) && body?.data
        ? `count=${body.meta?.count ?? (Array.isArray(body.data) ? body.data.length : "?")} ${rl}`
        : `${body?.error ?? "no body"} ${rl}`;

      console.log(`  ${symbol} [${tier.padEnd(7)}] ${status} (${ms}ms) — ${sample}`);
    }
    console.log();
  }

  // ─── 3. Rate limit test: 11 requests with free key (limit = 10/min) ──────
  console.log("━━━ Rate Limit Test — 11 requests with free key ━━━");
  console.log("  (Requires fresh minute window. If you see all 200s, wait 60s and retry.)");
  const freeKey = keys.free;
  let hitLimit = false;

  for (let i = 1; i <= 11; i++) {
    const { status } = await hit("/api/v1/markets", freeKey, { limit: "1" });
    const symbol = status === 429 ? "429 LIMIT HIT" : `${status}`;
    console.log(`  Request ${String(i).padStart(2)}: ${symbol}`);
    if (status === 429) { hitLimit = true; break; }
  }

  if (!hitLimit) {
    console.log("  ⚠ Rate limit not triggered — may have rolled over into a new minute window");
  } else {
    console.log("  ✓ Rate limiting working correctly");
  }

  console.log("\nDone.");
}

main().catch(console.error);
