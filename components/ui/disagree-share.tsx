"use client";

import { useState } from "react";
import { Share2, Check, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Disagreement } from "@/lib/mockData";

// X/Twitter logo as inline SVG
function XLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function DisagreeShareButton({ d }: { d: Disagreement }) {
  const [copied, setCopied] = useState(false);

  const shareText = `🔴 The Market Disagrees\n\n"${d.question}"\n\nPolymarket: ${d.polyPrice}¢\nKalshi: ${d.kalshiPrice}¢\nSpread: ${d.spread} points\n\n${d.direction === "poly-higher" ? "Poly prices higher" : "Kalshi prices higher"} — potential arbitrage opportunity\n\nvia Quiver Markets`;

  const tweetText = encodeURIComponent(
    `🔴 The Market Disagrees\n\n"${d.question}"\n\nPolymarket: ${d.polyPrice}¢\nKalshi: ${d.kalshiPrice}¢\nSpread: ${d.spread}pts\n\nSomeone is wrong. 👀`
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handlePostX = () => {
    window.open(`https://x.com/intent/tweet?text=${tweetText}`, "_blank", "width=550,height=420");
  };

  return (
    <div className="relative flex items-center gap-1.5">
      <Button
        variant="outline"
        size="xs"
        onClick={handleCopy}
        className="border-[#2f374f] text-[#8892b0] hover:text-[#f59e0b] hover:border-[#f59e0b]/30 gap-1"
      >
        {copied ? <Check className="size-3 text-[#22c55e]" /> : <Share2 className="size-3" />}
        {copied ? "Copied!" : "Share"}
      </Button>
      <Button
        variant="outline"
        size="xs"
        onClick={handlePostX}
        className="border-[#2f374f] text-[#8892b0] hover:text-[#e2e8f0] hover:border-[#e2e8f0]/30 gap-1"
      >
        <XLogo className="size-3" />
        Post
      </Button>

      {/* Branded toast preview */}
      {copied && (
        <div className="absolute bottom-full mb-2 left-0 w-72 rounded-lg bg-[#222638] border border-[#2f374f] shadow-xl shadow-black/50 z-50 overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <div className="p-3 space-y-2">
            <p className="text-[10px] font-semibold text-[#f59e0b] uppercase tracking-widest">The Market Disagrees</p>
            <p className="text-xs font-semibold text-[#e2e8f0] leading-snug">{d.question}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-center p-1.5 rounded bg-[#1a1e2e]">
                <div className="text-[8px] text-[#8892b0]">Polymarket</div>
                <div className="font-mono text-base font-bold tabular-nums text-[#e2e8f0]">{d.polyPrice}¢</div>
              </div>
              <div className="px-2 py-1 rounded-full bg-[#f59e0b]/15 text-[#f59e0b] text-sm font-bold font-mono tabular-nums border border-[#f59e0b]/20">
                {d.spread}pt
              </div>
              <div className="flex-1 text-center p-1.5 rounded bg-[#1a1e2e]">
                <div className="text-[8px] text-[#8892b0]">Kalshi</div>
                <div className="font-mono text-base font-bold tabular-nums text-[#e2e8f0]">{d.kalshiPrice}¢</div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#57D7BA]/10 border-t border-[#57D7BA]/20">
            <div className="flex items-center gap-1.5">
              <Activity className="size-3 text-[#57D7BA]" />
              <span className="text-[9px] font-semibold text-[#57D7BA]">Quiver Markets</span>
            </div>
            <span className="text-[9px] text-[#8892b0]">Ready to post on X</span>
          </div>
        </div>
      )}
    </div>
  );
}
