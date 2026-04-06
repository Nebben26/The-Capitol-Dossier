"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/layout/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Zap,
  Shield,
  Check,
  Minus,
  Crown,
  Star,
  ArrowRight,
  Sparkles,
  Lock,
  Wallet,
  Brain,
  Radio,
  Download,
  Headphones,
  Code,
  Eye,
  Timer,
  Quote,
} from "lucide-react";

// ─── FEATURE TABLE DATA ──────────────────────────────────────────────
const features = [
  { feature: "Market Browse & Search", free: true, pro: true, cat: "Core" },
  { feature: "Price Charts (delayed 15m)", free: true, pro: false, cat: "Core" },
  { feature: "Price Charts (real-time)", free: false, pro: true, cat: "Core" },
  { feature: "Basic Leaderboard", free: true, pro: true, cat: "Core" },
  { feature: "Full Whale Profiles", free: false, pro: true, cat: "Whale Intel" },
  { feature: "Real-Time Whale Alerts", free: false, pro: true, cat: "Whale Intel" },
  { feature: "Whale Flow Dashboard", free: false, pro: true, cat: "Whale Intel" },
  { feature: "Smart Money Score", free: false, pro: true, cat: "Whale Intel" },
  { feature: "Cross-Platform Comparison", free: true, pro: true, cat: "Analytics" },
  { feature: "Arbitrage Detection", free: false, pro: true, cat: "Analytics" },
  { feature: "Calibration Charts", free: false, pro: true, cat: "Analytics" },
  { feature: "AI Signals & NLP Sentiment", free: false, pro: true, cat: "Analytics" },
  { feature: "Curated Strategies", free: true, pro: true, cat: "Strategies" },
  { feature: "Premium Strategies", free: false, pro: true, cat: "Strategies" },
  { feature: "Full Backtester", free: false, pro: true, cat: "Strategies" },
  { feature: "Custom Strategy Builder", free: false, pro: true, cat: "Strategies" },
  { feature: "API Access (REST + WebSocket)", free: false, pro: true, cat: "Data" },
  { feature: "CSV/JSON Exports", free: false, pro: true, cat: "Data" },
  { feature: "Historical Data (full archive)", free: false, pro: true, cat: "Data" },
  { feature: "Ads", free: true, pro: false, cat: "Experience" },
  { feature: "Ad-Free Experience", free: false, pro: true, cat: "Experience" },
  { feature: "Priority Support", free: false, pro: true, cat: "Experience" },
  { feature: "Early Access to New Features", free: false, pro: true, cat: "Experience" },
];

const testimonials = [
  {
    name: "KalshiKing",
    role: "Rank #1 Whale · $5.8M P&L",
    quote: "The whale flow alerts alone paid for my Pro subscription in the first week. I see positions before they move the market.",
    avatar: "K",
  },
  {
    name: "NateGold",
    role: "Election Markets Specialist",
    quote: "Cross-platform arbitrage detection found me 12 opportunities last month. The backtester is the best I've used in prediction markets.",
    avatar: "N",
  },
  {
    name: "Cassandra.eth",
    role: "Quant Trader · 77% Accuracy",
    quote: "The calibration charts and smart money scoring completely changed how I size positions. Quiver Pro is non-negotiable for serious traders.",
    avatar: "C",
  },
];

