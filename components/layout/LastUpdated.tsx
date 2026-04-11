"use client";

import { useState, useEffect } from "react";
import { Clock, RefreshCw, AlertCircle } from "lucide-react";

interface Props {
  lastFetched?: Date;
  refreshing?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function LastUpdated({ lastFetched, refreshing, error, onRetry }: Props) {
  const [label, setLabel] = useState("just now");

  useEffect(() => {
    const update = () => {
      if (!lastFetched) { setLabel("just now"); return; }
      const secs = Math.floor((Date.now() - lastFetched.getTime()) / 1000);
      if (secs < 10) setLabel("just now");
      else if (secs < 60) setLabel(`${secs}s ago`);
      else setLabel(`${Math.floor(secs / 60)}m ago`);
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [lastFetched]);

  if (error) {
    return (
      <button
        onClick={onRetry}
        aria-label="Retry loading data"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ef4444]/10 border border-[#ef4444]/20 text-[10px] text-[#ef4444] hover:bg-[#ef4444]/20 transition-colors"
      >
        <AlertCircle className="size-2.5" />
        Retry
      </button>
    );
  }

  if (refreshing) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#57D7BA]/10 border border-[#57D7BA]/20 text-[10px] text-[#57D7BA]">
        <RefreshCw className="size-2.5 animate-spin" />
        Refreshing...
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#161b27] border border-[#21262d] text-[10px] text-[#8892b0]">
      <Clock className="size-2.5" />
      Updated {label}
    </span>
  );
}
