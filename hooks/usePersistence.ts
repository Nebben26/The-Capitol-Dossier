"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/layout/AuthContext";
import { supabase } from "@/lib/supabase";
import type { DbPrediction, DbWatchlistItem } from "@/lib/supabase";

// ─── LOCAL STORAGE FALLBACK ───────────────────────────────────────────
function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch { return fallback; }
}

function setLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── PREDICTIONS PERSISTENCE ──────────────────────────────────────────
export interface SavedPrediction {
  id: string;
  question: string;
  probability: number;
  outcome: "YES" | "NO" | null;
  category: string;
  date: string;
}

export function useSavedPredictions() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<SavedPrediction[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    if (user?.id) {
      // Try Supabase first
      supabase
        .from("user_predictions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setPredictions(data.map((d: DbPrediction) => ({
              id: d.id || `db-${Date.now()}`,
              question: d.question,
              probability: d.probability,
              outcome: d.outcome,
              category: d.category,
              date: d.date,
            })));
          } else {
            // Fall back to localStorage
            setPredictions(getLocal(`predictions-${user.id}`, []));
          }
          setLoaded(true);
        });
    } else {
      setPredictions(getLocal("predictions-anon", []));
      setLoaded(true);
    }
  }, [user?.id]);

  // Save whenever predictions change
  useEffect(() => {
    if (!loaded) return;
    const key = user?.id ? `predictions-${user.id}` : "predictions-anon";
    setLocal(key, predictions);

    // Also try to save to Supabase
    if (user?.id && predictions.length > 0) {
      const rows: DbPrediction[] = predictions.map((p) => ({
        user_id: user.id,
        question: p.question,
        probability: p.probability,
        outcome: p.outcome,
        category: p.category,
        date: p.date,
      }));
      // Upsert all (fire and forget)
      supabase.from("user_predictions").upsert(rows, { onConflict: "id" }).then(() => {});
    }
  }, [predictions, loaded, user?.id]);

  const addPrediction = useCallback((p: Omit<SavedPrediction, "id">) => {
    setPredictions((prev) => [{ ...p, id: `p-${Date.now()}` }, ...prev]);
  }, []);

  const removePrediction = useCallback((id: string) => {
    setPredictions((prev) => prev.filter((p) => p.id !== id));
    if (user?.id) {
      supabase.from("user_predictions").delete().eq("id", id).then(() => {});
    }
  }, [user?.id]);

  const importPredictions = useCallback((preds: SavedPrediction[]) => {
    setPredictions(preds);
  }, []);

  return { predictions, loaded, addPrediction, removePrediction, importPredictions };
}

// ─── WATCHLIST PERSISTENCE ────────────────────────────────────────────
export interface WatchlistItem {
  id: string;
  type: "market" | "whale";
  itemId: string;
  name: string;
}

export function useWatchlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user?.id) {
      supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", user.id)
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setItems(data.map((d: DbWatchlistItem) => ({
              id: d.id || `w-${Date.now()}`,
              type: d.item_type,
              itemId: d.item_id,
              name: d.item_name,
            })));
          } else {
            setItems(getLocal(`watchlist-${user.id}`, []));
          }
          setLoaded(true);
        });
    } else {
      setItems(getLocal("watchlist-anon", []));
      setLoaded(true);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!loaded) return;
    const key = user?.id ? `watchlist-${user.id}` : "watchlist-anon";
    setLocal(key, items);
  }, [items, loaded, user?.id]);

  const isWatched = useCallback((itemId: string) => {
    return items.some((i) => i.itemId === itemId);
  }, [items]);

  const toggleWatch = useCallback((type: "market" | "whale", itemId: string, name: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.itemId === itemId);
      if (existing) {
        if (user?.id) {
          supabase.from("watchlist").delete().eq("item_id", itemId).eq("user_id", user.id).then(() => {});
        }
        return prev.filter((i) => i.itemId !== itemId);
      }
      const newItem: WatchlistItem = { id: `w-${Date.now()}`, type, itemId, name };
      if (user?.id) {
        supabase.from("watchlist").insert({ user_id: user.id, item_type: type, item_id: itemId, item_name: name }).then(() => {});
      }
      return [...prev, newItem];
    });
  }, [user?.id]);

  return { items, loaded, isWatched, toggleWatch };
}
