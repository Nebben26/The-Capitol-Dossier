"use client";

import { useState, useCallback } from "react";

export interface SavedSearch {
  id: string;         // timestamp-based id
  name: string;
  params: Record<string, unknown>;
  createdAt: string;
}

const LS_KEY = "qm_saved_searches";
const MAX_SAVED = 10;

function load(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as SavedSearch[]) : [];
  } catch {
    return [];
  }
}

function persist(searches: SavedSearch[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(searches));
  } catch { /* ignore */ }
}

export function useSavedSearches(namespace: string) {
  const [searches, setSearches] = useState<SavedSearch[]>(() =>
    load().filter((s) => (s.id ?? "").startsWith(namespace))
  );

  const saveSearch = useCallback(
    (name: string, params: Record<string, unknown>) => {
      const all = load().filter((s) => !(s.id ?? "").startsWith(namespace));
      const namespaced = load().filter((s) => (s.id ?? "").startsWith(namespace));

      const entry: SavedSearch = {
        id: `${namespace}_${Date.now()}`,
        name,
        params,
        createdAt: new Date().toISOString(),
      };

      const updated = [entry, ...namespaced].slice(0, MAX_SAVED);
      persist([...all, ...updated]);
      setSearches(updated);
    },
    [namespace]
  );

  const deleteSearch = useCallback(
    (id: string) => {
      const all = load().filter((s) => s.id !== id);
      persist(all);
      setSearches((prev) => prev.filter((s) => s.id !== id));
    },
    []
  );

  const clearAll = useCallback(() => {
    const all = load().filter((s) => !(s.id ?? "").startsWith(namespace));
    persist(all);
    setSearches([]);
  }, [namespace]);

  return { searches, saveSearch, deleteSearch, clearAll };
}
