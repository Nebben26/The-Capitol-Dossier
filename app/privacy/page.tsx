import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#8892b0] hover:text-[#57D7BA] transition-colors">
        <ArrowLeft className="size-4" /> Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <div className="space-y-4 text-sm text-[#8892b0] leading-relaxed">
        <p>Last updated: April 2026</p>
        <p>Your privacy matters. Quiver Markets collects minimal data necessary to provide our analytics platform.</p>
        <h2 className="text-lg font-semibold text-[#e2e8f0] pt-4">What We Collect</h2>
        <p>Account information (email, name) for registered users. Usage analytics (pages viewed, features used) to improve the platform. We do not sell your personal data to third parties.</p>
        <h2 className="text-lg font-semibold text-[#e2e8f0] pt-4">Cookies</h2>
        <p>We use essential cookies for authentication and preferences. Optional analytics cookies help us understand usage patterns. You can disable non-essential cookies in your browser settings.</p>
        <h2 className="text-lg font-semibold text-[#e2e8f0] pt-4">Data Retention</h2>
        <p>Account data is retained while your account is active. You may request deletion of your data at any time by contacting support.</p>
        <h2 className="text-lg font-semibold text-[#e2e8f0] pt-4">Contact</h2>
        <p>For privacy inquiries, contact privacy@quivermarkets.com.</p>
      </div>
    </div>
  );
}
