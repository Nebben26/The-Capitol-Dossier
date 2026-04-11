import { supabase } from "@/lib/supabase";
import { scoreOpportunity } from "@/lib/opportunity-score";

export interface MorningBriefContent {
  date: string;
  topDisagreements: Array<{
    id: string;
    question: string;
    spread: number;
    polyPrice: number;
    kalshiPrice: number;
    score: number;
  }>;
  biggestMovers: Array<{
    id: string;
    question: string;
    change: number;
    price: number;
  }>;
  stats: {
    totalMarkets: number;
    activeDisagreements: number;
  };
}

export async function generateMorningBrief(): Promise<MorningBriefContent> {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Top disagreements by opportunity score
  const { data: disagreements } = await supabase
    .from("disagreements")
    .select("id, question, spread, poly_price, kalshi_price, poly_volume, kalshi_volume, days_left")
    .order("spread", { ascending: false })
    .limit(20);

  const topDisagreements = (disagreements || [])
    .map((d: any) => {
      const scored = scoreOpportunity({
        spread: Number(d.spread) || 0,
        polyPrice: Number(d.poly_price) || 0,
        kalshiPrice: Number(d.kalshi_price) || 0,
        polyVol: String(d.poly_volume || "0"),
        kalshiVol: String(d.kalshi_volume || "0"),
        daysLeft: Number(d.days_left) || 0,
        spreadTrend: "stable",
        opportunityScore: 0,
      });
      return {
        id: d.id,
        question: d.question,
        spread: Number(d.spread) || 0,
        polyPrice: Number(d.poly_price) || 0,
        kalshiPrice: Number(d.kalshi_price) || 0,
        score: scored.score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Biggest movers (positive change)
  const { data: movers } = await supabase
    .from("markets")
    .select("id, question, price, change_24h")
    .eq("resolved", false)
    .not("change_24h", "is", null)
    .order("change_24h", { ascending: false })
    .limit(5);

  const biggestMovers = (movers || []).map((m: any) => ({
    id: m.id,
    question: m.question,
    change: Number(m.change_24h) || 0,
    price: Number(m.price) || 0,
  }));

  // System stats
  const [marketsRes, disagreementsRes] = await Promise.all([
    supabase.from("markets").select("id", { count: "exact", head: true }).eq("resolved", false),
    supabase.from("disagreements").select("id", { count: "exact", head: true }),
  ]);

  return {
    date: today,
    topDisagreements,
    biggestMovers,
    stats: {
      totalMarkets: marketsRes.count || 0,
      activeDisagreements: disagreementsRes.count || 0,
    },
  };
}

export function renderMorningBriefHtml(
  content: MorningBriefContent,
  unsubscribeUrl: string
): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://amazing-kitsune-139d51.netlify.app";

  const disagreementsHtml =
    content.topDisagreements.length === 0
      ? `<p style="color:#8d96a0;font-size:13px;text-align:center;padding:16px 0;">No active spreads right now.</p>`
      : content.topDisagreements
          .map(
            (d, i) => `
        <a href="${siteUrl}/disagrees?highlight=${encodeURIComponent(d.id)}" style="display:block;text-decoration:none;background:#161b27;border:1px solid #21262d;border-radius:12px;padding:16px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:start;gap:12px;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:10px;color:#57D7BA;font-weight:700;letter-spacing:1px;margin-bottom:4px;">#${i + 1} · SCORE ${d.score}</div>
              <div style="font-size:14px;font-weight:600;color:#f0f6fc;line-height:1.4;margin-bottom:8px;">${d.question}</div>
              <div style="font-size:12px;color:#8d96a0;">Poly ${Math.round(d.polyPrice)}¢ · Kalshi ${Math.round(d.kalshiPrice)}¢</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-size:22px;font-weight:700;color:#f0f6fc;font-family:monospace;">${d.spread.toFixed(1)}pt</div>
              <div style="font-size:10px;color:#8d96a0;text-transform:uppercase;letter-spacing:1px;">spread</div>
            </div>
          </div>
        </a>`
          )
          .join("");

  const moversHtml =
    content.biggestMovers.length === 0
      ? `<p style="color:#8d96a0;font-size:13px;text-align:center;padding:16px 0;">No significant moves in the last 24h.</p>`
      : content.biggestMovers
          .map(
            (m) => `
        <a href="${siteUrl}/markets/${encodeURIComponent(m.id)}" style="display:block;text-decoration:none;padding:10px 0;border-bottom:1px solid #21262d;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
            <div style="flex:1;font-size:13px;color:#f0f6fc;line-height:1.3;">${m.question}</div>
            <div style="font-size:13px;font-weight:700;color:${m.change >= 0 ? "#3fb950" : "#f85149"};font-family:monospace;flex-shrink:0;">
              ${m.change >= 0 ? "+" : ""}${m.change.toFixed(1)}pt
            </div>
          </div>
          <div style="font-size:11px;color:#8d96a0;margin-top:2px;">Now at ${Math.round(m.price)}¢</div>
        </a>`
          )
          .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Quiver Morning Brief — ${content.date}</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f0f6fc;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;padding-bottom:20px;border-bottom:1px solid #21262d;">
      <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#57D7BA;margin-bottom:8px;">Quiver Morning Brief</div>
      <div style="font-size:15px;color:#f0f6fc;font-weight:600;">${content.date}</div>
      <div style="font-size:12px;color:#8d96a0;margin-top:4px;">Your daily prediction market intelligence digest</div>
    </div>

    <!-- Top Arbs -->
    <div style="margin-bottom:32px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#8d96a0;margin-bottom:14px;">Today's Top Arbitrage Opportunities</div>
      ${disagreementsHtml}
    </div>

    <!-- Biggest Movers -->
    <div style="margin-bottom:32px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#8d96a0;margin-bottom:14px;">Overnight Movers</div>
      ${moversHtml}
    </div>

    <!-- Stats -->
    <div style="background:#161b27;border:1px solid #21262d;border-radius:12px;padding:18px;margin-bottom:32px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#8d96a0;margin-bottom:12px;">Today's Numbers</div>
      <div style="display:flex;gap:32px;">
        <div>
          <div style="font-size:24px;font-weight:700;color:#f0f6fc;font-family:monospace;">${content.stats.totalMarkets.toLocaleString()}</div>
          <div style="font-size:10px;color:#8d96a0;text-transform:uppercase;letter-spacing:1px;">Active Markets</div>
        </div>
        <div>
          <div style="font-size:24px;font-weight:700;color:#57D7BA;font-family:monospace;">${content.stats.activeDisagreements.toLocaleString()}</div>
          <div style="font-size:10px;color:#8d96a0;text-transform:uppercase;letter-spacing:1px;">Active Arbs</div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:32px 0;">
      <a href="${siteUrl}/disagrees" style="display:inline-block;background:#57D7BA;color:#0d1117;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
        Open Quiver Markets →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:24px;border-top:1px solid #21262d;">
      <div style="font-size:11px;color:#484f58;margin-bottom:6px;">Quiver Markets · Prediction market intelligence</div>
      <div style="font-size:10px;color:#484f58;">
        You're receiving this because you subscribed at quivermarkets.com.
        <br>
        <a href="${unsubscribeUrl}" style="color:#484f58;text-decoration:underline;">Unsubscribe</a>
      </div>
    </div>

  </div>
</body>
</html>`.trim();
}
