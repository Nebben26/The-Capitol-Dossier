/**
 * detect-story-events.ts
 * Detects events that match story templates and upserts stories into the DB.
 * Run after ingest cycle. Idempotent — safe to run multiple times.
 * Do NOT run this script directly; let it be called by the ingest cron.
 */

import { createClient } from "@supabase/supabase-js";
import { STORY_TEMPLATES, slugify } from "../lib/story-templates";
import type { StoryContext } from "../lib/story-templates";
import { analyzeCausation, getCausationLabel } from "../lib/causation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Dedup check ────────────────────────────────────────────────────────────

async function isDuplicate(templateId: string, marketIds: string[]): Promise<boolean> {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data } = await supabase
    .from("stories")
    .select("id")
    .eq("template_id", templateId)
    .contains("source_market_ids", marketIds)
    .gte("published_at", since)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

// ─── Upsert story ────────────────────────────────────────────────────────────

async function upsertStory(story: {
  slug: string;
  template_id: string;
  event_type: string;
  headline: string;
  summary: string;
  body: string;
  category: string | null;
  quality_score: number;
  tier: "free" | "pro" | "trader";
  source_market_ids: string[];
  source_whale_ids: string[];
  metadata: Record<string, unknown> | null;
}): Promise<boolean> {
  const { error } = await supabase
    .from("stories")
    .upsert(story, { onConflict: "slug" });
  if (error) {
    console.error(`[detect-story-events] upsert failed for ${story.slug}:`, error.message);
    return false;
  }
  return true;
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

function determineTier(qualityScore: number): "free" | "pro" {
  return qualityScore >= 70 ? "pro" : "free";
}

// ─── Event detection per template ────────────────────────────────────────────

async function detectLargeSpreadEmerged(): Promise<number> {
  // Fetch top spreads — no volume filter in DB query since volumes may be 0
  // until poly_volume/kalshi_volume columns are populated after session42 migration
  const { data: disagreements, error } = await supabase
    .from("disagreements")
    .select("poly_market_id, kalshi_market_id, spread, poly_price, kalshi_price, poly_volume, kalshi_volume, direction, category, question")
    .gte("spread", 5)
    .order("spread", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[detect-story-events] detectLargeSpreadEmerged query error:", error.message);
    return 0;
  }
  console.log(`[detect-story-events] detectLargeSpreadEmerged: ${disagreements?.length ?? 0} rows with spread >= 5`);
  if (!disagreements?.length) return 0;

  const template = STORY_TEMPLATES.find(t => t.id === "large_spread_emerged")!;
  let count = 0;

  for (const d of disagreements) {
    // Require spread >= 8 for quality threshold
    if ((d.spread ?? 0) < 8) continue;

    const marketId = d.poly_market_id ?? d.kalshi_market_id;
    if (!marketId) continue;
    if (await isDuplicate(template.id, [marketId])) continue;

    const polyVol = Number(d.poly_volume ?? 0);
    const kalshiVol = Number(d.kalshi_volume ?? 0);

    // Volume guard — only enforced if volumes are populated (> 0)
    // If both are 0 (columns not yet populated), allow through
    const volumesPopulated = polyVol > 0 || kalshiVol > 0;
    if (volumesPopulated && (polyVol < 5_000 || kalshiVol < 5_000)) {
      console.log(`[detect-story-events]   Skipping ${marketId} — low volume (poly=$${polyVol}, kalshi=$${kalshiVol})`);
      continue;
    }

    const causation = analyzeCausation({
      polymarketPrice: Math.round(d.poly_price ?? 50),
      kalshiPrice: Math.round(d.kalshi_price ?? 50),
      spread: Math.round(d.spread ?? 0),
      polymarketVolume: polyVol,
      kalshiVolume: kalshiVol,
      daysToResolution: null,
      spreadAgeHours: null,
      convergenceVelocity: null,
      category: d.category ?? "Unknown",
      resolutionCriteriaDiffer: null,
    });

    const ctx: StoryContext = {
      marketId,
      marketIds: [marketId],
      marketQuestion: d.question ?? marketId,
      spread: Math.round(d.spread ?? 0),
      polyPrice: Math.round(d.poly_price ?? 50),
      kalshiPrice: Math.round(d.kalshi_price ?? 50),
      polyVol: polyVol,
      kalshiVol: kalshiVol,
      direction: d.direction as "poly-higher" | "kalshi-higher",
      causationLabel: getCausationLabel(causation.primaryCause).label,
      category: d.category ?? null,
    };

    const verified = template.buildContext(ctx);
    if (!verified) {
      console.log(`[detect-story-events]   Template rejected context for ${marketId}`);
      continue;
    }

    const headline = template.buildHeadline(verified);
    const summary = template.buildSummary(verified);
    const body = template.buildBody(verified);
    const qs = template.minQualityScore + Math.min(Math.round((verified.spread ?? 8) - 8) * 2, 20);

    console.log(`[detect-story-events]   Creating story: "${headline}"`);
    const ok = await upsertStory({
      slug: slugify(headline, randomSuffix()),
      template_id: template.id,
      event_type: template.eventType,
      headline,
      summary,
      body,
      category: verified.category ?? null,
      quality_score: qs,
      tier: determineTier(qs),
      source_market_ids: [marketId],
      source_whale_ids: [],
      metadata: { spread: verified.spread, polyPrice: verified.polyPrice, kalshiPrice: verified.kalshiPrice },
    });
    if (ok) count++;
  }
  return count;
}

async function detectWidestSpreadsDaily(): Promise<number> {
  const { data: disagreements, error } = await supabase
    .from("disagreements")
    .select("poly_market_id, question, spread, poly_price, kalshi_price, poly_volume, kalshi_volume, direction, category")
    .gte("spread", 5)
    .order("spread", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[detect-story-events] detectWidestSpreadsDaily query error:", error.message);
    return 0;
  }
  console.log(`[detect-story-events] detectWidestSpreadsDaily: ${disagreements?.length ?? 0} rows with spread >= 5`);
  if (!disagreements || disagreements.length < 3) return 0;

  const template = STORY_TEMPLATES.find(t => t.id === "widest_spreads_daily")!;
  const marketIds = disagreements.map(d => d.poly_market_id).filter(Boolean);
  if (await isDuplicate(template.id, [marketIds[0]])) {
    console.log(`[detect-story-events] detectWidestSpreadsDaily: duplicate (already published in last 24h)`);
    return 0;
  }

  const widestSpreads = disagreements.map(d => {
    const causation = analyzeCausation({
      polymarketPrice: Math.round(d.poly_price ?? 50),
      kalshiPrice: Math.round(d.kalshi_price ?? 50),
      spread: Math.round(d.spread ?? 0),
      polymarketVolume: Number(d.poly_volume ?? 0),
      kalshiVolume: Number(d.kalshi_volume ?? 0),
      daysToResolution: null,
      spreadAgeHours: null,
      convergenceVelocity: null,
      category: d.category ?? "Unknown",
      resolutionCriteriaDiffer: null,
    });
    return {
      question: d.question ?? d.poly_market_id,
      spread: Math.round(d.spread ?? 0),
      id: d.poly_market_id,
      causation: getCausationLabel(causation.primaryCause).label,
    };
  });

  const ctx: StoryContext = { widestSpreads, marketIds, category: null };
  const headline = template.buildHeadline(ctx);
  console.log(`[detect-story-events]   Creating story: "${headline}"`);
  const ok = await upsertStory({
    slug: slugify(headline, randomSuffix()),
    template_id: template.id,
    event_type: template.eventType,
    headline,
    summary: template.buildSummary(ctx),
    body: template.buildBody(ctx),
    category: null,
    quality_score: template.minQualityScore,
    tier: "free",
    source_market_ids: marketIds,
    source_whale_ids: [],
    metadata: { widestSpreads },
  });
  return ok ? 1 : 0;
}

async function detectWhalePositions(): Promise<number> {
  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const { data: positions, error } = await supabase
    .from("whale_positions")
    .select("whale_id, market_id, outcome, current_value, pnl, updated_at")
    .gte("updated_at", since)
    .gte("current_value", 5000)   // lowered from 100k — most real positions are $5-50k
    .order("current_value", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[detect-story-events] detectWhalePositions query error:", error.message);
    return 0;
  }
  console.log(`[detect-story-events] detectWhalePositions: ${positions?.length ?? 0} large positions updated in last hour`);
  if (!positions?.length) return 0;

  const template = STORY_TEMPLATES.find(t => t.id === "whale_large_position")!;
  let count = 0;

  for (const p of positions) {
    if (await isDuplicate(template.id, [p.market_id])) continue;

    // Get wallet label if available
    const { data: labelRow } = await supabase
      .from("wallet_labels")
      .select("display_name")
      .eq("wallet_address", p.whale_id)
      .single();

    // Get market question
    const { data: market } = await supabase
      .from("markets")
      .select("question, category")
      .eq("id", p.market_id)
      .single();

    const ctx: StoryContext = {
      whaleId: p.whale_id,
      whaleLabel: labelRow?.display_name ?? undefined,
      marketId: p.market_id,
      marketIds: [p.market_id],
      whaleIds: [p.whale_id],
      marketQuestion: market?.question ?? p.market_id,
      positionDelta: Number(p.current_value ?? 0),
      positionSide: (p.outcome ?? "").toLowerCase().startsWith("y") ? "YES" : "NO",
      positionValue: Number(p.current_value ?? 0),
      category: market?.category ?? null,
    };

    const verified = template.buildContext(ctx);
    if (!verified) continue;

    const headline = template.buildHeadline(verified);
    console.log(`[detect-story-events]   Creating story: "${headline}"`);
    const ok = await upsertStory({
      slug: slugify(headline, randomSuffix()),
      template_id: template.id,
      event_type: template.eventType,
      headline,
      summary: template.buildSummary(verified),
      body: template.buildBody(verified),
      category: verified.category ?? null,
      quality_score: template.minQualityScore,
      tier: determineTier(template.minQualityScore),
      source_market_ids: [p.market_id],
      source_whale_ids: [p.whale_id],
      metadata: { positionValue: p.current_value, outcome: p.outcome },
    });
    if (ok) count++;
  }
  return count;
}

async function detectResolutionNearing(): Promise<number> {
  // Markets table uses end_date (not close_time) — set by ingest.ts
  const { data: markets, error } = await supabase
    .from("markets")
    .select("id, question, end_date, category")
    .not("end_date", "is", null)
    .order("end_date", { ascending: true })
    .limit(200);

  if (error) {
    console.error("[detect-story-events] detectResolutionNearing query error:", error.message);
    return 0;
  }
  console.log(`[detect-story-events] detectResolutionNearing: ${markets?.length ?? 0} markets with end_date`);
  if (!markets?.length) return 0;

  const template = STORY_TEMPLATES.find(t => t.id === "market_approaching_resolution")!;
  let count = 0;
  const now = Date.now();
  const targets = [7, 3, 1];

  for (const m of markets) {
    const msLeft = new Date(m.end_date).getTime() - now;
    const daysLeft = Math.round(msLeft / 86_400_000);
    if (!targets.includes(daysLeft)) continue;
    if (await isDuplicate(template.id, [m.id])) continue;

    const ctx: StoryContext = {
      marketId: m.id,
      marketIds: [m.id],
      marketQuestion: m.question,
      resolutionDaysLeft: daysLeft,
      currentPrice: null as any,
      category: m.category ?? null,
    };

    const verified = template.buildContext(ctx);
    if (!verified) continue;

    const headline = template.buildHeadline(verified);
    console.log(`[detect-story-events]   Creating story: "${headline}"`);
    const ok = await upsertStory({
      slug: slugify(headline, randomSuffix()),
      template_id: template.id,
      event_type: template.eventType,
      headline,
      summary: template.buildSummary(verified),
      body: template.buildBody(verified),
      category: verified.category ?? null,
      quality_score: template.minQualityScore,
      tier: "free",
      source_market_ids: [m.id],
      source_whale_ids: [],
      metadata: { daysLeft },
    });
    if (ok) count++;
  }
  return count;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("[detect-story-events] starting event detection…");

  // Diagnostics — print row counts so we can see what's available
  const [{ count: disagreeCount }, { count: snapCount }, { count: whaleCount }] = await Promise.all([
    supabase.from("disagreements").select("*", { count: "exact", head: true }),
    supabase.from("spread_snapshots").select("*", { count: "exact", head: true }),
    supabase.from("whale_positions").select("*", { count: "exact", head: true }),
  ]);
  console.log(`[detect-story-events] DB state: ${disagreeCount ?? 0} disagreements, ${snapCount ?? 0} spread_snapshots, ${whaleCount ?? 0} whale_positions`);

  const results = await Promise.allSettled([
    detectLargeSpreadEmerged().then(n => ({ name: "large_spread_emerged", n })),
    detectWidestSpreadsDaily().then(n => ({ name: "widest_spreads_daily", n })),
    detectWhalePositions().then(n => ({ name: "whale_large_position", n })),
    detectResolutionNearing().then(n => ({ name: "market_approaching_resolution", n })),
  ]);

  let total = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      console.log(`[detect-story-events] ${r.value.name}: ${r.value.n} stories`);
      total += r.value.n;
    } else {
      console.error("[detect-story-events] detector failed:", r.reason);
    }
  }
  console.log(`[detect-story-events] done — ${total} total stories written`);
}

main().catch(e => { console.error("[detect-story-events] fatal:", e); process.exit(1); });
