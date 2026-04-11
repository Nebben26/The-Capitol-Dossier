import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface HealthCheck {
  service: string;
  status: "ok" | "warning" | "error";
  message: string;
  details?: unknown;
}

// Supabase returns PostgrestError plain objects (not Error instances). Extract message robustly.
function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message || "Unknown error";
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (e.message) return String(e.message);
    if (e.details) return String(e.details);
    if (e.code) return `DB error code ${e.code}`;
    return JSON.stringify(err);
  }
  return String(err) || "Unknown error";
}

// Use service role key if available for more complete health checks;
// fall back to anon key so the endpoint still works in dev
function getSupabaseClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "anon-key-missing";
  return createClient(url, key);
}

export async function GET() {
  const checks: HealthCheck[] = [];
  const startTime = Date.now();

  const db = getSupabaseClient();

  // ── Check 1: Supabase connection ──────────────────────────────────
  try {
    const { error } = await db
      .from("markets")
      .select("id", { count: "exact", head: true })
      .limit(1);
    if (error) throw error;
    checks.push({ service: "supabase", status: "ok", message: "Database reachable" });
  } catch (err: unknown) {
    const msg = extractMessage(err);
    checks.push({ service: "supabase", status: "error", message: msg });
  }

  // ── Check 2: Markets table has recent data ────────────────────────
  try {
    const { data, error } = await db
      .from("markets")
      .select("id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) {
      checks.push({
        service: "markets_data",
        status: "error",
        message: "No markets in database",
      });
    } else {
      const lastUpdate = new Date(data[0].updated_at).getTime();
      const ageMinutes = Math.round((Date.now() - lastUpdate) / 60000);
      if (ageMinutes > 90) {
        checks.push({
          service: "markets_data",
          status: "error",
          message: `Last update ${ageMinutes}m ago — ingestion may be down`,
        });
      } else if (ageMinutes > 45) {
        checks.push({
          service: "markets_data",
          status: "warning",
          message: `Last update ${ageMinutes}m ago — slightly stale`,
        });
      } else {
        checks.push({
          service: "markets_data",
          status: "ok",
          message: `Last update ${ageMinutes}m ago`,
        });
      }
    }
  } catch (err: unknown) {
    const msg = extractMessage(err);
    checks.push({ service: "markets_data", status: "error", message: msg });
  }

  // ── Check 3: Disagreements table populated ────────────────────────
  try {
    const { count, error } = await db
      .from("disagreements")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    if (!count || count === 0) {
      checks.push({
        service: "disagreements",
        status: "warning",
        message: "No disagreements in database",
      });
    } else {
      checks.push({
        service: "disagreements",
        status: "ok",
        message: `${count} disagreements tracked`,
      });
    }
  } catch (err: unknown) {
    const msg = extractMessage(err);
    checks.push({ service: "disagreements", status: "error", message: msg });
  }

  // ── Check 4: Whales table populated ──────────────────────────────
  try {
    const { count, error } = await db
      .from("whales")
      .select("id", { count: "exact", head: true });
    if (error) {
      // whales table not created yet — warning, not error (ingestion still works without it)
      checks.push({
        service: "whales",
        status: "warning",
        message: "whales table missing or inaccessible — whale tracking not yet set up",
      });
    } else if (!count || count === 0) {
      checks.push({
        service: "whales",
        status: "warning",
        message: "No whales in database",
      });
    } else {
      checks.push({
        service: "whales",
        status: "ok",
        message: `${count} whales tracked`,
      });
    }
  } catch (err: unknown) {
    const msg = extractMessage(err);
    checks.push({ service: "whales", status: "error", message: msg });
  }

  // ── Check 5: Stripe configured ────────────────────────────────────
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey.includes("PLACEHOLDER")) {
    checks.push({
      service: "stripe",
      status: "warning",
      message: "Stripe not configured — payments will not work",
    });
  } else {
    checks.push({ service: "stripe", status: "ok", message: "Stripe key present" });
  }

  // ── Check 6: Resend configured ────────────────────────────────────
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey || resendKey.includes("PLACEHOLDER")) {
    checks.push({
      service: "resend",
      status: "warning",
      message: "Resend not configured — morning brief will not send",
    });
  } else {
    checks.push({ service: "resend", status: "ok", message: "Resend key present" });
  }

  // ── Check 7: PostHog configured ───────────────────────────────────
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!posthogKey || posthogKey.includes("PLACEHOLDER")) {
    checks.push({
      service: "posthog",
      status: "warning",
      message: "PostHog not configured — analytics not collected",
    });
  } else {
    checks.push({ service: "posthog", status: "ok", message: "PostHog key present" });
  }

  // ── Check 8: Sentry configured ────────────────────────────────────
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!sentryDsn || sentryDsn.includes("PLACEHOLDER")) {
    checks.push({
      service: "sentry",
      status: "warning",
      message: "Sentry not configured — using hardcoded fallback DSN",
    });
  } else {
    checks.push({ service: "sentry", status: "ok", message: "Sentry DSN present" });
  }

  // ── Check 9: user_tiers table (paywall) ───────────────────────────
  try {
    const { error } = await db
      .from("user_tiers")
      .select("user_id", { count: "exact", head: true });
    if (error) throw error;
    checks.push({
      service: "user_tiers_table",
      status: "ok",
      message: "user_tiers table exists",
    });
  } catch (err: unknown) {
    const msg = extractMessage(err);
    checks.push({
      service: "user_tiers_table",
      status: "error",
      message: `user_tiers table missing — run session6-tiers.sql migration (${msg})`,
    });
  }

  // ── Check 10: user_alerts table ───────────────────────────────────
  try {
    const { error } = await db
      .from("user_alerts")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    checks.push({
      service: "user_alerts_table",
      status: "ok",
      message: "user_alerts table exists",
    });
  } catch (err: unknown) {
    const msg = extractMessage(err);
    checks.push({
      service: "user_alerts_table",
      status: "error",
      message: `user_alerts table missing — run session4-alerts.sql migration (${msg})`,
    });
  }

  // ── Check 11: alert_triggers table ───────────────────────────────
  try {
    const { error } = await db
      .from("alert_triggers")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    checks.push({
      service: "alert_triggers_table",
      status: "ok",
      message: "alert_triggers table exists",
    });
  } catch (err: unknown) {
    const msg = extractMessage(err);
    checks.push({
      service: "alert_triggers_table",
      status: "error",
      message: `alert_triggers table missing — run session8-alert-triggers.sql migration (${msg})`,
    });
  }

  // ── Check 12: morning_brief_subscribers table ────────────────────
  try {
    const { error } = await db
      .from("morning_brief_subscribers")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    checks.push({
      service: "morning_brief_subscribers_table",
      status: "ok",
      message: "morning_brief_subscribers table exists",
    });
  } catch (err: unknown) {
    const msg = extractMessage(err);
    checks.push({
      service: "morning_brief_subscribers_table",
      status: "error",
      message: `morning_brief_subscribers table missing — run session9-morning-brief.sql migration (${msg})`,
    });
  }

  // ── Check 13: Last ingestion run ─────────────────────────────────
  try {
    const { data: lastRun, error } = await db
      .from("ingestion_runs")
      .select("id, started_at, status, duration_seconds, errors")
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    if (!lastRun) {
      checks.push({
        service: "ingestion_run_history",
        status: "warning",
        message: "No ingestion runs recorded yet",
      });
    } else {
      const ageMinutes = Math.round(
        (Date.now() - new Date(lastRun.started_at).getTime()) / 60000
      );
      if (lastRun.status === "running" && ageMinutes > 15) {
        checks.push({
          service: "ingestion_run_history",
          status: "error",
          message: `Last ingestion has been "running" for ${ageMinutes}m — likely stuck`,
        });
      } else if (lastRun.status === "failed") {
        checks.push({
          service: "ingestion_run_history",
          status: "error",
          message: `Last ingestion failed ${ageMinutes}m ago`,
          details: lastRun.errors,
        });
      } else if (lastRun.status === "completed_with_errors") {
        checks.push({
          service: "ingestion_run_history",
          status: "warning",
          message: `Last ingestion had errors ${ageMinutes}m ago`,
          details: lastRun.errors,
        });
      } else if (ageMinutes > 90) {
        checks.push({
          service: "ingestion_run_history",
          status: "error",
          message: `Last ingestion ${ageMinutes}m ago — cron may be down`,
        });
      } else {
        checks.push({
          service: "ingestion_run_history",
          status: "ok",
          message: `Last ingestion ${ageMinutes}m ago (${lastRun.duration_seconds ?? "?"}s)`,
        });
      }
    }
  } catch (err: unknown) {
    checks.push({
      service: "ingestion_run_history",
      status: "warning",
      message: `ingestion_runs table missing — run session15-ingestion-runs.sql: ${extractMessage(err)}`,
    });
  }

  // ── Check 14: Sentry reachable ────────────────────────────────────
  const sentryDsnForProbe = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (sentryDsnForProbe && !sentryDsnForProbe.includes("PLACEHOLDER")) {
    try {
      const dsnUrl = new URL(sentryDsnForProbe);
      const projectId = dsnUrl.pathname.replace("/", "");
      const probeUrl = `https://${dsnUrl.host}/api/${projectId}/store/`;
      const probe = await fetch(probeUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      });
      if (probe.status === 401 || probe.status === 200 || probe.status === 405) {
        checks.push({ service: "sentry_reachable", status: "ok", message: "Sentry endpoint reachable" });
      } else {
        checks.push({
          service: "sentry_reachable",
          status: "warning",
          message: `Sentry returned unexpected ${probe.status}`,
        });
      }
    } catch (err: unknown) {
      checks.push({
        service: "sentry_reachable",
        status: "warning",
        message: `Cannot reach Sentry: ${extractMessage(err)}`,
      });
    }
  }

  // ── Check 15: Function memory ─────────────────────────────────────
  try {
    const mem = process.memoryUsage();
    const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
    checks.push({
      service: "function_memory",
      status: heapUsedMB > 400 ? "warning" : "ok",
      message: `Heap ${heapUsedMB}MB / ${heapTotalMB}MB${heapUsedMB > 400 ? " — high" : ""}`,
    });
  } catch {
    // Non-fatal — skip silently
  }

  const overallStatus = checks.some((c) => c.status === "error")
    ? "error"
    : checks.some((c) => c.status === "warning")
    ? "warning"
    : "ok";

  const elapsedMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      elapsedMs,
      checks,
      summary: {
        total: checks.length,
        ok: checks.filter((c) => c.status === "ok").length,
        warnings: checks.filter((c) => c.status === "warning").length,
        errors: checks.filter((c) => c.status === "error").length,
      },
    },
    {
      status: overallStatus === "error" ? 503 : 200,
    }
  );
}
