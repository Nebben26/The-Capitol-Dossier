"use client";

import Link from "next/link";
import { Newspaper, BarChart3, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InsightsPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5">
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md space-y-5">
          <div className="size-16 rounded-2xl bg-[#6366f1]/10 flex items-center justify-center mx-auto">
            <Newspaper className="size-8 text-[#6366f1]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">News & Catalysts</h1>
          <p className="text-sm text-[#8892b0] leading-relaxed">
            We&apos;re building a pipeline to tag financial news to specific prediction markets. Coming soon.
          </p>
          <p className="text-xs text-[#8892b0]/60">
            In the meantime, browse live markets or check out cross-platform arbitrage disagreements.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/markets">
              <Button className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 gap-1.5">
                <BarChart3 className="size-4" />
                Browse Markets
              </Button>
            </Link>
            <Link href="/disagrees">
              <Button variant="outline" className="border-[#2f374f] text-[#8892b0] hover:text-[#f59e0b] hover:border-[#f59e0b]/30 gap-1.5">
                <GitCompareArrows className="size-4" />
                View Disagreements
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-between py-4 border-t border-[#2f374f] text-[10px] text-[#8892b0]">
        <span>© 2026 Quiver Markets. Not financial advice. Data from Polymarket &amp; Kalshi.</span>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}
