"use client";
import { AlertTriangle } from "lucide-react";

export function TestModeBanner() {
  const pubKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  if (!pubKey.startsWith("pk_test_")) return null;

  return (
    <div className="rounded-lg bg-[#d29922]/10 border border-[#d29922]/30 px-4 py-2 flex items-center gap-2 text-xs text-[#d29922]">
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>
        <span className="font-bold">Test Mode</span> — Use card number{" "}
        <code className="font-mono bg-[#0d1117] px-1 rounded">4242 4242 4242 4242</code>{" "}
        with any future expiry and any CVC.
      </span>
    </div>
  );
}
