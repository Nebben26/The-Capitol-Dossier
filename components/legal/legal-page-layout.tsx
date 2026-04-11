import { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPageLayout({ title, subtitle, lastUpdated, children }: Props) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-[#8d96a0] hover:text-[#57D7BA] transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to home
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-[#f0f6fc] tracking-tight">{title}</h1>
        {subtitle && <p className="text-base text-[#8d96a0] mt-2">{subtitle}</p>}
        <p className="text-xs text-[#484f58] mt-4 font-mono">Last updated: {lastUpdated}</p>
      </div>

      <div className="legal-content space-y-6 text-[15px] text-[#8d96a0] leading-relaxed">
        {children}
      </div>
    </div>
  );
}
