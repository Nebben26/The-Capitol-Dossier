"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading") return;
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: email, email, source: "newsletter" }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm text-[#57D7BA] font-medium">
        You&apos;re in — check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] placeholder-[#484f58] focus:outline-none focus:border-[#57D7BA]/50 transition-colors"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex items-center gap-1.5 bg-[#57D7BA] hover:bg-[#57D7BA]/90 text-[#0d1117] font-semibold text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
      >
        <Send className="size-3.5" />
        {status === "loading" ? "…" : "Subscribe"}
      </button>
      {status === "error" && (
        <p className="absolute mt-10 text-xs text-[#f85149]">Something went wrong. Try again.</p>
      )}
    </form>
  );
}
