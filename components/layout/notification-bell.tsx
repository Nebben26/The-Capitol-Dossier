"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, ArrowUpRight, ArrowDownRight, CheckCheck, X, Zap } from "lucide-react";
import { useTopMarkets } from "@/hooks/useData";
import { supabase } from "@/lib/supabase";

interface Notification {
  id: string;
  marketId: string;
  question: string;
  change: number;
  price: number;
  category: string;
  ts: number;
  read: boolean;
  isAlert?: boolean;
  alertMessage?: string;
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

  // Build notifications: merge price movers + alert_triggers
  useEffect(() => {
    const readSet = getReadSet();

    // Price mover notifications from market data
    const movers: Notification[] = markets
      .filter((m) => Math.abs(m.change) >= 5)
      .slice(0, 6)
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

    // Alert trigger notifications from Supabase (requires auth)
    const fetchAlertTriggers = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setNotifications(movers);
          return;
        }
        const { data: triggers } = await supabase
          .from("alert_triggers")
          .select("id, message, payload, read, triggered_at")
          .eq("user_id", session.user.id)
          .order("triggered_at", { ascending: false })
          .limit(10);

        const alertNotifs: Notification[] = (triggers || []).map((t) => ({
          id: `alert-trigger-${t.id}`,
          marketId: (t.payload as any)?.market_id || "",
          question: (t.payload as any)?.question || t.message,
          change: 0,
          price: 0,
          category: "Alert",
          ts: new Date(t.triggered_at).getTime(),
          read: t.read,
          isAlert: true,
          alertMessage: t.message,
        }));

        // Merge: alert triggers first, then price movers, sorted by ts desc
        const combined = [...alertNotifs, ...movers].sort((a, b) => b.ts - a.ts).slice(0, 12);
        setNotifications(combined);
      } catch {
        setNotifications(movers);
      }
    };

    fetchAlertTriggers();
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
    const alertTriggerIds: string[] = [];
    notifications.forEach((n) => {
      readSet.add(n.id);
      if (n.isAlert) alertTriggerIds.push(n.id.replace("alert-trigger-", ""));
    });
    saveReadSet(readSet);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    // Mark DB triggers as read
    if (alertTriggerIds.length > 0) {
      supabase.from("alert_triggers").update({ read: true }).in("id", alertTriggerIds).then(() => {});
    }
  }

  function markRead(id: string) {
    const readSet = getReadSet();
    readSet.add(id);
    saveReadSet(readSet);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (id.startsWith("alert-trigger-")) {
      const triggerId = id.replace("alert-trigger-", "");
      supabase.from("alert_triggers").update({ read: true }).eq("id", triggerId).then(() => {});
    }
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
            <span className="text-xs font-semibold text-[#f0f6fc]">Alerts</span>
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
                <p className="text-xs text-[#8d96a0]">No alerts yet</p>
                <p className="text-[10px] text-[#484f58] mt-0.5">Markets that move ≥5pt, or your saved alert rules, appear here</p>
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
                  {n.isAlert ? (
                    <div className="mt-0.5 size-6 rounded-full flex items-center justify-center shrink-0 bg-[#f59e0b]/15">
                      <Zap className="size-3.5 text-[#f59e0b]" />
                    </div>
                  ) : (
                    <div className={`mt-0.5 size-6 rounded-full flex items-center justify-center shrink-0 ${n.change >= 0 ? "bg-[#3fb950]/15" : "bg-[#f85149]/15"}`}>
                      {n.change >= 0 ? <ArrowUpRight className="size-3.5 text-[#3fb950]" /> : <ArrowDownRight className="size-3.5 text-[#f85149]" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[#e2e8f0] line-clamp-2 leading-snug">
                      {n.question}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {n.isAlert ? (
                        <span className="font-mono text-[11px] font-bold text-[#f59e0b]">{n.alertMessage}</span>
                      ) : (
                        <>
                          <span className={`font-mono text-[11px] font-bold ${n.change >= 0 ? "text-[#3fb950]" : "text-[#f85149]"}`}>
                            {n.change >= 0 ? "+" : ""}{n.change}pt
                          </span>
                          <span className="text-[10px] text-[#8d96a0]">{n.price}¢</span>
                        </>
                      )}
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
              Price movers (≥5pt) + your custom alert rules
            </div>
          )}
        </div>
      )}
    </div>
  );
}
