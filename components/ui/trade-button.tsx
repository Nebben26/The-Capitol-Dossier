"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TradeButton({
  side,
  price,
  url,
}: {
  side: "YES" | "NO";
  price: number;
  url?: string;
}) {
  const isYes = side === "YES";
  const bg = isYes ? "bg-[#22c55e]" : "bg-[#ef4444]";
  const bgHover = isYes ? "hover:bg-[#22c55e]/80" : "hover:bg-[#ef4444]/80";

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1">
        <Button className={`w-full h-9 text-white font-semibold text-sm ${bg} ${bgHover} gap-1.5`}>
          Buy {side} @ {price}¢
          <ExternalLink className="size-3" />
        </Button>
      </a>
    );
  }

  return (
    <div className="flex-1">
      <Button className={`w-full h-9 text-white font-semibold text-sm ${bg} ${bgHover} opacity-50 cursor-not-allowed`} disabled>
        Buy {side} @ {price}¢
      </Button>
    </div>
  );
}
