import Link from "next/link";
import { Search, Home, ArrowRight } from "lucide-react";

const QUICK_LINKS = [
  { label: "Disagrees", href: "/disagrees", desc: "Cross-platform arbitrage" },
  { label: "Whales", href: "/whales", desc: "Top trader profiles" },
  { label: "Screener", href: "/screener", desc: "Filter all markets" },
  { label: "Leaderboard", href: "/leaderboard", desc: "Rankings & performance" },
];

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        {/* 404 number */}
        <div className="text-[80px] sm:text-[120px] font-black leading-none tabular-nums font-mono bg-gradient-to-b from-[#57D7BA]/30 to-[#57D7BA]/5 bg-clip-text text-transparent select-none mb-4">
          404
        </div>

        <h1 className="text-2xl font-bold text-[#f0f6fc] mb-2">Page not found</h1>
        <p className="text-sm text-[#8d96a0] mb-8 leading-relaxed">
          That market, whale, or page doesn&apos;t exist — or it may have resolved and been removed.
        </p>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2 mb-8">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 p-3 rounded-xl bg-[#161b27] border border-[#21262d] hover:border-[#57D7BA]/30 hover:bg-[#57D7BA]/5 transition-all text-left group"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#e2e8f0] group-hover:text-[#57D7BA] transition-colors">
                  {link.label}
                </div>
                <div className="text-[10px] text-[#8d96a0]">{link.desc}</div>
              </div>
              <ArrowRight className="size-3.5 text-[#484f58] group-hover:text-[#57D7BA] transition-colors shrink-0" />
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#57D7BA] text-[#0d1117] font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#57D7BA]/90 transition-all active:scale-[0.97]"
          >
            <Home className="size-4" />
            Back to home
          </Link>
          <Link
            href="/screener"
            className="inline-flex items-center gap-2 bg-[#161b27] text-[#f0f6fc] font-semibold text-sm px-5 py-2.5 rounded-lg border border-[#21262d] hover:border-[#57D7BA]/40 transition-all active:scale-[0.97]"
          >
            <Search className="size-4" />
            Browse markets
          </Link>
        </div>
      </div>
    </div>
  );
}
