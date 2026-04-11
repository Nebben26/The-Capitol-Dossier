"use client";

import { useState } from "react";
import { Code, Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EmbedButton({
  type,
  id,
  label = "Embed",
}: {
  type: "market" | "disagree" | "sparkline" | "arb";
  id: string;
  label?: string;
}) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  // Map legacy type names to new widget types
  const widgetType = type === "disagree" ? "arb" : type === "sparkline" ? "market" : type;

  const embedCode =
    `<div data-quiver-widget="${widgetType}" data-id="${id}" data-theme="dark"></div>\n` +
    `<script src="https://quivermarkets.com/embed.js" async><\/script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="xs"
        onClick={() => setShowCode(!showCode)}
        className="border-[#21262d] text-[#8892b0] hover:text-[#388bfd] hover:border-[#388bfd]/30 gap-1"
      >
        <Code className="size-3" />
        {label}
      </Button>
      {showCode && (
        <div className="absolute top-full mt-1.5 right-0 w-80 p-3 rounded-xl bg-[#0f1119] border border-[#21262d] shadow-2xl z-50 animate-in fade-in-0 slide-in-from-top-1 duration-200 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-[#e2e8f0] uppercase tracking-widest">Embed this widget</p>
            <Link
              href={`/embed/builder?type=${widgetType}&id=${encodeURIComponent(id)}`}
              className="inline-flex items-center gap-1 text-[10px] text-[#388bfd] hover:text-[#388bfd]/80 transition-colors"
              onClick={() => setShowCode(false)}
            >
              <ExternalLink className="w-2.5 h-2.5" />
              Builder
            </Link>
          </div>
          <textarea
            readOnly
            value={embedCode}
            rows={3}
            className="w-full text-[9px] text-[#57D7BA] font-mono bg-[#0d1117] border border-[#21262d] rounded-lg p-2 resize-none focus:outline-none"
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
          <Button
            size="xs"
            onClick={handleCopy}
            className="w-full bg-[#388bfd] hover:bg-[#388bfd]/80 text-white gap-1"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "Copied!" : "Copy embed code"}
          </Button>
        </div>
      )}
    </div>
  );
}
