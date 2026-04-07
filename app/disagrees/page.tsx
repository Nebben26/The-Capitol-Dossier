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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  GitCompareArrows,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  BarChart3,
  Search,
  Timer,
  LayoutGrid,
  List,
} from "lucide-react";
import { useDisagreements } from "@/hooks/useData";
import { LastUpdated } from "@/components/layout/LastUpdated";
import { DisagreeShareButton } from "@/components/ui/disagree-share";
import type { Disagreement } from "@/lib/mockData";

const catFilters = ["All", "Economics", "Elections", "Crypto", "Tech", "Geopolitics"];

type SortKey = "spread" | "polyVol" | "daysLeft";
type SortDir = "asc" | "desc";
type ViewMode = "grid" | "table";

function parseVol(v: string): number {
  const n = parseFloat(v.replace(/[$KM,]/g, ""));
  if (v.includes("M")) return n * 1000000;
  if (v.includes("K")) return n * 1000;
  return n;
}

function SpreadBadge({ spread }: { spread: number }) {
  const color = spread >= 15 ? "#ef4444" : spread >= 12 ? "#f59e0b" : "#f59e0b";
  const bg = spread >= 15 ? "bg-[#ef4444]/10" : "bg-[#f59e0b]/10";
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-mono text-xs font-bold tabular-nums ${bg}`} style={{ color }}>
      <AlertTriangle className="size-2.5" />
      {spread}pt
    </span>
  );
}

function DisagreeCard({ d }: { d: Disagreement }) {
  return (
    <Card className="bg-[#222638] border-[#2f374f] hover:border-[#f59e0b]/30 transition-all h-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[8px] font-bold flex items-center gap-0.5">
            <AlertTriangle className="size-2.5" /> ARBITRAGE
          </span>
          <span className="px-1.5 py-0.5 rounded bg-[#57D7BA]/10 text-[#57D7BA] text-[8px] font-semibold">{d.category}</span>
          <span className="flex items-center gap-0.5 text-[8px] text-[#8892b0]">
            {d.daysLeft > 0 && <><Timer className="size-2.5" />{d.daysLeft}d</>}
          </span>
        </div>
        <Link href={`/markets/${d.marketId}`} className="group block">
          <p className="text-xs font-semibold text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors leading-snug line-clamp-2 mb-3">
            {d.question}
          </p>
        </Link>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 text-center p-2 rounded-lg bg-[#1a1e2e] border border-[#2f374f]">
            <div className="text-[9px] text-[#8892b0] mb-0.5">Polymarket</div>
            <div className="font-mono text-lg font-bold tabular-nums text-[#e2e8f0]">{d.polyPrice}¢</div>
            <div className="text-[8px] text-[#8892b0] mt-0.5">{d.polyVol}</div>
          </div>
          <div className="shrink-0 flex flex-col items-center">
            <div className="px-2.5 py-1.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-sm font-bold font-mono tabular-nums border border-[#f59e0b]/20">
              {d.spread}pt
            </div>
            <span className="text-[7px] text-[#8892b0] mt-0.5">spread</span>
          </div>
          <div className="flex-1 text-center p-2 rounded-lg bg-[#1a1e2e] border border-[#2f374f]">
            <div className="text-[9px] text-[#8892b0] mb-0.5">Kalshi</div>
            <div className="font-mono text-lg font-bold tabular-nums text-[#e2e8f0]">{d.kalshiPrice}¢</div>
            <div className="text-[8px] text-[#8892b0] mt-0.5">{d.kalshiVol}</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] font-semibold ${d.direction === "poly-higher" ? "text-[#6366f1]" : "text-[#22c55e]"}`}>
              {d.direction === "poly-higher" ? "Poly prices higher" : "Kalshi prices higher"}
            </span>
            {d.spreadTrend && d.spreadTrend !== "stable" && (
              <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[7px] font-bold ${
                d.spreadTrend === "converging" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"
              }`}>
                {d.spreadTrend === "converging" ? <ChevronDown className="size-2" /> : <ChevronUp className="size-2" />}
                {d.spreadTrend === "converging" ? "Converging" : "Diverging"}
              </span>
            )}
          </div>
          <DisagreeShareButton d={d} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DisagreesPage() {
  const { disagreements, refreshing, lastFetched, error, retry } = useDisagreements();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortKey>("spread");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let result = disagreements;
    if (category !== "All") result = result.filter((d) => d.category === category);
    if (searchQuery) result = result.filter((d) => d.question.toLowerCase().includes(searchQuery.toLowerCase()));
    return [...result].sort((a, b) => {
      let av: number, bv: number;
      if (sortBy === "spread") { av = a.spread; bv = b.spread; }
      else if (sortBy === "polyVol") { av = parseVol(a.polyVol); bv = parseVol(b.polyVol); }
      else { av = a.daysLeft; bv = b.daysLeft; }
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [disagreements, category, searchQuery, sortBy, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortBy !== col) return <ChevronDown className="size-3 opacity-30" />;
    return sortDir === "desc" ? <ChevronDown className="size-3 text-[#57D7BA]" /> : <ChevronUp className="size-3 text-[#57D7BA]" />;
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <GitCompareArrows className="size-7 text-[#f59e0b]" />
            The Market Disagrees
          </h1>
          <p className="text-sm text-[#8892b0] mt-1">
            Cross-platform price spreads — where Polymarket and Kalshi see the world differently
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LastUpdated lastFetched={lastFetched} refreshing={refreshing} error={error} onRetry={retry} />
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] font-bold">
            <AlertTriangle className="size-3" />
            {filtered.length} opportunities
          </span>
        </div>
      </div>

      {/* Explainer — hide when few results */}
      {disagreements.length >= 10 && <Card className="bg-[#222638] border-[#f59e0b]/20">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-[#f59e0b] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#e2e8f0] mb-1">How to read this</p>
            <p className="text-[11px] text-[#8892b0] leading-relaxed">
              When two major platforms price the same event differently by ≥ 10 percentage points, one of them is likely wrong.
              Smart traders buy the cheaper side and sell the expensive side — capturing the spread as profit when prices converge.
              Higher spreads = bigger potential edge. Higher volume = more liquid opportunity.
            </p>
          </div>
        </CardContent>
      </Card>}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8892b0]" />
          <input type="text" placeholder="Search disagreements..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-[#222638] border border-[#2f374f] text-sm text-[#e2e8f0] placeholder:text-[#8892b0]/60 focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 transition-all" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {catFilters.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-medium transition-all ${category === cat ? "bg-[#f59e0b] text-[#0f1119]" : "bg-[#222638] text-[#8892b0] hover:text-[#e2e8f0] border border-[#2f374f]"}`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#8892b0] font-mono">{filtered.length} results</span>
          <div className="flex items-center gap-0.5 bg-[#222638] rounded-lg p-0.5 border border-[#2f374f]">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-[#f59e0b] text-[#0f1119]" : "text-[#8892b0]"}`}><LayoutGrid className="size-3.5" /></button>
            <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-[#f59e0b] text-[#0f1119]" : "text-[#8892b0]"}`}><List className="size-3.5" /></button>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {disagreements.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Spreads", val: `${disagreements.length}`, color: "#f59e0b" },
          { label: "Avg Spread", val: `${Math.round(disagreements.reduce((s, d) => s + d.spread, 0) / disagreements.length)}pt`, color: "#ef4444" },
          { label: "Widest Spread", val: `${Math.max(...disagreements.map((d) => d.spread))}pt`, color: "#ec4899" },
          { label: "Combined Volume", val: "$" + (disagreements.reduce((s, d) => s + parseVol(d.polyVol) + parseVol(d.kalshiVol), 0) / 1000000).toFixed(0) + "M", color: "#57D7BA" },
        ].map((s) => (
          <Card key={s.label} className="bg-[#222638] border-[#2f374f]">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold font-mono tabular-nums" style={{ color: s.color }}>{s.val}</div>
              <div className="text-[9px] text-[#8892b0] uppercase tracking-wider">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>}

      {/* Grid view */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => <DisagreeCard key={d.id} d={d} />)}
        </div>
      )}

      {/* Table view */}
      {viewMode === "table" && (
        <Card className="bg-[#222638] border-[#2f374f]">
          <CardContent className="px-0 py-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2f374f] hover:bg-transparent">
                  <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">MARKET</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium">POLY</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium">KALSHI</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handleSort("spread")}>
                    <span className="flex items-center gap-0.5">SPREAD <SortIcon col="spread" /></span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] hidden md:table-cell" onClick={() => handleSort("polyVol")}>
                    <span className="flex items-center gap-0.5">VOLUME <SortIcon col="polyVol" /></span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium hidden lg:table-cell">CAT</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium hidden lg:table-cell">TREND</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA] hidden sm:table-cell" onClick={() => handleSort("daysLeft")}>
                    <span className="flex items-center gap-0.5">RESOLVES <SortIcon col="daysLeft" /></span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4 text-right">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => (
                  <TableRow key={d.id} className="border-[#2f374f]/50 hover:bg-[#f59e0b]/5 transition-colors">
                    <TableCell className="pl-4 py-2.5 max-w-[220px]">
                      <Link href={`/markets/${d.marketId}`} className="text-xs font-medium text-[#e2e8f0] hover:text-[#57D7BA] transition-colors leading-snug line-clamp-2">
                        {d.question}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="font-mono text-sm font-bold tabular-nums text-[#e2e8f0]">{d.polyPrice}¢</span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span className="font-mono text-sm font-bold tabular-nums text-[#e2e8f0]">{d.kalshiPrice}¢</span>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <SpreadBadge spread={d.spread} />
                    </TableCell>
                    <TableCell className="py-2.5 hidden md:table-cell">
                      <div className="text-[10px] text-[#8892b0] font-mono tabular-nums">
                        <div>P: {d.polyVol}</div>
                        <div>K: {d.kalshiVol}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5 hidden lg:table-cell">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#57D7BA]/10 text-[#57D7BA]">{d.category}</span>
                    </TableCell>
                    <TableCell className="py-2.5 hidden lg:table-cell">
                      {d.spreadTrend && d.spreadTrend !== "stable" ? (
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                          d.spreadTrend === "converging" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"
                        }`}>
                          {d.spreadTrend === "converging" ? "Converging" : "Diverging"}
                        </span>
                      ) : (
                        <span className="text-[8px] text-[#8892b0]">Stable</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 hidden sm:table-cell">
                      <span className="text-[10px] text-[#8892b0] font-mono tabular-nums">{d.daysLeft > 0 ? `${d.daysLeft}d` : "—"}</span>
                    </TableCell>
                    <TableCell className="pr-4 py-2.5 text-right">
                      <Link href={`/markets/${d.marketId}`}>
                        <Button size="xs" className="bg-[#f59e0b] text-[#0f1119] hover:bg-[#f59e0b]/80 gap-1">
                          Trade <ArrowRight className="size-3" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {disagreements.length === 0 && (
        <Card className="bg-[#222638] border-[#2f374f]">
          <CardContent className="py-16 text-center">
            <GitCompareArrows className="size-12 text-[#2f374f] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active arbitrage opportunities right now</h3>
            <p className="text-sm text-[#8892b0]">Check back in 30 minutes — disagreements are recalculated each ingestion cycle.</p>
          </CardContent>
        </Card>
      )}

      {disagreements.length > 0 && filtered.length === 0 && (
        <Card className="bg-[#222638] border-[#2f374f]">
          <CardContent className="py-16 text-center">
            <GitCompareArrows className="size-12 text-[#2f374f] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No disagreements found</h3>
            <p className="text-sm text-[#8892b0]">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}

      <footer className="flex items-center justify-between py-4 border-t border-[#2f374f] text-[10px] text-[#8892b0]">
        <span>© 2026 Quiver Markets. Not financial advice. Data from Polymarket &amp; Kalshi.</span>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
          
        </div>
      </footer>
    </div>
  );
}
