import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How every metric on Quiver Markets is computed — formulas, data sources, and honest limitations.",
};

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4" id={id}>
      <h2 className="text-xl font-bold text-[#f0f6fc]">{title}</h2>
      {children}
    </section>
  );
}

function FormulaBlock({ children }: { children: React.ReactNode }) {
  return (
    <code className="block bg-[#0d1117] border border-[#21262d] rounded-lg p-4 text-xs text-[#f0f6fc] font-mono whitespace-pre-wrap leading-relaxed">
      {children}
    </code>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-3">
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs text-[#57D7BA] font-bold uppercase tracking-widest">{children}</div>
  );
}

function Body({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[#8d96a0] leading-relaxed">{children}</p>;
}

export default function MethodologyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 bg-[#57D7BA]/10 border border-[#57D7BA]/20 rounded-full px-3 py-1 text-[11px] font-bold text-[#57D7BA] uppercase tracking-widest mb-4">
          <BookOpen className="w-3 h-3" />
          Methodology
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#f0f6fc]">How we compute every number</h1>
        <p className="text-base text-[#8d96a0] mt-3 leading-relaxed">
          Every metric on this site is derived from live data. Here&apos;s exactly how each one works,
          so you can decide whether to trust it. If a number can&apos;t be made honest, we don&apos;t show it.
        </p>
      </div>

      {/* ─── Disagrees / Arbitrage Detection ─── */}
      <Section title="Disagrees — Arbitrage Detection" id="disagrees">
        <Card>
          <Label>Raw Return on Arbitrage</Label>
          <FormulaBlock>{`rawReturn = spread_in_percent_points

Example: Polymarket = 74¢, Kalshi = 26¢
  spread = 74 - 26 = 48pt
  display: "48.0% in 4d"`}</FormulaBlock>
          <Body>
            When we show &ldquo;48.0% in 4d&rdquo; on a disagreement, we mean: if the spread between Polymarket
            and Kalshi fully converges at the market&apos;s resolution, you would realize approximately a
            48% return on capital. We do <strong className="text-[#f0f6fc]">not annualize this number</strong> —
            prediction market arbs are one-shot trades. They cannot be compounded across a year.
            Real returns will be lower due to platform fees (est. 2–9% of gross), slippage, and partial convergence.
          </Body>
          <Body>
            <strong className="text-[#f85149]">What we removed:</strong> We previously showed &ldquo;999%+ annualized&rdquo;
            for short-lifetime spreads. A 48pt spread resolving in 4 days technically annualizes to ~4,380%,
            but this number is meaningless — you can&apos;t roll the position over 91 times a year.
            We now show the raw % and days remaining instead.
          </Body>
        </Card>
        <Card>
          <Label>Opportunity Score</Label>
          <FormulaBlock>{`score = spreadScore (0–30)
      + volumeScore  (0–20)
      + timeScore    (0–10)
      + trendScore   (0–10)
      = total 0–70 (displayed as 0–100 normalized)

verdicts: ≥75 → Elite | ≥50 → Strong | ≥30 → Moderate | <30 → Weak`}</FormulaBlock>
          <Body>
            A 0–100 score on each disagreement ranking how actionable the arbitrage is.
            <strong className="text-[#f0f6fc]"> Spread size</strong> is the biggest weight.
            <strong className="text-[#f0f6fc]"> Volume</strong> is log-scaled from the lesser-liquid side.
            <strong className="text-[#f0f6fc]"> Time</strong> favors 7–30 day resolution windows.
            <strong className="text-[#f0f6fc]"> Trend</strong> rewards diverging spreads over converging ones.
          </Body>
        </Card>
        <Card>
          <Label>Cross-platform matching</Label>
          <FormulaBlock>{`Step 1: Fetch all open markets from Polymarket (Gamma API) and Kalshi
Step 2: Normalize titles — lowercase, strip punctuation, remove filler words
Step 3: Fuzzy match with threshold ≥ 0.70 (Jaro-Winkler similarity)
Step 4: Filter matched pairs where spread ≥ 3¢
Step 5: Store in disagreements table, ordered by spread DESC`}</FormulaBlock>
          <Body>
            Matching runs during every ingest cycle (~30 minutes). A spread must be at least 3 cents to appear
            on the Disagrees page — smaller differences are within normal bid-ask noise.
            Match confidence is stored alongside each pair; pairs below 0.75 confidence are flagged.
          </Body>
        </Card>
        <div className="rounded-xl bg-[#f85149]/5 border border-[#f85149]/20 p-5">
          <Body>
            We do not model platform fees, slippage, or partial fills in the raw return display.
            Real P&amp;L from executing any arbitrage will be lower than the headline number.
            We do not provide execution — we show you the opportunity; you trade on Polymarket and Kalshi directly.
          </Body>
        </div>
      </Section>

      {/* ─── Whales / Accuracy and Brier Scoring ─── */}
      <Section title="Whales — Accuracy &amp; Brier Scoring" id="whales">
        <Card>
          <Label>Whale Accuracy</Label>
          <FormulaBlock>{`accuracy = resolved_correct_positions / total_resolved_positions × 100

source: whale_positions table → joined with resolved market outcomes`}</FormulaBlock>
          <Body>
            Accuracy percentages come from the <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">whale_positions</code> table
            in Supabase, joined with resolved market outcomes. When live accuracy data is available (total
            resolved trades ≥ 1), it overrides the mock data. When a whale has zero resolved trades, we show
            &ldquo;New&rdquo; rather than a percentage.
          </Body>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#d29922]/10 border border-[#d29922]/20">
            <AlertTriangle className="size-3.5 text-[#d29922] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#d29922]">
              Whale accuracy may reflect mock data if the live pipeline hasn&apos;t populated whale_positions for a given trader.
              The &ldquo;SMART&rdquo; badge appears on traders with live P&amp;L over $500K — it is a volume signal, not a verified accuracy badge.
            </p>
          </div>
        </Card>
        <Card>
          <Label>Brier Score</Label>
          <FormulaBlock>{`Brier score = (1/N) × Σ (forecast_probability - outcome)²

Lower is better: 0.0 = perfect | 0.25 = random | >0.25 = worse than random`}</FormulaBlock>
          <Body>
            Brier scores are computed from resolved positions: each position&apos;s entry price is treated as the
            forecasted probability, and the binary outcome (1 = correct side won, 0 = wrong side) is the outcome.
            Traders with fewer than 10 resolved positions have high Brier score uncertainty — treat those readings
            as directional indicators, not precise benchmarks.
          </Body>
        </Card>
        <Card>
          <Label>Whale identification</Label>
          <FormulaBlock>{`Source: Polymarket Data API (/leaderboard, /positions)
Criteria: traders ranked by lifetime P&L
Refresh: every 5 minutes (cached)
Display name: ENS name → labeled alias → truncated wallet address`}</FormulaBlock>
          <Body>
            Whales are identified from the Polymarket leaderboard and enriched with their open positions.
            We track 411 traders. P&amp;L and volume figures reflect Polymarket activity only — traders
            who also trade on Kalshi may have higher total P&amp;L than shown.
          </Body>
        </Card>
      </Section>

      {/* ─── Quiver Indices ─── */}
      <Section title="Quiver Indices Methodology" id="indices">
        <Card>
          <Label>What indices are and are not</Label>
          <Body>
            Quiver Indices are <strong className="text-[#f0f6fc]">derived from prediction market prices</strong>, not
            from economic data, expert forecasts, or ground-truth outcomes. They reflect the aggregate consensus of
            all traders participating in each category of prediction markets — no more, no less. They are citeable
            as <em className="text-[#f0f6fc]">"market-implied"</em> readings, not as objective measurements of the
            underlying phenomena.
          </Body>
        </Card>
        <Card>
          <Label>Core formula — volume-weighted mean</Label>
          <FormulaBlock>{`For most indices:
  value = Σ(price_i × volume_i) / Σ(volume_i)

Where:
  price_i  = current YES probability of market i (0–100)
  volume_i = lifetime USD volume of market i (weight)
  i        = all non-resolved markets in the relevant category

If total volume = 0 (no volume data): equal-weight mean is used.
Result is clamped to [0, 100].`}</FormulaBlock>
          <Body>
            Volume-weighting means high-liquidity markets count more than thin markets. A $10M election
            market contributes more to the Election Confidence Index than a $5K market on the same topic.
          </Body>
        </Card>
        <Card>
          <Label>Index-specific formulas</Label>
          <FormulaBlock>{`Election Confidence Index:
  value = Σ(|price_i − 50| × 2 × volume_i) / Σ(volume_i)
  — Measures "decisiveness": a market at 90¢ contributes 80pt of confidence
    (it has a clear frontrunner); a 50/50 market contributes 0.
  — Ranges 0 (all markets uncertain) to 100 (all markets fully decided).

Crypto Sentiment Index:
  value = volume-weighted mean of crypto market prices
  — Direct sentiment: higher price = more bullish.

Geopolitical Risk Index:
  value = volume-weighted mean of geopolitics market prices
  — Higher = more market-implied probability of escalation events.
  — Interpret: >70 = high risk priced in; <30 = markets calm.

Economic Outlook Index:
  value = 100 − (volume-weighted mean of economics market prices)
  — Inverted: economics markets are often framed as recession/inflation risks.
  — Higher index = more optimistic (lower recession/crisis probability priced in).`}</FormulaBlock>
        </Card>
        <Card>
          <Label>Update frequency &amp; latency</Label>
          <Body>
            Indices are recomputed at the end of each ingest cycle, approximately every 30 minutes.
            The value displayed reflects the state of markets at the most recent completed ingest.
            The <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">updated_at</code>{" "}
            timestamp on each index shows when it was last recomputed.
          </Body>
        </Card>
        <div className="rounded-xl bg-[#f85149]/5 border border-[#f85149]/20 p-5">
          <Body>
            <strong className="text-[#f0f6fc]">Limitations:</strong>{" "}
            Prediction market prices reflect trader consensus, not ground truth. Markets can be wrong,
            thin, or manipulated. Category assignment of individual markets affects which index they feed.
            Indices should be cited as <em className="text-[#f0f6fc]">"market-implied"</em> readings with this caveat noted.
          </Body>
        </div>
      </Section>

      {/* Capitol Dossier relationship */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5">
        <Body>
          <a
            href="https://thecapitoldossier.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f0f6fc] hover:underline"
          >
            The Capitol Dossier
          </a>{" "}
          (https://thecapitoldossier.com) is an independent options trading service that uses prediction
          market data — including the disagreements and indices computed by Quiver Markets — alongside
          political filings, dark pool flow, and insider transaction signals to identify exact options setups
          for active traders. Quiver Markets is the free, public-facing prediction market intelligence layer;
          The Capitol Dossier is the paid trading product that combines it with three other signal sources.
        </Body>
      </div>

      <div className="pt-4 border-t border-[#21262d] text-xs text-[#484f58]">
        Questions about a specific number?{" "}
        <a href="mailto:hello@quivermarkets.com" className="text-[#57D7BA] hover:underline">
          Email us
        </a>{" "}
        or{" "}
        <Link href="/disagrees" className="text-[#57D7BA] hover:underline">
          go back to Disagrees
        </Link>
        .
      </div>
    </div>
  );
}
