"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";
import { marketById } from "@/lib/mockData";

function SparklineEmbed() {
  const params = useSearchParams();
  const id = params.get("id") || "recession-2026";
  const m = marketById[id];
  if (!m) return <div className="p-4 text-xs text-[#8892b0]">Market not found</div>;
  const positive = m.change >= 0;
  const color = positive ? "#22c55e" : "#ef4444";

  return (
    <div className="bg-[#0d1117] text-[#e2e8f0] p-3 rounded-xl border border-[#21262d] font-sans" style={{ fontFamily: "Inter, system-ui, sans-serif", width: 280, height: 120 }}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <div className="size-3 rounded bg-[#57D7BA] flex items-center justify-center"><Activity className="size-2 text-[#0f1119]" /></div>
          <span className="text-[7px] text-[#8892b0]">Quiver</span>
        </div>
        <span className="font-mono text-xs font-bold tabular-nums">{m.price}¢ <span className={`text-[10px] ${positive ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{positive ? "+" : ""}{m.change}pt</span></span>
      </div>
      <p className="text-[9px] text-[#8892b0] truncate mb-1">{m.question}</p>
      <div className="h-14 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <AreaChart data={m.spark}>
            <defs>
              <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill="url(#eg)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="p-3 text-xs text-[#8892b0]">Loading...</div>}><SparklineEmbed /></Suspense>;
}
