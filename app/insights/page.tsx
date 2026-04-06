"use client";

import React, { useState, useMemo } from "react";
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
  Newspaper,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ExternalLink,
  Clock,
  TrendingUp,
  Filter,
} from "lucide-react";
import { useInsights } from "@/hooks/useData";
import { LastUpdated } from "@/components/layout/LastUpdated";
import type { Insight } from "@/lib/mockData";
import { CopyAlertButton } from "@/components/ui/copy-alert-button";

const catFilters = ["All", "Economics", "Elections", "Crypto", "Tech", "Geopolitics"];
const sourceFilters = ["All", "News", "Twitter/X", "Research", "Official"];

function sourceMatch(insight: Insight, filter: string): boolean {
  if (filter === "All") return true;
  if (filter === "News") return insight.sourceType === "news";
  if (filter === "Twitter/X") return insight.sourceType === "twitter";
  if (filter === "Research") return insight.sourceType === "research";
  if (filter === "Official") return insight.sourceType === "official";
  return true;
}

function ImpactIcon({ impact }: { impact: "bullish" | "bearish" | "neutral" }) {
  if (impact === "bullish") return <ArrowUpRight className="size-3.5 text-[#22c55e]" />;
  if (impact === "bearish") return <ArrowDownRight className="size-3.5 text-[#ef4444]" />;
  return <Minus className="size-3.5 text-[#8892b0]" />;
}

function SourceBadge({ type }: { type: Insight["sourceType"] }) {
  const styles = {
    twitter: "bg-[#1d9bf0]/10 text-[#1d9bf0]",
    news: "bg-[#f59e0b]/10 text-[#f59e0b]",
    research: "bg-[#8b5cf6]/10 text-[#8b5cf6]",
    official: "bg-[#22c55e]/10 text-[#22c55e]",
  };
  const labels = { twitter: "Twitter/X", news: "News", research: "Research", official: "Official" };
  return <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold ${styles[type]}`}>{labels[type]}</span>;
}

function insightAlertText(ins: Insight) {
  const arrow = ins.impact === "bullish" ? "📈" : ins.impact === "bearish" ? "📉" : "➡️";
  return `${arrow} ${ins.headline}\n\n"${ins.marketQuestion}" moved ${ins.priceMove}\n\nSource: ${ins.source}\n\nvia Quiver Markets`;
}

export default function InsightsPage() {
  const { insights, lastFetched, refreshing } = useInsights();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");

  const filtered = useMemo(() => {
    let result = insights;
    if (category !== "All") result = result.filter((i) => i.category === category);
    if (sourceFilter !== "All") result = result.filter((i) => sourceMatch(i, sourceFilter));
    if (searchQuery) result = result.filter((i) => i.headline.toLowerCase().includes(searchQuery.toLowerCase()) || i.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [insights, category, sourceFilter, searchQuery]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Newspaper className="size-7 text-[#6366f1]" />
            Market Insights
          </h1>
          <p className="text-sm text-[#8892b0] mt-1">News, catalysts, and context driving prediction market prices</p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated lastFetched={lastFetched} refreshing={refreshing} />
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#6366f1]/10 text-[#6366f1] text-[10px] font-bold tabular-nums">
            {filtered.length} stories
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8892b0]" />
          <input type="text" placeholder="Search insights..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#222638] border border-[#2f374f] text-sm text-[#e2e8f0] placeholder:text-[#8892b0]/60 focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 transition-all" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {catFilters.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${category === cat ? "bg-[#6366f1] text-white" : "bg-[#222638] text-[#8892b0] hover:text-[#e2e8f0] border border-[#2f374f]"}`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="size-3 text-[#8892b0]" />
          {sourceFilters.map((sf) => (
            <button key={sf} onClick={() => setSourceFilter(sf)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all border ${sourceFilter === sf ? "bg-[#57D7BA]/10 text-[#57D7BA] border-[#57D7BA]/30" : "bg-[#222638] text-[#8892b0] border-[#2f374f]"}`}>
              {sf}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Bullish Catalysts", val: String(insights.filter((i) => i.impact === "bullish").length), color: "#22c55e" },
          { label: "Bearish Catalysts", val: String(insights.filter((i) => i.impact === "bearish").length), color: "#ef4444" },
          { label: "Markets Impacted", val: String(new Set(insights.map((i) => i.marketId)).size), color: "#6366f1" },
          { label: "Sources Tracked", val: String(new Set(insights.map((i) => i.source)).size), color: "#f59e0b" },
        ].map((s) => (
          <Card key={s.label} className="bg-[#222638] border-[#2f374f]">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold font-mono tabular-nums" style={{ color: s.color }}>{s.val}</div>
              <div className="text-[9px] text-[#8892b0] uppercase tracking-wider">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights list */}
      <div className="space-y-3">
        {filtered.map((ins) => (
          <Card key={ins.id} className="bg-[#222638] border-[#2f374f] hover:border-[#6366f1]/20 transition-all">
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Impact indicator */}
                <div className="shrink-0 mt-1">
                  <div className={`size-10 rounded-xl flex items-center justify-center ${ins.impact === "bullish" ? "bg-[#22c55e]/10" : ins.impact === "bearish" ? "bg-[#ef4444]/10" : "bg-[#2f374f]"}`}>
                    <ImpactIcon impact={ins.impact} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <SourceBadge type={ins.sourceType} />
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#57D7BA]/10 text-[#57D7BA]">{ins.category}</span>
                    <span className="flex items-center gap-0.5 text-[9px] text-[#8892b0]"><Clock className="size-2.5" />{ins.time}</span>
                  </div>

                  <Link href={`/markets/${ins.marketId}`} className="group block">
                    <h3 className="text-sm font-semibold text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors leading-snug mb-1">
                      {ins.headline}
                    </h3>
                  </Link>

                  <p className="text-[11px] text-[#8892b0] leading-relaxed mb-2 line-clamp-2">{ins.summary}</p>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Link href={`/markets/${ins.marketId}`} className="flex items-center gap-1 text-[10px] text-[#57D7BA] hover:underline">
                      <TrendingUp className="size-3" />
                      {ins.marketQuestion}
                    </Link>
                    <span className={`font-mono text-xs font-bold tabular-nums ${ins.impact === "bullish" ? "text-[#22c55e]" : ins.impact === "bearish" ? "text-[#ef4444]" : "text-[#8892b0]"}`}>
                      {ins.priceMove}
                    </span>
                    <span className="text-[9px] text-[#8892b0]">via {ins.source}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <CopyAlertButton text={insightAlertText(ins)} />
                  <Link href={`/markets/${ins.marketId}`}>
                    <Button variant="ghost" size="icon-xs" className="text-[#8892b0] hover:text-[#57D7BA]">
                      <ExternalLink className="size-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="bg-[#222638] border-[#2f374f]">
          <CardContent className="py-16 text-center">
            <Newspaper className="size-12 text-[#2f374f] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No insights found</h3>
            <p className="text-sm text-[#8892b0]">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}

      <footer className="flex items-center justify-between py-4 border-t border-[#2f374f] text-[10px] text-[#8892b0]">
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
