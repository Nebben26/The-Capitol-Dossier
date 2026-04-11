// ─── run-alert-evaluator.ts ───────────────────────────────────────────────────
// Server-side evaluator. Reads all enabled user_alerts, checks each against
// current market/disagreement data, and writes alert_triggers when conditions fire.
// Called from the /api/alerts/evaluate route and hooked into ingest.ts.

import { supabase } from "@/lib/supabase";
import { evaluateAlerts, type AlertSnapshot, type CustomAlert } from "@/lib/alert-evaluator";

export interface EvaluationResult {
  evaluated: number;
  triggered: number;
  errors: number;
  details: Array<{
    alertId: string;
    alertName: string;
    status: "triggered" | "not_matched" | "error";
    message?: string;
  }>;
}

export async function runAlertEvaluator(): Promise<EvaluationResult> {
  const result: EvaluationResult = {
    evaluated: 0,
    triggered: 0,
    errors: 0,
    details: [],
  };

  // 1. Load all enabled alerts
  const { data: alerts, error: alertsError } = await supabase
    .from("user_alerts")
    .select("*")
    .eq("enabled", true);

  if (alertsError) throw new Error(alertsError.message);
  if (!alerts || alerts.length === 0) return result;

  // 2. Collect unique market IDs
  const marketIds = [...new Set(alerts.map((a) => a.market_id))];

  // 3. Fetch market snapshots for those IDs
  const { data: markets } = await supabase
    .from("markets")
    .select("id, price, volume")
    .in("id", marketIds)
    .eq("resolved", false);

  // 4. Fetch disagreements for spread_above alerts
  const hasSpreadAlerts = alerts.some((a) => a.condition === "spread_above");
  const spreadByMarketId = new Map<string, number>();
  if (hasSpreadAlerts) {
    const { data: disagrees } = await supabase
      .from("disagreements")
      .select("poly_market_id, kalshi_market_id, spread")
      .order("spread", { ascending: false })
      .limit(500);
    if (disagrees) {
      for (const d of disagrees) {
        if (d.poly_market_id) spreadByMarketId.set(d.poly_market_id, Number(d.spread) || 0);
        if (d.kalshi_market_id) spreadByMarketId.set(d.kalshi_market_id, Number(d.spread) || 0);
      }
    }
  }

  // 5. Build AlertSnapshot array
  const snapshots: AlertSnapshot[] = (markets || []).map((m) => ({
    market_id: m.id,
    price: m.price,
    spread: spreadByMarketId.get(m.id),
    volume: m.volume,
  }));

  // 6. Evaluate all alerts at once
  const firings = evaluateAlerts(alerts as CustomAlert[], snapshots);
  const firingMap = new Map(firings.map((f) => [f.alert.id, f]));

  // 7. Process each alert
  for (const alert of alerts) {
    result.evaluated++;
    const alertName = `${alert.market_question || alert.market_id} (${alert.condition} ${alert.threshold})`;
    try {
      // Cooldown: skip if already triggered in the last hour
      if (alert.last_triggered_at) {
        const lastMs = new Date(alert.last_triggered_at).getTime();
        if (Date.now() - lastMs < 60 * 60 * 1000) {
          result.details.push({ alertId: alert.id, alertName, status: "not_matched", message: "Cooldown active" });
          continue;
        }
      }

      const firing = firingMap.get(alert.id);
      if (firing) {
        // Write trigger record
        const { error: triggerError } = await supabase.from("alert_triggers").insert({
          alert_id: alert.id,
          user_id: alert.user_id,
          message: firing.message,
          payload: {
            market_id: alert.market_id,
            question: alert.market_question,
            condition: alert.condition,
            threshold: alert.threshold,
          },
          read: false,
        });
        if (triggerError) throw new Error(triggerError.message);

        // Update last_triggered_at and trigger_count
        await supabase
          .from("user_alerts")
          .update({
            last_triggered_at: new Date().toISOString(),
            trigger_count: (alert.trigger_count || 0) + 1,
          })
          .eq("id", alert.id);

        result.triggered++;
        result.details.push({ alertId: alert.id, alertName, status: "triggered", message: firing.message });
      } else {
        result.details.push({ alertId: alert.id, alertName, status: "not_matched" });
      }
    } catch (err: any) {
      result.errors++;
      result.details.push({ alertId: alert.id, alertName, status: "error", message: err.message || "Unknown error" });
    }
  }

  return result;
}
