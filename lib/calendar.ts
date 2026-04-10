import { supabase } from "./supabase";

export interface CalendarMarket {
  id: string;
  question: string;
  platform: string;
  category: string | null;
  end_date: string;
  volume: number;
  price: number;      // yes price 0-100 (cents)
  days_left: number;
  traders: number;
  spread: number;     // from disagreements table, 0 if not a cross-platform pair
  score: number;
}

export function scoreCatalyst(
  volume: number,
  spread: number,
  traders: number,
  daysLeft: number,
): number {
  // Volume contribution: log10(vol+1)*10 → roughly 0–80 for $1–$10B markets
  const volumeScore = Math.log10(volume + 1) * 10;
  // Spread contribution capped at 50 pts
  const spreadScore = Math.min(spread, 50);
  // Traders as whale-count proxy: scale so 200 traders ≈ 20 pts max
  const whaleScore = Math.min(traders * 0.1, 20);
  // Urgency bonus
  const urgency = daysLeft <= 1 ? 30 : daysLeft <= 7 ? 20 : daysLeft <= 14 ? 10 : 0;
  return volumeScore + spreadScore + whaleScore + urgency;
}

export async function fetchUpcomingCatalysts(daysAhead = 30): Promise<CalendarMarket[]> {
  const now = new Date().toISOString();
  const future = new Date(Date.now() + daysAhead * 86_400_000).toISOString();

  const [marketsResp, disagreementsResp] = await Promise.all([
    supabase
      .from("markets")
      .select("id, question, platform, category, end_date, volume, price, days_left, traders")
      .eq("resolved", false)
      .gte("end_date", now)
      .lte("end_date", future)
      .order("end_date", { ascending: true })
      .limit(500),
    supabase
      .from("disagreements")
      .select("poly_market_id, spread"),
  ]);

  const markets = marketsResp.data;
  if (!markets?.length) return [];

  const spreadMap: Record<string, number> = {};
  for (const d of disagreementsResp.data || []) {
    if (d.poly_market_id) spreadMap[d.poly_market_id] = Number(d.spread ?? 0);
  }

  return markets.map((m) => {
    const volume = Number(m.volume ?? 0);
    const traders = Number(m.traders ?? 0);
    const spread = spreadMap[m.id] ?? 0;
    const daysLeft = Number(m.days_left ?? 0);
    return {
      id: m.id,
      question: m.question ?? m.id,
      platform: m.platform ?? "Polymarket",
      category: m.category ?? null,
      end_date: m.end_date,
      volume,
      price: Number(m.price ?? 50),
      days_left: daysLeft,
      traders,
      spread,
      score: scoreCatalyst(volume, spread, traders, daysLeft),
    };
  });
}

/** Format volume compactly: $1.2M, $450K, $80 */
export function fmtVol(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

/** Top scoring factor as a one-liner reason string */
export function whyItMatters(m: CalendarMarket): string {
  if (m.spread >= 8)      return `${m.spread}pt cross-platform spread`;
  if (m.volume >= 1_000_000) return `${fmtVol(m.volume)} volume`;
  if (m.traders >= 50)    return `${m.traders} traders`;
  if (m.days_left <= 1)   return "resolves today";
  if (m.days_left <= 3)   return "resolves this week";
  return fmtVol(m.volume) + " volume";
}

/** ISO date string → "YYYY-MM-DD" for day bucketing */
export function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}
