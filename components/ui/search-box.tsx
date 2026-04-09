"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { getTopMarkets } from "@/lib/api";
import type { Market } from "@/lib/mockData";

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [markets, setMarkets] = useState<Market[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load top markets once on mount
  useEffect(() => {
    getTopMarkets(1000).then((res) => setMarkets(res.data));
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return markets
      .filter((m) => m.question.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, markets]);

  const navigate = (id: string) => {
    setOpen(false);
    setQuery("");
    router.push(`/markets/${id}`);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[#8892b0] z-10 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => query.length >= 2 && setOpen(true)}
        placeholder="Search 6,500+ markets — Trump, Bitcoin, World Cup..."
        className="w-full h-12 pl-12 pr-4 rounded-xl bg-[#222638] border border-[#2f374f] text-sm text-[#e2e8f0] placeholder:text-[#8892b0]/60 focus:outline-none focus:ring-2 focus:ring-[#57D7BA]/40 focus:border-[#57D7BA]/50 transition-all shadow-lg shadow-black/20"
      />

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl bg-[#222638] border border-[#2f374f] shadow-xl shadow-black/40 overflow-hidden z-50">
          {results.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(m.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#57D7BA]/5 transition-colors text-left border-b border-[#2f374f]/50 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#e2e8f0] truncate">{m.question}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-[#57D7BA] font-semibold">{m.category}</span>
                  <span className="text-[9px] text-[#8892b0]">{m.platform}</span>
                </div>
              </div>
              <span className="shrink-0 font-mono text-xs font-semibold text-[#e2e8f0] tabular-nums">
                {m.price}¢
              </span>
            </button>
          ))}
          <div className="px-4 py-2 border-t border-[#2f374f] text-center">
            <button
              onClick={() => { setOpen(false); router.push(`/screener`); }}
              className="text-[10px] text-[#8892b0] hover:text-[#57D7BA] transition-colors"
            >
              Browse all markets in Screener →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
