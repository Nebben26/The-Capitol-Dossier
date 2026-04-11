// ─── Alert Evaluator ─────────────────────────────────────────────────────────
// Client-side evaluator for custom threshold alerts.
// Checks a snapshot of market data against saved alert rules
// and returns which alerts would fire.

export type AlertCondition =
  | "price_above"
  | "price_below"
  | "spread_above"
  | "volume_above"
  | "whale_entry";

export interface CustomAlert {
  id: string;
  user_id: string;
  market_id: string;
  market_question: string;
  condition: AlertCondition;
  threshold: number;
  enabled: boolean;
  created_at: string;
  last_triggered_at: string | null;
  trigger_count: number;
}

export interface AlertSnapshot {
  market_id: string;
  price: number;       // 0–100 cents
  spread?: number;
  volume?: number;
  hasNewWhaleEntry?: boolean;
}

export interface AlertFiring {
  alert: CustomAlert;
  snapshot: AlertSnapshot;
  message: string;
}

export function evaluateAlerts(
  alerts: CustomAlert[],
  snapshots: AlertSnapshot[]
): AlertFiring[] {
  const snapshotMap = new Map(snapshots.map((s) => [s.market_id, s]));
  const firings: AlertFiring[] = [];

  for (const alert of alerts) {
    if (!alert.enabled) continue;
    const snap = snapshotMap.get(alert.market_id);
    if (!snap) continue;

    let fires = false;
    let message = "";

    switch (alert.condition) {
      case "price_above":
        if (snap.price > alert.threshold) {
          fires = true;
          message = `Price hit ${snap.price}¢ (threshold: >${alert.threshold}¢)`;
        }
        break;
      case "price_below":
        if (snap.price < alert.threshold) {
          fires = true;
          message = `Price dropped to ${snap.price}¢ (threshold: <${alert.threshold}¢)`;
        }
        break;
      case "spread_above":
        if ((snap.spread ?? 0) > alert.threshold) {
          fires = true;
          message = `Spread is ${snap.spread?.toFixed(1)}pt (threshold: >${alert.threshold}pt)`;
        }
        break;
      case "volume_above":
        if ((snap.volume ?? 0) > alert.threshold) {
          fires = true;
          message = `Volume hit $${((snap.volume ?? 0) / 1000).toFixed(1)}K (threshold: >$${(alert.threshold / 1000).toFixed(1)}K)`;
        }
        break;
      case "whale_entry":
        if (snap.hasNewWhaleEntry) {
          fires = true;
          message = `New whale entry detected on this market`;
        }
        break;
    }

    if (fires) {
      firings.push({ alert, snapshot: snap, message });
    }
  }

  return firings;
}

export const CONDITION_LABELS: Record<AlertCondition, string> = {
  price_above: "Price rises above",
  price_below: "Price falls below",
  spread_above: "Spread exceeds",
  volume_above: "Volume exceeds",
  whale_entry: "Whale enters",
};

export const CONDITION_UNITS: Record<AlertCondition, string> = {
  price_above: "¢",
  price_below: "¢",
  spread_above: "pt",
  volume_above: "$",
  whale_entry: "",
};
