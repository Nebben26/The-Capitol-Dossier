"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function WaitlistForm({ compact = false, source }: { compact?: boolean; source?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ageChecked, setAgeChecked] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          source: source || "homepage",
          // honeypot field — bots fill this, humans don't
          website: formData.get("website") || "",
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        console.error("[WaitlistForm] submit failed:", data.error);
      }
    } catch (err) {
      console.error("[WaitlistForm] submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/30">
        <CheckCircle2 className="size-4 text-[#22c55e] shrink-0" />
        <span className="text-sm text-[#22c55e]">
          You&apos;re on the list. We&apos;ll email you when Pro launches.
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? "flex flex-col gap-2 max-w-md" : "space-y-3 max-w-md"}
    >
      {!compact && (
        <h3 className="text-base font-bold text-[#e2e8f0]">
          Join the founder cohort — lock in $39/mo before Pro launches at $60/mo
        </h3>
      )}
      <input
        type="text"
        name="name"
        placeholder="Your name"
        required
        className="w-full px-3 py-2 bg-[#1a1e2e] border border-[#2f374f] rounded-lg text-sm text-[#e2e8f0] placeholder-[#4a5168] focus:border-[#57D7BA] outline-none transition-colors"
      />
      <input
        type="email"
        name="email"
        placeholder="you@email.com"
        required
        className="w-full px-3 py-2 bg-[#1a1e2e] border border-[#2f374f] rounded-lg text-sm text-[#e2e8f0] placeholder-[#4a5168] focus:border-[#57D7BA] outline-none transition-colors"
      />
      {/* Honeypot — hidden from real users, filled by bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
        aria-hidden="true"
      />
      {/* 18+ consent */}
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          required
          checked={ageChecked}
          onChange={(e) => setAgeChecked(e.target.checked)}
          className="mt-0.5 accent-[#57D7BA] shrink-0"
        />
        <span className="text-[11px] text-[#8892b0] leading-relaxed">
          I am 18+ and consent to receive launch updates from Quiver Markets.
        </span>
      </label>
      <button
        type="submit"
        disabled={submitting || !ageChecked}
        className="w-full py-2 bg-[#57D7BA] text-[#0f1119] font-bold rounded-lg hover:bg-[#57D7BA]/90 disabled:opacity-50 text-sm transition-colors"
      >
        {submitting ? "Joining..." : "Join the waitlist"}
      </button>
    </form>
  );
}
