// LEGAL DISCLAIMER: This content was generated as a starting template.
// Ben should have it reviewed by a qualified attorney before launching to the public,
// especially the data processing, payment, and dispute resolution clauses.

import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Our Data",
  description: "Where Quiver Markets data comes from and how to interpret it.",
};

export default function AboutDataPage() {
  return (
    <LegalPageLayout
      title="About Our Data"
      subtitle="Where the numbers come from and how to interpret them."
      lastUpdated="April 11, 2026"
    >
      <p>
        Quiver Markets aggregates data from public APIs and on-chain sources. We do not purchase data from third
        parties or scrape websites in violation of any platform&rsquo;s terms of service.
      </p>

      <h2>Data Sources</h2>

      <h3>Polymarket</h3>
      <p>
        Polymarket data is sourced from Polymarket&rsquo;s public Gamma API and CLOB API. We pull market metadata,
        current prices, volume, and resolution status. Whale wallet positions are derived from public on-chain data
        on the Polygon blockchain — anyone can verify these positions by inspecting the smart contract events
        directly.
      </p>

      <h3>Kalshi</h3>
      <p>
        Kalshi data is sourced from Kalshi&rsquo;s public REST API. We pull event tickers, market questions, current
        prices, and volume. Kalshi operates a private order book, so individual trader positions on Kalshi are not
        publicly available — whale tracking on Kalshi is therefore not possible.
      </p>

      <h2>Update Frequency</h2>
      <p>
        Our ingestion pipeline runs approximately every 30 minutes. This means prices, volumes, and disagreements
        you see on the site can be up to 30 minutes stale. The &ldquo;Last updated&rdquo; timestamp visible at the
        top of market pages reflects the actual freshness of that data.
      </p>
      <p>
        <strong>For real-time data, always check the source platforms directly before placing trades.</strong> Do not
        use Quiver Markets prices as the basis for trade execution — our data is for research and discovery, not
        real-time execution.
      </p>

      <h2>What We Compute</h2>
      <p>
        The following metrics are computed by Quiver Markets from raw market data. They are not provided by
        Polymarket or Kalshi and represent our own analysis:
      </p>
      <ul>
        <li>Cross-platform spreads (disagreements between Polymarket and Kalshi prices)</li>
        <li>Opportunity scores (a composite ranking of spread attractiveness)</li>
        <li>Market Pulse (a sentiment composite across multiple signals)</li>
        <li>Whale accuracy and Brier scores (computed from historical positions and resolutions)</li>
        <li>Market categorization and tagging beyond what platforms provide</li>
        <li>AI-generated market thesis summaries</li>
        <li>24-hour price change (point-based, not percentage)</li>
      </ul>
      <p>
        See the <a href="/methodology">Methodology page</a> for the exact formulas used to compute each metric.
      </p>

      <h2>Limitations and Caveats</h2>

      <h3>Data Lag</h3>
      <p>
        Our 30-minute refresh cycle means fast-moving markets may show stale prices during periods of high activity.
        Major news events that move markets rapidly will not be reflected instantly. Always verify on the source
        platform before trading.
      </p>

      <h3>Whale Tracking is Limited to Polymarket</h3>
      <p>
        Because Polymarket runs on a public blockchain (Polygon), we can track wallet positions, historical trades,
        and accuracy over time. Kalshi operates a centralized private order book — individual trader data is not
        publicly accessible, so we cannot track individual positions or calculate accuracy for Kalshi traders.
      </p>

      <h3>Resolved Markets</h3>
      <p>
        When a market resolves, its final price settles to 0&cent; or 100&cent; for binary markets. Resolved markets
        are excluded from the live screener and arbitrage scanner. They are archived at{" "}
        <a href="/resolved">/resolved</a> for historical reference.
      </p>

      <h3>Accuracy of External APIs</h3>
      <p>
        If Polymarket&rsquo;s or Kalshi&rsquo;s APIs return incorrect data, that data will appear on Quiver Markets
        until the next ingestion cycle corrects it. We do not validate every individual data point against ground
        truth. If you spot an error, please report it.
      </p>

      <h3>Spreads Are Indicative, Not Executable</h3>
      <p>
        The spreads shown on the arbitrage scanner reflect the difference between mid-market prices at the time of
        our last data pull. Actual executable spreads may differ due to bid-ask spread, liquidity, and data lag.
        A displayed spread does not guarantee you can capture it profitably.
      </p>

      <h2>Data You Cannot Get From Quiver Markets</h2>
      <p>Quiver Markets does not provide:</p>
      <ul>
        <li>Trade execution — we do not place trades on your behalf</li>
        <li>Account balance or position management on Polymarket or Kalshi</li>
        <li>Personalized investment or trading advice</li>
        <li>Predictions of future market resolution outcomes</li>
        <li>Real-time streaming data (our data has up to 30-minute lag)</li>
        <li>Insider information of any kind</li>
      </ul>

      <h2>Reporting Data Issues</h2>
      <p>
        If you find data on Quiver Markets that you believe is incorrect, please email{" "}
        <a href="mailto:hello@quivermarkets.com">hello@quivermarkets.com</a> with:
      </p>
      <ul>
        <li>The page or market where you saw the issue</li>
        <li>What the data shows on Quiver Markets</li>
        <li>What you believe it should show</li>
        <li>A link to the source platform if possible</li>
      </ul>
      <p>We investigate all reports and correct issues as quickly as possible, typically within one ingestion cycle.</p>
    </LegalPageLayout>
  );
}
