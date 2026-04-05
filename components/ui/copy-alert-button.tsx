"use client";

import { useState } from "react";
import { Copy, Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

function XLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function CopyAlertButton({
  text,
  compact = false,
}: {
  text: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePostX = () => {
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`,
      "_blank",
      "width=550,height=420"
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={handleCopy} className="p-1 rounded hover:bg-[#57D7BA]/10 text-[#8892b0] hover:text-[#57D7BA] transition-colors" title="Copy for Telegram">
          {copied ? <Check className="size-3 text-[#22c55e]" /> : <Send className="size-3" />}
        </button>
        <button onClick={handlePostX} className="p-1 rounded hover:bg-[#e2e8f0]/10 text-[#8892b0] hover:text-[#e2e8f0] transition-colors" title="Post to X">
          <XLogo className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-xs" onClick={handleCopy} className="text-[#8892b0] hover:text-[#57D7BA]" title="Copy for Telegram/X">
        {copied ? <Check className="size-3 text-[#22c55e]" /> : <Copy className="size-3" />}
      </Button>
      <Button variant="ghost" size="icon-xs" onClick={handlePostX} className="text-[#8892b0] hover:text-[#e2e8f0]" title="Post to X">
        <XLogo className="size-3" />
      </Button>
    </div>
  );
}
