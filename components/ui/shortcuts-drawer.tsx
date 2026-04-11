"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Keyboard } from "lucide-react";

const SHORTCUT_GROUPS = [
  {
    label: "General",
    shortcuts: [
      { keys: ["?"], desc: "Toggle keyboard shortcuts" },
      { keys: ["⌘", "K"], desc: "Search markets & whales" },
      { keys: ["Esc"], desc: "Close any overlay" },
    ],
  },
  {
    label: "Navigate",
    shortcuts: [
      { keys: ["g", "h"], desc: "Go to Home" },
      { keys: ["g", "s"], desc: "Go to Screener" },
      { keys: ["g", "d"], desc: "Go to Disagrees" },
      { keys: ["g", "w"], desc: "Go to Whales" },
      { keys: ["g", "l"], desc: "Go to Leaderboard" },
      { keys: ["g", "a"], desc: "Go to Alerts" },
      { keys: ["g", "c"], desc: "Go to Compare" },
      { keys: ["g", "p"], desc: "Go to Pricing" },
    ],
  },
];

const G_ROUTES: Record<string, string> = {
  h: "/",
  s: "/screener",
  d: "/disagrees",
  w: "/whales",
  l: "/leaderboard",
  a: "/alerts",
  c: "/compare",
  p: "/pricing",
};

export function ShortcutsDrawer() {
  const [open, setOpen] = useState(false);
  const [awaitingG, setAwaitingG] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let gTimer: ReturnType<typeof setTimeout>;

    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (open && e.key === "Escape") {
        setOpen(false);
        return;
      }

      if (awaitingG) {
        clearTimeout(gTimer);
        setAwaitingG(false);
        const route = G_ROUTES[e.key];
        if (route) router.push(route);
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      if (e.key === "g") {
        setAwaitingG(true);
        gTimer = setTimeout(() => setAwaitingG(false), 1500);
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      clearTimeout(gTimer);
    };
  }, [open, awaitingG, router]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-[#161b27] border border-[#21262d] rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262d]">
          <div className="flex items-center gap-2">
            <Keyboard className="size-4 text-[#57D7BA]" />
            <span className="text-sm font-semibold text-[#f0f6fc]">Keyboard Shortcuts</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-[#8d96a0] hover:text-[#f0f6fc] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#484f58] mb-2">
                {group.label}
              </div>
              <div className="space-y-1.5">
                {group.shortcuts.map((s) => (
                  <div key={s.desc} className="flex items-center justify-between">
                    <span className="text-sm text-[#8d96a0]">{s.desc}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, i) => (
                        <kbd
                          key={i}
                          className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded bg-[#0d1117] border border-[#21262d] text-[11px] font-mono text-[#f0f6fc]"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#21262d] text-[10px] text-[#484f58] text-center">
          Press{" "}
          <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-[#0d1117] border border-[#21262d] text-[10px] font-mono text-[#8d96a0]">
            ?
          </kbd>{" "}
          to toggle this panel
        </div>
      </div>
    </div>
  );
}
