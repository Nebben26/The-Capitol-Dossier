"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="flex items-center gap-1 text-[11px] text-[#8892b0] mb-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3 text-[#4a5168]" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-[#57D7BA] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#e2e8f0] truncate max-w-[200px] sm:max-w-[400px]">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
