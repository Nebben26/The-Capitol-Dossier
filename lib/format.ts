export function formatPct(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return `${n.toFixed(decimals)}%`;
}

export function formatSignedPct(n: number | null | undefined, decimals = 1): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(decimals)}%`;
}

export function formatUsd(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatCents(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return `${Math.round(n)}¢`;
}

export function formatCount(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return n.toLocaleString();
}
