"use client";

import { useState } from "react";
import { Share2, Check, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Disagreement } from "@/lib/mockData";

function XLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function DisagreeShareButton({ d }: { d: Disagreement }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/disagrees` : "https://amazing-kitsune-139d51.netlify.app/disagrees";

  const shareText = `🔴 The Market Disagrees\n\n"${d.question}"\n\nPolymarket: ${d.polyPrice}¢\nKalshi: ${d.kalshiPrice}¢\nSpread: ${d.spread} points\n\n${d.direction === "poly-higher" ? "Poly prices higher" : "Kalshi prices higher"}\n\nvia Quiver Markets`;

  const tweetText = `🔴 The Market Disagrees\n\n"${d.question}"\n\nPolymarket: ${d.polyPrice}¢ vs Kalshi: ${d.kalshiPrice}¢\nSpread: ${d.spread}pts\n\nSomeone is wrong. 👀`;

  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;
  const tgHref = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(tweetText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div className="relative flex items-center gap-1.5">
      <Button
        variant="outline"
        size="xs"
        onClick={handleCopy}
        className="border-[#21262d] text-[#8892b0] hover:text-[#f59e0b] hover:border-[#f59e0b]/30 gap-1"
      >
        {copied ? <Check className="size-3 text-[#22c55e]" /> : <Share2 className="size-3" />}
        {copied ? "Copied!" : "Share"}
      </Button>
      <a
        href={tgHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center h-7 px-2 rounded-md border border-[#21262d] text-[#8892b0] hover:text-[#2AABEE] hover:border-[#2AABEE]/30 transition-colors"
        title="Send to Telegram"
      >
        <svg viewBox="0 0 24 24" className="size-3" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
      </a>
      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-[#21262d] text-[#8892b0] hover:text-[#e2e8f0] hover:border-[#e2e8f0]/30 transition-colors text-[10px] font-medium"
      >
        <XLogo className="size-3" />
        Post
      </a>

      {copied && (
        <div className="absolute bottom-full mb-2 left-0 w-72 rounded-lg bg-[#161b27] shadow-card hover:shadow-card-hover hover:-translate-y-px transition-all duration-200 border border-[#21262d] shadow-xl shadow-black/50 z-50 overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <div className="p-3 space-y-2">
            <p className="text-[10px] font-semibold text-[#f59e0b] uppercase tracking-widest">The Market Disagrees</p>
            <p className="text-xs font-semibold text-[#e2e8f0] leading-snug">{d.question}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-center p-1.5 rounded bg-[#0d1117]">
                <div className="text-[8px] text-[#8892b0]">Polymarket</div>
                <div className="font-mono text-base font-bold tabular-nums text-[#e2e8f0]">{d.polyPrice}¢</div>
              </div>
              <div className="px-2 py-1 rounded-full bg-[#f59e0b]/15 text-[#f59e0b] text-sm font-bold font-mono tabular-nums border border-[#f59e0b]/20">
                {d.spread}pt
              </div>
              <div className="flex-1 text-center p-1.5 rounded bg-[#0d1117]">
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
            <span className="text-[9px] text-[#8892b0]">Copied to clipboard</span>
          </div>
        </div>
      )}
    </div>
  );
}
