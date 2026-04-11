"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Search, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ResolvedMarket {
  id: string;
  question: string;
  platform: string;
  category: string;
  price: number;
  volume: number;
  end_date: string | null;
  resolves_at: string | null;
  url: string | null;
}

const PAGE_SIZE = 50;

export default function ResolvedPage() {
  const [markets, setMarkets] = useState<ResolvedMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes("PLACEHOLDER")) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    supabase
      .from("markets")
      .select("id, question, platform, category, price, volume, end_date, resolves_at, url", { count: "exact" })
      .eq("resolved", true)
      .order("end_date", { ascending: false })
      .range(from, to)
      .then(({ data, count, error }) => {
        if (!error && data) {
          setMarkets(data);
          setTotal(count ?? 0);
        }
        setLoading(false);
      });
  }, [page]);

  const filtered = useMemo(() => {
    if (!search.trim()) return markets;
    const q = search.toLowerCase();
    return markets.filter(
      (m) =>
        m.question.toLowerCase().includes(q) ||
        m.platform.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }, [markets, search]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function formatDate(s: string | null) {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function formatVol(v: number) {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v}`;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e2e8f0] p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="size-5 text-[#8892b0]" />
          <h1 className="text-xl font-bold tracking-tight">Resolved Markets</h1>
        </div>
        <p className="text-sm text-[#8892b0]">
          Historical archive of settled prediction markets. {total > 0 && <span>{total.toLocaleString()} markets resolved.</span>}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8892b0]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resolved markets…"
          className="w-full pl-9 pr-3 py-2 bg-[#161b27] border border-[#2a2f45] rounded-lg text-sm text-[#e2e8f0] placeholder:text-[#8892b0] outline-none focus:border-[#57D7BA]/40 transition-colors"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-[#161b27] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#8892b0]">
          <CheckCircle className="size-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium text-[#e2e8f0] mb-1">
            {search ? "No markets match your search." : "No resolved markets yet."}
          </p>
          <p className="text-xs max-w-sm mx-auto leading-relaxed">
            {search
              ? "Try a different keyword, platform, or category."
              : "Resolved markets appear here after Polymarket or Kalshi settles them. Check back after the next ingestion run, or browse active markets on the Screener."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#2a2f45] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2f45] bg-[#161b27]">
                <th className="text-left px-4 py-2.5 text-[10px] text-[#8892b0] uppercase tracking-wider font-semibold">Market</th>
                <th className="text-left px-4 py-2.5 text-[10px] text-[#8892b0] uppercase tracking-wider font-semibold hidden sm:table-cell">Platform</th>
                <th className="text-left px-4 py-2.5 text-[10px] text-[#8892b0] uppercase tracking-wider font-semibold hidden md:table-cell">Category</th>
                <th className="text-right px-4 py-2.5 text-[10px] text-[#8892b0] uppercase tracking-wider font-semibold">Final</th>
                <th className="text-right px-4 py-2.5 text-[10px] text-[#8892b0] uppercase tracking-wider font-semibold hidden sm:table-cell">Volume</th>
                <th className="text-right px-4 py-2.5 text-[10px] text-[#8892b0] uppercase tracking-wider font-semibold hidden md:table-cell">Resolved</th>
                <th className="px-4 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr
                  key={m.id}
                  className={`border-b border-[#2a2f45] hover:bg-[#161b27] transition-colors ${i % 2 === 0 ? "bg-[#0d1117]" : "bg-[#10141e]"}`}
                >
                  <td className="px-4 py-3">
                    <Link href={`/markets/${m.id}`} className="text-[#e2e8f0] hover:text-[#57D7BA] transition-colors line-clamp-2 leading-snug text-xs sm:text-sm">
                      {m.question}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium border border-[#2a2f45] text-[#8892b0]">
                      {m.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-[#8892b0]">{m.category}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono text-sm font-bold tabular-nums ${m.price >= 50 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                      {m.price}¢
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell font-mono text-xs text-[#8892b0] tabular-nums">
                    {formatVol(m.volume)}
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell text-xs text-[#8892b0]">
                    {formatDate(m.resolves_at || m.end_date)}
                  </td>
                  <td className="px-4 py-3">
                    {m.url && (
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-[#8892b0] hover:text-[#57D7BA] transition-colors">
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#2a2f45]">
          <span className="text-xs text-[#8892b0]">
            Page {page + 1} of {totalPages} · {total.toLocaleString()} total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs border border-[#2a2f45] text-[#8892b0] hover:text-[#e2e8f0] hover:border-[#57D7BA]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-xs border border-[#2a2f45] text-[#8892b0] hover:text-[#e2e8f0] hover:border-[#57D7BA]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
