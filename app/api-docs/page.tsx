"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/layout/AuthContext";
import { ProBadge } from "@/components/ui/pro-gate";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Code,
  Zap,
  Lock,
  Key,
  ArrowRight,
  Copy,
  Check,
  Globe,
  Clock,
  Shield,
  BarChart3,
  Users,
  GitCompareArrows,
  Radio,
  BookOpen,
  Terminal,
} from "lucide-react";

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-lg bg-[#0f1119] border border-[#2f374f] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2f374f]">
        <span className="text-[10px] text-[#8892b0] font-mono uppercase">{lang}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] text-[#8892b0] hover:text-[#57D7BA] transition-colors">
          {copied ? <Check className="size-3 text-[#22c55e]" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-[#e2e8f0]"><code>{code}</code></pre>
    </div>
  );
}

const endpoints = [
  {
    method: "GET",
    path: "/v1/markets",
    desc: "List all active prediction markets across Polymarket and Kalshi",
    params: [
      { name: "limit", type: "number", desc: "Results per page (default: 50, max: 200)" },
      { name: "offset", type: "number", desc: "Pagination offset" },
      { name: "category", type: "string", desc: "Filter by category (Economics, Elections, Crypto, etc.)" },
      { name: "platform", type: "string", desc: "Filter by platform (polymarket, kalshi, all)" },
      { name: "sort", type: "string", desc: "Sort by volume, change, resolution (default: volume)" },
    ],
    response: `{
  "data": [
    {
      "id": "recession-2026",
      "question": "Will there be a US recession by Dec 2026?",
      "price": 68,
      "change_24h": 12.4,
      "volume": 24100000,
      "category": "Economics",
      "platform": "polymarket",
      "resolution_date": "2026-12-31",
      "days_left": 271,
      "traders": 18420,
      "liquidity": 4200000
    }
  ],
  "total": 24,
  "limit": 50,
  "offset": 0
}`,
  },
  {
    method: "GET",
    path: "/v1/markets/:id",
    desc: "Get detailed data for a single market including orderbook and whale positions",
    params: [
      { name: "id", type: "string", desc: "Market ID (e.g. recession-2026)" },
    ],
    response: `{
  "id": "recession-2026",
  "question": "Will there be a US recession by Dec 2026?",
  "description": "Resolves YES if NBER declares...",
  "price": 68,
  "change_24h": 12.4,
  "volume_24h": 4200000,
  "total_volume": 24100000,
  "liquidity": 4200000,
  "traders": 18420,
  "whale_count": 22,
  "platform": "polymarket",
  "resolution_date": "2026-12-31",
  "cross_platform": {
    "polymarket": 68,
    "kalshi": 55,
    "spread": 13
  }
}`,
  },
  {
    method: "GET",
    path: "/v1/disagrees",
    desc: "Cross-platform arbitrage opportunities where spread ≥ 10 points",
    params: [
      { name: "min_spread", type: "number", desc: "Minimum spread threshold (default: 10)" },
      { name: "category", type: "string", desc: "Filter by category" },
    ],
    response: `{
  "data": [
    {
      "market_id": "recession-2026",
      "question": "US recession by Dec 2026?",
      "polymarket_price": 68,
      "kalshi_price": 55,
      "spread": 13,
      "direction": "poly_higher",
      "combined_volume": 32400000
    }
  ],
  "total": 10
}`,
  },
  {
    method: "GET",
    path: "/v1/whales",
    desc: "Top prediction market traders ranked by P&L and accuracy",
    params: [
      { name: "limit", type: "number", desc: "Results per page (default: 15)" },
      { name: "sort", type: "string", desc: "Sort by rank, pnl, accuracy, brier" },
    ],
    response: `{
  "data": [
    {
      "id": "w4",
      "name": "KalshiKing",
      "rank": 1,
      "accuracy": 79,
      "win_rate": 74,
      "total_pnl": 5800000,
      "brier_score": 0.11,
      "total_trades": 534,
      "active_markets": 9
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/v1/whales/:id/positions",
    desc: "Live on-chain positions for a tracked whale wallet",
    params: [
      { name: "id", type: "string", desc: "Whale ID (e.g. w4)" },
    ],
    response: `{
  "whale_id": "w4",
  "name": "KalshiKing",
  "positions": [
    {
      "market_id": "recession-2026",
      "side": "YES",
      "size": 3100000,
      "entry_price": 61,
      "current_price": 68,
      "unrealized_pnl": 620000
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/v1/alerts/stream",
    desc: "WebSocket stream of real-time whale alerts and price spikes",
    params: [
      { name: "types", type: "string", desc: "Comma-separated: whale,price,resolution" },
      { name: "min_size", type: "number", desc: "Minimum trade size in USD" },
    ],
    response: `// WebSocket message
{
  "type": "whale_alert",
  "timestamp": "2026-04-05T14:32:00Z",
  "wallet": "KalshiKing",
  "side": "YES",
  "size": 3100000,
  "market_id": "recession-2026",
  "price": 68,
  "accuracy": 79
}`,
  },
];

const jsExample = `import { QuiverClient } from '@quivermarkets/sdk';

const client = new QuiverClient({
  apiKey: process.env.QUIVER_API_KEY,
});

// Fetch all markets sorted by volume
const markets = await client.markets.list({
  sort: 'volume',
  limit: 20,
});

// Get cross-platform arbitrage opportunities
const disagrees = await client.disagrees.list({
  min_spread: 10,
});

// Stream real-time whale alerts
client.alerts.stream({
  types: ['whale', 'price'],
  min_size: 500000,
  onAlert: (alert) => {
    console.log("Whale: " + alert.wallet + " went " + alert.side + " on " + alert.market_id);
  },
});`;

const pyExample = `import quivermarkets as qm

client = qm.Client(api_key="YOUR_API_KEY")

# Fetch all markets sorted by volume
markets = client.markets.list(sort="volume", limit=20)

for market in markets:
    print(f"{market.question}: {market.price} cents")

# Get cross-platform arbitrage opportunities
disagrees = client.disagrees.list(min_spread=10)

for d in disagrees:
    print(f"Spread: {d.spread}pts — Poly {d.polymarket_price} vs Kalshi {d.kalshi_price}")

# Stream real-time whale alerts
def on_alert(alert):
    print(f"Whale: {alert.wallet} went {alert.side} on {alert.market_id}")

client.alerts.stream(types=["whale", "price"], callback=on_alert)`;

const curlExample = `# List markets
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  "https://api.quivermarkets.com/v1/markets?sort=volume&limit=10"

# Get single market
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  "https://api.quivermarkets.com/v1/markets/recession-2026"

# Get cross-platform spreads
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  "https://api.quivermarkets.com/v1/disagrees?min_spread=10"

# Get whale positions
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  "https://api.quivermarkets.com/v1/whales/w4/positions"`;

export default function ApiDocsPage() {
  const { user, isPro, startTrial, setShowLogin } = useAuth();
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-xl bg-[#57D7BA]/10 flex items-center justify-center">
            <BookOpen className="size-5 text-[#57D7BA]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">API Documentation</h1>
            <p className="text-sm text-[#8892b0]">Build on top of Quiver Markets data with our REST and WebSocket APIs</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-4">
          <span className="px-2.5 py-1 rounded-full bg-[#222638] border border-[#2f374f] text-[10px] text-[#8892b0] flex items-center gap-1"><Globe className="size-3" />Base URL: api.quivermarkets.com</span>
          <span className="px-2.5 py-1 rounded-full bg-[#222638] border border-[#2f374f] text-[10px] text-[#8892b0] flex items-center gap-1"><Lock className="size-3" />API Key Auth</span>
          <span className="px-2.5 py-1 rounded-full bg-[#222638] border border-[#2f374f] text-[10px] text-[#8892b0] flex items-center gap-1"><Zap className="size-3" />WebSocket Support</span>
          <span className="px-2.5 py-1 rounded-full bg-[#222638] border border-[#2f374f] text-[10px] text-[#8892b0] flex items-center gap-1"><Clock className="size-3" />99.9% Uptime</span>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Code, title: "REST API", desc: "Query markets, whales, orderbooks, and historical data with simple HTTP requests", color: "#57D7BA" },
          { icon: Zap, title: "WebSocket", desc: "Real-time price feeds, whale alerts, and resolution notifications streamed live", color: "#f59e0b" },
          { icon: Lock, title: "Authentication", desc: "Bearer token auth with per-key rate limiting and usage analytics", color: "#6366f1" },
        ].map((item) => (
          <Card key={item.title} className="bg-[#222638] border-[#2f374f]">
            <CardContent className="p-5 space-y-3">
              <div className="size-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                <item.icon className="size-5" style={{ color: item.color }} />
              </div>
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="text-[11px] text-[#8892b0] leading-relaxed">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Authentication */}
      <Card className="bg-[#222638] border-[#2f374f]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Key className="size-4 text-[#f59e0b]" />Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[#8892b0] leading-relaxed">
            All API requests require a valid API key passed in the <code className="px-1.5 py-0.5 rounded bg-[#0f1119] text-[#57D7BA] text-xs font-mono">Authorization</code> header.
          </p>
          <CodeBlock lang="http" code={`GET /v1/markets HTTP/1.1\nHost: api.quivermarkets.com\nAuthorization: Bearer YOUR_API_KEY\nContent-Type: application/json`} />
          <div className="flex items-center gap-3 pt-2">
            {isPro ? (
              <Button className="bg-[#22c55e] text-white hover:bg-[#22c55e]/80 gap-1.5"><Key className="size-4" />Your API Key: qm_live_...abc123</Button>
            ) : (
              <Button onClick={() => user ? startTrial() : setShowLogin(true)} className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 gap-1.5"><Key className="size-4" />Get API Key</Button>
            )}
            <p className="text-[10px] text-[#8892b0]">API access requires a Pro subscription ($22/mo)</p>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card className="bg-[#222638] border-[#2f374f]">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Shield className="size-4 text-[#6366f1]" />Rate Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { tier: "Pro", reads: "100/min", writes: "20/min", ws: "5 connections", color: "#57D7BA" },
              { tier: "Enterprise", reads: "500/min", writes: "100/min", ws: "25 connections", color: "#f59e0b" },
              { tier: "Custom", reads: "Unlimited", writes: "Unlimited", ws: "Unlimited", color: "#8b5cf6" },
            ].map((t) => (
              <div key={t.tier} className="p-4 rounded-lg bg-[#0f1119] border border-[#2f374f]">
                <div className="text-sm font-bold mb-3" style={{ color: t.color }}>{t.tier}</div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between"><span className="text-[#8892b0]">REST reads</span><span className="font-mono text-[#e2e8f0]">{t.reads}</span></div>
                  <div className="flex justify-between"><span className="text-[#8892b0]">REST writes</span><span className="font-mono text-[#e2e8f0]">{t.writes}</span></div>
                  <div className="flex justify-between"><span className="text-[#8892b0]">WebSocket</span><span className="font-mono text-[#e2e8f0]">{t.ws}</span></div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#8892b0] mt-3">Rate limit headers included in every response: <code className="text-[#57D7BA]">X-RateLimit-Remaining</code>, <code className="text-[#57D7BA]">X-RateLimit-Reset</code></p>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Terminal className="size-5 text-[#57D7BA]" />Endpoints</h2>
        <div className="space-y-4">
          {endpoints.map((ep, i) => (
            <Card key={i} className="bg-[#222638] border-[#2f374f]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#22c55e]/10 text-[#22c55e]">{ep.method}</span>
                  <code className="text-sm font-mono text-[#57D7BA]">{ep.path}</code>
                </div>
                <CardDescription className="text-xs text-[#8892b0]">{ep.desc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ep.params.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[#8892b0] uppercase tracking-wider font-semibold mb-2">Parameters</p>
                    <div className="space-y-1">
                      {ep.params.map((p) => (
                        <div key={p.name} className="flex items-baseline gap-2 text-xs">
                          <code className="font-mono text-[#57D7BA] shrink-0">{p.name}</code>
                          <span className="text-[9px] text-[#8892b0] font-mono shrink-0">({p.type})</span>
                          <span className="text-[#8892b0]">— {p.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-[#8892b0] uppercase tracking-wider font-semibold mb-2">Response</p>
                  <CodeBlock lang="json" code={ep.response} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Code Examples */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Code className="size-5 text-[#f59e0b]" />Code Examples</h2>
        <Tabs defaultValue="js">
          <TabsList variant="line" className="bg-transparent gap-0 mb-4">
            <TabsTrigger value="js" className="px-4 py-2.5 text-xs gap-1.5 data-active:text-[#57D7BA] text-[#8892b0]">JavaScript / TypeScript</TabsTrigger>
            <TabsTrigger value="py" className="px-4 py-2.5 text-xs gap-1.5 data-active:text-[#57D7BA] text-[#8892b0]">Python</TabsTrigger>
            <TabsTrigger value="curl" className="px-4 py-2.5 text-xs gap-1.5 data-active:text-[#57D7BA] text-[#8892b0]">cURL</TabsTrigger>
          </TabsList>
          <TabsContent value="js"><CodeBlock lang="javascript" code={jsExample} /></TabsContent>
          <TabsContent value="py"><CodeBlock lang="python" code={pyExample} /></TabsContent>
          <TabsContent value="curl"><CodeBlock lang="bash" code={curlExample} /></TabsContent>
        </Tabs>
      </div>

      {/* CTA */}
      <Card className="bg-[#222638] border-[#57D7BA]/20 ring-1 ring-[#57D7BA]/10 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#57D7BA]/5 via-transparent to-[#6366f1]/5 pointer-events-none" />
        <CardContent className="p-8 text-center relative space-y-4">
          <Key className="size-10 text-[#57D7BA] mx-auto" />
          <h2 className="text-xl font-bold">Ready to build with Quiver Markets?</h2>
          <p className="text-sm text-[#8892b0] max-w-md mx-auto">
            Get your API key and start querying real-time prediction market data in minutes.
            Full REST + WebSocket access with our Pro plan.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/pricing">
              <Button className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 h-11 px-6 font-semibold gap-1.5">
                Get API Key <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
          <p className="text-[10px] text-[#8892b0]">Starting at $22/mo · 100 req/min · 99.9% uptime SLA</p>
        </CardContent>
      </Card>

      <footer className="flex items-center justify-between py-4 border-t border-[#2f374f] text-[10px] text-[#8892b0]">
        <span>© 2026 Quiver Markets. Not financial advice. Data from Polymarket &amp; Kalshi.</span>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
          <Link href="/api-docs" className="text-[#57D7BA]">API</Link>
        </div>
      </footer>
    </div>
  );
}
