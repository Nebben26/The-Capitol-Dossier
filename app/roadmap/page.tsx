"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, Calendar } from "lucide-react";

const SHIPPED = [
  "Cross-platform arbitrage scanner (Polymarket vs Kalshi, 286+ disagreements tracked)",
  "Whale tracking and Smart Money Flow (200+ wallets, $60M+ tracked)",
  "AI Market Thesis on top markets (bull case, bear case, catalysts, whale read)",
  "Smart Signal Alerts (Consensus, Concentration, Size Spike, Divergence detection)",
  "Smart Money Watch — virtual portfolio tracker for top whale positions",
  "Kalshi candlestick charts",
  "Public REST API with three pricing tiers",
  "Morning Brief overnight summary",
];

const IN_PROGRESS = [
  "Historical accuracy scoring on smart signals",
  "Telegram and email alert delivery",
  "Mobile app (iOS and Android)",
  "Webhooks for API customers",
];

const COMING_SOON = [
  "Real-time Anthropic API integration for personalized AI analysis",
  "Personalized \u201cMy Dashboard\u201d with watchlist + followed whales",
  "Embeddable share cards for Twitter",
  "Weekly Smart Money Report PDF (Premium tier)",
  "Sports betting intelligence (parallel product, in planning)",
];

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  color: string;
  items: string[];
}

function RoadmapSection({ icon, title, color, items }: SectionProps) {
  return (
    <Card className="bg-[#161b27] border-[#21262d]">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          {icon}
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color }}>
            {title}
          </h2>
        </div>
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0" style={{ color }}>
                {title === "SHIPPED" ? (
                  <CheckCircle2 className="size-3.5" />
                ) : title === "IN PROGRESS" ? (
                  <Clock className="size-3.5" />
                ) : (
                  <Calendar className="size-3.5" />
                )}
              </span>
              <span className="text-[13px] text-[#8892b0] leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function RoadmapPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Roadmap</h1>
        <p className="text-[#8892b0]">What we&apos;ve shipped and what&apos;s coming next</p>
      </div>

      <RoadmapSection
        icon={<CheckCircle2 className="size-4 text-[#22c55e]" />}
        title="SHIPPED"
        color="#22c55e"
        items={SHIPPED}
      />
      <RoadmapSection
        icon={<Clock className="size-4 text-[#f59e0b]" />}
        title="IN PROGRESS"
        color="#f59e0b"
        items={IN_PROGRESS}
      />
      <RoadmapSection
        icon={<Calendar className="size-4 text-[#8b5cf6]" />}
        title="COMING SOON"
        color="#8b5cf6"
        items={COMING_SOON}
      />

      <p className="text-[11px] text-[#4a5168] text-center pt-4">
        Have a feature request? <a href="mailto:hello@quivermarkets.com" className="text-[#57D7BA] hover:underline">Let us know.</a>
      </p>
    </div>
  );
}
