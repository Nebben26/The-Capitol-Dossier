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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { markets, whales } from "@/lib/mockData";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter results
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return { markets: [], whales: [] };
    return {
      markets: markets
        .filter(
          (m) =>
            m.question.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q) ||
            m.id.includes(q)
        )
        .slice(0, 5),
      whales: whales
        .filter(
          (w) =>
            w.name.toLowerCase().includes(q) ||
            w.bestCategory.toLowerCase().includes(q)
        )
        .slice(0, 4),
    };
  }, [query]);

  const hasResults = results.markets.length > 0 || results.whales.length > 0;

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ⌘K shortcut
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#1a1e2e]/95 backdrop-blur-md border-b border-[#2a2f45] flex items-center gap-3 px-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-[#8892b0] hover:text-[#e2e8f0]"
      >
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
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query && setOpen(true)}
          className="w-full h-9 pl-9 pr-12 rounded-lg bg-[#222638] border border-[#2a2f45] text-sm text-[#e2e8f0] placeholder:text-[#8892b0]/60 focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 focus:border-[#57D7BA]/50 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center gap-1 rounded border border-[#2a2f45] bg-[#1a1e2e] px-1.5 text-[10px] text-[#8892b0] font-mono">
          ⌘K
        </kbd>

        {/* Results dropdown */}
        {open && query.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1.5 rounded-lg bg-[#222638] border border-[#2a2f45] shadow-xl shadow-black/40 overflow-hidden z-50 max-h-[420px] overflow-y-auto">
            {!hasResults && (
              <div className="px-4 py-6 text-center">
                <Search className="size-8 text-[#2a2f45] mx-auto mb-2" />
                <p className="text-xs text-[#8892b0]">
                  No results for &ldquo;{query}&rdquo;
                </p>
              </div>
            )}

            {results.markets.length > 0 && (
              <div>
                <div className="px-3 py-2 border-b border-[#2a2f45] flex items-center gap-1.5">
                  <Target className="size-3 text-[#57D7BA]" />
                  <span className="text-[10px] text-[#8892b0] uppercase tracking-wider font-semibold">
                    Markets
                  </span>
                  <span className="text-[10px] text-[#8892b0]/50 ml-auto">
                    {results.markets.length} found
                  </span>
                </div>
                {results.markets.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/markets/${m.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#57D7BA]/5 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#e2e8f0] truncate">
                        {m.question}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-[#57D7BA] font-semibold">
                          {m.category}
                        </span>
                        <span className="text-[9px] text-[#8892b0]">
                          {m.platform}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-mono text-xs font-semibold text-[#e2e8f0]">
                        {m.price}¢
                      </span>
                      <span
                        className={`flex items-center gap-0.5 font-mono text-[10px] font-semibold justify-end ${
                          m.change >= 0
                            ? "text-[#22c55e]"
                            : "text-[#ef4444]"
                        }`}
                      >
                        {m.change >= 0 ? (
                          <ArrowUpRight className="size-2.5" />
                        ) : (
                          <ArrowDownRight className="size-2.5" />
                        )}
                        {Math.abs(m.change)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.whales.length > 0 && (
              <div>
                <div className="px-3 py-2 border-b border-[#2a2f45] border-t flex items-center gap-1.5">
                  <Wallet className="size-3 text-[#8b5cf6]" />
                  <span className="text-[10px] text-[#8892b0] uppercase tracking-wider font-semibold">
                    Whales
                  </span>
                  <span className="text-[10px] text-[#8892b0]/50 ml-auto">
                    {results.whales.length} found
                  </span>
                </div>
                {results.whales.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => navigate(`/whales/${w.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#57D7BA]/5 transition-colors text-left"
                  >
                    <div className="size-7 rounded-full bg-gradient-to-br from-[#57D7BA] to-[#8b5cf6] flex items-center justify-center shrink-0">
                      <span className="text-[8px] font-bold text-[#0f1119]">
                        #{w.rank}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#e2e8f0] truncate">
                        {w.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-[#8892b0]">
                          Rank #{w.rank}
                        </span>
                        <span className="text-[9px] text-[#57D7BA] font-semibold">
                          {w.accuracy}% acc
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={`font-mono text-xs font-semibold ${
                          w.totalPnlNum >= 0
                            ? "text-[#22c55e]"
                            : "text-[#ef4444]"
                        }`}
                      >
                        {w.totalPnl}
                      </span>
                      <span className="block text-[9px] text-[#8892b0]">
                        {w.totalTrades} trades
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {hasResults && (
              <div className="px-3 py-2 border-t border-[#2a2f45] text-center">
                <Link
                  href="/markets"
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="text-[10px] text-[#8892b0] hover:text-[#57D7BA] transition-colors"
                >
                  Browse all markets →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-xs font-medium">
          <span className="size-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          Live
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-[#8892b0] hover:text-[#e2e8f0]"
        >
          <Bell className="size-4" />
        </Button>
      </div>
    </header>
  );
}
