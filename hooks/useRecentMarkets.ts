"use client";
import { useState, useEffect } from "react";

const KEY = "qm_recent_markets";
const MAX = 5;

export interface RecentMarket {
  id: string;
  question: string;
  price: number;
  category: string;
  viewedAt: number;
}

export function useRecentMarkets() {
  const [recents, setRecents] = useState<RecentMarket[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  function addRecent(market: Omit<RecentMarket, "viewedAt">) {
    setRecents((prev) => {
      const filtered = prev.filter((r) => r.id !== market.id);
      const next = [{ ...market, viewedAt: Date.now() }, ...filtered].slice(0, MAX);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function clearRecents() {
    setRecents([]);
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  }

  return { recents, addRecent, clearRecents };
}
