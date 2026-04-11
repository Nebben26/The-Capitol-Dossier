import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Methodology",
  description: "How every metric on Quiver Markets is computed — formulas, data sources, and honest limitations.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
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

      {/* ─── Raw Return on Arbitrage ─── */}
      <Section title="Raw Return on Arbitrage">
        <Card>
          <Label>Formula</Label>
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
      </Section>

      {/* ─── Opportunity Score ─── */}
      <Section title="Opportunity Score">
        <Card>
          <Label>Formula</Label>
          <FormulaBlock>{`score = spreadScore (0–30)
      + returnScore  (0–30)   ← internal ranking only
      + volumeScore  (0–20)
      + timeScore    (0–10)
      + trendScore   (0–10)
      = total 0–100

verdicts: ≥75 → Elite | ≥50 → Strong | ≥30 → Moderate | <30 → Weak`}</FormulaBlock>
          <Body>
            A 0–100 score on each disagreement ranking how actionable the arbitrage is.
            <strong className="text-[#f0f6fc]"> Spread size</strong> is the biggest weight (30pts).
            <strong className="text-[#f0f6fc]"> Volume</strong> is log-scaled from the lesser-liquid side.
            <strong className="text-[#f0f6fc]"> Time</strong> favors 7–30 day resolution windows (optimal arb timing).
            <strong className="text-[#f0f6fc]"> Trend</strong> rewards diverging spreads (growing opportunity) over converging ones.
            The returnScore component uses an internal relative return signal — it&apos;s used for ranking only
            and is not the annualized number we removed from the display.
          </Body>
        </Card>
      </Section>

      {/* ─── Market Pulse ─── */}
      <Section title="Market Pulse">
        <Card>
          <Label>Formula</Label>
          <FormulaBlock>{`pulse = (spreadHealth × 0.30)
      + (volume       × 0.25)
      + (whaleConc.   × 0.20)
      + (priceMovement× 0.25)
      = 0–100 score

Labels: <20 Extreme Fear | 20–40 Fear | 40–60 Neutral | 60–80 Greed | 80+ Extreme Greed`}</FormulaBlock>
          <Body>
            A 0–100 composite showing overall market sentiment, computed from 4 live Supabase queries:
            average disagreement spread (narrower = more consensus = greed),
            total market volume log-scaled (high = greed),
            whale position concentration (top-quartile PnL ratio, high = greed),
            and 24-hour price movement across markets (more movement = more activity = greed).
            When all four queries fail or return defaults, we show &ldquo;—&rdquo; instead of a fallback score.
          </Body>
        </Card>
      </Section>

      {/* ─── Whale Accuracy ─── */}
      <Section title="Whale Accuracy">
        <Card>
          <Label>Data source</Label>
          <FormulaBlock>{`accuracy = resolved_correct_positions / total_resolved_positions × 100

source: whale_positions table → joined with resolved market outcomes`}</FormulaBlock>
          <Body>
            Accuracy percentages for whale traders come from the <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">whale_positions</code> table
            in Supabase, joined with resolved market outcomes. When live accuracy data is available (total
            resolved trades ≥ 1), it overrides the mock data. When a whale has zero resolved trades, we show
            &ldquo;New&rdquo; rather than a percentage. When no live data exists, mock data from the seed dataset
            is shown and visually indistinguishable from live data — this is a known limitation.
          </Body>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#d29922]/10 border border-[#d29922]/20">
            <AlertTriangle className="size-3.5 text-[#d29922] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#d29922]">
              AUDIT 2026-04-10: Whale accuracy on the Leaderboard and Whale cards may be mock data if the
              live pipeline hasn&apos;t populated whale_positions for that trader. Cannot distinguish live vs. mock
              at render time without a &ldquo;data_source&rdquo; flag on the record.
            </p>
          </div>
          <Body>
            <strong className="text-[#f0f6fc]">Why we removed &ldquo;Win Rate&rdquo;:</strong> Whale cards and the leaderboard
            previously showed both &ldquo;Accuracy&rdquo; and &ldquo;Win Rate&rdquo; as separate stats. In practice, the
            <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">win_rate</code> column in the database is never populated
            by the ingestion pipeline (it is always 0), so the UI was falling back to
            <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">liveAccuracy.accuracy</code> for both fields — producing identical
            numbers under two different labels. We removed the duplicate: whale cards now show P&amp;L, Accuracy, and Volume.
            Win Rate would require computing mark-to-market P&amp;L on open positions, which is a future pipeline addition.
          </Body>
        </Card>
      </Section>

      {/* ─── System Stats ─── */}
      <Section title="System Stats (Markets, Whales, Spreads counts)">
        <Card>
          <Label>Data source</Label>
          <FormulaBlock>{`marketsCount     = SELECT COUNT(*) FROM markets
whalesCount      = SELECT COUNT(*) FROM whales
disagreementsCount = SELECT COUNT(*) FROM disagreements WHERE spread >= 10
signalsCount     = SELECT COUNT(*) FROM signals`}</FormulaBlock>
          <Body>
            The stat strip on the homepage (Markets Tracked, Whales, Spreads Found, Data Points Today)
            comes from live Supabase <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">COUNT(*)</code> queries
            run on page load. If the queries fail, the strip is hidden entirely rather than showing zeros or stale values.
            &ldquo;Data Points Today&rdquo; counts rows in <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">price_history</code> from the last 24 hours.
          </Body>
        </Card>
      </Section>

      {/* ─── Market Thesis ─── */}
      <Section title="Market Thesis TL;DR">
        <Card>
          <Label>Method</Label>
          <FormulaBlock>{`signal = "bullish"  if price > 75
         "bearish"  if price < 25
         "volatile" if |change| > 10 and volume > $1M
         "neutral"  otherwise

text = deterministic rule-based sentence from signal + category + daysLeft`}</FormulaBlock>
          <Body>
            The short thesis line shown on market cards is generated deterministically from price, volume,
            category, and days-to-resolution — it is not AI-generated, not probabilistic, and does not
            account for real-world news or context. It is a quick orientation aid, not a trading signal.
          </Body>
        </Card>
      </Section>

      {/* ─── Calibration / Brier Score ─── */}
      <Section title="Calibration &amp; Brier Score">
        <Card>
          <Label>Formula</Label>
          <FormulaBlock>{`Brier score = (1/N) × Σ (forecast_probability - outcome)²

Lower is better: 0.0 = perfect | 0.25 = random | >0.25 = worse than random`}</FormulaBlock>
          <Body>
            The Calibration page computes your personal Brier score from predictions you enter manually.
            Comparison against whale Brier scores uses mock whale data seeded at launch —
            the comparison will become more meaningful as the live whale accuracy pipeline is fully populated.
          </Body>
        </Card>
      </Section>

      {/* ─── What we don't compute ─── */}
      <Section title="What we don't compute">
        <div className="rounded-xl bg-[#f85149]/5 border border-[#f85149]/20 p-5">
          <Body>
            We do not model platform fees, slippage, or partial fills in the raw return display.
            Real P&amp;L from executing any arbitrage will be lower than the headline number by an
            estimated 1–3% of capital depending on platforms and position size. We do not predict
            the probability that a spread will converge before resolution — that&apos;s trader judgment.
            We do not provide execution — we show you the opportunity; you trade on Polymarket and Kalshi directly.
          </Body>
        </div>
      </Section>

      {/* Footer link */}
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
