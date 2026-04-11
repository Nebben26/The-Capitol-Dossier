"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Menu,
  Target,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { markets as mockMarkets, whales as mockWhales } from "@/lib/mockData";
import { useTopMarkets, useWhales, useDisagreements } from "@/hooks/useData";
import { useDataSource } from "./DataSourceContext";
import { useAuth } from "./AuthContext";
import { LogOut, User } from "lucide-react";

// ─── MINI PULSE GAUGE ─────────────────────────────────────────────────
function MiniPulseGauge() {
  const { markets: pulseMarkets } = useTopMarkets();
  const value = useMemo(() => {
    const top = pulseMarkets.filter(m => m.volNum > 100000 && m.change !== 0);
    if (top.length === 0) return 50;
    const avgChange = top.reduce((s, m) => s + m.change, 0) / top.length;
    return Math.min(100, Math.max(0, Math.round(50 + avgChange * 5)));
  }, [pulseMarkets]);

  // Arc dot position: center=(50,46), radius=40
  const angle = ((value / 100) * Math.PI) - (Math.PI / 2);
  const dotX = 50 + 40 * Math.sin(angle);
  const dotY = 46 - 40 * Math.cos(angle);
  const color = value >= 65 ? "#ef4444" : value >= 45 ? "#f59e0b" : "#22c55e";

  return (
    <div className="hidden lg:flex items-center gap-2 bg-[#161b27] border border-[#21262d] rounded-lg px-2.5 py-1.5 shrink-0" title={`Market Pulse: ${value}`}>
      <svg viewBox="0 0 100 55" className="w-9 h-auto">
        <defs>
          <linearGradient id="miniGaugeG" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3fb950" />
            <stop offset="50%" stopColor="#d29922" />
            <stop offset="100%" stopColor="#f85149" />
          </linearGradient>
        </defs>
        <path d="M 10 46 A 40 40 0 0 1 90 46" fill="none" stroke="#21262d" strokeWidth="5" strokeLinecap="round" />
        <path d="M 10 46 A 40 40 0 0 1 90 46" fill="none" stroke="url(#miniGaugeG)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(value / 100) * 126} 126`} />
        <circle cx={dotX} cy={dotY} r={3} fill="#fff" stroke={color} strokeWidth={1.5} />
      </svg>
      <div className="flex flex-col">
        <div className="text-[9px] text-[#484f58] font-bold uppercase tracking-widest leading-none">Pulse</div>
        <div className="text-sm font-bold tabular-nums text-[#f0f6fc] leading-tight mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const { source } = useDataSource();
  const { user, setShowLogin, signOut } = useAuth();
  const { markets: liveMarkets } = useTopMarkets();
  const { whales: liveWhales } = useWhales();
  const { disagreements } = useDisagreements();
  const markets = liveMarkets.length > 24 ? liveMarkets : mockMarkets;
  const whales = liveWhales.length > 0 ? liveWhales : mockWhales;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return { markets: [], whales: [] };
    return {
      markets: markets.filter((m) => m.question.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.id.includes(q)).slice(0, 5),
      whales: whales.filter((w) => w.name.toLowerCase().includes(q) || w.bestCategory.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [query, markets, whales]);

  const hasResults = results.markets.length > 0 || results.whales.length > 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); inputRef.current?.focus(); setOpen(true); }
      if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const navigate = (href: string) => { setOpen(false); setQuery(""); router.push(href); };

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#0d1117]/95 backdrop-blur-md border-b border-[#21262d] flex items-center gap-3 px-4">
      <button onClick={onMenuClick} aria-label="Open navigation menu" className="lg:hidden text-[#8892b0] hover:text-[#e2e8f0]">
        <Menu className="size-5" />
      </button>

      {/* Search with dropdown */}
      <div className="flex-1 max-w-xl relative" ref={wrapperRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8892b0] z-10" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search markets, contracts, whales..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full h-9 pl-9 pr-12 rounded-lg bg-[#161b27] border border-[#21262d] text-sm text-[#e2e8f0] placeholder:text-[#8892b0]/60 focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 focus:border-[#57D7BA]/50 hover:border-[#57D7BA]/50 hover:shadow-[0_0_0_3px_rgba(87,215,186,0.06)] transition-all duration-150"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[#21262d] bg-[#0d1117] px-1.5 text-[10px] text-[#8892b0] font-mono">⌘K</kbd>

        {/* Results dropdown — full-screen sheet on mobile, inline dropdown on sm+ */}
        {open && (
          <div className="fixed top-14 inset-x-0 bottom-0 sm:absolute sm:top-full sm:bottom-auto sm:mt-1.5 sm:max-h-[420px] rounded-none sm:rounded-lg bg-[#161b27] shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 border-t sm:border border-[#21262d] shadow-xl shadow-black/40 overflow-y-auto z-50">
            {/* Empty state — no query entered yet */}
            {!query.trim() && (
              <div className="px-4 py-8 text-center">
                <Search className="size-8 text-[#21262d] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#8892b0]">Search 5,800+ markets and 200+ whales</p>
                <p className="text-xs text-[#4a5168] mt-1">Start typing to see results</p>
              </div>
            )}
            {/* No results */}
            {query.trim() && !hasResults && (
              <div className="px-4 py-6 text-center">
                <Search className="size-8 text-[#21262d] mx-auto mb-2" />
                <p className="text-xs text-[#8892b0]">No results for &ldquo;{query}&rdquo;</p>
                <p className="text-[10px] text-[#4a5168] mt-1">Try different keywords or browse the screener</p>
              </div>
            )}
            {/* Market results */}
            {results.markets.length > 0 && (
              <div>
                <div className="px-3 py-2 border-b border-[#21262d] flex items-center gap-1.5">
                  <Target className="size-3 text-[#57D7BA]" />
                  <span className="text-[10px] text-[#8892b0] uppercase tracking-wider font-semibold">Markets</span>
                  <span className="text-[10px] text-[#8892b0]/50 ml-auto">{results.markets.length} found</span>
                </div>
                {results.markets.map((m) => (
                  <button key={m.id} onClick={() => navigate(`/markets/${m.id}`)} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[#57D7BA]/5 transition-colors text-left min-h-[44px]">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#e2e8f0] truncate">{m.question}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-[#57D7BA] font-semibold">{m.category}</span>
                        <span className="text-[9px] text-[#8892b0]">{m.platform}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-mono text-xs font-semibold text-[#e2e8f0]">{m.price}¢</span>
                      <span className={`flex items-center gap-0.5 font-mono text-[10px] font-semibold justify-end ${m.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                        {m.change >= 0 ? <ArrowUpRight className="size-2.5" /> : <ArrowDownRight className="size-2.5" />}
                        {Math.abs(m.change)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {/* Whale results */}
            {results.whales.length > 0 && (
              <div>
                <div className="px-3 py-2 border-b border-[#21262d] border-t flex items-center gap-1.5">
                  <Wallet className="size-3 text-[#8b5cf6]" />
                  <span className="text-[10px] text-[#8892b0] uppercase tracking-wider font-semibold">Whales</span>
                  <span className="text-[10px] text-[#8892b0]/50 ml-auto">{results.whales.length} found</span>
                </div>
                {results.whales.map((w) => (
                  <button key={w.id} onClick={() => navigate(`/whales/${w.id}`)} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[#57D7BA]/5 transition-colors text-left min-h-[44px]">
                    <div className="size-7 rounded-full bg-gradient-to-br from-[#57D7BA] to-[#8b5cf6] flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-[#0f1119]">#{w.rank}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#e2e8f0] truncate">{w.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-[#8892b0]">Rank #{w.rank}</span>
                        <span className="text-[9px] text-[#57D7BA] font-semibold">{w.accuracy}% acc</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`font-mono text-xs font-semibold ${w.totalPnlNum >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{w.totalPnl}</span>
                      <span className="block text-[9px] text-[#8892b0]">{w.totalTrades} trades</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {hasResults && (
              <div className="px-3 py-2 border-t border-[#21262d] text-center">
                <Link href="/screener" onClick={() => { setOpen(false); setQuery(""); }} className="text-[10px] text-[#8892b0] hover:text-[#57D7BA] transition-colors">Browse all markets →</Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* LIVE badge */}
        <div className="hidden md:inline-flex items-center gap-1.5 bg-[#3fb950]/15 border border-[#3fb950]/30 text-[#3fb950] text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse shrink-0" />
          LIVE
        </div>

        {/* My Calibration */}
        <Link href="/calibration" className="hidden xl:inline text-[11px] text-[#8d96a0] hover:text-[#f0f6fc] transition-colors">
          My Calibration
        </Link>

        {/* Disagrees count */}
        <Link href="/disagrees" className="hidden md:inline-flex items-center gap-1 bg-[#161b27] border border-[#21262d] text-[#f0f6fc] text-[11px] font-semibold px-2 py-1 rounded-md hover:border-[#57D7BA]/40 transition-colors">
          <span className="font-mono tabular-nums">{disagreements.length}</span>
          <span className="text-[#8d96a0]">Disagrees</span>
        </Link>

        {/* Telegram share */}
        <button
          onClick={() => {
            const topDisagree = disagreements[0];
            const text = topDisagree
              ? `🔴 The Market Disagrees\n\n"${topDisagree.question}"\n\nPolymarket: ${topDisagree.polyPrice}¢\nKalshi: ${topDisagree.kalshiPrice}¢\nSpread: ${topDisagree.spread}pts\n\nvia Quiver Markets`
              : "Check out Quiver Markets — prediction market intelligence";
            window.open(`https://t.me/share/url?text=${encodeURIComponent(text)}`, "_blank", "width=550,height=420");
          }}
          className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#2AABEE]/10 text-[#2AABEE] text-[11px] font-bold hover:bg-[#2AABEE]/20 transition-colors border border-[#2AABEE]/20 active:scale-[0.97] transition-all duration-100"
          title="Share top disagree to Telegram"
          aria-label="Share top disagreement to Telegram"
        >
          <svg viewBox="0 0 24 24" className="size-3" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
        </button>

        {/* Pulse gauge */}
        <MiniPulseGauge />
      </div>
    </header>
  );
}
