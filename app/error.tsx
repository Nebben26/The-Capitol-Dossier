"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#f85149]/10 border border-[#f85149]/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="size-7 text-[#f85149]" />
        </div>
        <h1 className="text-2xl font-bold text-[#f0f6fc] mb-2">Something went wrong</h1>
        <p className="text-sm text-[#8d96a0] mb-6 leading-relaxed">
          An unexpected error occurred. This has been logged and we&apos;re looking into it.
        </p>
        {error.message && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-[#161b27] border border-[#21262d] text-left">
            <p className="text-[10px] font-mono text-[#8d96a0] break-all">{error.message}</p>
            {error.digest && (
              <p className="text-[9px] font-mono text-[#484f58] mt-1">Digest: {error.digest}</p>
            )}
          </div>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-[#57D7BA] text-[#0d1117] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#57D7BA]/90 transition-all active:scale-[0.97]"
          >
            <RotateCcw className="size-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#161b27] text-[#f0f6fc] font-semibold text-sm px-5 py-2.5 rounded-lg border border-[#21262d] hover:border-[#57D7BA]/40 transition-all active:scale-[0.97]"
          >
            <Home className="size-4" />
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
