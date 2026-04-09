"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export function ErrorBanner({
  message = "Couldn't load data",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30">
      <AlertCircle className="size-4 text-[#ef4444] shrink-0" />
      <span className="text-sm text-[#e2e8f0] flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          aria-label="Retry loading data"
          className="flex items-center gap-1 text-xs text-[#57D7BA] hover:text-[#57D7BA]/80"
        >
          <RefreshCw className="size-3" /> Retry
        </button>
      )}
    </div>
  );
}
