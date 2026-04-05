import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#8892b0] hover:text-[#57D7BA] transition-colors">
        <ArrowLeft className="size-4" /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <div className="space-y-4 text-sm text-[#8892b0] leading-relaxed">
        <p>Last updated: April 2026</p>
        <p>Quiver Markets provides prediction market analytics and intelligence tools for informational purposes only. By using this platform, you agree to the following terms.</p>
        <h2 className="text-lg font-semibold text-[#e2e8f0] pt-4">1. Not Financial Advice</h2>
        <p>All data, analytics, signals, and content on Quiver Markets are for informational and educational purposes only. Nothing on this platform constitutes financial, investment, or trading advice. Always do your own research.</p>
        <h2 className="text-lg font-semibold text-[#e2e8f0] pt-4">2. Data Accuracy</h2>
        <p>We aggregate data from multiple prediction market platforms. While we strive for accuracy, we make no guarantees about the completeness, reliability, or timeliness of any data displayed.</p>
        <h2 className="text-lg font-semibold text-[#e2e8f0] pt-4">3. Account & Subscription</h2>
        <p>Pro subscriptions are billed monthly or annually. You may cancel at any time. Refunds are handled on a case-by-case basis within 14 days of purchase.</p>
        <h2 className="text-lg font-semibold text-[#e2e8f0] pt-4">4. Acceptable Use</h2>
        <p>You agree not to scrape, redistribute, or commercially exploit data from Quiver Markets without a valid API license. Automated access requires a Pro subscription with API access enabled.</p>
      </div>
    </div>
  );
}
