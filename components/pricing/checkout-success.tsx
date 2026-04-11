"use client";
import { CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

export function CheckoutSuccess({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full bg-[#161b27] border border-[#3fb950]/30 rounded-2xl shadow-2xl p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-2xl bg-[#3fb950]/15 border border-[#3fb950]/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-[#3fb950]" />
        </div>
        <div className="inline-flex items-center gap-1.5 bg-[#3fb950]/10 border border-[#3fb950]/20 rounded-full px-3 py-1 text-[10px] font-bold text-[#3fb950] uppercase tracking-widest mb-3">
          <Sparkles className="w-3 h-3" />
          Welcome Aboard
        </div>
        <h2 className="text-2xl font-bold text-[#f0f6fc] mb-2 tracking-tight">
          You&apos;re in
        </h2>
        <p className="text-sm text-[#8d96a0] leading-relaxed mb-6">
          Your subscription is active. All premium features are unlocked
          immediately. Check your email for a receipt.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/disagrees"
            className="inline-flex items-center gap-2 bg-[#57D7BA] text-[#0d1117] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#57D7BA]/90 transition-all active:scale-[0.97]"
          >
            Start exploring
          </Link>
          <Link
            href="/settings"
            className="text-sm text-[#8d96a0] hover:text-[#f0f6fc] transition-colors"
          >
            Manage subscription
          </Link>
        </div>
      </div>
    </div>
  );
}
