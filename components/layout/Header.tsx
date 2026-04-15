"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Activity,
  Target,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { markets as mockMarkets, whales as mockWhales } from "@/lib/mockData";
import { useTopMarkets, useWhales } from "@/hooks/useData";

const NAV = [
  { label: "Disagrees", href: "/disagrees" },
  { label: "Whales",    href: "/whales"    },
  { label: "Indices",   href: "/indices"   },
];

export function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const { markets: liveMarkets } = useTopMarkets();
  const { whales: liveWhales }   = useWhales();
  const markets = liveMarkets.length > 24 ? liveMarkets : mockMarkets;
  const whales  = liveWhales.length  > 0  ? liveWhales  : mockWhales;

  const [query,    setQuery]    = useState("");
  const [open,     setOpen]     = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return { markets: [], whales: [] };
    return {
      markets: markets
        .filter((m) => m.question.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.id.includes(q))
        .slice(0, 5),
      whales: whales
        .filter((w) => w.name.toLowerCase().includes(q) || w.bestCategory.toLowerCase().includes(q))
        .slice(0, 4),
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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur-sm border-b border-[#21262d] px-6 py-0 flex items-center gap-6 h-14">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[#57D7BA] flex items-center justify-center">
          <Activity className="size-3.5 text-[#0d1117]" />
        </div>
        <span className="text-sm font-bold tracking-tight text-[#f0f6fc]">Quiver Markets</span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {NAV.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
              isActive(href)
                ? "text-[#57D7BA] font-semibold"
                : "text-[#8d96a0] hover:text-[#f0f6fc]"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search icon trigger */}
      <div className="relative" ref={wrapperRef}>
        <button
          aria-label="Search markets and whales"
          onClick={() => { setOpen((v) => !v); setTimeout(() => inputRef.current?.focus(), 50); }}
          className="p-2 rounded-md text-[#8d96a0] hover:text-[#f0f6fc] hover:bg-[#161b27] transition-colors"
        >
          <Search className="size-4" />
        </button>

        {/* Search dropdown */}
        {open && (
          <div className="absolute top-full right-0 mt-2 w-[420px] rounded-lg bg-[#161b27] border border-[#21262d] shadow-xl shadow-black/40 overflow-hidden z-50">
            {/* Input */}
            <div className="relative border-b border-[#21262d]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8892b0]" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search markets, whales..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-transparent text-sm text-[#e2e8f0] placeholder:text-[#8892b0]/60 focus:outline-none"
              />
            </div>

            {/* Empty state */}
            {!query.trim() && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-[#8892b0]">Search 5,800+ markets and 200+ whales</p>
                <p className="text-xs text-[#484f58] mt-1">Start typing to see results</p>
              </div>
            )}

            {/* No results */}
            {query.trim() && !hasResults && (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-[#8892b0]">No results for &ldquo;{query}&rdquo;</p>
              </div>
            )}

            {/* Market results */}
            {results.markets.length > 0 && (
              <div>
                <div className="px-3 py-2 border-b border-[#21262d] flex items-center gap-1.5">
                  <Target className="size-3 text-[#57D7BA]" />
                  <span className="text-[10px] text-[#8892b0] uppercase tracking-wider font-semibold">Markets</span>
                </div>
                {results.markets.map((m) => (
                  <button key={m.id} onClick={() => navigate(`/markets/${m.id}`)} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[#57D7BA]/5 transition-colors text-left">
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
                        {Math.abs(m.change)}pt
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
                </div>
                {results.whales.map((w) => (
                  <button key={w.id} onClick={() => navigate(`/whales/${w.id}`)} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[#57D7BA]/5 transition-colors text-left">
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
                <Link href="/markets" onClick={() => { setOpen(false); setQuery(""); }} className="text-[10px] text-[#8892b0] hover:text-[#57D7BA] transition-colors">Browse all markets →</Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LIVE pill */}
      <div className="inline-flex items-center gap-1.5 bg-[#3fb950]/15 border border-[#3fb950]/30 text-[#3fb950] text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse shrink-0" />
        LIVE
      </div>
    </header>
  );
}
