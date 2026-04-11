"use client";
import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  tier?: string;
}

export function WaitlistModal({ open, onClose, tier }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, tier }),
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#161b27] border border-[#21262d] rounded-2xl p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8d96a0] hover:text-[#f0f6fc] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-6">
            <div className="text-2xl font-bold text-[#f0f6fc] mb-2">You&apos;re on the list.</div>
            <div className="text-sm text-[#8d96a0]">
              We&apos;ll email you the moment {tier || "this tier"} launches.
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-[#f0f6fc] mb-1">Join the waitlist</h3>
            <p className="text-sm text-[#8d96a0] mb-5">
              {tier ? `Be first to know when ${tier} launches.` : "Get early access when we launch."}
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#21262d] rounded-lg text-sm text-[#f0f6fc] placeholder:text-[#484f58] focus:border-[#57D7BA]/50 focus:outline-none transition-colors"
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#21262d] rounded-lg text-sm text-[#f0f6fc] placeholder:text-[#484f58] focus:border-[#57D7BA]/50 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#57D7BA] text-[#0d1117] font-semibold text-sm py-2.5 rounded-lg hover:bg-[#57D7BA]/90 transition-all duration-150 active:scale-[0.97] shadow-glow-brand disabled:opacity-60"
              >
                {submitting ? "Joining..." : "Join Waitlist"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
