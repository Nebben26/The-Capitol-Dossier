"use client";
import { useEffect, useState, useRef } from "react";

export function CountUp({ end, duration = 1200, className }: { end: number; duration?: number; className?: string }) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (end === 0) return;
    let frame: number;
    const animate = (now: number) => {
      if (startTime.current === null) startTime.current = now;
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(end * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [end, duration]);

  return <span className={className}>{value.toLocaleString()}</span>;
}
