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

function TelegramLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
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
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "width=550,height=420");
  };

  const handleTelegram = () => {
    window.open(`https://t.me/share/url?text=${encodeURIComponent(text)}`, "_blank", "width=550,height=420");
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button onClick={handleCopy} className="p-1 rounded hover:bg-[#57D7BA]/10 text-[#8892b0] hover:text-[#57D7BA] transition-colors" title="Copy text">
          {copied ? <Check className="size-3 text-[#22c55e]" /> : <Copy className="size-3" />}
        </button>
        <button onClick={handleTelegram} className="p-1 rounded hover:bg-[#2AABEE]/10 text-[#8892b0] hover:text-[#2AABEE] transition-colors" title="Send to Telegram">
          <TelegramLogo className="size-3" />
        </button>
        <button onClick={handlePostX} className="p-1 rounded hover:bg-[#e2e8f0]/10 text-[#8892b0] hover:text-[#e2e8f0] transition-colors" title="Post to X">
          <XLogo className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-xs" onClick={handleCopy} className="text-[#8892b0] hover:text-[#57D7BA]" title="Copy">
        {copied ? <Check className="size-3 text-[#22c55e]" /> : <Copy className="size-3" />}
      </Button>
      <Button variant="ghost" size="icon-xs" onClick={handleTelegram} className="text-[#8892b0] hover:text-[#2AABEE]" title="Telegram">
        <TelegramLogo className="size-3" />
      </Button>
      <Button variant="ghost" size="icon-xs" onClick={handlePostX} className="text-[#8892b0] hover:text-[#e2e8f0]" title="Post to X">
        <XLogo className="size-3" />
      </Button>
    </div>
  );
}
