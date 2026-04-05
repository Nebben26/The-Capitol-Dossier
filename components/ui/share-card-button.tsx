"use client";

import { useState } from "react";
import { Share2, Check, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareCardButton({
  title,
  price,
  change,
}: {
  title: string;
  price?: number;
  change?: number;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const changeStr = change ? `${change >= 0 ? "+" : ""}${change}%` : "";
    const priceStr = price ? `${price}¢` : "";
    const text = `${title}${priceStr ? ` — ${priceStr}` : ""}${changeStr ? ` (${changeStr} 24h)` : ""}\n\nvia Quiver Markets · quivermarkets.com`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="border-[#2f374f] text-[#8892b0] hover:text-[#57D7BA] hover:border-[#57D7BA]/30 gap-1.5"
      >
        {copied ? <Check className="size-3.5 text-[#22c55e]" /> : <Share2 className="size-3.5" />}
        {copied ? "Copied!" : "Share Card"}
      </Button>
      {copied && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 rounded-lg bg-[#222638] border border-[#2f374f] shadow-xl shadow-black/50 z-50 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-300">
          <div className="p-3 space-y-2">
            <p className="text-xs font-semibold text-[#e2e8f0] leading-snug">{title}</p>
            {(price || change) && (
              <div className="flex items-center gap-3">
                {price && <span className="font-mono text-lg font-bold text-[#e2e8f0] tabular-nums">{price}¢</span>}
                {change && (
                  <span className={`font-mono text-xs font-semibold tabular-nums ${change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {change >= 0 ? "+" : ""}{change}% 24h
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#57D7BA]/10 border-t border-[#57D7BA]/20">
            <div className="flex items-center gap-1.5">
              <Activity className="size-3 text-[#57D7BA]" />
              <span className="text-[9px] font-semibold text-[#57D7BA]">Quiver Markets</span>
            </div>
            <span className="text-[9px] text-[#8892b0]">Copied to clipboard</span>
          </div>
        </div>
      )}
    </div>
  );
}
