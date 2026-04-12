"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Users,
  Trophy,
  Bell,
  Home,
  Target,
  X,
  GitCompareArrows,
  GitMerge,
  ArrowLeftRight,
  Crosshair,
  Star,
  Newspaper,
  DollarSign,
  Copy,
  Code,
  CreditCard,
  Server,
  FileText,
  BookOpen,
  Sparkles,
  CalendarDays,
  Zap,
  Mail,
  Info,
  Settings,
  CheckCircle,
  Wallet,
  Calculator,
  TrendingUp,
  BarChart3,
  FlaskConical,
} from "lucide-react";
import { SidebarUpgradeCard } from "@/components/ui/pro-gate";

const navGroups = [
  {
    label: "Discover",
    items: [
      { label: "Home", icon: Home, href: "/" },
      { label: "Screener", icon: Target, href: "/screener" },
      { label: "Resolved", icon: CheckCircle, href: "/resolved" },
      { label: "Calendar", icon: CalendarDays, href: "/calendar" },
      { label: "Compare", icon: ArrowLeftRight, href: "/compare" },
      { label: "Insights", icon: Newspaper, href: "/insights" },
      { label: "Stories", icon: Sparkles, href: "/stories" },
      { label: "Morning Brief", icon: Mail, href: "/morning-brief" },
    ],
  },
  {
    label: "Arbitrage",
    items: [
      { label: "Disagrees", icon: GitCompareArrows, href: "/disagrees" },
      { label: "Simulator", icon: Calculator, href: "/simulate" },
      { label: "Backtester", icon: TrendingUp, href: "/backtest" },
      { label: "Flow", icon: DollarSign, href: "/flow" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Indices", icon: BarChart3, href: "/indices", badge: "NEW" },
      { label: "Correlations", icon: GitMerge, href: "/correlations" },
      { label: "Accuracy", icon: FlaskConical, href: "/accuracy" },
    ],
  },
  {
    label: "Whales",
    items: [
      { label: "Whales", icon: Users, href: "/whales" },
      { label: "Smart Money", icon: Copy, href: "/copy" },
      { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
    ],
  },
  {
    label: "My Account",
    items: [
      { label: "My Quiver", icon: Wallet, href: "/my", badge: "NEW" },
      { label: "My Profile", icon: Target, href: "/profile/claim" },
      { label: "Watchlist", icon: Star, href: "/watchlist" },
      { label: "Calibration", icon: Crosshair, href: "/calibration" },
      { label: "Alerts", icon: Bell, href: "/alerts" },
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
  {
    label: "Developer",
    items: [
      { label: "API Docs", icon: Code, href: "/api" },
      { label: "API Keys", icon: Zap, href: "/settings/api-keys" },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Pricing", icon: CreditCard, href: "/pricing" },
      { label: "Status", icon: Server, href: "/status" },
      { label: "Changelog", icon: FileText, href: "/changelog" },
      { label: "Blog", icon: BookOpen, href: "/blog" },
      { label: "Methodology", icon: BookOpen, href: "/methodology" },
      { label: "About", icon: Info, href: "/about" },
    ],
  },
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
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-[#0d1117] border-r border-[#21262d] flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[#21262d]">
          <Link href="/" className="flex items-center gap-2.5 flex-1 min-w-0">
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

        {/* Nav groups */}
        <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin">
          {navGroups.map((group, gi) => (
            <div key={group.label}>
              <div className={`px-3 mb-1 ${gi === 0 ? "mt-2" : "mt-5"}`}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
                  {group.label}
                </span>
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-2.5 py-2 text-sm font-medium transition-all duration-150 ${
                        active
                          ? "bg-gradient-to-r from-[#57D7BA]/15 to-transparent border-l-2 border-[#57D7BA] text-[#57D7BA] font-semibold rounded-r-lg pl-[10px] pr-3"
                          : "text-[#8d96a0] hover:bg-[#1c2333] hover:text-[#f0f6fc] rounded-lg mx-1 px-3"
                      }`}
                    >
                      <item.icon className="size-4 shrink-0" />
                      {item.label}
                      {"badge" in item && item.badge && (
                        <span className="ml-auto text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[#57D7BA]/15 text-[#57D7BA] border border-[#57D7BA]/20">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Upgrade card */}
        <div className="px-3 pb-4">
          <SidebarUpgradeCard />
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
