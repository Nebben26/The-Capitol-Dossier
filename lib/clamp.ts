/**
 * Defensive bounds helpers.
 * Apply these to every formula that has a semantic output range to prevent
 * display of physically impossible values (e.g., 999% probability).
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Clamp to [0, 100] — for percentages, scores, win rates */
export function clampPercent(value: number): number {
  return clamp(value, 0, 100);
}

/** Clamp to [0, 1] — for probabilities */
export function clampProbability(value: number): number {
  return clamp(value, 0, 1);
}

/** Clamp to [0, 100] — for prediction market prices in cents */
export function clampCents(value: number): number {
  return clamp(value, 0, 100);
}

/** Clamp to [0, 1] — for Brier scores (lower is better, 0 = perfect) */
export function clampBrier(value: number): number {
  return clamp(value, 0, 1);
}
