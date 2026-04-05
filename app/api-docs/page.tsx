import Link from "next/link";
import { ArrowLeft, Code, Zap, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ApiDocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#8892b0] hover:text-[#57D7BA] transition-colors">
        <ArrowLeft className="size-4" /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
      <p className="text-sm text-[#8892b0]">Build on top of Quiver Markets data with our REST and WebSocket APIs.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Code, title: "REST API", desc: "Query markets, whales, and historical data" },
          { icon: Zap, title: "WebSocket", desc: "Real-time price feeds and whale alerts" },
          { icon: Lock, title: "Authentication", desc: "API key-based auth with rate limiting" },
        ].map((item) => (
          <Card key={item.title} className="bg-[#222638] border-[#2f374f]">
            <CardContent className="p-4 text-center space-y-2">
              <item.icon className="size-8 text-[#57D7BA] mx-auto" />
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="text-[10px] text-[#8892b0]">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-[#222638] border-[#2f374f]">
        <CardContent className="p-6 text-center space-y-3">
          <h2 className="text-lg font-semibold">API access requires a Pro subscription</h2>
          <p className="text-sm text-[#8892b0]">Get real-time data, historical archives, and webhook integrations.</p>
          <Link href="/pricing"><Button className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80">Upgrade to Pro</Button></Link>
        </CardContent>
      </Card>
      <div className="rounded-lg bg-[#1a1e2e] border border-[#2f374f] p-4 font-mono text-xs text-[#8892b0] space-y-1">
        <p className="text-[#57D7BA]"># Example: Get market data</p>
        <p>curl -H &quot;Authorization: Bearer YOUR_API_KEY&quot; \</p>
        <p>&nbsp;&nbsp;https://api.quivermarkets.com/v1/markets/recession-2026</p>
      </div>
    </div>
  );
}
