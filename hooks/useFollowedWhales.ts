"use client";
import { useState, useEffect } from "react";

const KEY = "qm_followed_whales";

export function useFollowedWhales() {
  const [followed, setFollowed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setFollowed(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  function toggle(id: string) {
    setFollowed((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function isFollowing(id: string): boolean {
    return followed.includes(id);
  }

  return { followed, toggle, isFollowing };
}
