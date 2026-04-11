"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Code,
  Copy,
  Check,
  BarChart3,
  GitCompareArrows,
  TrendingUp,
  ArrowRight,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from "lucide-react";
import { markets, disagreements } from "@/lib/mockData";

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <div className="rounded-lg bg-[#0f1119] border border-[#21262d] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#21262d]">
          <span className="text-[9px] text-[#8892b0] font-mono">HTML</span>
          <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1 text-[9px] text-[#8892b0] hover:text-[#57D7BA] transition-colors">
            {copied ? <Check className="size-3 text-[#22c55e]" /> : <Copy className="size-3" />}{copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="p-3 overflow-x-auto text-[10px] font-mono text-[#57D7BA] leading-relaxed"><code>{code}</code></pre>
      </div>
    </div>
  );
}

const sampleMarket = markets[0];
const sampleDisagree = disagreements[0];
const base = "https://quivermarkets.com";

export default function WidgetsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6366f1]/10 text-[#6366f1] text-xs font-semibold">
          <Code className="size-3.5" /> Embeddable Widgets
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Embed prediction market data <span className="text-[#57D7BA]">anywhere</span>
        </h1>
        <p className="text-sm text-[#8892b0] max-w-xl mx-auto">
          Drop live prediction market widgets into your blog, newsletter, dashboard, or social media.
          Dark-themed, responsive, and always up to date.
        </p>
      </div>

      {/* Widget 1: Market Price Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-2"><BarChart3 className="size-5 text-[#57D7BA]" />Market Price Card</h2>
          <p className="text-sm text-[#8892b0] mb-4">Show any market&apos;s current price, 24h change, and YES/NO bar. Updates on page load.</p>
          <CopyCode code={`<iframe\n  src="${base}/embed/market?id=${sampleMarket.id}"\n  width="400" height="220"\n  frameborder="0"\n  style="border-radius:12px;overflow:hidden;"\n  loading="lazy"\n></iframe>`} />
          <div className="mt-3">
            <p className="text-[10px] text-[#8892b0] mb-1">Parameters:</p>
            <div className="space-y-0.5 text-[10px]">
              <div><code className="text-[#57D7BA] font-mono">id</code> <span className="text-[#8892b0]">— Market ID (e.g. recession-2026, fed-rate-cut)</span></div>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="bg-[#0d1117] text-[#e2e8f0] p-4 rounded-xl border border-[#21262d] max-w-sm w-full">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="size-4 rounded bg-[#57D7BA] flex items-center justify-center"><Activity className="size-2.5 text-[#0f1119]" /></div>
              <span className="text-[8px] text-[#8892b0] uppercase tracking-wider font-semibold">Quiver Markets</span>
            </div>
            <p className="text-xs font-semibold leading-snug mb-3">{sampleMarket.question}</p>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums">{sampleMarket.price}<span className="text-sm text-[#8892b0]">¢</span></span>
                <span className={`flex items-center gap-0.5 font-mono text-xs font-bold tabular-nums ${sampleMarket.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {sampleMarket.change >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}{Math.abs(sampleMarket.change)}%
                </span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#57D7BA]/10 text-[#57D7BA]">{sampleMarket.category}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#0f1119] overflow-hidden flex mb-2">
              <div className="h-full bg-[#22c55e] rounded-l-full" style={{ width: `${sampleMarket.price}%` }} />
              <div className="h-full bg-[#ef4444] rounded-r-full" style={{ width: `${100 - sampleMarket.price}%` }} />
            </div>
            <div className="flex items-center justify-between text-[9px] text-[#8892b0]">
              <span>Vol: {sampleMarket.volume}</span>
              <span className="text-[#57D7BA]">View on Quiver →</span>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-[#21262d]" />

      {/* Widget 2: Mini Disagrees Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-2"><GitCompareArrows className="size-5 text-[#f59e0b]" />Disagrees Card</h2>
          <p className="text-sm text-[#8892b0] mb-4">Show cross-platform price spreads with side-by-side Polymarket vs Kalshi pricing.</p>
          <CopyCode code={`<iframe\n  src="${base}/embed/disagree?id=${sampleDisagree.id}"\n  width="400" height="220"\n  frameborder="0"\n  style="border-radius:12px;overflow:hidden;"\n  loading="lazy"\n></iframe>`} />
          <div className="mt-3">
            <p className="text-[10px] text-[#8892b0] mb-1">Parameters:</p>
            <div className="space-y-0.5 text-[10px]">
              <div><code className="text-[#57D7BA] font-mono">id</code> <span className="text-[#8892b0]">— Disagreement ID (e.g. d1, d2)</span></div>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="bg-[#0d1117] text-[#e2e8f0] p-4 rounded-xl border border-[#21262d] max-w-sm w-full">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="size-4 rounded bg-[#57D7BA] flex items-center justify-center"><Activity className="size-2.5 text-[#0f1119]" /></div>
              <span className="text-[8px] text-[#8892b0] uppercase tracking-wider font-semibold">Quiver Markets</span>
              <span className="ml-auto px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[7px] font-bold flex items-center gap-0.5"><AlertTriangle className="size-2" />DISAGREES</span>
            </div>
            <p className="text-xs font-semibold leading-snug mb-3">{sampleDisagree.question}</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 text-center p-2 rounded-lg bg-[#0f1119] border border-[#21262d]">
                <div className="text-[8px] text-[#8892b0] mb-0.5">Polymarket</div>
                <div className="font-mono text-lg font-bold tabular-nums">{sampleDisagree.polyPrice}¢</div>
              </div>
              <div className="px-2 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-sm font-bold font-mono tabular-nums border border-[#f59e0b]/20">{sampleDisagree.spread}pt</div>
              <div className="flex-1 text-center p-2 rounded-lg bg-[#0f1119] border border-[#21262d]">
                <div className="text-[8px] text-[#8892b0] mb-0.5">Kalshi</div>
                <div className="font-mono text-lg font-bold tabular-nums">{sampleDisagree.kalshiPrice}¢</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-[9px] text-[#8892b0]">
              <span>{sampleDisagree.category}</span>
              <span className="text-[#57D7BA]">View on Quiver →</span>
            </div>
          </div>
        </div>
      </div>

      <hr className="border-[#21262d]" />

      {/* Widget 3: Live Sparkline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2 mb-2"><TrendingUp className="size-5 text-[#22c55e]" />Live Sparkline</h2>
          <p className="text-sm text-[#8892b0] mb-4">Compact price chart with current price and change. Perfect for sidebars and dashboards.</p>
          <CopyCode code={`<iframe\n  src="${base}/embed/sparkline?id=${sampleMarket.id}"\n  width="300" height="140"\n  frameborder="0"\n  style="border-radius:12px;overflow:hidden;"\n  loading="lazy"\n></iframe>`} />
          <div className="mt-3">
            <p className="text-[10px] text-[#8892b0] mb-1">Parameters:</p>
            <div className="space-y-0.5 text-[10px]">
              <div><code className="text-[#57D7BA] font-mono">id</code> <span className="text-[#8892b0]">— Market ID</span></div>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="bg-[#0d1117] text-[#e2e8f0] p-3 rounded-xl border border-[#21262d]" style={{ width: 280 }}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <div className="size-3 rounded bg-[#57D7BA] flex items-center justify-center"><Activity className="size-2 text-[#0f1119]" /></div>
                <span className="text-[7px] text-[#8892b0]">Quiver</span>
              </div>
              <span className="font-mono text-xs font-bold tabular-nums">{sampleMarket.price}¢ <span className="text-[10px] text-[#22c55e]">+{sampleMarket.change}%</span></span>
            </div>
            <p className="text-[9px] text-[#8892b0] truncate mb-1">{sampleMarket.question}</p>
            <div className="h-14 rounded bg-gradient-to-t from-[#22c55e]/10 to-transparent flex items-end px-1 pb-1 gap-px">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="flex-1 bg-[#22c55e]/60 rounded-t" style={{ height: `${25 + Math.sin(i / 3) * 30 + Math.random() * 20}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <hr className="border-[#21262d]" />

      {/* All Markets List */}
      <div>
        <h2 className="text-lg font-bold mb-3">Available Market IDs</h2>
        <Card className="bg-[#161b27] border-[#21262d]">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {markets.slice(0, 16).map((m) => (
                <div key={m.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-[#57D7BA]/5">
                  <code className="text-[10px] font-mono text-[#57D7BA] truncate">{m.id}</code>
                  <span className="text-[9px] text-[#8892b0] truncate">{m.price}¢</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <Card className="bg-[#161b27] border-[#6366f1]/20 ring-1 ring-[#6366f1]/10 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1]/5 via-transparent to-[#57D7BA]/5 pointer-events-none" />
        <CardContent className="p-8 text-center relative space-y-4">
          <Code className="size-10 text-[#6366f1] mx-auto" />
          <h2 className="text-xl font-bold">Need custom integrations?</h2>
          <p className="text-sm text-[#8892b0] max-w-md mx-auto">
            Our Pro API gives you full programmatic access to build custom widgets, bots, and dashboards.
          </p>
          <p className="text-xs text-[#8892b0]">API docs and pricing coming soon.</p>
        </CardContent>
      </Card>

      <footer className="flex items-center justify-between py-4 border-t border-[#21262d] text-[10px] text-[#8892b0]">
        <span>© 2026 Quiver Markets. Not financial advice. Data from Polymarket &amp; Kalshi.</span>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
          
        </div>
      </footer>
    </div>
  );
}
