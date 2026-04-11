/**
 * Polymarket Data API client — read-only.
 * Fetches user positions by wallet address from the public Polymarket data API.
 * No private keys or signatures ever required.
 */

export interface PolymarketPosition {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome: string;
  oppositePrice: number;
  endDate: string;
  negativeRisk: boolean;
}

const POLYMARKET_DATA_API = "https://data-api.polymarket.com";

async function fetchWithTimeout(url: string, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchUserPositions(walletAddress: string): Promise<{
  success: boolean;
  positions?: PolymarketPosition[];
  error?: string;
}> {
  if (!walletAddress || !walletAddress.startsWith("0x")) {
    return { success: false, error: "Invalid wallet address — must start with 0x" };
  }

  try {
    const url = `${POLYMARKET_DATA_API}/positions?user=${walletAddress.toLowerCase()}&limit=500`;
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      return { success: false, error: `Polymarket API returned ${response.status}` };
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return { success: false, error: "Unexpected response shape from Polymarket" };
    }

    return { success: true, positions: data as PolymarketPosition[] };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { success: false, error: "Request timed out — Polymarket API may be slow" };
    }
    return { success: false, error: err.message || "Failed to fetch positions" };
  }
}

export async function verifyWalletExists(walletAddress: string): Promise<boolean> {
  const result = await fetchUserPositions(walletAddress);
  // A valid wallet either has positions OR returns an empty array (not an error)
  return result.success;
}

export interface PortfolioSummary {
  totalValueUsd: number;
  totalCostBasisUsd: number;
  totalPnlUsd: number;
  totalPnlPct: number;
  positionCount: number;
  openPositions: number;
  closedPositions: number;
  redeemablePositions: number;
}

export function computePortfolioSummary(positions: PolymarketPosition[]): PortfolioSummary {
  let totalValueUsd = 0;
  let totalCostBasisUsd = 0;
  let totalPnlUsd = 0;
  let openPositions = 0;
  let closedPositions = 0;
  let redeemablePositions = 0;

  for (const pos of positions) {
    totalValueUsd += pos.currentValue || 0;
    totalCostBasisUsd += pos.initialValue || 0;
    totalPnlUsd += (pos.cashPnl || 0) + (pos.realizedPnl || 0);

    if (pos.size > 0) openPositions++;
    else closedPositions++;

    if (pos.redeemable) redeemablePositions++;
  }

  const totalPnlPct =
    totalCostBasisUsd > 0 ? (totalPnlUsd / totalCostBasisUsd) * 100 : 0;

  return {
    totalValueUsd,
    totalCostBasisUsd,
    totalPnlUsd,
    totalPnlPct,
    positionCount: positions.length,
    openPositions,
    closedPositions,
    redeemablePositions,
  };
}
