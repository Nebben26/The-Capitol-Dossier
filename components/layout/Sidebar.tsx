"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Users, BarChart3, GitMerge, X, ExternalLink, LogIn } from "lucide-react";
import { useAuth } from "@/components/layout/AuthContext";

const NAV = [
  { label: "Disagrees", icon: GitMerge, href: "/disagrees" },
  { label: "Whales", icon: Users, href: "/whales" },
  { label: "Indices", icon: BarChart3, href: "/indices" },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, setShowLogin } = useAuth();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-[#0d1117] border-r border-[#21262d] flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[#21262d]">
          <Link href="/" className="flex items-center gap-2.5 flex-1 min-w-0" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-[#57D7BA] flex items-center justify-center shrink-0 shadow-glow-brand">
              <Activity className="size-4 text-[#0d1117]" />
            </div>
            <span className="text-base font-bold tracking-tight text-[#f0f6fc] truncate">
              Quiver Markets
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="ml-auto lg:hidden text-[#8d96a0] hover:text-[#f0f6fc] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-2.5 py-2 text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-gradient-to-r from-[#57D7BA]/15 to-transparent border-l-2 border-[#57D7BA] text-[#57D7BA] font-semibold rounded-r-lg pl-[10px] pr-3"
                    : "text-[#8d96a0] hover:bg-[#1c2333] hover:text-[#f0f6fc] rounded-lg px-3"
                }`}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer section */}
        <div className="px-3 pb-5 space-y-1">
          <div className="border-t border-[#21262d] mb-3" />

          <a
            href="https://thecapitoldossier.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#8d96a0] hover:text-[#f0f6fc] transition-colors"
          >
            <ExternalLink className="size-3.5 shrink-0" />
            <span className="text-xs">The Capitol Dossier</span>
          </a>

          {user ? (
            <Link
              href="/settings"
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#8d96a0] hover:text-[#f0f6fc] transition-colors"
            >
              <LogIn className="size-3.5 shrink-0" />
              <span className="text-xs">Account</span>
            </Link>
          ) : (
            <button
              onClick={() => { setShowLogin(true); onClose(); }}
              className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-[#8d96a0] hover:text-[#f0f6fc] transition-colors"
            >
              <LogIn className="size-3.5 shrink-0" />
              <span className="text-xs">Sign in</span>
            </button>
          )}
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}
    </>
  );
}
