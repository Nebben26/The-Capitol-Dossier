"use client";

import { useState } from "react";
import { Code, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmbedButton({
  type,
  id,
  label = "Embed",
}: {
  type: "market" | "disagree" | "sparkline";
  id: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const base = "https://quivermarkets.com";
  const dims = type === "sparkline" ? 'width="300" height="140"' : 'width="400" height="220"';
  const code = `<iframe src="${base}/embed/${type}?id=${id}" ${dims} frameborder="0" style="border-radius:12px;overflow:hidden;" loading="lazy"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button variant="outline" size="xs" onClick={handleCopy} className="border-[#2f374f] text-[#8892b0] hover:text-[#6366f1] hover:border-[#6366f1]/30 gap-1">
        {copied ? <Check className="size-3 text-[#22c55e]" /> : <Code className="size-3" />}
        {copied ? "Copied!" : label}
      </Button>
      {copied && (
        <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 w-60 p-2 rounded-lg bg-[#0f1119] border border-[#2f374f] shadow-xl z-50 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <p className="text-[9px] text-[#8892b0] mb-1">Embed code copied:</p>
          <code className="text-[8px] text-[#57D7BA] font-mono break-all leading-relaxed block">{code}</code>
        </div>
      )}
    </div>
  );
}
