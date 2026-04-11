import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#21262d] bg-[#0d1117] mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#484f58] mb-3">Product</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">Home</Link></li>
              <li><Link href="/disagrees" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">Arbitrage</Link></li>
              <li><Link href="/whales" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">Whale Tracker</Link></li>
              <li><Link href="/screener" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">Market Screener</Link></li>
              <li><Link href="/morning-brief" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">Morning Brief</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#484f58] mb-3">Company</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/about" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">About</Link></li>
              <li><Link href="/pricing" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">Pricing</Link></li>
              <li><Link href="/methodology" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">Methodology</Link></li>
              <li><Link href="/about-data" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">About Our Data</Link></li>
              <li><Link href="/blog" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">Blog</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#484f58] mb-3">Legal</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/terms" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refunds" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">Refund Policy</Link></li>
              <li><Link href="/cookies" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">Cookie Notice</Link></li>
              <li><Link href="/dmca" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">DMCA</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#484f58] mb-3">Contact</div>
            <ul className="space-y-2 text-xs">
              <li><a href="mailto:hello@quivermarkets.com" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">hello@quivermarkets.com</a></li>
              <li><a href="mailto:support@quivermarkets.com" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">support@quivermarkets.com</a></li>
              <li><a href="mailto:dmca@quivermarkets.com" className="text-[#8d96a0] hover:text-[#57D7BA] transition-colors">dmca@quivermarkets.com</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[#21262d] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] text-[#484f58]">
            © 2026 Quiver Markets. All rights reserved. Not financial advice.
          </div>
          <div className="text-[10px] text-[#484f58]">
            Quiver Markets is not affiliated with Polymarket or Kalshi.
          </div>
        </div>
      </div>
    </footer>
  );
}
