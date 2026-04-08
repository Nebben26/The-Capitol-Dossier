"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ArrowRight, Sparkles } from "lucide-react";

const STORAGE_KEY = "qm_seen_intro_banner";

export function StickyIntroBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // Only show on non-homepage pages, only for first-time visitors
  useEffect(() => {
    if (pathname === "/") return;
    if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, [pathname]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="bg-[#1e2235] border-b border-[#57D7BA]/20 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles className="size-3.5 text-[#57D7BA] shrink-0" />
        <p className="text-[11px] text-[#8892b0] truncate">
          <span className="text-[#e2e8f0] font-medium">New to Quiver Markets?</span>
          {" "}Track whale money, arbitrage spreads, and AI signals across Polymarket &amp; Kalshi.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/"
          onClick={dismiss}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#57D7BA]/10 text-[#57D7BA] text-[10px] font-semibold hover:bg-[#57D7BA]/20 transition-colors whitespace-nowrap"
        >
          See dashboard <ArrowRight className="size-3" />
        </Link>
        <button
          onClick={dismiss}
          className="text-[#8892b0] hover:text-[#e2e8f0] transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
