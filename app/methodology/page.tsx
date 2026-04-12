import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, AlertTriangle, Send } from "lucide-react";

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

      {/* ─── Signal Desk Alerts ─── */}
      <Section title="Signal Desk — Real-Time Alert Methodology">
        <Card>
          <div className="flex items-center gap-2 mb-1">
            <Send className="size-3.5 text-[#d29922]" />
            <Label>How alerts fire</Label>
          </div>
          <FormulaBlock>{`Alert triggers when:
  arb_spread alert:    spread_pt >= subscriber.min_spread_pt
                       AND subscriber.alert_arb_spreads = true
                       AND category matches subscriber.category_filter (if set)

  whale_activity alert: position_usd >= subscriber.min_whale_position_usd
                        AND subscriber.alert_whale_activity = true

Rate limiting:
  alerts_today counter resets at UTC midnight
  max_alerts_per_day = 50 (configurable per subscriber)
  if paused_until > NOW(): alert skipped

Latency:
  ingest pipeline runs every ~30 minutes
  alert dispatch runs immediately after ingest completes
  Telegram delivery: typically < 1 second after dispatch`}</FormulaBlock>
          <Body>
            Signal Desk alerts fire from the ingest pipeline after each 30-minute data refresh.
            They are <strong className="text-[#f0f6fc]">not true real-time</strong> in the sense of
            millisecond WebSocket feeds — they fire within one ingest cycle of the opportunity appearing.
            For most arb opportunities that persist for hours or days, this latency is immaterial.
          </Body>
          <Body>
            <strong className="text-[#f0f6fc]">Whale alerts</strong> trigger when the ingest pipeline
            detects a new whale trade above the subscriber&apos;s configured minimum position size.
            The alert includes the wallet address, market name, side (YES/NO), and approximate size.
          </Body>
          <Body>
            <strong className="text-[#f0f6fc]">Arb spread alerts</strong> trigger when a disagreement row
            has <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">spread_pt</code> at or above the subscriber&apos;s
            configured threshold. We send alerts for the top 10 disagreements by spread size per ingest run,
            filtered by subscriber preferences.
          </Body>
          <Body>
            Subscribers can adjust thresholds, pause alerts, or unsubscribe at any time via Telegram bot commands
            (<code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">/pause</code>, <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">/resume</code>, <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">/settings</code>).
            Auto-deactivation occurs if the bot is blocked by the user in Telegram.
          </Body>
        </Card>
      </Section>

      {/* ─── Quiver Indices ─── */}
      <div id="indices" />
      <Section title="Quiver Indices Methodology">
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
            Volume-weighting means high-liquidity markets (where more real money has been committed)
            count more than thin markets. A $10M election market contributes more to the Election Confidence
            Index than a $5K market on the same topic.
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
  — 0 = all crypto markets near 0¢ (extreme bear), 100 = all near 100¢ (extreme bull).

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
            Indices are recomputed at the end of each ingest cycle, which runs approximately every 30 minutes.
            The value displayed reflects the state of markets at the time of the most recent completed ingest.
            Intraday price movements between ingest cycles are not reflected. The <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">updated_at</code>{" "}
            timestamp on each index shows when it was last recomputed.
          </Body>
        </Card>
        <div className="rounded-xl bg-[#f85149]/5 border border-[#f85149]/20 p-5">
          <Body>
            <strong className="text-[#f0f6fc]">Limitations:</strong>{" "}
            Prediction market prices reflect trader consensus, not ground truth. Markets can be wrong,
            thin, or manipulated. Category assignment of individual markets affects which index they feed.
            The Economics index inversion assumes most economics markets are framed around negative outcomes
            (recession, inflation) — this may not hold for all component markets. Indices should be cited
            as <em className="text-[#f0f6fc]">"market-implied"</em> readings with this caveat noted.
          </Body>
        </div>
      </Section>

      {/* ─── Correlation Engine ─── */}
      <div id="correlations" />
      <Section title="Correlation Engine Methodology">
        <Card>
          <Label>Algorithm</Label>
          <FormulaBlock>{`Method: Returns-based Pearson correlation (not raw price correlation)

Step 1: Compute returns (price differences) between adjacent snapshots:
  dx[i] = price[i] - price[i-1]

Step 2: Align two markets' return series by timestamp (forward-fill)

Step 3: Pearson correlation on aligned return series:
  r = Σ((dx - mean_dx)(dy - mean_dy)) / sqrt(Σ(dx - mean_dx)² × Σ(dy - mean_dy)²)

Filters applied:
  - At least 30 aligned data points per pair
  - Standard deviation of returns ≥ 0.02 (removes flat/near-flat markets)
  - Bonferroni-adjusted significance threshold (p < 0.05, two-tailed)
  - Category compatibility filter (cross-category pairs must be plausibly related)

Output: |r| threshold is typically 0.65–0.80+ after Bonferroni correction`}</FormulaBlock>
          <Body>
            Correlations are computed on <strong className="text-[#f0f6fc]">price returns</strong> (changes between
            adjacent snapshots), not raw price levels. This removes spurious correlations caused by two markets
            that happen to both trend upward or downward over time (co-drift), which would produce a high raw
            correlation even if the markets are completely unrelated.
          </Body>
        </Card>
        <Card>
          <Label>Significance test</Label>
          <FormulaBlock>{`H₀: correlation = 0 (no relationship)
Test: Two-tailed t-test using Fisher z-transformation
Correction: Bonferroni adjustment for number of pairs tested
Threshold: p < 0.05 after correction

Why Bonferroni: Testing thousands of pairs simultaneously creates a high
false-positive rate. Bonferroni correction ensures the expected number of
false positives across all pairs remains below 1 per run.`}</FormulaBlock>
          <Body>
            Without multiple-testing correction, testing 50,000 pairs at p &lt; 0.05 would produce ~2,500
            false positives by chance alone. Bonferroni correction makes this rigorous at the cost of
            lower sensitivity — some real correlations may be missed. We accept this tradeoff to keep the
            results meaningful rather than noisy.
          </Body>
        </Card>
        <div className="rounded-xl bg-[#f85149]/5 border border-[#f85149]/20 p-5 space-y-2">
          <Body>
            <strong className="text-[#f0f6fc]">Correlation does not imply causation.</strong>{" "}
            Two prediction markets may be correlated because they both respond to the same underlying real-world
            variable (e.g., both depend on the outcome of an election), not because one causes the other.
            A correlated pair is a signal to investigate, not a signal to trade blindly.
          </Body>
          <Body>
            <strong className="text-[#f0f6fc]">Data limitations:</strong> Correlations are computed from
            ingest-cycle price snapshots (~30 min frequency), not tick-level data. Short-lived price movements
            between snapshots are invisible. Markets with fewer than 30 aligned snapshots in the computation
            window are excluded entirely. Correlations are recomputed nightly; intraday changes are not reflected.
          </Body>
        </div>
      </Section>

      {/* ─── Backtester Methodology ─── */}
      <div id="backtester" />
      <Section title="Backtester Methodology">
        <Card>
          <Label>Fee model</Label>
          <FormulaBlock>{`fees_per_contract = $0.02 (Polymarket withdrawal) + $0.01 (Kalshi per-contract fee)
                       = $0.03 per contract

contracts          = capitalPerTrade / (cheapLegPrice / 100)
totalCost          = contracts × cheapPrice/100 + contracts × (100 - expPrice)/100
grossProfit        = contracts × spread / 100
netProfit          = grossProfit - fees
returnPct          = netProfit / totalCost × 100`}</FormulaBlock>
          <Body>
            The backtester simulates a market-neutral arbitrage on every signal in <code className="text-[#f0f6fc] bg-[#0d1117] px-1 rounded">signal_history</code>:
            buy YES on the cheap leg (lower price) and buy NO on the expensive leg (higher price).
            If both legs reach 100¢ at resolution, the gross profit equals the spread in cents per contract.
            Fees are estimated from Polymarket&apos;s $0.02/contract withdrawal fee and Kalshi&apos;s $0.01/contract trading fee.
          </Body>
        </Card>
        <Card>
          <Label>P&amp;L accounting</Label>
          <FormulaBlock>{`Resolved signals:
  netProfit = arb_profit_pct × totalCost / 100   (if available from DB)
            = grossProfit - fees                  (computed fallback)
  status    = "won" if netProfit >= 0, "lost" if netProfit < 0

Open signals:
  netProfit = 0  (marked at cost — no unrealized P&L)
  status    = "open"

Deduplication:
  One trade per disagreement_id (most recent snapshot wins)
  Concurrency cap: max N open positions at once`}</FormulaBlock>
          <Body>
            Open (unresolved) positions are marked at $0 P&L — they do not contribute to the equity curve
            or aggregate stats until resolved. This is conservative: a position could be worth more or less
            if you exited early. The concurrency cap enforces a realistic position limit; signals that would
            exceed the cap are skipped (not queued).
          </Body>
        </Card>
        <Card>
          <Label>Equity curve &amp; risk metrics</Label>
          <FormulaBlock>{`Equity curve:   daily cumulative closed net P&L (resolved trades only)
Max drawdown:   (peak - trough) / peak × 100, rolling over equity curve
Sharpe (approx): annualized mean daily return / stddev daily return × √252
  — Uses closed-trade daily P&L, not position-level returns
  — Simplified: does not account for capital at risk over hold periods`}</FormulaBlock>
          <Body>
            The Sharpe ratio is an approximation. It uses daily closed P&L as a proxy for daily returns,
            not a rigorous position-weighted return series. It should be treated as a directional indicator
            rather than a precise risk-adjusted return figure. Values above 1.0 suggest favorable
            risk-reward; values below 0 indicate consistent losses outpacing volatility.
          </Body>
        </Card>
        <div className="rounded-xl bg-[#f85149]/5 border border-[#f85149]/20 p-5">
          <Body>
            <strong className="text-[#f0f6fc]">Limitations the backtester does not model:</strong>{" "}
            slippage (especially on thin markets), partial fills, platform outages, withdrawal delays,
            liquidity constraints on large positions, tax treatment of prediction market income,
            or the possibility that both legs settle at the same value (both YES or both NO).
            The simulation assumes perfect execution at the prices recorded at signal detection time.
          </Body>
        </div>
      </Section>

      {/* ─── Community Consensus Methodology ─── */}
      <div id="community-consensus" />
      <Section title="Community Consensus">
        <Card>
          <Label>Aggregation method</Label>
          <FormulaBlock>{`For each market with ≥1 community prediction:

consensus_prob = Σ(predicted_prob_i × confidence_i) / Σ(confidence_i)

confidence weights: Low = 1, Medium = 2, High = 3

Example: 3 users submit 60% (high), 70% (medium), 50% (low)
  weighted sum = 60×3 + 70×2 + 50×1 = 180 + 140 + 50 = 370
  total weight = 3 + 2 + 1 = 6
  consensus    = 370 / 6 = 61.7%`}</FormulaBlock>
          <Body>
            The Community Consensus is a confidence-weighted mean of all predictions submitted on a market.
            Users who express higher confidence in their estimate receive proportionally more weight.
            This mirrors techniques from superforecasting research, where confidence calibration
            improves aggregate accuracy. The raw (unweighted) mean is also stored for comparison.
          </Body>
        </Card>
        <Card>
          <Label>Source accuracy &amp; Brier scoring</Label>
          <FormulaBlock>{`Brier score for a single prediction:
  B = (predicted_probability - outcome)²
  predicted_probability ∈ [0, 1]   (e.g. 65% → 0.65)
  outcome ∈ {0, 1}                 (0 = NO, 1 = YES)

Lower B is better. Range: 0 (perfect) to 1 (worst possible).

Accuracy score (displayed in UI):
  accuracy = round((1 - mean_B) × 100)   → 0–100 scale`}</FormulaBlock>
          <Body>
            When a market resolves, we record each source&apos;s last-known probability alongside the true outcome.
            The Brier score measures probabilistic accuracy: a confident prediction that turns out wrong
            is penalized more than a hedge near 50%. We compare Polymarket, Kalshi, Whale Consensus,
            and Community predictions on the same resolved markets to determine which source is most accurate
            over time. Sources with fewer than 10 resolved data points should be treated with caution.
          </Body>
        </Card>
        <div className="rounded-xl bg-[#f85149]/5 border border-[#f85149]/20 p-5">
          <Body>
            <strong className="text-[#f0f6fc]">Limitations:</strong>{" "}
            Community predictions are self-reported and subject to selection bias — users who predict
            on Quiver Markets may be more informed or engaged than the general public. The consensus
            is not a prediction market (no real money, no arbitrage mechanism), so it may be slower
            to update than traded prices. Community sample sizes are small during early growth;
            Brier scores should be treated as directional indicators, not precise benchmarks.
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
