"use client";
import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

const KEY = "qm_disclaimer_dismissed";

export function DisclaimerBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(KEY);
      if (!dismissed) setShow(true);
    } catch {
      // sessionStorage not available (SSR, private mode)
    }
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="bg-[#d29922]/10 border-b border-[#d29922]/20 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        <AlertTriangle className="w-3.5 h-3.5 text-[#d29922] flex-shrink-0" />
        <div className="flex-1 text-[11px] text-[#d29922]">
          <strong>Not financial advice.</strong> Quiver Markets is an information platform. Prediction markets carry
          risk of total loss. See our{" "}
          <a href="/terms" className="underline">terms</a>{" "}
          and{" "}
          <a href="/about-data" className="underline">data disclosures</a>{" "}
          before trading.
        </div>
        <button
          onClick={dismiss}
          className="text-[#d29922] hover:opacity-70 transition-opacity flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
