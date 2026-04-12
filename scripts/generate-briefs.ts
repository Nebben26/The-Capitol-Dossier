/**
 * generate-briefs.ts
 *
 * Generates daily market briefs for each category from live Supabase data.
 * Pure deterministic templates — no LLM calls, no hallucinations.
 * Runs at the end of each ingest cycle.
 *
 * Usage:
 *   npx tsx scripts/generate-briefs.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

const CATEGORIES = ["Elections", "Crypto", "Economics", "Geopolitics", "Sports"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_INDEX_SLUGS: Record<Category, string | null> = {
  Elections: "election-confidence",
  Crypto: "crypto-sentiment",
  Geopolitics: "geopolitical-risk",
  Economics: "economic-outlook",
  Sports: null,
};

const CATEGORY_EMOJIS: Record<Category, string> = {
  Elections: "🗳️",
  Crypto: "₿",
  Economics: "📈",
  Geopolitics: "🌍",
  Sports: "🏆",
};

// ─── DATA TYPES ───────────────────────────────────────────────────────────────

interface Market {
  id: string;
  question: string;
  price: number;
  change_24h: number;
  volume: number;
  category: string;
  platform: string;
  resolved: boolean;
  resolution: string | null;
}

interface Disagreement {
  question: string;
  poly_price: number;
  kalshi_price: number;
  spread: number;
  direction: string;
}

interface QuiverIndex {
  name: string;
  current_value: number;
  change_24h: number | null;
}

interface BriefData {
  category: Category;
  date: string;
  index: QuiverIndex | null;
  movers: Market[];
  topArb: Disagreement | null;
  recentResolutions: Market[];
}

interface BriefJson {
  category: string;
  generated_at: string;
  index: { name: string; value: number; change_24h: number | null } | null;
  movers: { question: string; price: number; change_24h: number }[];
  top_arb: { question: string; poly_price: number; kalshi_price: number; spread: number } | null;
  resolutions: { question: string; resolution: string | null }[];
  footer: string;
}

// ─── DATA FETCHING ────────────────────────────────────────────────────────────

async function fetchBriefData(category: Category): Promise<BriefData> {
  const date = new Date().toISOString().slice(0, 10);
  const indexSlug = CATEGORY_INDEX_SLUGS[category];

  const [moversRes, arbRes, resolvedRes, indexRes] = await Promise.all([
    // Top movers in category
    supabase
      .from("markets")
      .select("id, question, price, change_24h, volume, category, platform, resolved, resolution")
      .eq("category", category)
      .eq("resolved", false)
      .not("change_24h", "is", null)
      .order("change_24h", { ascending: false, nullsFirst: false })
      .limit(10),

    // Top arb spread
    supabase
      .from("disagreements")
      .select("question, poly_price, kalshi_price, spread, direction")
      .eq("category", category)
      .order("spread", { ascending: false })
      .limit(1),

    // Recent resolutions
    supabase
      .from("markets")
      .select("id, question, price, change_24h, volume, category, platform, resolved, resolution, resolves_at")
      .eq("category", category)
      .eq("resolved", true)
      .not("resolution", "is", null)
      .order("resolves_at", { ascending: false })
      .limit(5),

    // Quiver index
    indexSlug
      ? supabase
          .from("quiver_indices")
          .select("name, current_value, change_24h")
          .eq("slug", indexSlug)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Sort movers by absolute change for biggest moves
  const allMovers: Market[] = (moversRes.data ?? []) as Market[];
  const movers = [...allMovers]
    .sort((a, b) => Math.abs(b.change_24h) - Math.abs(a.change_24h))
    .slice(0, 3);

  return {
    category,
    date,
    index: indexRes.data as QuiverIndex | null,
    movers,
    topArb: (arbRes.data?.[0] as Disagreement | null) ?? null,
    recentResolutions: (resolvedRes.data ?? []).slice(0, 3) as Market[],
  };
}

// ─── MARKDOWN GENERATION ──────────────────────────────────────────────────────

function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}pp`;
}

function buildMarkdown(d: BriefData, customBranding?: string): string {
  const emoji = CATEGORY_EMOJIS[d.category];
  const lines: string[] = [];

  lines.push(`# ${emoji} Quiver ${d.category} Markets Brief`);
  lines.push(`**${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}**`);
  lines.push("");

  // ── Market Pulse ──
  if (d.index) {
    const change = d.index.change_24h;
    const chgStr = change != null ? ` (${formatChange(change)} 24h)` : "";
    const zone = d.index.current_value <= 30 ? "Low" : d.index.current_value <= 70 ? "Neutral" : "High";
    lines.push("## 📊 Market Pulse");
    lines.push(`**${d.index.name}:** ${d.index.current_value.toFixed(1)}/100${chgStr} — *${zone}*`);
    lines.push("");
  }

  // ── Top Movers ──
  if (d.movers.length > 0) {
    lines.push("## 📈 Top Movers (24h)");
    for (const m of d.movers) {
      const dir = m.change_24h >= 0 ? "▲" : "▼";
      const pct = Math.abs(m.change_24h).toFixed(1);
      lines.push(`- **${dir} ${pct}pp** — ${m.question} _(${m.price}¢ on ${m.platform})_`);
    }
    lines.push("");
  } else {
    lines.push("## 📈 Top Movers (24h)");
    lines.push("- No significant movers in this category today.");
    lines.push("");
  }

  // ── Arbitrage ──
  if (d.topArb) {
    const arb = d.topArb;
    const cheap = arb.direction === "poly-higher" ? "Kalshi" : "Polymarket";
    const expensive = arb.direction === "poly-higher" ? "Polymarket" : "Kalshi";
    lines.push("## ⚡ Top Arbitrage Spread");
    lines.push(
      `- **${arb.spread.toFixed(1)}pp spread** on _${arb.question}_`
    );
    lines.push(
      `  - ${expensive}: **${Math.round(arb.poly_price)}¢** vs ${cheap}: **${Math.round(arb.kalshi_price)}¢**`
    );
    lines.push(
      `  - Strategy: buy YES on ${cheap} and NO on ${expensive} to capture the gap.`
    );
    lines.push("");
  } else {
    lines.push("## ⚡ Arbitrage");
    lines.push("- No notable cross-platform spreads in this category right now.");
    lines.push("");
  }

  // ── Recent Resolutions ──
  if (d.recentResolutions.length > 0) {
    lines.push("## ✅ Recent Resolutions");
    for (const m of d.recentResolutions) {
      const res = m.resolution === "YES" ? "✓ YES" : m.resolution === "NO" ? "✗ NO" : m.resolution ?? "—";
      lines.push(`- **${res}** — ${m.question}`);
    }
    lines.push("");
  }

  // ── Footer ──
  lines.push("---");
  if (customBranding) {
    lines.push(`*${customBranding}*`);
    lines.push("");
  }
  lines.push(
    `*Powered by [Quiver Markets](https://quivermarkets.com) — real-time prediction market intelligence. Data refreshes every ~30 min. Free to use with attribution.*`
  );

  return lines.join("\n");
}

// ─── HTML GENERATION ─────────────────────────────────────────────────────────
// Email-safe HTML with inline styles

function buildHtml(d: BriefData, markdown: string, customBranding?: string): string {
  const emoji = CATEGORY_EMOJIS[d.category];
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const s = {
    wrap: 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:600px;margin:0 auto;background:#0d1117;color:#f0f6fc;padding:24px;border-radius:12px;',
    h1: "font-size:22px;font-weight:800;color:#f0f6fc;margin:0 0 4px;",
    date: "font-size:12px;color:#8d96a0;margin:0 0 20px;",
    section: "margin:0 0 20px;padding:16px;background:#161b27;border-radius:8px;border-left:3px solid #57D7BA;",
    sectionTitle: "font-size:13px;font-weight:700;color:#57D7BA;text-transform:uppercase;letter-spacing:.05em;margin:0 0 10px;",
    bullet: "font-size:13px;color:#e2e8f0;line-height:1.6;margin:4px 0;",
    hl: "color:#f0f6fc;font-weight:700;",
    muted: "color:#8d96a0;",
    up: "color:#3fb950;font-weight:700;",
    down: "color:#f85149;font-weight:700;",
    brand: "font-size:10px;color:#484f58;text-align:center;margin-top:16px;border-top:1px solid #21262d;padding-top:12px;",
    link: "color:#57D7BA;text-decoration:none;",
    arbCard: "display:flex;gap:12px;margin-top:8px;",
    arbBox: "flex:1;background:#0d1117;border:1px solid #21262d;border-radius:6px;padding:10px;text-align:center;",
    arbPrice: "font-size:20px;font-weight:800;font-family:monospace;",
    arbLabel: "font-size:9px;font-weight:700;text-transform:uppercase;color:#8d96a0;",
    spreadBadge: "display:inline-block;background:rgba(87,215,186,.15);color:#57D7BA;font-size:11px;font-weight:700;padding:3px 10px;border-radius:10px;",
  };

  let body = `<div style="${s.wrap}">`;
  body += `<h1 style="${s.h1}">${emoji} Quiver ${d.category} Markets Brief</h1>`;
  body += `<p style="${s.date}">${dateStr}</p>`;

  // Index pulse
  if (d.index) {
    const v = d.index.current_value;
    const valColor = v <= 30 ? "#f85149" : v <= 70 ? "#d29922" : "#3fb950";
    const change = d.index.change_24h;
    const chgStr = change != null ? ` <span style="color:${change >= 0 ? "#3fb950" : "#f85149"};font-weight:700;">${change >= 0 ? "▲" : "▼"}${Math.abs(change).toFixed(1)}</span>` : "";
    const zone = v <= 30 ? "Low" : v <= 70 ? "Neutral" : "High";
    body += `<div style="${s.section}">`;
    body += `<div style="${s.sectionTitle}">📊 Market Pulse</div>`;
    body += `<p style="${s.bullet}">${d.index.name}: <span style="font-size:22px;font-weight:800;color:${valColor};">${v.toFixed(1)}</span><span style="${s.muted}">/100</span>${chgStr} &nbsp;·&nbsp; <em style="color:${valColor};">${zone}</em></p>`;
    body += `</div>`;
  }

  // Movers
  body += `<div style="${s.section}">`;
  body += `<div style="${s.sectionTitle}">📈 Top Movers (24h)</div>`;
  if (d.movers.length > 0) {
    for (const m of d.movers) {
      const isUp = m.change_24h >= 0;
      const clr = isUp ? "#3fb950" : "#f85149";
      const arrow = isUp ? "▲" : "▼";
      body += `<p style="${s.bullet}"><span style="color:${clr};font-weight:700;">${arrow} ${Math.abs(m.change_24h).toFixed(1)}pp</span> &mdash; ${m.question} <span style="${s.muted}">(${m.price}¢)</span></p>`;
    }
  } else {
    body += `<p style="${s.bullet};${s.muted}">No significant movers today.</p>`;
  }
  body += `</div>`;

  // Arb
  if (d.topArb) {
    const a = d.topArb;
    const cheap = a.direction === "poly-higher" ? "Kalshi" : "Polymarket";
    const expensive = a.direction === "poly-higher" ? "Polymarket" : "Kalshi";
    body += `<div style="${s.section}border-left-color:#f59e0b;">`;
    body += `<div style="${s.sectionTitle}color:#f59e0b;">⚡ Top Arbitrage Spread</div>`;
    body += `<p style="${s.bullet};font-weight:700;">${a.question}</p>`;
    body += `<div style="${s.arbCard}">`;
    body += `<div style="${s.arbBox}"><div style="${s.arbLabel}">Polymarket</div><div style="${s.arbPrice};color:#57D7BA;">${Math.round(a.poly_price)}¢</div></div>`;
    body += `<div style="${s.arbBox}"><div style="${s.arbLabel}">Kalshi</div><div style="${s.arbPrice};color:#388bfd;">${Math.round(a.kalshi_price)}¢</div></div>`;
    body += `</div>`;
    body += `<p style="margin-top:8px;"><span style="${s.spreadBadge}">${a.spread.toFixed(1)}pp spread</span></p>`;
    body += `<p style="${s.bullet};margin-top:8px;">Strategy: buy YES on <strong>${cheap}</strong>, NO on <strong>${expensive}</strong>.</p>`;
    body += `</div>`;
  }

  // Resolutions
  if (d.recentResolutions.length > 0) {
    body += `<div style="${s.section}border-left-color:#3fb950;">`;
    body += `<div style="${s.sectionTitle}color:#3fb950;">✅ Recent Resolutions</div>`;
    for (const m of d.recentResolutions) {
      const resColor = m.resolution === "YES" ? "#3fb950" : "#f85149";
      const resLabel = m.resolution ?? "—";
      body += `<p style="${s.bullet}"><span style="color:${resColor};font-weight:700;">${resLabel}</span> &mdash; ${m.question}</p>`;
    }
    body += `</div>`;
  }

  // Footer
  body += `<div style="${s.brand}">`;
  if (customBranding) {
    body += `<p style="margin:0 0 6px;color:#8d96a0;">${customBranding}</p>`;
  }
  body += `<p style="margin:0;">Powered by <a href="https://quivermarkets.com" style="${s.link}">Quiver Markets</a> &mdash; real-time prediction market intelligence</p>`;
  body += `</div>`;
  body += `</div>`;

  return body;
}

// ─── JSON GENERATION ──────────────────────────────────────────────────────────

function buildJson(d: BriefData): BriefJson {
  return {
    category: d.category,
    generated_at: new Date().toISOString(),
    index: d.index
      ? { name: d.index.name, value: d.index.current_value, change_24h: d.index.change_24h ?? null }
      : null,
    movers: d.movers.map((m) => ({
      question: m.question,
      price: m.price,
      change_24h: m.change_24h,
    })),
    top_arb: d.topArb
      ? {
          question: d.topArb.question,
          poly_price: Math.round(d.topArb.poly_price),
          kalshi_price: Math.round(d.topArb.kalshi_price),
          spread: Number(d.topArb.spread.toFixed(2)),
        }
      : null,
    resolutions: d.recentResolutions.map((m) => ({
      question: m.question,
      resolution: m.resolution,
    })),
    footer: "Powered by Quiver Markets — quivermarkets.com",
  };
}

// ─── WORD COUNT ───────────────────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// ─── MAIN GENERATOR ───────────────────────────────────────────────────────────

async function generateBriefForCategory(category: Category): Promise<void> {
  try {
    const data = await fetchBriefData(category);
    const dateStr = data.date;
    const slug = `${category.toLowerCase()}-${dateStr}`;
    const title = `Quiver ${category} Markets Brief — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

    const markdown = buildMarkdown(data);
    const html = buildHtml(data, markdown);
    const json = buildJson(data);
    const wc = wordCount(markdown);
    const sourceCount = data.movers.length + (data.topArb ? 1 : 0) + data.recentResolutions.length;

    const { error } = await supabase.from("market_briefs").upsert(
      {
        slug,
        category,
        title,
        brief_markdown: markdown,
        brief_html: html,
        brief_json: json,
        generated_at: new Date().toISOString(),
        source_market_count: sourceCount,
        word_count: wc,
      },
      { onConflict: "slug" }
    );

    if (error) {
      console.error(`  [briefs] Failed to upsert ${category}:`, error.message);
    } else {
      console.log(`  [briefs] ✓ ${category} (${wc} words, ${sourceCount} markets)`);
    }
  } catch (err: any) {
    console.error(`  [briefs] Error generating ${category}:`, err.message);
  }
}

export async function generateBriefs(): Promise<void> {
  console.log("  [briefs] Generating daily market briefs...");
  await Promise.all(CATEGORIES.map(generateBriefForCategory));
  console.log("  [briefs] Done.");
}

// ─── Standalone entry point ───────────────────────────────────────────────────
if (require.main === module) {
  generateBriefs()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err); process.exit(1); });
}
