"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TradeButton({
  side,
  price,
}: {
  side: "YES" | "NO";
  price: number;
}) {
  const [state, setState] = useState<"idle" | "filling" | "filled">("idle");
  const [showToast, setShowToast] = useState(false);

  const amount = (1800 + Math.random() * 2000).toFixed(0);
  const isYes = side === "YES";
  const bg = isYes ? "bg-[#22c55e]" : "bg-[#ef4444]";
  const bgHover = isYes ? "hover:bg-[#22c55e]/80" : "hover:bg-[#ef4444]/80";

  const handleClick = () => {
    if (state !== "idle") return;
    setState("filling");
    setTimeout(() => {
      setState("filled");
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setTimeout(() => setState("idle"), 300);
      }, 3000);
    }, 600);
  };

  return (
    <div className="relative flex-1">
      <Button
        onClick={handleClick}
        disabled={state === "filling"}
        className={`w-full h-9 text-white font-semibold text-sm transition-all ${
          state === "filled"
            ? "bg-[#57D7BA] hover:bg-[#57D7BA]/80"
            : `${bg} ${bgHover}`
        } ${state === "filling" ? "opacity-70" : ""}`}
      >
        {state === "filling" ? (
          <span className="flex items-center gap-1.5">
            <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Filling...
          </span>
        ) : state === "filled" ? (
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5" />
            Filled
          </span>
        ) : (
          `Buy ${side}`
        )}
      </Button>
      {showToast && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-2 rounded-lg bg-[#222638] border border-[#2f374f] shadow-xl z-50 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-[#f59e0b]" />
            <span className="text-xs text-[#e2e8f0] font-medium">
              Order placed — ${amount} {side} @ {price}¢
            </span>
          </div>
          <div className="flex justify-center mt-1">
            {Array.from({ length: 8 }, (_, i) => (
              <span
                key={i}
                className="inline-block text-[10px] animate-bounce"
                style={{
                  animationDelay: `${i * 60}ms`,
                  animationDuration: "0.8s",
                  color: ["#f59e0b", "#57D7BA", "#ec4899", "#6366f1", "#22c55e", "#ef4444", "#8b5cf6", "#f59e0b"][i],
                }}
              >
                {["🎉", "✨", "🚀", "💰", "🎊", "⚡", "🔥", "💎"][i]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
