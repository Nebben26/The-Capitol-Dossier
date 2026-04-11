"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Check, ExternalLink } from "lucide-react";
import { WaitlistForm } from "@/components/ui/waitlist-form";
import { getWaitlistCount } from "@/lib/api";

const RESPONDS_TO = [
  "Feature requests and product feedback (we read every email)",
  "Enterprise / Premium tier inquiries (response within 24 hours)",
  "Press and partnership requests (response within 48 hours)",
  "Bug reports (please include screenshots — we'll fix fast)",
];

export default function ContactPage() {
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  useEffect(() => { getWaitlistCount().then(setWaitlistCount); }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
        <p className="text-[#8892b0]">We&apos;re a small team. We read everything.</p>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="mailto:hello@quivermarkets.com"
          className="block group"
        >
          <Card className="bg-[#161b27] border-[#21262d] group-hover:border-[#57D7BA]/40 transition-colors h-full">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="size-10 rounded-xl bg-[#57D7BA]/10 flex items-center justify-center">
                <Mail className="size-5 text-[#57D7BA]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#e2e8f0]">Email</div>
                <div className="text-[13px] text-[#57D7BA] font-mono mt-0.5">hello@quivermarkets.com</div>
              </div>
            </CardContent>
          </Card>
        </a>

      </div>

      {/* What we respond to */}
      <Card className="bg-[#161b27] border-[#21262d]">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#e2e8f0]">What we respond to</h2>
          <ul className="space-y-2.5">
            {RESPONDS_TO.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="size-3.5 text-[#22c55e] shrink-0 mt-0.5" />
                <span className="text-[13px] text-[#8892b0] leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Waitlist */}
      <Card className="bg-[#161b27] border-[#21262d]">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#e2e8f0]">Join the founder cohort for $39/mo lifetime discount</h2>
          <p className="text-sm text-[#8892b0]">
            {waitlistCount !== null && waitlistCount >= 10
              ? `Join ${waitlistCount.toLocaleString()} others who've locked in founder pricing.`
              : "Be one of the first to lock in founder pricing."}
          </p>
          <WaitlistForm source="contact" />
        </CardContent>
      </Card>

      <p className="text-[12px] text-[#4a5168] text-center leading-relaxed">
        We are a small team. We read everything. Thank you for taking the time to write.
      </p>
    </div>
  );
}
