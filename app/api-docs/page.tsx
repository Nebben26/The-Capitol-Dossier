"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Code,
  Zap,
  Shield,
  Globe,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Lock,
  ArrowUpRight,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Endpoint {
  method: "GET" | "POST";
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  response: string;
  tiers: ("free" | "pro" | "premium")[];
  tierNote?: string;
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/v1/health",
    description: "Health check — no auth required. Returns API status and database connectivity.",
    response: `{
  "status": "ok",
  "version": "v1",
  "uptime_seconds": 3600,
  "database": "connected",
  "timestamp": "2026-04-07T12:00:00Z"
}`,
    tiers: ["free", "pro", "premium"],
  },
  {
    method: "GET",
    path: "/api/v1/markets",
    description: "Returns prediction markets across Polymarket and Kalshi, filterable by category, volume, and sorted by volume or 24h change.",
    params: [
      { name: "category", type: "string", required: false, description: "Filter by category (Economics, Elections, Sports, Crypto, Tech, Geopolitics)" },
      { name: "min_volume", type: "number", required: false, description: "Minimum volume in USD" },
      { name: "sort", type: "string", required: false, description: "Sort by: volume (default) or change_24h" },
      { name: "limit", type: "number", required: false, description: "Results per page. Free: max 25, Pro: max 200, Premium: max 10,000" },
    ],
    response: `{
  "data": [
    {
      "id": "will-the-fed-cut-rates",
      "question": "Will the Fed cut rates before July 2026?",
      "category": "Economics",
      "platform": "polymarket",
      "price": 68,
      "volume": 4200000,
      "change_24h": 3.2,
      "end_date": "2026-07-01T00:00:00Z"
    }
  ],
  "meta": { "count": 25, "tier": "free", "tier_limit": 25 }
}`,
    tiers: ["free", "pro", "premium"],
    tierNote: "Free: 25 results · Pro: 200 results · Premium: all markets",
  },
  {
    method: "GET",
    path: "/api/v1/disagreements",
    description: "Returns cross-platform price disagreements between Polymarket and Kalshi, sorted by spread size.",
    params: [
      { name: "min_spread", type: "number", required: false, description: "Minimum spread in percentage points (e.g. 5 = 5pp gap)" },
      { name: "category", type: "string", required: false, description: "Filter by market category" },
      { name: "limit", type: "number", required: false, description: "Free: max 10, Pro: max 100, Premium: max 1,000" },
    ],
    response: `{
  "data": [
    {
      "id": "abc123",
      "question": "Trump wins 2028?",
      "poly_price": 72,
      "kalshi_price": 61,
      "spread": 11,
      "direction": "poly-higher",
      "spread_trend": "widening",
      "category": "Elections",
      "updated_at": "2026-04-07T11:45:00Z"
    }
  ],
  "meta": { "count": 10, "tier": "free" }
}`,
    tiers: ["free", "pro", "premium"],
    tierNote: "Free: 10 results · Pro: 100 results · Premium: 1,000 results",
  },
  {
    method: "GET",
    path: "/api/v1/disagreements/history",
    description: "Returns historical spread snapshots for a specific market, showing how the gap between Polymarket and Kalshi has evolved.",
    params: [
      { name: "market_id", type: "string", required: true, description: "Polymarket market ID (from /disagreements response)" },
      { name: "days", type: "number", required: false, description: "Days of history. Pro: max 7, Premium: max 90" },
    ],
    response: `{
  "data": [
    { "poly_market_id": "abc123", "spread": 11.2, "captured_at": "2026-04-07T12:00:00Z" },
    { "poly_market_id": "abc123", "spread": 9.8,  "captured_at": "2026-04-07T11:30:00Z" }
  ],
  "meta": { "market_id": "abc123", "days_requested": 7, "count": 336 }
}`,
    tiers: ["pro", "premium"],
    tierNote: "Free: blocked · Pro: 7 days history · Premium: 90 days",
  },
  {
    method: "GET",
    path: "/api/v1/whales",
    description: "Returns tracked whale wallets sorted by P&L or accuracy.",
    params: [
      { name: "sort", type: "string", required: false, description: "Sort by: pnl (default) or accuracy" },
      { name: "limit", type: "number", required: false, description: "Free: max 25, Pro: max 100, Premium: max 1,000" },
      { name: "include_positions", type: "boolean", required: false, description: "Include position count per whale (Pro+ only)" },
    ],
    response: `{
  "data": [
    {
      "address": "0x1234...",
      "display_name": "DegenWhale.eth",
      "total_pnl": 4200000,
      "accuracy": 74,
      "total_trades": 847,
      "tag": "SMART"
    }
  ],
  "meta": { "count": 25, "sort": "total_pnl", "tier": "free" }
}`,
    tiers: ["free", "pro", "premium"],
    tierNote: "Free: 25 whales · Pro: 100 whales + position counts · Premium: all 149+",
  },
  {
    method: "GET",
    path: "/api/v1/whales/{address}/positions",
    description: "Returns all current open positions for a specific whale wallet, enriched with market questions.",
    params: [
      { name: "address", type: "string (path)", required: true, description: "Whale wallet address" },
    ],
    response: `{
  "data": [
    {
      "market_id": "fed-rate-cut-july",
      "market_question": "Will the Fed cut rates before July 2026?",
      "outcome": "Yes",
      "size": 50000,
      "avg_price": 0.62,
      "current_value": 31000,
      "pnl": 4200
    }
  ],
  "meta": { "address": "0x1234...", "count": 12 }
}`,
    tiers: ["pro", "premium"],
    tierNote: "Free: blocked · Pro: current positions · Premium: all positions + full history",
  },
  {
    method: "GET",
    path: "/api/v1/flow",
    description: "Smart Money Flow — aggregated whale capital by market category, showing where the big money is moving. Available to all tiers.",
    response: `{
  "data": [
    {
      "category": "Economics",
      "yes_value_usd": 4200000,
      "no_value_usd": 1800000,
      "net_flow_usd": 2400000,
      "total_value_usd": 6000000,
      "position_count": 847,
      "unique_whales": 34,
      "direction": "YES"
    }
  ],
  "meta": { "count": 8, "total_positions_analyzed": 5928 }
}`,
    tiers: ["free", "pro", "premium"],
  },
  {
    method: "GET",
    path: "/api/v1/signals",
    description: "AI-detected whale behaviour signals — consensus trades, size spikes, smart money divergence, and concentration patterns.",
    params: [
      { name: "type", type: "string", required: false, description: "Filter by: whale_consensus, smart_money_concentration, size_spike, whale_divergence" },
      { name: "min_confidence", type: "number", required: false, description: "Minimum confidence score (1-10)" },
      { name: "limit", type: "number", required: false, description: "Free: max 5, Pro: max 50, Premium: max 500" },
    ],
    response: `{
  "data": [
    {
      "signal_id": "whale_consensus_market-abc_NO",
      "type": "whale_consensus",
      "confidence": 9,
      "market_id": "lightning-senators",
      "market_question": "Lightning vs. Senators",
      "headline": "12 whales piling into NO in the last 6h",
      "detail": "$883K total position size on NO.",
      "detected_at": "2026-04-07T12:00:00Z"
    }
  ],
  "meta": { "count": 5, "tier": "free" }
}`,
    tiers: ["free", "pro", "premium"],
    tierNote: "Free: 5 signals · Pro: 50 signals · Premium: 500 signals + historical",
  },
];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: "free" | "pro" | "premium" }) {
  const styles = {
    free: "bg-[#8892b0]/10 text-[#8892b0]",
    pro: "bg-[#57D7BA]/10 text-[#57D7BA]",
    premium: "bg-[#f59e0b]/10 text-[#f59e0b]",
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${styles[tier]}`}>
      {tier}
    </span>
  );
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false);
  const methodColor = ep.method === "GET" ? "text-[#22c55e] bg-[#22c55e]/10" : "text-[#f59e0b] bg-[#f59e0b]/10";

  return (
    <Card className="bg-[#222638] border-[#2f374f]">
      <CardContent className="p-0">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#57D7BA]/5 transition-colors rounded-lg"
        >
          <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${methodColor}`}>
            {ep.method}
          </span>
          <span className="flex-1 font-mono text-sm text-[#e2e8f0]">{ep.path}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {ep.tiers.map((t) => <TierBadge key={t} tier={t} />)}
          </div>
          {open ? <ChevronUp className="size-4 text-[#8892b0] shrink-0" /> : <ChevronDown className="size-4 text-[#8892b0] shrink-0" />}
        </button>

        {open && (
          <div className="px-4 pb-4 space-y-4 border-t border-[#2f374f] pt-4">
            <p className="text-sm text-[#8892b0]">{ep.description}</p>

            {ep.tierNote && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#57D7BA]/5 border border-[#57D7BA]/15">
                <Shield className="size-3.5 text-[#57D7BA] shrink-0" />
                <span className="text-[11px] text-[#57D7BA]">{ep.tierNote}</span>
              </div>
            )}

            {ep.params && ep.params.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-[#8892b0] uppercase tracking-wide mb-2">Parameters</p>
                <div className="rounded-lg overflow-hidden border border-[#2f374f]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#1a1e2e] border-b border-[#2f374f]">
                        <th className="text-left px-3 py-2 text-[10px] text-[#8892b0] font-medium">NAME</th>
                        <th className="text-left px-3 py-2 text-[10px] text-[#8892b0] font-medium">TYPE</th>
                        <th className="text-left px-3 py-2 text-[10px] text-[#8892b0] font-medium">REQ</th>
                        <th className="text-left px-3 py-2 text-[10px] text-[#8892b0] font-medium">DESCRIPTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ep.params.map((p) => (
                        <tr key={p.name} className="border-b border-[#2f374f]/50 last:border-0">
                          <td className="px-3 py-2 font-mono text-[#57D7BA]">{p.name}</td>
                          <td className="px-3 py-2 text-[#8892b0]">{p.type}</td>
                          <td className="px-3 py-2">
                            {p.required
                              ? <span className="text-[#ef4444] font-bold">yes</span>
                              : <span className="text-[#8892b0]">no</span>}
                          </td>
                          <td className="px-3 py-2 text-[#8892b0]">{p.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-semibold text-[#8892b0] uppercase tracking-wide mb-2">Response</p>
              <pre className="bg-[#1a1e2e] rounded-lg p-4 text-[11px] font-mono text-[#57D7BA] overflow-x-auto leading-relaxed">
                {ep.response}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ApiDocsPage() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 py-5 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 py-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#57D7BA]/10 border border-[#57D7BA]/20 text-[11px] text-[#57D7BA] font-semibold mb-2">
          <Zap className="size-3" /> Public Beta
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Quiver Markets API
        </h1>
        <p className="text-[#8892b0] max-w-xl mx-auto">
          Programmatic access to prediction market intelligence — disagreements,
          whale positions, smart signals, and real-time flow data.
        </p>
      </div>

      {/* Pricing tiers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            tier: "Starter API",
            price: "$150",
            sub: "per month",
            color: "#22d3ee",
            limits: ["20 req/min", "1,000 req/day"],
            endpoints: ["All endpoints (limited results)", "/api/v1/disagreements", "/api/v1/whales", "7-day history"],
            cta: "Get Starter API",
            ctaLink: "/pricing",
          },
          {
            tier: "Quant API",
            price: "$500",
            sub: "per month",
            color: "#f59e0b",
            limits: ["60 req/min", "5,000 req/day"],
            endpoints: ["All Starter endpoints (expanded)", "/api/v1/disagreements/history (30d)", "/api/v1/whales/{address}/positions", "Signals + flow feeds"],
            cta: "Get Quant API",
            ctaLink: "/pricing",
            featured: true,
          },
          {
            tier: "Premium",
            price: "$1,500",
            sub: "per month",
            color: "#8b5cf6",
            limits: ["600 req/min", "100,000 req/day"],
            endpoints: ["All Quant endpoints (expanded)", "/api/v1/disagreements/history (90d)", "Full market universe (6,070+)", "Priority support & SLA"],
            cta: "Contact us",
            ctaLink: "/pricing",
          },
        ].map((t) => (
          <Card
            key={t.tier}
            className={`bg-[#222638] transition-all ${t.featured ? "border-[#57D7BA]/40 ring-1 ring-[#57D7BA]/20" : "border-[#2f374f]"}`}
          >
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.color }}>
                  {t.tier}
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-[#e2e8f0]">{t.price}</span>
                  <span className="text-xs text-[#8892b0]">/{t.sub}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {t.limits.map((l) => (
                  <div key={l} className="flex items-center gap-2 text-[11px] text-[#8892b0]">
                    <Zap className="size-3 shrink-0" style={{ color: t.color }} />
                    {l}
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 pt-2 border-t border-[#2f374f]">
                {t.endpoints.map((e) => (
                  <div key={e} className="flex items-start gap-2 text-[11px] text-[#8892b0]">
                    <CheckCircle className="size-3 shrink-0 mt-0.5 text-[#22c55e]" />
                    {e}
                  </div>
                ))}
              </div>
              <Link
                href="/pricing"
                className="flex items-center justify-center gap-1 w-full py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ backgroundColor: `${t.color}18`, color: t.color, border: `1px solid ${t.color}30` }}
              >
                {t.cta} <ArrowUpRight className="size-3" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick start */}
      <Card className="bg-[#222638] border-[#2f374f]">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Code className="size-4 text-[#57D7BA]" />
            <p className="text-sm font-semibold text-[#e2e8f0]">Quick Start</p>
          </div>
          <pre className="bg-[#1a1e2e] rounded-lg p-4 text-[11px] font-mono text-[#57D7BA] overflow-x-auto leading-relaxed">
{`# 1. Get your API key (email hello@quivermarkets.com)

# 2. Make your first request
curl -H "Authorization: Bearer qm_free_your_key_here" \\
     https://quivermarkets.com/api/v1/flow

# 3. Filter disagreements with a 10pt+ spread
curl -H "Authorization: Bearer qm_free_your_key_here" \\
     "https://quivermarkets.com/api/v1/disagreements?min_spread=10&limit=5"

# 4. Get top whale positions (Pro+)
curl -H "Authorization: Bearer qm_pro_your_key_here" \\
     "https://quivermarkets.com/api/v1/whales/0x1234.../positions"`}
          </pre>
        </CardContent>
      </Card>

      {/* Endpoint reference */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[#e2e8f0]">Endpoint Reference</h2>
        {ENDPOINTS.map((ep) => (
          <EndpointCard key={ep.path} ep={ep} />
        ))}
      </div>

      {/* Auth + Rate Limiting */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-[#222638] border-[#2f374f]">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="size-4 text-[#57D7BA]" />
              <p className="text-sm font-semibold text-[#e2e8f0]">Authentication</p>
            </div>
            <p className="text-[11px] text-[#8892b0] leading-relaxed">
              All endpoints (except <code className="text-[#57D7BA]">/health</code>) require an API key.
              Pass it as a Bearer token in the <code className="text-[#57D7BA]">Authorization</code> header.
            </p>
            <pre className="bg-[#1a1e2e] rounded-lg p-3 text-[10px] font-mono text-[#57D7BA]">
{`Authorization: Bearer qm_free_a1b2c3d4...`}
            </pre>
            <p className="text-[10px] text-[#8892b0]">
              Keys are prefixed with your tier: <code>qm_free_</code>, <code>qm_pro_</code>, or <code>qm_premium_</code>.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#222638] border-[#2f374f]">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-[#57D7BA]" />
              <p className="text-sm font-semibold text-[#e2e8f0]">Rate Limiting</p>
            </div>
            <p className="text-[11px] text-[#8892b0] leading-relaxed">
              Rate limit info is returned in every response header. When you hit the limit,
              you receive a <code className="text-[#57D7BA]">429 Too Many Requests</code> with a message explaining the reset time.
            </p>
            <pre className="bg-[#1a1e2e] rounded-lg p-3 text-[10px] font-mono text-[#57D7BA]">
{`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1744070400  # Unix timestamp (midnight UTC)
X-RateLimit-Tier: free`}
            </pre>
          </CardContent>
        </Card>
      </div>

      {/* Coming soon */}
      <Card className="bg-[#222638] border-[#2f374f]">
        <CardContent className="p-5 flex items-start gap-3">
          <Globe className="size-5 text-[#8b5cf6] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#e2e8f0] mb-1">Coming Soon — Webhooks</p>
            <p className="text-[11px] text-[#8892b0] leading-relaxed">
              Subscribe to real-time events: new disagreements above a spread threshold, whale position
              changes, signal detections, and market resolutions. Register a webhook URL and we'll POST
              to it within 30 seconds of detection. Expected availability: Q3 2026.
            </p>
          </div>
        </CardContent>
      </Card>

      <footer className="flex items-center justify-between py-4 border-t border-[#2f374f] text-[10px] text-[#8892b0]">
        <span>© 2026 Quiver Markets. Not financial advice.</span>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
          <a href="mailto:hello@quivermarkets.com" className="hover:text-[#57D7BA] transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
