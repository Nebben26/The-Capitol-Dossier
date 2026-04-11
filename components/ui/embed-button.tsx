"use client";

import { useState } from "react";
import { Code, Check, Copy } from "lucide-react";
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
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const base = "https://amazing-kitsune-139d51.netlify.app";
  const src = type === "market" ? `${base}/embed/${id}` : `${base}/embed/${type}?id=${id}`;
  const dims = type === "sparkline" ? 'width="300" height="140"' : 'width="600" height="300"';
  const code = `<iframe src="${src}" ${dims} frameborder="0" style="border-radius:12px;overflow:hidden;" loading="lazy"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="xs"
        onClick={() => setShowCode(!showCode)}
        className="border-[#21262d] text-[#8892b0] hover:text-[#6366f1] hover:border-[#6366f1]/30 gap-1"
      >
        <Code className="size-3" />
        {label}
      </Button>
      {showCode && (
        <div className="absolute top-full mt-1.5 right-0 w-72 p-3 rounded-lg bg-[#0f1119] border border-[#21262d] shadow-xl z-50 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <p className="text-[10px] font-semibold text-[#e2e8f0] mb-2">Embed this market</p>
          <textarea
            readOnly
            value={code}
            rows={3}
            className="w-full text-[9px] text-[#57D7BA] font-mono bg-[#0d1117] border border-[#21262d] rounded p-2 resize-none focus:outline-none"
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          />
          <Button
            size="xs"
            onClick={handleCopy}
            className="mt-2 w-full bg-[#6366f1] hover:bg-[#6366f1]/80 text-white gap-1"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "Copied!" : "Copy embed code"}
          </Button>
        </div>
      )}
    </div>
  );
}
