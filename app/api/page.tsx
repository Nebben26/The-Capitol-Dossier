"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Code,
  Copy,
  Check,
  ChevronRight,
  Zap,
  Shield,
  Globe,
  Terminal,
  ExternalLink,
  Activity,
  Lock,
  AlertTriangle,
  BarChart3,
  Users,
  GitCompareArrows,
  GitMerge,
  Key,
} from "lucide-react";

// ─── COPY BUTTON ──────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="absolute top-2 right-2 p-1.5 rounded-md text-[#484f58] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-all"
      title="Copy"
    >
      {copied ? <Check className="size-3.5 text-[#3fb950]" /> : <Copy className="size-3.5" />}
    </button>
  );
}

// ─── CODE BLOCK ───────────────────────────────────────────────────────────────
function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-xl bg-[#0d1117] border border-[#21262d] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#21262d] bg-[#161b27]">
        <Terminal className="size-3 text-[#484f58]" />
        <span className="text-[9px] font-mono uppercase tracking-widest text-[#484f58]">{lang}</span>
      </div>
      <pre className="p-4 text-xs font-mono text-[#e2e8f0] overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
      <CopyButton text={code} />
    </div>
  );
}

// ─── SECTION ──────────────────────────────────────────────────────────────────
function Section({ id, title, icon: Icon, children }: { id: string; title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section id={id} className="space-y-4 scroll-mt-20">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#21262d]">
        <div className="w-7 h-7 rounded-lg bg-[#57D7BA]/10 flex items-center justify-center">
          <Icon className="size-3.5 text-[#57D7BA]" />
        </div>
        <h2 className="text-base font-bold text-[#f0f6fc]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ─── PARAM TABLE ─────────────────────────────────────────────────────────────
function ParamTable({ params }: { params: { name: string; type: string; required: boolean; description: string }[] }) {
  return (
    <div className="rounded-xl border border-[#21262d] overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#161b27] border-b border-[#21262d]">
            <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Param</th>
            <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Type</th>
            <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Req</th>
            <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#484f58] w-1/2">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-[#21262d]/50 hover:bg-[#161b27] transition-colors">
              <td className="px-4 py-2.5 font-mono text-[#57D7BA]">{p.name}</td>
              <td className="px-3 py-2.5 font-mono text-[#a371f7]">{p.type}</td>
              <td className="px-3 py-2.5">
                {p.required
                  ? <span className="text-[9px] font-bold text-[#f85149] bg-[#f85149]/10 border border-[#f85149]/20 px-1.5 py-0.5 rounded-full">required</span>
                  : <span className="text-[9px] text-[#484f58]">optional</span>}
              </td>
              <td className="px-3 py-2.5 text-[#8d96a0] leading-relaxed">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── ENDPOINT BLOCK ──────────────────────────────────────────────────────────
function EndpointBlock({
  method, path, description, params, curlExample, jsExample, pyExample, responseExample, tiers, tierNote,
}: {
  method: string; path: string; description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  curlExample: string; jsExample: string; pyExample: string; responseExample: string;
  tiers: string[]; tierNote?: string;
}) {
  const [lang, setLang] = useState<"curl" | "js" | "python">("curl");
  const codeMap = { curl: curlExample, js: jsExample, python: pyExample };
  const methodColor = method === "GET" ? "#3fb950" : method === "POST" ? "#388bfd" : "#f85149";

  return (
    <div className="rounded-xl bg-[#161b27] border border-[#21262d] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#21262d]">
        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border" style={{ color: methodColor, borderColor: `${methodColor}40`, backgroundColor: `${methodColor}10` }}>
          {method}
        </span>
        <code className="font-mono text-sm text-[#57D7BA]">{path}</code>
        <div className="ml-auto flex gap-1">
          {tiers.map((t) => (
            <span key={t} className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
              t === "free" ? "text-[#3fb950] border-[#3fb950]/30 bg-[#3fb950]/10" :
              t === "pro" ? "text-[#388bfd] border-[#388bfd]/30 bg-[#388bfd]/10" :
              "text-[#a371f7] border-[#a371f7]/30 bg-[#a371f7]/10"}`}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-sm text-[#8d96a0] leading-relaxed">{description}</p>
        {tierNote && (
          <p className="text-[10px] text-[#484f58] italic">{tierNote}</p>
        )}
        {params && params.length > 0 && <ParamTable params={params} />}

        {/* Language tabs */}
        <div>
          <div className="flex gap-1 mb-2">
            {(["curl", "js", "python"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  lang === l
                    ? "bg-[#57D7BA]/10 text-[#57D7BA] border border-[#57D7BA]/20"
                    : "text-[#484f58] hover:text-[#8d96a0] border border-transparent"
                }`}
              >
                {l === "curl" ? "curl" : l === "js" ? "JavaScript" : "Python"}
              </button>
            ))}
          </div>
          <CodeBlock code={codeMap[lang]} lang={lang === "js" ? "javascript" : lang === "python" ? "python" : "bash"} />
        </div>

        {/* Response */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#484f58] mb-2">Example Response</p>
          <CodeBlock code={responseExample} lang="json" />
        </div>
      </div>
    </div>
  );
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const BASE = "https://quivermarkets.com";

const ENDPOINTS_DATA = [
  {
    method: "GET",
    path: "/api/v1/health",
    description: "Health check endpoint — no API key required. Use to verify API connectivity before making authenticated calls.",
    tiers: ["free", "pro", "premium"],
    curlExample: `curl ${BASE}/api/v1/health`,
    jsExample: `const res = await fetch('${BASE}/api/v1/health');
const { status, version } = await res.json();
console.log(status); // "ok"`,
    pyExample: `import httpx
r = httpx.get('${BASE}/api/v1/health')
print(r.json())`,
    responseExample: `{
  "status": "ok",
  "version": "v1",
  "timestamp": "2026-04-11T12:00:00Z"
}`,
  },
  {
    method: "GET",
    path: "/api/v1/markets",
    description: "List prediction markets across Polymarket and Kalshi. Filter by category, minimum volume, platform. Sort by volume or 24h change.",
    tiers: ["free", "pro", "premium"],
    tierNote: "Free: 25 results per call · Pro: 200 · Premium: 10,000",
    params: [
      { name: "category", type: "string", required: false, description: "Filter by category: Economics, Elections, Sports, Crypto, Tech, Geopolitics" },
      { name: "platform", type: "string", required: false, description: "Filter by platform: polymarket or kalshi" },
      { name: "min_volume", type: "number", required: false, description: "Minimum volume in USD" },
      { name: "sort", type: "string", required: false, description: "Sort field: volume (default) or change_24h" },
      { name: "limit", type: "number", required: false, description: "Results per call (max depends on tier)" },
      { name: "offset", type: "number", required: false, description: "Pagination offset" },
    ],
    curlExample: `curl -H "Authorization: Bearer YOUR_KEY" \\
  "${BASE}/api/v1/markets?category=Economics&limit=10"`,
    jsExample: `const res = await fetch('${BASE}/api/v1/markets?category=Economics&limit=10', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
});
const { data, meta } = await res.json();
console.log(\`Fetched \${meta.count} markets\`);`,
    pyExample: `import httpx

r = httpx.get(
    '${BASE}/api/v1/markets',
    params={'category': 'Economics', 'limit': 10},
    headers={'Authorization': 'Bearer YOUR_KEY'}
)
data = r.json()['data']
print(f"Fetched {len(data)} markets")`,
    responseExample: `{
  "data": [
    {
      "id": "will-the-fed-cut-rates-before-july",
      "question": "Will the Fed cut rates before July 2026?",
      "category": "Economics",
      "platform": "Polymarket",
      "price": 68,
      "volume": 4200000,
      "change_24h": 3.2,
      "end_date": "2026-07-01T00:00:00Z",
      "resolved": false
    }
  ],
  "meta": {
    "count": 10,
    "sort": "volume",
    "tier": "free",
    "tier_limit": 25,
    "generated_at": "2026-04-11T12:00:00Z"
  }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/markets/:id",
    description: "Single market detail by ID, including description and platform URLs.",
    tiers: ["free", "pro", "premium"],
    params: [
      { name: "id", type: "string", required: true, description: "Market ID from /markets list" },
    ],
    curlExample: `curl -H "Authorization: Bearer YOUR_KEY" \\
  "${BASE}/api/v1/markets/will-the-fed-cut-rates"`,
    jsExample: `const res = await fetch('${BASE}/api/v1/markets/will-the-fed-cut-rates', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
});
const { data } = await res.json();`,
    pyExample: `r = httpx.get(
    '${BASE}/api/v1/markets/will-the-fed-cut-rates',
    headers={'Authorization': 'Bearer YOUR_KEY'}
)
market = r.json()['data']`,
    responseExample: `{
  "data": {
    "id": "will-the-fed-cut-rates",
    "question": "Will the Fed cut rates before July 2026?",
    "category": "Economics",
    "platform": "Polymarket",
    "price": 68,
    "volume": 4200000,
    "change_24h": 3.2,
    "resolved": false,
    "description": "Resolves YES if the FOMC...",
    "poly_url": "https://polymarket.com/event/..."
  },
  "meta": { "generated_at": "2026-04-11T12:00:00Z", "source": "Quiver Markets API v1" }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/disagreements",
    description: "Cross-platform arbitrage spreads — markets where Polymarket and Kalshi prices diverge. Sorted by spread size descending.",
    tiers: ["free", "pro", "premium"],
    tierNote: "Free: 10 results · Pro: 100 · Premium: 1,000",
    params: [
      { name: "min_spread", type: "number", required: false, description: "Minimum spread in percentage points (e.g. 5 for 5pp gap)" },
      { name: "category", type: "string", required: false, description: "Filter by market category" },
      { name: "limit", type: "number", required: false, description: "Max results (tier-limited)" },
    ],
    curlExample: `curl -H "Authorization: Bearer YOUR_KEY" \\
  "${BASE}/api/v1/disagreements?min_spread=5"`,
    jsExample: `const res = await fetch('${BASE}/api/v1/disagreements?min_spread=5', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
});
const { data } = await res.json();
const best = data[0];
console.log(\`Best arb: \${best.question} — \${best.spread}pp spread\`);`,
    pyExample: `r = httpx.get(
    '${BASE}/api/v1/disagreements',
    params={'min_spread': 5},
    headers={'Authorization': 'Bearer YOUR_KEY'}
)
for arb in r.json()['data']:
    print(f"{arb['question']}: {arb['spread']}pp")`,
    responseExample: `{
  "data": [
    {
      "id": "abc123",
      "question": "Will Trump win in 2028?",
      "poly_price": 72,
      "kalshi_price": 61,
      "spread": 11,
      "direction": "poly-higher",
      "category": "Elections",
      "updated_at": "2026-04-11T11:45:00Z"
    }
  ],
  "meta": { "count": 10, "tier": "free", "tier_limit": 10, "generated_at": "..." }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/whales",
    description: "Top whale wallets ranked by P&L or accuracy. Returns leaderboard data from the Polymarket Data API.",
    tiers: ["free", "pro", "premium"],
    tierNote: "Free: 25 wallets · Pro: 100 · Premium: 1,000",
    params: [
      { name: "sort", type: "string", required: false, description: "Sort by: total_pnl (default) or accuracy" },
      { name: "limit", type: "number", required: false, description: "Max results (tier-limited)" },
    ],
    curlExample: `curl -H "Authorization: Bearer YOUR_KEY" \\
  "${BASE}/api/v1/whales?sort=accuracy&limit=10"`,
    jsExample: `const res = await fetch('${BASE}/api/v1/whales?sort=accuracy', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
});
const { data } = await res.json();`,
    pyExample: `r = httpx.get(
    '${BASE}/api/v1/whales',
    params={'sort': 'accuracy'},
    headers={'Authorization': 'Bearer YOUR_KEY'}
)
top = r.json()['data']`,
    responseExample: `{
  "data": [
    {
      "address": "0xabcd...1234",
      "display_name": "Alpha Whale",
      "total_pnl": 142000,
      "accuracy": 0.71,
      "win_rate": 0.68,
      "rank": 1
    }
  ],
  "meta": { "count": 10, "sort": "total_pnl", "generated_at": "..." }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/whales/:address",
    description: "Individual whale profile with positions. Free tier returns 10 positions; Pro returns 100.",
    tiers: ["free", "pro", "premium"],
    params: [
      { name: "address", type: "string", required: true, description: "Wallet address (0x...)" },
    ],
    curlExample: `curl -H "Authorization: Bearer YOUR_KEY" \\
  "${BASE}/api/v1/whales/0xabcd1234"`,
    jsExample: `const res = await fetch('${BASE}/api/v1/whales/0xabcd1234', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
});
const { data } = await res.json();
console.log(data.positions);`,
    pyExample: `r = httpx.get(
    '${BASE}/api/v1/whales/0xabcd1234',
    headers={'Authorization': 'Bearer YOUR_KEY'}
)
whale = r.json()['data']`,
    responseExample: `{
  "data": {
    "address": "0xabcd...1234",
    "total_pnl": 142000,
    "accuracy": 0.71,
    "positions": [
      { "market_id": "xyz", "current_value": 5200, "pnl": 820 }
    ]
  },
  "meta": { "positions_count": 10, "generated_at": "..." }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/indices",
    description: "All 4 Quiver proprietary composite indices: Election Confidence, Crypto Sentiment, Geopolitical Risk, Economic Outlook. Each aggregates prediction market data into a 0–100 score.",
    tiers: ["free", "pro", "premium"],
    curlExample: `curl -H "Authorization: Bearer YOUR_KEY" \\
  "${BASE}/api/v1/indices"`,
    jsExample: `const res = await fetch('${BASE}/api/v1/indices', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
});
const { data } = await res.json();
data.forEach(idx => console.log(idx.name, idx.current_value));`,
    pyExample: `r = httpx.get('${BASE}/api/v1/indices',
    headers={'Authorization': 'Bearer YOUR_KEY'})
for idx in r.json()['data']:
    print(f"{idx['name']}: {idx['current_value']}")`,
    responseExample: `{
  "data": [
    {
      "slug": "election-confidence",
      "name": "Quiver Election Confidence Index",
      "current_value": 71.4,
      "change_24h": 2.1,
      "component_count": 47,
      "updated_at": "2026-04-11T12:00:00Z"
    }
  ],
  "meta": { "count": 4, "note": "Values 0–100, updated every ~30 min", "generated_at": "..." }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/indices/:slug",
    description: "Single index with historical time-series. Free tier: 7 days. Pro: 30 days. Premium: 365 days.",
    tiers: ["free", "pro", "premium"],
    tierNote: "History: Free: 7 days · Pro: 30 days · Premium: 1 year",
    params: [
      { name: "slug", type: "string", required: true, description: "Index slug: election-confidence, crypto-sentiment, geopolitical-risk, economic-outlook" },
      { name: "days", type: "number", required: false, description: "Days of history (default 30, max depends on tier)" },
    ],
    curlExample: `curl -H "Authorization: Bearer YOUR_KEY" \\
  "${BASE}/api/v1/indices/election-confidence?days=7"`,
    jsExample: `const res = await fetch('${BASE}/api/v1/indices/election-confidence?days=7', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
});
const { data } = await res.json();
console.log(data.history); // [{value, recorded_at}]`,
    pyExample: `r = httpx.get(
    '${BASE}/api/v1/indices/election-confidence',
    params={'days': 7},
    headers={'Authorization': 'Bearer YOUR_KEY'}
)
history = r.json()['data']['history']`,
    responseExample: `{
  "data": {
    "slug": "election-confidence",
    "current_value": 71.4,
    "change_24h": 2.1,
    "history": [
      { "value": 69.2, "recorded_at": "2026-04-04T12:00:00Z" },
      { "value": 70.8, "recorded_at": "2026-04-05T12:00:00Z" }
    ]
  },
  "meta": { "history_days": 7, "history_points": 14, "generated_at": "..." }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/correlations",
    description: "Pairwise market correlations computed using returns-based Pearson coefficients with Bonferroni correction. Useful for pairs trading and lead-lag analysis.",
    tiers: ["free", "pro", "premium"],
    tierNote: "Free: 25 pairs · Pro: 200 · Premium: 2,000",
    params: [
      { name: "min_strength", type: "number", required: false, description: "Minimum absolute correlation (0–1, default 0.5)" },
      { name: "direction", type: "string", required: false, description: "positive or negative to filter by direction" },
      { name: "category", type: "string", required: false, description: "Filter by category of either market in the pair" },
      { name: "limit", type: "number", required: false, description: "Max results (tier-limited)" },
    ],
    curlExample: `curl -H "Authorization: Bearer YOUR_KEY" \\
  "${BASE}/api/v1/correlations?min_strength=0.7"`,
    jsExample: `const res = await fetch('${BASE}/api/v1/correlations?min_strength=0.7', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
});
const { data } = await res.json();`,
    pyExample: `r = httpx.get(
    '${BASE}/api/v1/correlations',
    params={'min_strength': 0.7},
    headers={'Authorization': 'Bearer YOUR_KEY'}
)
pairs = r.json()['data']`,
    responseExample: `{
  "data": [
    {
      "market_a_id": "fed-rate-cut",
      "market_b_id": "recession-by-dec",
      "question_a": "Will the Fed cut rates?",
      "question_b": "US recession by December?",
      "correlation": 0.83,
      "sample_count": 28,
      "category_a": "Economics",
      "category_b": "Economics"
    }
  ],
  "meta": { "count": 25, "generated_at": "..." }
}`,
  },
  {
    method: "GET",
    path: "/api/v1/signals",
    description: "Recent smart money signals: whale consensus shifts, volume spikes, cross-platform divergence events. Updated each ingestion cycle (~30 min).",
    tiers: ["free", "pro", "premium"],
    tierNote: "Free: 10 signals · Pro: 100 · Premium: all",
    params: [
      { name: "limit", type: "number", required: false, description: "Max results (tier-limited)" },
      { name: "signal_type", type: "string", required: false, description: "Filter: whale_consensus, size_spike, or divergence" },
    ],
    curlExample: `curl -H "Authorization: Bearer YOUR_KEY" \\
  "${BASE}/api/v1/signals?limit=10"`,
    jsExample: `const res = await fetch('${BASE}/api/v1/signals?limit=10', {
  headers: { 'Authorization': 'Bearer YOUR_KEY' }
});
const { data } = await res.json();`,
    pyExample: `r = httpx.get(
    '${BASE}/api/v1/signals',
    params={'limit': 10},
    headers={'Authorization': 'Bearer YOUR_KEY'}
)
signals = r.json()['data']`,
    responseExample: `{
  "data": [
    {
      "id": "sig_abc",
      "market_id": "fed-rate-cut",
      "signal_type": "whale_consensus",
      "direction": "bullish",
      "strength": 0.82,
      "description": "Top 10 wallets increased YES by 34% in 7d",
      "created_at": "2026-04-11T11:30:00Z"
    }
  ],
  "meta": { "count": 10, "generated_at": "..." }
}`,
  },
];

const RATE_LIMITS = [
  { tier: "Free", color: "#3fb950", reqMin: 30, reqDay: 1000, markets: 25, arb: 10, history: "None", price: "Free" },
  { tier: "Pro", color: "#388bfd", reqMin: 60, reqDay: 5000, markets: 200, arb: 100, history: "30 days", price: "$39/mo" },
  { tier: "Premium", color: "#a371f7", reqMin: 300, reqDay: 50000, markets: "All", arb: "All", history: "1 year", price: "$149/mo" },
];

const NAV_ITEMS = [
  { id: "quickstart", label: "Quick Start" },
  { id: "auth", label: "Authentication" },
  { id: "rate-limits", label: "Rate Limits" },
  { id: "endpoints", label: "Endpoints" },
  { id: "errors", label: "Error Handling" },
  { id: "sdks", label: "SDKs" },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState("quickstart");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveSection(e.target.id);
        }
      },
      { rootMargin: "-20% 0% -70% 0%" }
    );
    document.querySelectorAll("section[id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-10 space-y-4">
        <div className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[#57D7BA] bg-[#57D7BA]/10 border border-[#57D7BA]/20 px-3 py-1 rounded-full">
          <Activity className="size-3" />
          Quiver Markets API v1 — Public Beta
        </div>
        <h1 className="text-3xl font-black text-[#f0f6fc] tracking-tight">
          Prediction market intelligence<br className="hidden sm:block" /> as a service
        </h1>
        <p className="text-base text-[#8d96a0] max-w-2xl leading-relaxed">
          Access real-time markets, arbitrage spreads, whale flows, proprietary indices, and
          pairwise correlations via a simple REST API. Free tier includes 1,000 requests/day —
          no credit card required.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/settings/api-keys"
            className="inline-flex items-center gap-2 bg-[#57D7BA] text-[#0d1117] text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#57D7BA]/90 transition-all"
          >
            <Key className="size-4" />
            Get API Key
          </Link>
          <Link
            href="/api-docs"
            className="inline-flex items-center gap-2 bg-[#161b27] border border-[#21262d] text-[#f0f6fc] text-sm font-semibold px-4 py-2 rounded-lg hover:border-[#57D7BA]/30 transition-all"
          >
            <Code className="size-4" />
            Full Reference
          </Link>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sticky sidebar */}
        <aside className="hidden lg:block w-44 shrink-0">
          <div className="sticky top-6 space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#484f58] mb-3 px-2">On this page</p>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`block px-3 py-1.5 rounded-lg text-xs transition-all ${
                  activeSection === item.id
                    ? "text-[#57D7BA] bg-[#57D7BA]/10 font-semibold"
                    : "text-[#484f58] hover:text-[#8d96a0] hover:bg-[#161b27]"
                }`}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-4 mt-4 border-t border-[#21262d]">
              <a
                href="#endpoints"
                className="block text-[9px] text-[#484f58] hover:text-[#8d96a0] px-3 py-1"
              >
                All 9 endpoints ↓
              </a>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-12">

          {/* ─── QUICK START ── */}
          <Section id="quickstart" title="Quick Start" icon={Zap}>
            <p className="text-sm text-[#8d96a0]">Three steps to your first API call.</p>

            <div className="space-y-4">
              {[
                { n: 1, title: "Create a free account", desc: "No credit card required. 1,000 API requests per day included forever.", action: <Link href="/pricing" className="text-xs text-[#57D7BA] hover:underline inline-flex items-center gap-1">Sign up free <ChevronRight className="size-3" /></Link> },
                { n: 2, title: "Generate an API key", desc: "Go to Settings → API Keys and create your first key. The key is shown once — save it.", action: <Link href="/settings/api-keys" className="text-xs text-[#57D7BA] hover:underline inline-flex items-center gap-1">API Keys settings <ChevronRight className="size-3" /></Link> },
                { n: 3, title: "Make your first request", desc: "Include your key as a Bearer token in the Authorization header.", action: null },
              ].map((step) => (
                <div key={step.n} className="flex gap-4 rounded-xl bg-[#161b27] border border-[#21262d] p-4">
                  <div className="w-7 h-7 rounded-full bg-[#57D7BA]/10 border border-[#57D7BA]/20 flex items-center justify-center shrink-0 text-xs font-bold text-[#57D7BA]">{step.n}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#f0f6fc]">{step.title}</p>
                    <p className="text-xs text-[#8d96a0] mt-0.5">{step.desc}</p>
                    {step.action && <div className="mt-2">{step.action}</div>}
                  </div>
                </div>
              ))}
            </div>

            <CodeBlock
              lang="bash"
              code={`# Your first API call — list top 10 markets
curl -H "Authorization: Bearer qvr_live_YOUR_KEY" \\
  "${BASE}/api/v1/markets?limit=10"

# Response includes:
# - data: array of markets with price, volume, change_24h
# - meta: count, tier, rate limit info`}
            />
          </Section>

          {/* ─── AUTHENTICATION ── */}
          <Section id="auth" title="Authentication" icon={Shield}>
            <p className="text-sm text-[#8d96a0] leading-relaxed">
              Every request (except <code className="text-[#57D7BA] bg-[#0d1117] px-1 rounded text-xs">/api/v1/health</code>) must include an
              Authorization header with your API key as a Bearer token.
            </p>

            <CodeBlock lang="bash" code={`Authorization: Bearer qvr_live_YOUR_API_KEY_HERE`} />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-[#3fb950]/5 border border-[#3fb950]/20 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-[#3fb950] text-xs font-semibold">
                  <Check className="size-3.5" /> Do this
                </div>
                <CodeBlock lang="bash" code={`curl -H "Authorization: Bearer qvr_live_abc123" \\
  ${BASE}/api/v1/markets`} />
              </div>
              <div className="rounded-xl bg-[#f85149]/5 border border-[#f85149]/20 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-[#f85149] text-xs font-semibold">
                  <AlertTriangle className="size-3.5" /> Not this
                </div>
                <CodeBlock lang="bash" code={`# Missing header → 401 Unauthorized
curl ${BASE}/api/v1/markets

# Wrong scheme → 401
curl -H "X-API-Key: qvr_live_abc123" ${BASE}/api/v1/markets`} />
              </div>
            </div>

            <div className="rounded-xl bg-[#d29922]/5 border border-[#d29922]/20 p-4 flex gap-3">
              <AlertTriangle className="size-4 text-[#d29922] shrink-0 mt-0.5" />
              <p className="text-xs text-[#8d96a0] leading-relaxed">
                <strong className="text-[#f0f6fc]">Keep your key secret.</strong> Never commit API keys to Git or include them in client-side code.
                If a key is compromised, revoke it immediately in{" "}
                <Link href="/settings/api-keys" className="text-[#57D7BA] hover:underline">Settings → API Keys</Link>.
              </p>
            </div>
          </Section>

          {/* ─── RATE LIMITS ── */}
          <Section id="rate-limits" title="Rate Limits" icon={Activity}>
            <p className="text-sm text-[#8d96a0] leading-relaxed">
              Rate limits are enforced per API key. The free tier is genuinely useful — all endpoints
              are available, with limits on result counts and history depth.
            </p>

            <div className="rounded-xl border border-[#21262d] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#161b27] border-b border-[#21262d]">
                    {["Tier", "Price", "Req/min", "Req/day", "Markets", "Arb", "History"].map((h) => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#484f58]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RATE_LIMITS.map((r) => (
                    <tr key={r.tier} className="border-b border-[#21262d]/50 hover:bg-[#161b27] transition-colors">
                      <td className="px-3 py-3 font-bold" style={{ color: r.color }}>{r.tier}</td>
                      <td className="px-3 py-3 font-mono text-[#8d96a0]">{r.price}</td>
                      <td className="px-3 py-3 font-mono text-[#f0f6fc]">{r.reqMin}</td>
                      <td className="px-3 py-3 font-mono text-[#f0f6fc]">{r.reqDay.toLocaleString()}</td>
                      <td className="px-3 py-3 font-mono text-[#8d96a0]">{r.markets}</td>
                      <td className="px-3 py-3 font-mono text-[#8d96a0]">{r.arb}</td>
                      <td className="px-3 py-3 font-mono text-[#8d96a0]">{r.history}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-[#484f58]">
              Rate limit headers are included in every response:{" "}
              <code className="text-[#57D7BA] bg-[#0d1117] px-1 rounded">X-RateLimit-Limit</code>,{" "}
              <code className="text-[#57D7BA] bg-[#0d1117] px-1 rounded">X-RateLimit-Remaining</code>,{" "}
              <code className="text-[#57D7BA] bg-[#0d1117] px-1 rounded">X-RateLimit-Reset</code> (Unix timestamp).
              A <code className="text-[#57D7BA] bg-[#0d1117] px-1 rounded">429 Too Many Requests</code> is returned when limits are exceeded.
            </p>
          </Section>

          {/* ─── ENDPOINTS ── */}
          <Section id="endpoints" title="Endpoints" icon={Globe}>
            <p className="text-sm text-[#8d96a0]">
              Base URL: <code className="text-[#57D7BA] bg-[#0d1117] px-1 rounded text-xs">{BASE}</code>
              {" · "}All responses include a <code className="text-[#57D7BA] bg-[#0d1117] px-1 rounded text-xs">meta</code> envelope with{" "}
              <code className="text-[#57D7BA] bg-[#0d1117] px-1 rounded text-xs">generated_at</code> and rate limit context.
              CORS is open (no origin restriction).
            </p>
            <div className="space-y-6">
              {ENDPOINTS_DATA.map((ep) => (
                <EndpointBlock key={ep.path} {...ep} />
              ))}
            </div>
          </Section>

          {/* ─── ERROR HANDLING ── */}
          <Section id="errors" title="Error Handling" icon={AlertTriangle}>
            <p className="text-sm text-[#8d96a0]">All errors return a standard envelope with an HTTP status code and a message.</p>
            <CodeBlock lang="json" code={`// Standard error envelope
{
  "error": "Human-readable error message here"
}

// HTTP status codes:
// 400 Bad Request     — invalid parameters
// 401 Unauthorized    — missing or invalid API key
// 404 Not Found       — resource doesn't exist
// 429 Too Many Requests — rate limit exceeded
// 500 Internal Server Error — our fault, try again`} />

            <div className="space-y-2">
              {[
                { code: 401, color: "#f85149", msg: "Invalid API key", note: "Check the key is correct and hasn't been revoked" },
                { code: 429, color: "#d29922", msg: "Per-minute rate limit exceeded (30 req/min)", note: "Wait 60 seconds then retry" },
                { code: 429, color: "#d29922", msg: "Daily rate limit exceeded (1000 req/day). Resets at midnight UTC.", note: "Upgrade or wait for reset" },
              ].map((e, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-[#161b27] border border-[#21262d] p-3">
                  <span className="font-mono text-xs font-bold shrink-0 mt-0.5" style={{ color: e.color }}>{e.code}</span>
                  <div>
                    <code className="text-xs text-[#8d96a0]">{e.msg}</code>
                    <p className="text-[10px] text-[#484f58] mt-0.5">{e.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ─── SDKs ── */}
          <Section id="sdks" title="SDKs & Wrappers" icon={Code}>
            <p className="text-sm text-[#8d96a0] leading-relaxed">
              Community SDKs are welcome. The API is designed to be simple enough to integrate directly
              without a wrapper library, but if you build one, email us and we&apos;ll feature it here.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { lang: "JavaScript", status: "Direct (no wrapper needed)", note: "Native fetch works out of the box. Use any HTTP client." },
                { lang: "Python", status: "httpx / requests", note: "Both work perfectly. See examples above." },
                { lang: "R / Julia", status: "Community welcome", note: "Email hello@quivermarkets.com if you build one." },
              ].map((s) => (
                <div key={s.lang} className="rounded-xl bg-[#161b27] border border-[#21262d] p-4 space-y-2">
                  <p className="text-xs font-bold text-[#f0f6fc]">{s.lang}</p>
                  <p className="text-[10px] font-semibold text-[#57D7BA]">{s.status}</p>
                  <p className="text-[10px] text-[#484f58]">{s.note}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#161b27] border border-[#21262d] p-4">
              <div>
                <p className="text-sm font-semibold text-[#f0f6fc]">Ready to build?</p>
                <p className="text-xs text-[#8d96a0] mt-0.5">Get your free API key — 1,000 requests/day, all endpoints, no card required.</p>
              </div>
              <Link
                href="/settings/api-keys"
                className="shrink-0 inline-flex items-center gap-1.5 bg-[#57D7BA] text-[#0d1117] text-xs font-bold px-3 py-2 rounded-lg hover:bg-[#57D7BA]/90 transition-all"
              >
                <Key className="size-3.5" />
                Get API Key
              </Link>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
