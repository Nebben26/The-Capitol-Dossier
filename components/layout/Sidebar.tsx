"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Users,
  Trophy,
  Zap,
  Bell,
  Home,
  Target,
  Shield,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Markets", icon: Target, href: "/markets" },
  { label: "Whales", icon: Users, href: "/whales" },
  { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  { label: "Strategies", icon: Zap, href: "/strategies" },
  { label: "Alerts", icon: Bell, href: "/alerts" },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-[#171b28] border-r border-[#2a2f45] flex flex-col transition-transform duration-200 lg:relative lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-[#2a2f45]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-[#57D7BA] flex items-center justify-center">
              <Activity className="size-4 text-[#0f1119]" />
            </div>
            <span className="font-semibold text-sm tracking-tight">
              Quiver Markets
            </span>
          </Link>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden text-[#8892b0] hover:text-[#e2e8f0]"
          >
            <X className="size-4" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-[#57D7BA]/10 text-[#57D7BA] font-medium"
                    : "text-[#8892b0] hover:text-[#e2e8f0] hover:bg-[#222638]"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-4">
          <Card className="bg-[#222638] border-[#2a2f45]">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="size-3.5 text-[#57D7BA]" />
                <span className="text-xs font-medium">Pro Access</span>
              </div>
              <p className="text-[10px] text-[#8892b0] leading-relaxed">
                Unlock real-time whale alerts, advanced analytics & API access.
              </p>
              <Link href="/pricing">
                <Button className="w-full mt-2 h-7 text-xs bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80">
                  Upgrade
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}
