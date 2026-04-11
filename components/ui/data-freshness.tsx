"use client";
import { useEffect, useState } from "react";

interface Props {
  timestamp: string | Date | null;
  label?: string;
}

export function DataFreshness({ timestamp, label = "Updated" }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  if (!timestamp) return null;

  const ts = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const ageMs = Date.now() - ts.getTime();
  const ageMin = Math.floor(ageMs / 60000);

  let colorClass = "text-[#484f58]";
  if (ageMin >= 40) colorClass = "text-[#f85149]";
  else if (ageMin >= 25) colorClass = "text-[#d29922]";

  const ageText =
    ageMin < 1 ? "just now" :
    ageMin === 1 ? "1m ago" :
    ageMin < 60 ? `${ageMin}m ago` :
    `${Math.floor(ageMin / 60)}h ago`;

  return (
    <div className={`inline-flex items-center gap-1.5 text-[11px] font-medium tabular-nums ${colorClass}`}>
      <span className="w-1 h-1 rounded-full bg-current" />
      {label} {ageText}
    </div>
  );
}
