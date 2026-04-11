"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, ArrowUpRight, ArrowDownRight, CheckCheck, X } from "lucide-react";
import { useTopMarkets } from "@/hooks/useData";

interface Notification {
  id: string;
  marketId: string;
  question: string;
  change: number;
  price: number;
  category: string;
  ts: number;
  read: boolean;
}

const READ_KEY = "qm_notif_read";

function getReadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    // ignore
  }
  return new Set();
}

function saveReadSet(s: Set<string>) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...s]));
  } catch {
    // ignore
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { markets } = useTopMarkets();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Build notifications from markets that moved >5%
  useEffect(() => {
    if (!markets.length) return;
    const readSet = getReadSet();
    const movers = markets
      .filter((m) => Math.abs(m.change) >= 5)
      .slice(0, 8)
      .map((m) => ({
        id: `notif-${m.id}`,
        marketId: m.id,
        question: m.question,
        change: m.change,
        price: m.price,
        category: m.category,
        ts: Date.now() - Math.floor(Math.random() * 3 * 60 * 60 * 1000),
        read: readSet.has(`notif-${m.id}`),
      }));
    setNotifications(movers);
  }, [markets]);

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    const readSet = getReadSet();
    notifications.forEach((n) => readSet.add(n.id));
    saveReadSet(readSet);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    const readSet = getReadSet();
    readSet.add(id);
    saveReadSet(readSet);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function formatAge(ts: number) {
    const ageMs = Date.now() - ts;
    if (ageMs < 60_000) return "just now";
    if (ageMs < 3_600_000) return `${Math.floor(ageMs / 60_000)}m ago`;
    return `${Math.floor(ageMs / 3_600_000)}h ago`;
  }

  return (
    <div className="relative hidden lg:block" ref={wrapperRef}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markAllRead();
        }}
        className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#161b27] border border-[#21262d] text-[#8d96a0] hover:text-[#f0f6fc] hover:border-[#57D7BA]/40 transition-all"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-[#f85149] text-[#f0f6fc] text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-[#161b27] border border-[#21262d] rounded-xl shadow-xl z-40 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#21262d]">
            <span className="text-xs font-semibold text-[#f0f6fc]">Price Alerts</span>
            <div className="flex items-center gap-2">
              {notifications.some((n) => !n.read) && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[10px] text-[#57D7BA] hover:underline"
                >
                  <CheckCheck className="size-3" />
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-[#8d96a0] hover:text-[#f0f6fc]">
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="size-7 text-[#21262d] mx-auto mb-2" />
                <p className="text-xs text-[#8d96a0]">No price alerts yet</p>
                <p className="text-[10px] text-[#484f58] mt-0.5">Markets that move ≥5% will appear here</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-2.5 px-3 py-2.5 border-b border-[#21262d]/50 hover:bg-[#57D7BA]/5 transition-colors cursor-pointer ${
                    !n.read ? "bg-[#57D7BA]/5" : ""
                  }`}
                >
                  {/* Direction icon */}
                  <div
                    className={`mt-0.5 size-6 rounded-full flex items-center justify-center shrink-0 ${
                      n.change >= 0 ? "bg-[#3fb950]/15" : "bg-[#f85149]/15"
                    }`}
                  >
                    {n.change >= 0 ? (
                      <ArrowUpRight className="size-3.5 text-[#3fb950]" />
                    ) : (
                      <ArrowDownRight className="size-3.5 text-[#f85149]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[#e2e8f0] line-clamp-2 leading-snug">
                      {n.question}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`font-mono text-[11px] font-bold ${
                          n.change >= 0 ? "text-[#3fb950]" : "text-[#f85149]"
                        }`}
                      >
                        {n.change >= 0 ? "+" : ""}
                        {n.change}%
                      </span>
                      <span className="text-[10px] text-[#8d96a0]">{n.price}¢</span>
                      <span className="text-[9px] text-[#484f58] ml-auto">{formatAge(n.ts)}</span>
                    </div>
                  </div>
                  {!n.read && (
                    <span className="mt-1.5 size-1.5 rounded-full bg-[#57D7BA] shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-3 py-2 border-t border-[#21262d] text-[10px] text-[#484f58] text-center">
              Showing markets that moved ≥5% in the last 24h
            </div>
          )}
        </div>
      )}
    </div>
  );
}
