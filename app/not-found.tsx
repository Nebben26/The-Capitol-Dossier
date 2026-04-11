import Link from "next/link";
import { Home, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-20">
      <div className="text-center max-w-md space-y-6">
        <div className="text-8xl font-bold font-mono text-[#21262d]">404</div>
        <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="text-sm text-[#8892b0] leading-relaxed">
          This market or page may have been removed, or never existed.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/">
            <Button className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 gap-1.5">
              <Home className="size-4" />
              Homepage
            </Button>
          </Link>
          <Link href="/markets">
            <Button variant="outline" className="border-[#21262d] text-[#8892b0] hover:text-[#57D7BA] hover:border-[#57D7BA]/30 gap-1.5">
              <BarChart3 className="size-4" />
              Browse Markets
            </Button>
          </Link>
          <Link href="/whales">
            <Button variant="outline" className="border-[#21262d] text-[#8892b0] hover:text-[#57D7BA] hover:border-[#57D7BA]/30 gap-1.5">
              <Users className="size-4" />
              Browse Whales
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
