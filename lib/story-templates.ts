// ─── Story Template Library ───────────────────────────────────────────────────
// Each template defines how a detected event becomes a published story.
// NO LLM calls — pure data + string interpolation.

export interface StoryContext {
  marketId?: string;
  marketQuestion?: string;
  marketIds?: string[];
  whaleIds?: string[];
  spread?: number;
  spreadPrev?: number;
  polyPrice?: number;
  kalshiPrice?: number;
  polyVol?: number;
  kalshiVol?: number;
  daysLeft?: number;
  direction?: "poly-higher" | "kalshi-higher";
  causationLabel?: string;
  spreadAgeHours?: number;
  whaleId?: string;
  whaleLabel?: string;
  positionDelta?: number;
  positionSide?: "YES" | "NO";
  positionValue?: number;
  category?: string;
  signalNames?: string[];
  signalCount?: number;
  signalWindowHours?: number;
  categoryName?: string;
  categoryInflow?: number;
  topMarkets?: Array<{ question: string; id: string; inflow: number }>;
  oldCause?: string;
  newCause?: string;
  collapsedFromPt?: number;
  collapsedToPt?: number;
  collapsedInHours?: number;
  resolutionDaysLeft?: number;
  currentPrice?: number;
  widestSpreads?: Array<{ question: string; spread: number; id: string; causation: string }>;
  [key: string]: unknown;
}

export interface StoryTemplate {
  id: string;
  eventType: string;
  minQualityScore: number;
  buildContext: (data: unknown) => StoryContext | null;
  buildHeadline: (ctx: StoryContext) => string;
  buildSummary: (ctx: StoryContext) => string;
  buildBody: (ctx: StoryContext) => string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function slugify(text: string, suffix: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 74)
    .replace(/-$/, "")
    + "-" + suffix;
}
export { slugify };

