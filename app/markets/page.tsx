"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  LayoutGrid,
  List,
  Filter,
  Timer,
  Flame,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { sparkGen, Market, markets as allMarkets, CATEGORIES, PLATFORMS } from "@/lib/mockData";

const categories = CATEGORIES;
const platforms = PLATFORMS;

const sortOptions = [
  { label: "Volume (High → Low)", key: "volume" as const },
  { label: "Biggest Movers", key: "change" as const },
  { label: "Time to Resolution", key: "resolution" as const },
];

type SortKey = "volume" | "change" | "resolution" | "price";
type SortDir = "asc" | "desc";
type ViewMode = "grid" | "table";

// ─── SPARKLINE ────────────────────────────────────────────────────────
function MiniSparkline({ data, positive }: { data: { d: number; v: number }[]; positive: boolean }) {
  return (
    <div className="h-6 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={positive ? "#22c55e" : "#ef4444"} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── TOOLTIP SPARKLINE (larger) ───────────────────────────────────────
function TooltipSparkline({ data, positive }: { data: { d: number; v: number }[]; positive: boolean }) {
  const gId = positive ? "tipGreen" : "tipRed";
  const color = positive ? "#22c55e" : "#ef4444";
  return (
    <div className="h-14 w-36">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gId})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── RESOLUTION BADGE ─────────────────────────────────────────────────
function ResBadge({ days }: { days: number }) {
  const color = days <= 14 ? "#ef4444" : days <= 60 ? "#f59e0b" : days <= 180 ? "#57D7BA" : "#8892b0";
  const bg = days <= 14 ? "bg-[#ef4444]/10" : days <= 60 ? "bg-[#f59e0b]/10" : days <= 180 ? "bg-[#57D7BA]/10" : "bg-[#2a2f45]";
  const label = days <= 1 ? "Today" : days <= 7 ? `${days}d` : days <= 60 ? `${days}d` : days <= 365 ? `${Math.round(days / 30)}mo` : `${(days / 365).toFixed(1)}y`;
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold ${bg}`} style={{ color }}>
      <Timer className="size-2.5" />{label}
    </span>
  );
}

// ─── MARKET CARD ──────────────────────────────────────────────────────
function MarketCard({ m }: { m: Market }) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Link href={`/markets/${m.id}`} className="block group text-left">
          <Card className="bg-[#222638] border-[#2a2f45] hover:border-[#57D7BA]/20 transition-all h-full">
            <CardContent className="p-4 flex flex-col h-full">
              {/* Tags */}
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#57D7BA]/10 text-[#57D7BA]">{m.category}</span>
                <ResBadge days={m.daysLeft} />
                {m.trending && (
                  <span className="px-1 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] text-[8px] font-bold flex items-center gap-0.5">
                    <Flame className="size-2" />HOT
                  </span>
                )}
                <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-[#2a2f45] text-[#8892b0]">{m.platform}</span>
              </div>

              {/* Question */}
              <p className="text-xs font-semibold leading-snug group-hover:text-[#57D7BA] transition-colors line-clamp-2 mb-3 flex-1">
                {m.question}
              </p>

              {/* YES/NO bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-[9px] font-mono font-semibold mb-1">
                  <span className="text-[#22c55e]">YES {m.price}¢</span>
                  <span className="text-[#ef4444]">NO {100 - m.price}¢</span>
                </div>
                <div className="h-2 rounded-full bg-[#1a1e2e] overflow-hidden flex">
                  <div className="h-full bg-[#22c55e] rounded-l-full transition-all" style={{ width: `${m.price}%` }} />
                  <div className="h-full bg-[#ef4444] rounded-r-full transition-all" style={{ width: `${100 - m.price}%` }} />
                </div>
              </div>

              {/* Bottom stats */}
              <div className="flex items-center justify-between">
                <span className={`flex items-center gap-0.5 font-mono text-xs font-semibold ${m.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                  {m.change >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {Math.abs(m.change)}%
                </span>
                <span className="font-mono text-[10px] text-[#8892b0]">{m.volume}</span>
                <span className="text-[9px] text-[#8892b0]">{m.traders.toLocaleString()} traders</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-[#222638] border-[#2a2f45] text-[#e2e8f0] p-3 max-w-xs">
        <div className="space-y-2">
          <p className="text-xs font-medium">{m.question}</p>
          <TooltipSparkline data={m.spark} positive={m.change >= 0} />
          <div className="flex justify-between text-[10px]">
            <span className="text-[#8892b0]">Bid: {Math.max(m.price - 2, 1)}¢</span>
            <span className="text-[#8892b0]">Ask: {m.price + 2}¢</span>
            <span className="text-[#8892b0]">{m.whaleCount} whales</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────
export default function MarketsBrowsePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortKey>("volume");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [platform, setPlatform] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [visibleCount, setVisibleCount] = useState(12);
  const [loading, setLoading] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let result = allMarkets;
    if (category === "Trending") result = result.filter((m) => m.trending);
    else if (category !== "All") result = result.filter((m) => m.category === category);
    if (platform !== "All") result = result.filter((m) => m.platform === platform);
    if (searchQuery) result = result.filter((m) => m.question.toLowerCase().includes(searchQuery.toLowerCase()));
    return [...result].sort((a, b) => {
      let av: number, bv: number;
      if (sortBy === "volume") { av = a.volNum; bv = b.volNum; }
      else if (sortBy === "change") { av = Math.abs(a.change); bv = Math.abs(b.change); }
      else if (sortBy === "resolution") { av = a.daysLeft; bv = b.daysLeft; }
      else { av = a.price; bv = b.price; }
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [category, platform, searchQuery, sortBy, sortDir]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      setVisibleCount((c) => Math.min(c + 8, filtered.length));
      setLoading(false);
    }, 600);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortBy !== col) return <ChevronDown className="size-3 opacity-30" />;
    return sortDir === "desc" ? <ChevronDown className="size-3 text-[#57D7BA]" /> : <ChevronUp className="size-3 text-[#57D7BA]" />;
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* ─── HERO SEARCH ────────────────────────────────────── */}
      <div className="text-center py-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Browse Prediction Markets</h1>
        <p className="text-sm text-[#8892b0] mb-5">{allMarkets.length} active markets across all platforms</p>
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#8892b0]" />
          <input
            type="text"
            placeholder="Search by question, category, or keyword..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(12); }}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-[#222638] border border-[#2a2f45] text-base text-[#e2e8f0] placeholder:text-[#8892b0]/60 focus:outline-none focus:ring-2 focus:ring-[#57D7BA]/40 focus:border-[#57D7BA]/50 transition-all shadow-lg shadow-black/20"
          />
        </div>
      </div>

      {/* ─── CATEGORY PILLS ─────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none justify-center">
        {categories.map((cat) => (
          <button key={cat} onClick={() => { setCategory(cat); setVisibleCount(12); }}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${category === cat ? "bg-[#57D7BA] text-[#0f1119] shadow-lg shadow-[#57D7BA]/20" : "bg-[#222638] text-[#8892b0] hover:text-[#e2e8f0] border border-[#2a2f45] hover:border-[#57D7BA]/30"}`}>
            {cat}
          </button>
        ))}
      </div>
  
      {/* ─── SECONDARY FILTERS ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="size-3.5 text-[#8892b0]" />
          {/* Sort pills */}
          {sortOptions.map((opt) => (
            <button key={opt.key} onClick={() => handleSort(opt.key)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border ${sortBy === opt.key ? "bg-[#57D7BA]/10 text-[#57D7BA] border-[#57D7BA]/30" : "bg-[#222638] text-[#8892b0] border-[#2a2f45] hover:text-[#e2e8f0]"}`}>
              {opt.label}
              {sortBy === opt.key && (sortDir === "desc" ? <ChevronDown className="size-3 inline ml-0.5" /> : <ChevronUp className="size-3 inline ml-0.5" />)}
            </button>
          ))}
          {/* Platform pills */}
          <span className="text-[10px] text-[#2a2f45] mx-1">|</span>
          {platforms.map((p) => (
            <button key={p} onClick={() => { setPlatform(p); setVisibleCount(12); }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border ${platform === p ? "bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/30" : "bg-[#222638] text-[#8892b0] border-[#2a2f45] hover:text-[#e2e8f0]"}`}>
              {p}
            </button>
          ))}
        </div>
  
        {/* View toggle + count */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#8892b0] font-mono">{filtered.length} results</span>
          <div className="flex items-center gap-0.5 bg-[#222638] rounded-lg p-0.5 border border-[#2a2f45]">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-[#57D7BA] text-[#0f1119]" : "text-[#8892b0] hover:text-[#e2e8f0]"}`}>
              <LayoutGrid className="size-3.5" />
            </button>
            <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-[#57D7BA] text-[#0f1119]" : "text-[#8892b0] hover:text-[#e2e8f0]"}`}>
              <List className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
  
      {/* ─── GRID VIEW ──────────────────────────────────────── */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map((m) => (
            <MarketCard key={m.id} m={m} />
          ))}
        </div>
      )}
  
      {/* ─── TABLE VIEW ─────────────────────────────────────── */}
      {viewMode === "table" && (
        <Card className="bg-[#222638] border-[#2a2f45]">
          <CardContent className="px-0 py-0">
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a2f45] hover:bg-transparent">
                  <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">CONTRACT</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium">TREND</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handleSort("price")}>
                    <span className="flex items-center gap-0.5">PRICE <SortIcon col="price" /></span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handleSort("change")}>
                    <span className="flex items-center gap-0.5">24H <SortIcon col="change" /></span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handleSort("volume")}>
                    <span className="flex items-center gap-0.5">VOLUME <SortIcon col="volume" /></span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium cursor-pointer hover:text-[#57D7BA]" onClick={() => handleSort("resolution")}>
                    <span className="flex items-center gap-0.5">RESOLVES <SortIcon col="resolution" /></span>
                  </TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium">CAT</TableHead>
                  <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4">PLATFORM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((m) => (
                  <Tooltip key={m.id}>
                    <TooltipTrigger>
                      <TableRow className="border-[#2a2f45]/50 hover:bg-[#57D7BA]/5 cursor-pointer transition-colors">
                        <TableCell className="pl-4 py-2.5 max-w-[260px]">
                          <Link href={`/markets/${m.id}`} className="text-xs font-medium hover:text-[#57D7BA] transition-colors leading-snug line-clamp-2">
                            {m.question}
                          </Link>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <MiniSparkline data={m.spark} positive={m.change >= 0} />
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono text-xs font-semibold">{m.price}¢</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className={`flex items-center gap-0.5 font-mono text-xs font-semibold ${m.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                            {m.change >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                            {Math.abs(m.change)}%
                          </span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-mono text-[11px] text-[#8892b0]">{m.volume}</span>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <ResBadge days={m.daysLeft} />
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-[#57D7BA]/10 text-[#57D7BA]">{m.category}</span>
                        </TableCell>
                        <TableCell className="pr-4 py-2.5">
                          <span className="text-[10px] text-[#8892b0]">{m.platform}</span>
                        </TableCell>
                      </TableRow>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-[#222638] border-[#2a2f45] text-[#e2e8f0] p-3 max-w-xs">
                      <div className="space-y-2">
                        <p className="text-xs font-medium">{m.question}</p>
                        <TooltipSparkline data={m.spark} positive={m.change >= 0} />
                        <div className="flex justify-between text-[10px]">
                          <span className="text-[#8892b0]">Bid: {Math.max(m.price - 2, 1)}¢</span>
                          <span className="text-[#8892b0]">Ask: {m.price + 2}¢</span>
                          <span className="text-[#8892b0]">{m.whaleCount} whales</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
  
      {/* ─── LOAD MORE ──────────────────────────────────────── */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button onClick={loadMore} disabled={loading} variant="outline"
            className="border-[#2a2f45] text-[#8892b0] hover:text-[#57D7BA] hover:border-[#57D7BA]/30 px-8">
            {loading ? (
              <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" />Loading...</span>
            ) : (
              <span className="flex items-center gap-2"><TrendingUp className="size-4" />Load More ({filtered.length - visibleCount} remaining)</span>
            )}
          </Button>
        </div>
      )}
  
      {/* Empty state */}
      {filtered.length === 0 && (
        <Card className="bg-[#222638] border-[#2a2f45]">
          <CardContent className="py-16 text-center">
            <Search className="size-12 text-[#2a2f45] mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No markets found</h3>
            <p className="text-sm text-[#8892b0]">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
  
      {/* Footer */}
      <footer className="flex items-center justify-between py-4 border-t border-[#2a2f45] text-[10px] text-[#8892b0]">
        <span>© 2026 Quiver Markets. Not financial advice.</span>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
          <Link href="/api" className="hover:text-[#57D7BA] transition-colors">API</Link>
        </div>
      </footer>
    </div>
  );
}