// ─── MAIN ─────────────────────────────────────────────────────────────
export default function PricingPage() {
  const { user, isPro, startTrial, setShowLogin } = useAuth();
  const [annual, setAnnual] = useState(true);
  const monthlyPrice = 29;
  const annualPrice = 22;
  const price = annual ? annualPrice : monthlyPrice;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-16">

      {/* ─── BACK LINK ─────────────────────────────────────────────── */}
      <div>
        <Link href="/" className="text-xs text-[#8892b0] hover:text-[#57D7BA] transition-colors">
          ← Back to Dashboard
        </Link>
      </div>

      {/* ─── HERO ──────────────────────────────────────────────────── */}
      <div className="text-center space-y-5 pt-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#57D7BA]/10 text-[#57D7BA] text-xs font-semibold">
          <Sparkles className="size-3.5" />
          Trusted by 2,800+ prediction market traders
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
          Unlock the full power of<br />
          <span className="text-[#57D7BA]">prediction market intelligence</span>
        </h1>
        <p className="text-base sm:text-lg text-[#8892b0] max-w-2xl mx-auto leading-relaxed">
          See what the smartest money is doing before everyone else.
          Real-time whale alerts, cross-platform arbitrage, and AI-powered signals.
        </p>

        {/* Annual / Monthly toggle */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className={`text-sm transition-colors ${!annual ? "text-[#e2e8f0] font-medium" : "text-[#8892b0]"}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? "bg-[#57D7BA]" : "bg-[#2a2f45]"}`}
          >
            <div className={`absolute top-0.5 size-5 rounded-full bg-white shadow-md transition-transform ${annual ? "translate-x-6.5" : "translate-x-0.5"}`} />
          </button>
          <span className={`text-sm transition-colors ${annual ? "text-[#e2e8f0] font-medium" : "text-[#8892b0]"}`}>Annual</span>
          {annual && (
            <span className="px-2 py-0.5 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-[10px] font-bold">
              Save 25%
            </span>
          )}
        </div>
      </div>

      {/* ─── PLAN CARDS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-4 overflow-visible">
        {/* Free */}
        <Card className="bg-[#222638] border-[#2a2f45] relative">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="size-5 text-[#8892b0]" />
              Free
            </CardTitle>
            <CardDescription className="text-sm text-[#8892b0]">
              Get started with public prediction market data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <span className="text-4xl font-bold font-mono">$0</span>
              <span className="text-sm text-[#8892b0] ml-1">/month</span>
            </div>
            <ul className="space-y-3">
              {[
                "Browse all prediction markets",
                "Basic price charts (15m delay)",
                "Public leaderboard",
                "Cross-platform price comparison",
                "Curated strategy library (free tier)",
                "Community access",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="size-4 text-[#8892b0] shrink-0 mt-0.5" />
                  <span className="text-[#8892b0]">{f}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full h-11 border-[#2a2f45] text-[#8892b0] hover:text-[#e2e8f0] hover:border-[#57D7BA]/30">
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="bg-[#222638] border-[#57D7BA]/30 relative overflow-visible ring-1 ring-[#57D7BA]/20 shadow-xl shadow-[#57D7BA]/5">
          {/* Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#57D7BA] text-[#0f1119] text-[10px] font-bold flex items-center gap-1 shadow-lg shadow-[#57D7BA]/30">
            <Crown className="size-3" />
            MOST POPULAR
          </div>
          <CardHeader className="pb-4 pt-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="size-5 text-[#57D7BA]" />
              Pro
            </CardTitle>
            <CardDescription className="text-sm text-[#8892b0]">
              The full prediction market intelligence suite
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <span className="text-4xl font-bold font-mono text-[#57D7BA]">${price}</span>
              <span className="text-sm text-[#8892b0] ml-1">/month</span>
              {annual && (
                <span className="block text-xs text-[#8892b0] mt-0.5">
                  <span className="line-through">${monthlyPrice}</span> billed annually at ${annualPrice * 12}/yr
                </span>
              )}
            </div>
            <ul className="space-y-3">
              {[
                { text: "Everything in Free, plus:", bold: true },
                { text: "Real-time whale alerts & flow dashboard", icon: Radio },
                { text: "Full backtester & strategy builder", icon: Brain },
                { text: "AI signals & NLP sentiment analysis", icon: Sparkles },
                { text: "Cross-platform arbitrage detection", icon: BarChart3 },
                { text: "Full API access (REST + WebSocket)", icon: Code },
                { text: "Unlimited CSV/JSON exports", icon: Download },
                { text: "Complete historical data archive", icon: Timer },
                { text: "Ad-free experience", icon: Shield },
                { text: "Priority support", icon: Headphones },
              ].map((f) => (
                <li key={f.text} className={`flex items-start gap-2 text-sm ${f.bold ? "font-medium text-[#e2e8f0]" : ""}`}>
                  {f.bold ? (
                    <Sparkles className="size-4 text-[#57D7BA] shrink-0 mt-0.5" />
                  ) : f.icon ? (
                    <f.icon className="size-4 text-[#57D7BA] shrink-0 mt-0.5" />
                  ) : (
                    <Check className="size-4 text-[#57D7BA] shrink-0 mt-0.5" />
                  )}
                  <span className={f.bold ? "" : "text-[#e2e8f0]"}>{f.text}</span>
                </li>
              ))}
            </ul>
            <Button onClick={() => { if (!user) { setShowLogin(true); } else { startTrial(); } }} className="w-full h-11 bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 font-semibold text-sm shadow-lg shadow-[#57D7BA]/20">
              {isPro ? "Pro Active ✓" : "Start 14-Day Free Trial"} <ArrowRight className="size-4 ml-1" />
            </Button>
            <p className="text-[10px] text-[#8892b0] text-center">No credit card required · Cancel anytime</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── FEATURE COMPARISON TABLE ──────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-center mb-6">Full Feature Comparison</h2>
        <Card className="bg-[#222638] border-[#2a2f45] max-w-4xl mx-auto">
          <CardContent className="px-0 py-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a2f45] hover:bg-transparent">
                  <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4 w-1/2">FEATURE</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium text-center w-1/4">FREE</TableHead>
                  <TableHead className="text-[10px] text-[#57D7BA] font-medium text-center w-1/4 pr-4">PRO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  let lastCat = "";
                  return features.map((f, i) => {
                    const showCat = f.cat !== lastCat;
                    lastCat = f.cat;
                    return (
                      <React.Fragment key={i}>
                        {showCat && (
                          <TableRow className="border-[#2a2f45]/50 hover:bg-transparent">
                            <TableCell colSpan={3} className="pl-4 py-2">
                              <span className="text-[10px] text-[#57D7BA] font-bold uppercase tracking-wider">{f.cat}</span>
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow className="border-[#2a2f45]/30 hover:bg-[#57D7BA]/5 transition-colors">
                          <TableCell className="pl-8 py-2 text-xs text-[#e2e8f0]">{f.feature}</TableCell>
                          <TableCell className="py-2 text-center">
                            {f.free ? (
                              <Check className="size-4 text-[#8892b0] mx-auto" />
                            ) : (
                              <Minus className="size-4 text-[#2a2f45] mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="py-2 pr-4 text-center">
                            {f.pro ? (
                              <Check className="size-4 text-[#57D7BA] mx-auto" />
                            ) : (
                              <Minus className="size-4 text-[#2a2f45] mx-auto" />
                            )}
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ─── TESTIMONIALS ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-center mb-2">Trusted by Top Traders</h2>
        <p className="text-sm text-[#8892b0] text-center mb-8">Here&apos;s what our Pro members have to say</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {testimonials.map((t) => (
            <Card key={t.name} className="bg-[#222638] border-[#2a2f45] hover:border-[#57D7BA]/20 transition-all">
              <CardContent className="p-5 space-y-4">
                <Quote className="size-6 text-[#57D7BA]/30" />
                <p className="text-sm text-[#e2e8f0] leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2 border-t border-[#2a2f45]">
                  <div className="size-9 rounded-full bg-gradient-to-br from-[#57D7BA] to-[#8b5cf6] flex items-center justify-center">
                    <span className="text-xs font-bold text-[#0f1119]">{t.avatar}</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold flex items-center gap-1">
                      {t.name}
                      <Star className="size-3 text-[#f59e0b]" />
                    </div>
                    <div className="text-[10px] text-[#8892b0]">{t.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ─── FINAL CTA ─────────────────────────────────────────────── */}
      <div className="text-center py-8">
        <Card className="bg-[#222638] border-[#2a2f45] max-w-2xl mx-auto overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#57D7BA]/5 via-transparent to-[#8b5cf6]/5 pointer-events-none" />
          <CardContent className="p-8 sm:p-12 relative">
            <Crown className="size-10 text-[#57D7BA] mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Ready to trade smarter?
            </h2>
            <p className="text-sm text-[#8892b0] mb-6 max-w-md mx-auto">
              Join thousands of traders who use Quiver Markets Pro to find alpha in prediction markets.
              Start your 14-day free trial today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={() => { if (!user) { setShowLogin(true); } else { startTrial(); } }} className="h-12 px-8 bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 font-semibold text-base shadow-lg shadow-[#57D7BA]/20">
                {isPro ? "Pro Active ✓" : "Start 14-Day Free Trial"} <ArrowRight className="size-5 ml-2" />
              </Button>
              <Link href="/" className="text-sm text-[#8892b0] hover:text-[#57D7BA] transition-colors">
                or continue with Free plan →
              </Link>
            </div>
            <div className="flex items-center justify-center gap-4 mt-6 text-[10px] text-[#8892b0]">
              <span className="flex items-center gap-1"><Shield className="size-3" />No credit card required</span>
              <span className="flex items-center gap-1"><Lock className="size-3" />Cancel anytime</span>
              <span className="flex items-center gap-1"><Zap className="size-3" />Instant access</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── FOOTER ────────────────────────────────────────────────── */}
      <footer className="flex items-center justify-between py-4 border-t border-[#2a2f45] text-[10px] text-[#8892b0]">
        <span>© 2026 Quiver Markets. Not financial advice. Data from Polymarket &amp; Kalshi.</span>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
          <Link href="/api-docs" className="hover:text-[#57D7BA] transition-colors">API</Link>
        </div>
      </footer>

    </div>
  );
}