function shortQuestion(q: string, maxLen = 50): string {
  return q.length > maxLen ? q.slice(0, maxLen - 1) + "…" : q;
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const STORY_TEMPLATES: StoryTemplate[] = [

  // 1. Large spread emerged
  {
    id: "large_spread_emerged",
    eventType: "spread_event",
    minQualityScore: 50,
    buildContext: (data) => {
      const d = data as Partial<StoryContext>;
      if (!d.spread || d.spread < 8) return null;
      if ((d.polyVol ?? 0) < 50_000 || (d.kalshiVol ?? 0) < 50_000) return null;
      return d as StoryContext;
    },
    buildHeadline: (ctx) =>
      `${ctx.spread}pt spread opens between Polymarket and Kalshi on "${shortQuestion(ctx.marketQuestion ?? "", 40)}"`,
    buildSummary: (ctx) =>
      `Polymarket prices at ${ctx.polyPrice}¢ vs Kalshi at ${ctx.kalshiPrice}¢ — a ${ctx.spread}-point gap on a market with ${fmtUsd(ctx.polyVol ?? 0)} on Polymarket and ${fmtUsd(ctx.kalshiVol ?? 0)} on Kalshi. The spread suggests one platform is mispriced.`,
    buildBody: (ctx) => {
      const thinSide = (ctx.polyVol ?? 0) < (ctx.kalshiVol ?? 0) ? "Polymarket" : "Kalshi";
      const thickSide = thinSide === "Polymarket" ? "Kalshi" : "Polymarket";
      const impTrade = ctx.direction === "poly-higher"
        ? `buying YES on Kalshi at ${ctx.kalshiPrice}¢ and selling YES on Polymarket at ${ctx.polyPrice}¢`
        : `buying YES on Polymarket at ${ctx.polyPrice}¢ and selling YES on Kalshi at ${ctx.kalshiPrice}¢`;
      return `A ${ctx.spread}-point cross-platform spread emerged on "${ctx.marketQuestion ?? "this market"}" as of this cycle. Polymarket is pricing the outcome at ${ctx.polyPrice}¢ — an implied probability of ${ctx.polyPrice}% — while Kalshi puts it at ${ctx.kalshiPrice}¢ (${ctx.kalshiPrice}%). The ${ctx.spread}-point gap represents the maximum gross profit available to a trader who executes both legs simultaneously.

Volume context matters here. ${thickSide} has significantly deeper liquidity on this question, with ${fmtUsd(thickSide === "Polymarket" ? (ctx.polyVol ?? 0) : (ctx.kalshiVol ?? 0))} traded to date. ${thinSide}, at ${fmtUsd(thinSide === "Polymarket" ? (ctx.polyVol ?? 0) : (ctx.kalshiVol ?? 0))}, has a thinner book — and thinner books tend to have wider bid-ask spreads that can erode the theoretical edge.

The spread's most likely cause: ${ctx.causationLabel ?? "not yet classified — volume asymmetry and fee differentials are the most common explanations when this pattern appears"}.

The implied trade is ${impTrade}. On a $1,000 position, a trader capturing this spread in full would gross approximately $${((ctx.spread ?? 0) / 100 * Math.floor(1000 / ((100 - (ctx.spread ?? 0)) / 100))).toFixed(0)} before fees. Whether that net return is worth the execution and timing risk depends on the days to resolution — shorter horizons amplify the annualized figure but also compress the window for entry.

The spread will close naturally when one platform's price corrects toward consensus, or when traders arbitrage it down. How fast that happens — and which direction — is the real signal to watch.`;
    },
  },

  // 2. Spread converging fast
  {
    id: "spread_converging_fast",
    eventType: "spread_event",
    minQualityScore: 65,
    buildContext: (data) => {
      const d = data as Partial<StoryContext>;
      if (!d.collapsedFromPt || d.collapsedFromPt < 8) return null;
      if (!d.collapsedToPt || d.collapsedToPt > 3) return null;
      return d as StoryContext;
    },
    buildHeadline: (ctx) =>
      `Market correction: "${shortQuestion(ctx.marketQuestion ?? "", 35)}" spread collapsed from ${ctx.collapsedFromPt}pt to ${ctx.collapsedToPt}pt in ${ctx.collapsedInHours ?? "N"}h`,
    buildSummary: (ctx) =>
      `A ${ctx.collapsedFromPt}pt cross-platform spread on "${ctx.marketQuestion ?? "this market"}" compressed to ${ctx.collapsedToPt}pt in ${ctx.collapsedInHours ?? "N"} hours. The window for the original arbitrage trade has effectively closed.`,
    buildBody: (ctx) =>
      `The cross-platform spread on "${ctx.marketQuestion ?? "this market"}" has largely closed. What began as a ${ctx.collapsedFromPt}-point disagreement between Polymarket and Kalshi has compressed to ${ctx.collapsedToPt}pt over the last ${ctx.collapsedInHours ?? "N"} hours — a convergence rate of approximately ${(((ctx.collapsedFromPt ?? 0) - (ctx.collapsedToPt ?? 0)) / (ctx.collapsedInHours ?? 1)).toFixed(1)} points per hour.

Spreads collapse for two reasons: traders deliberately arbitraging the gap (which should cause both prices to move toward each other symmetrically), or one platform independently updating its price after a news event or internal liquidity shift. The symmetry of the move — whether both platforms converged or only one corrected — tells you which story is more likely here.

At ${ctx.collapsedToPt}pt, the remaining spread is below the threshold where a typical fee structure produces positive net returns at standard position sizes. Traders who entered the original position when the spread was ${ctx.collapsedFromPt}pt are now sitting on most of their maximum gross profit. Those who waited are likely out of time to execute at scale before the spread closes entirely.

The key question for what comes next is whether the convergence overshot. If one platform corrected too aggressively — chasing consensus rather than being driven by fundamentals — a small residual spread may reopen on the other side. That's worth watching in the next two to four ingest cycles.`,
  },

  // 3. Whale large position
  {
    id: "whale_large_position",
    eventType: "whale_event",
    minQualityScore: 60,
    buildContext: (data) => {
      const d = data as Partial<StoryContext>;
      if (!d.positionDelta || Math.abs(d.positionDelta) < 100_000) return null;
      return d as StoryContext;
    },
    buildHeadline: (ctx) => {
      const name = ctx.whaleLabel ?? (ctx.whaleId ? ctx.whaleId.slice(0, 6) + "…" : "Whale");
      return `${name} added ${fmtUsd(Math.abs(ctx.positionDelta ?? 0))} to ${ctx.positionSide ?? "YES"} on "${shortQuestion(ctx.marketQuestion ?? "", 35)}"`;
    },
    buildSummary: (ctx) =>
      `A tracked whale moved ${fmtUsd(Math.abs(ctx.positionDelta ?? 0))} into the ${ctx.positionSide ?? "YES"} side of "${ctx.marketQuestion ?? "this market"}" — a position size large enough to register as a directional signal on the broader market.`,
    buildBody: (ctx) => {
      const label = ctx.whaleLabel ?? (ctx.whaleId ? ctx.whaleId.slice(0, 6) + "…" + ctx.whaleId.slice(-4) : "This wallet");
      return `${label} added ${fmtUsd(Math.abs(ctx.positionDelta ?? 0))} to the ${ctx.positionSide ?? "YES"} side of "${ctx.marketQuestion ?? "this market"}" in the latest data cycle. The total position now stands at ${fmtUsd(ctx.positionValue ?? Math.abs(ctx.positionDelta ?? 0))}, making this one of the larger single-wallet positions recorded on this market.

Position moves of this size from tracked wallets carry informational weight. The Polymarket ecosystem has a documented history of sophisticated participants trading on information or analysis that hasn't yet reached the broader market. A move of ${fmtUsd(Math.abs(ctx.positionDelta ?? 0))} isn't noise — it's a deliberate directional bet at meaningful size.

What this implies about the trader's view: a ${ctx.positionSide ?? "YES"} position of this scale only makes economic sense if the wallet owner believes the current market price significantly underestimates the ${ctx.positionSide ?? "YES"} probability. At the current price level, ${ctx.positionSide} resolves to a ${ctx.positionSide === "YES" ? "1" : "0"} — so they need enough edge to justify the capital deployed.

This isn't a trading signal in isolation. Whale positions reflect conviction, but even well-calibrated participants are wrong a meaningful fraction of the time. The strongest use of this data point is as an input to your own analysis: if you independently believe the market is mispriced ${ctx.positionSide === "YES" ? "upward" : "downward"}, this position confirms at least one other large participant agrees.`;
    },
  },

  // 4. Whale reversal
  {
    id: "whale_reversal",
    eventType: "whale_event",
    minQualityScore: 75,
    buildContext: (data) => {
      const d = data as Partial<StoryContext>;
      if (!d.whaleId || !d.marketId) return null;
      if (!d.positionSide) return null;
      return d as StoryContext;
    },
    buildHeadline: (ctx) => {
      const name = ctx.whaleLabel ?? (ctx.whaleId ? ctx.whaleId.slice(0, 6) + "…" : "Whale");
      return `${name} just reversed on "${shortQuestion(ctx.marketQuestion ?? "", 35)}"`;
    },
    buildSummary: (ctx) =>
      `A tracked whale flipped from ${ctx.positionSide === "YES" ? "NO" : "YES"} to ${ctx.positionSide ?? "YES"} on "${ctx.marketQuestion ?? "this market"}". Reversals at tracked wallet scale are rare — this one is worth examining.`,
    buildBody: (ctx) => {
      const label = ctx.whaleLabel ?? (ctx.whaleId ? ctx.whaleId.slice(0, 6) + "…" + ctx.whaleId.slice(-4) : "This wallet");
      const prev = ctx.positionSide === "YES" ? "NO" : "YES";
      return `${label} reversed their position on "${ctx.marketQuestion ?? "this market"}," moving from ${prev} to ${ctx.positionSide ?? "YES"}. Reversals from tracked wallets are comparatively rare events — most large holders add to or trim positions rather than doing full 180s. When they do reverse, it typically signals one of a few scenarios.

The most common: new information reached the trader that materially changed their probability estimate. This is the actionable case — it suggests the market price has not yet reflected whatever they now know or believe.

The second scenario is portfolio hedging: a trader who is heavily exposed to one outcome in a related market uses this position to reduce their overall directional risk. In this case, the reversal is tactical rather than a fundamental view change, and the price signal is weaker.

The third, and least actionable: a stop-loss or forced close. Large positions sometimes get unwound mechanically rather than by decision.

Without visibility into the wallet's broader portfolio, distinguishing between these cases is difficult. What's observable is the size of the reversal and its timing relative to any catalyst in the news feed. If the reversal correlates with a news article tagged to this market, scenario one becomes more probable.`;
    },
  },

  // 5. Market approaching resolution
  {
    id: "market_approaching_resolution",
    eventType: "resolution_event",
    minQualityScore: 45,
    buildContext: (data) => {
      const d = data as Partial<StoryContext>;
      if (!d.resolutionDaysLeft || ![7, 3, 1].includes(d.resolutionDaysLeft)) return null;
      return d as StoryContext;
    },
    buildHeadline: (ctx) =>
      `${ctx.resolutionDaysLeft} ${ctx.resolutionDaysLeft === 1 ? "day" : "days"} left: "${shortQuestion(ctx.marketQuestion ?? "", 40)}" still pricing ${ctx.currentPrice ?? "?"}¢`,
    buildSummary: (ctx) =>
      `With ${ctx.resolutionDaysLeft} ${ctx.resolutionDaysLeft === 1 ? "day" : "days"} until resolution, "${ctx.marketQuestion ?? "this market"}" is priced at ${ctx.currentPrice ?? "?"}¢. Any cross-platform spread on this question carries heightened timing risk.`,
    buildBody: (ctx) =>
      `"${ctx.marketQuestion ?? "This market"}" enters its final ${ctx.resolutionDaysLeft}-day window at ${ctx.currentPrice ?? "?"}¢ — an implied probability of ${ctx.currentPrice ?? "?"}% that the stated outcome resolves YES.

Markets in their final days exhibit distinct behavioral patterns. Prices tend to become stickier as liquidity dries up — traders who want to exit do so earlier, and the participants remaining are typically those with the highest conviction or those who can't close easily. This sometimes leads to a brief pre-resolution price drift toward or away from the actual outcome as the final resolved probability approaches 0 or 100.

If a cross-platform spread is currently present on this question, the risk profile has changed materially. Annualized return calculations balloon at short horizons — a 5pt spread resolving in one day shows a theoretically massive annualized return — but the actual gross profit on a standard position size is unchanged. The compressed timeline also increases execution risk: slippage and partial fills matter more when there's no time to re-enter at a better price.

With ${ctx.resolutionDaysLeft} day${ctx.resolutionDaysLeft !== 1 ? "s" : ""} remaining, any information that shifts the true probability significantly will move both platforms' prices sharply. This is the window where markets are most efficient — and most dangerous for unhedged directional bets.`,
  },

  // 6. Causation flip
  {
    id: "causation_flip",
    eventType: "spread_event",
    minQualityScore: 55,
    buildContext: (data) => {
      const d = data as Partial<StoryContext>;
      if (!d.oldCause || !d.newCause || d.oldCause === d.newCause) return null;
      return d as StoryContext;
    },
    buildHeadline: (ctx) =>
      `"${shortQuestion(ctx.marketQuestion ?? "", 35)}" spread just shifted from ${ctx.oldCause} to ${ctx.newCause}`,
    buildSummary: (ctx) =>
      `The diagnosed cause of the cross-platform spread on "${ctx.marketQuestion ?? "this market"}" has shifted from ${ctx.oldCause} to ${ctx.newCause}. The same spread, different character — and different trading implications.`,
    buildBody: (ctx) =>
      `The spread on "${ctx.marketQuestion ?? "this market"}" carried a ${ctx.oldCause} diagnosis last cycle. As of this update, the classification has flipped to ${ctx.newCause}. The spread size may not have changed dramatically, but the interpretation has.

This kind of reclassification matters because the exploitability of a spread depends heavily on its cause. A spread driven by Information Lag — where one platform is simply slower to react to new data — tends to close quickly and is often the most actionable. A spread flagged as Structural or Liquidity Gap is more persistent but also less likely to close on any particular timeline. Fee Differential spreads typically represent the floor of what's exploitable after costs.

The shift from ${ctx.oldCause} to ${ctx.newCause} suggests the underlying dynamics have changed. This could reflect new volume entering the thinner-book platform, a resolution criteria clarification, or simply enough time passing for the liquidity-driven premium to reassert itself.

Traders holding a position based on the original ${ctx.oldCause} thesis should revisit their assumptions. The trade may still work, but the reason it was entered no longer describes the current situation.`,
  },

  // 7. Signal cluster
  {
    id: "signal_cluster",
    eventType: "signal_event",
    minQualityScore: 70,
    buildContext: (data) => {
      const d = data as Partial<StoryContext>;
      if (!d.signalCount || d.signalCount < 3) return null;
      return d as StoryContext;
    },
    buildHeadline: (ctx) =>
      `Signal cluster on "${shortQuestion(ctx.marketQuestion ?? "", 35)}": ${ctx.signalCount} alerts fired in ${ctx.signalWindowHours ?? 4}h`,
    buildSummary: (ctx) =>
      `${ctx.signalCount} distinct smart signals fired on "${ctx.marketQuestion ?? "this market"}" within a ${ctx.signalWindowHours ?? 4}-hour window: ${(ctx.signalNames ?? []).slice(0, 3).join(", ")}. Multi-signal convergence on a single market is a low-frequency event.`,
    buildBody: (ctx) => {
      const names = (ctx.signalNames ?? []).join(", ");
      return `"${ctx.marketQuestion ?? "This market"}" triggered ${ctx.signalCount} separate signals within a ${ctx.signalWindowHours ?? 4}-hour window: ${names || "multiple signal types"}. Signal clusters of this density are a low-frequency occurrence across the 6,500+ markets tracked by Quiver.

Individual signals are informative but noisy. A Whale Consensus signal, for example, fires whenever tracked wallets align strongly on one side — but whales are wrong often enough that a single signal doesn't justify high conviction. A Concentration signal fires when position distribution becomes unusually skewed, but concentration can reflect liquidity effects as much as informed trading.

What's less common — and more signal-rich — is when multiple distinct signal types fire simultaneously. If Whale Consensus, Concentration, and Divergence signals all fire on the same market within hours of each other, it suggests the underlying dynamics are genuinely moving rather than reflecting routine trading patterns.

The specific combination of signals firing here is: ${names || "see signal feed for details"}. The convergence of these particular types suggests ${(ctx.signalNames ?? []).includes("Divergence") ? "cross-platform disagreement combined with concentrated whale activity — a pattern that historically precedes price adjustment on at least one platform" : "concentrated informed activity on this market that warrants close attention in the next few trading cycles"}.`;
    },
  },

  // 8. Category heat
  {
    id: "category_heat",
    eventType: "category_event",
    minQualityScore: 40,
    buildContext: (data) => {
      const d = data as Partial<StoryContext>;
      if (!d.categoryName || !d.categoryInflow) return null;
      return d as StoryContext;
    },
    buildHeadline: (ctx) =>
      `${ctx.categoryName} markets drew ${fmtUsd(ctx.categoryInflow ?? 0)} in whale capital today`,
    buildSummary: (ctx) => {
      const tops = (ctx.topMarkets ?? []).map(m => `"${shortQuestion(m.question, 35)}" (${fmtUsd(m.inflow)})`).join("; ");
      return `${ctx.categoryName} led all categories for whale capital inflow over the last 24 hours. Top markets: ${tops || "multiple markets saw significant activity"}.`;
    },
    buildBody: (ctx) => {
      const tops = ctx.topMarkets ?? [];
      const marketList = tops.length > 0
        ? tops.map((m, i) => `${i + 1}. "${m.question}" attracted ${fmtUsd(m.inflow)} in net tracked-whale capital.`).join(" ")
        : "Multiple markets in this category saw above-average tracked wallet activity.";
      return `${ctx.categoryName} markets attracted ${fmtUsd(ctx.categoryInflow ?? 0)} in net tracked-whale capital inflow over the past 24 hours — more than any other category in this cycle.

${marketList}

Category-level capital flow is one of the most reliable leading indicators available in prediction market data. When tracked wallets systematically increase exposure to a single category, it typically reflects shared analysis of an upcoming event rather than independent decisions. The correlation in timing — wallets moving capital into the same category within hours of each other — is harder to explain by coincidence than by coordinated or simultaneous response to shared information.

Whether this flow is informationally significant depends on which specific wallets are driving it. Wallets with documented accuracy rates above 60% on resolved markets carry more weight than the broader tracked universe. The specific composition of wallets contributing to this inflow is visible in the full Whale Flow feed for tracked users.

The counterargument: ${ctx.categoryName} markets have inherently higher uncertainty than, say, economic indicator markets with clear resolution criteria. Whale capital flowing here could reflect informed trading or simply speculative positioning ahead of a known upcoming event.`;
    },
  },

  // 9. Resolution mismatch warning
  {
    id: "resolution_mismatch_warning",
    eventType: "spread_event",
    minQualityScore: 80,
    buildContext: (data) => {
      const d = data as Partial<StoryContext>;
      if (!d.marketId) return null;
      return d as StoryContext;
    },
    buildHeadline: (ctx) =>
      `Warning: "${shortQuestion(ctx.marketQuestion ?? "", 40)}" looks like arbitrage but the platforms resolve it differently`,
    buildSummary: (ctx) =>
      `The cross-platform spread on "${ctx.marketQuestion ?? "this market"}" carries a Resolution Mismatch flag. Polymarket and Kalshi appear to be pricing the same event — but their resolution criteria differ in ways that make the spread non-arbitrageable. Verify before trading.`,
    buildBody: (ctx) =>
      `"${ctx.marketQuestion ?? "This market"}" shows a cross-platform price spread that superficially resembles an arbitrage opportunity. It is not one.

The resolution criteria on Polymarket and Kalshi for this question differ in a material way. When two platforms price what appears to be the same event using different definitions of resolution, their prices are internally consistent with their own criteria — they just disagree on what constitutes a YES outcome. That isn't mispricing; it's pricing different things.

The classic example of this pattern is the Bitcoin Reserve question. Polymarket markets often resolve on "any" purchase of bitcoin by a designated entity; Kalshi markets on the same question may require specific announcement criteria. A trader who buys YES on the cheaper side and sells YES on the more expensive side is not capturing arbitrage — they are long two different bets that may resolve differently.

The consequence of trading this spread as arbitrage: if the mismatch is material, it's possible for both legs to resolve in the same direction (both YES, or both NO) leaving the trader with a net loss rather than a locked profit. This is the opposite of how arbitrage is supposed to work.

Before trading any spread flagged with Resolution Mismatch: read the full resolution criteria on both platforms, verify that the triggering events are identical, and confirm that an outcome which resolves one leg YES would necessarily resolve the other leg YES as well.`,
  },

  // 10. Widest spreads daily
  {
    id: "widest_spreads_daily",
    eventType: "daily_summary",
    minQualityScore: 35,
    buildContext: (data) => {
      const d = data as Partial<StoryContext>;
      if (!d.widestSpreads || (d.widestSpreads?.length ?? 0) < 3) return null;
      return d as StoryContext;
    },
    buildHeadline: (ctx) =>
      `Today's ${Math.min(ctx.widestSpreads?.length ?? 5, 5)} widest cross-platform spreads`,
    buildSummary: (ctx) => {
      const top = ctx.widestSpreads?.[0];
      return `The widest cross-platform spread today is ${top?.spread ?? 0}pt on "${shortQuestion(top?.question ?? "", 40)}". Full ranked list with causation diagnosis below.`;
    },
    buildBody: (ctx) => {
      const spreads = (ctx.widestSpreads ?? []).slice(0, 5);
      const list = spreads.map((s, i) =>
        `${i + 1}. "${s.question}" — ${s.spread}pt spread. Diagnosis: ${s.causation}.`
      ).join("\n\n");
      return `Here are today's widest cross-platform spreads as of this morning's ingest cycle, ranked by spread size and including the automated causation diagnosis for each:\n\n${list}\n\nA wider spread is not automatically a better opportunity. Spreads classified as Structural or Fee Differential typically persist without converging — they represent the market's equilibrium given the differences between platforms, not a mispricing ripe for exploitation. The highest-quality actionable opportunities tend to be Information Lag and Liquidity Gap spreads at widths above 8pt — situations where the price difference is likely to close once the slower platform catches up.\n\nAll five of today's widest spreads are available in full detail on the Disagrees page, including the execution calculator with fee-adjusted return estimates at multiple capital levels. The capital efficiency ranking on that page (sorted by annualized return rather than raw spread size) often surfaces different opportunities than the raw spread size ranking.`;
    },
  },
];
