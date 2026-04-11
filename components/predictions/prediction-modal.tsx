"use client";

import { useState, useEffect } from "react";
import { X, Target, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Props {
  marketId: string;
  marketQuestion: string;
  currentPrice: number; // 0-100
  onClose: () => void;
  onSuccess?: () => void;
}

const CONVICTION_OPTS = [
  { value: "low", label: "Low — exploratory", color: "#8d96a0" },
  { value: "medium", label: "Medium — reasonably confident", color: "#f59e0b" },
  { value: "high", label: "High — strong edge", color: "#57D7BA" },
];

export function PredictionModal({ marketId, marketQuestion, currentPrice, onClose, onSuccess }: Props) {
  const [user, setUser] = useState<any>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [outcome, setOutcome] = useState<"YES" | "NO">("YES");
  const [prob, setProb] = useState(Math.round(currentPrice));
  const [conviction, setConviction] = useState<"low" | "medium" | "high">("medium");
  const [reasoning, setReasoning] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      if (data.user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();
        setHasProfile(!!profile);
      } else {
        setHasProfile(false);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Not signed in."); setSubmitting(false); return; }

    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        market_id: marketId,
        market_question: marketQuestion,
        outcome,
        predicted_prob: prob,
        conviction,
        reasoning: reasoning.trim() || null,
      }),
    });

    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Failed to submit."); setSubmitting(false); return; }
    setSuccess(true);
    setTimeout(() => { onSuccess?.(); onClose(); }, 1500);
  };

  // Backdrop + modal
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-[#161b27] border border-[#21262d] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#21262d]">
          <div className="w-7 h-7 rounded-lg bg-[#57D7BA]/10 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 text-[#57D7BA]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-[#f0f6fc]">Log a Prediction</h2>
            <p className="text-[10px] text-[#484f58] truncate">{marketQuestion}</p>
          </div>
          <button onClick={onClose} className="text-[#484f58] hover:text-[#f0f6fc] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Not signed in */}
          {!user && hasProfile === false && (
            <div className="text-center space-y-3 py-4">
              <Target className="w-8 h-8 text-[#484f58] mx-auto" />
              <p className="text-sm text-[#8d96a0]">Sign in to log predictions.</p>
              <a
                href="/pricing"
                className="inline-flex items-center gap-1.5 bg-[#57D7BA] text-[#0d1117] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#57D7BA]/90 transition-all"
              >
                Sign in / Sign up — free
              </a>
            </div>
          )}

          {/* Signed in, no profile */}
          {user && hasProfile === false && (
            <div className="text-center space-y-3 py-4">
              <Target className="w-8 h-8 text-[#484f58] mx-auto" />
              <p className="text-sm text-[#8d96a0]">You need a public profile to log predictions.</p>
              <a
                href="/profile/claim"
                className="inline-flex items-center gap-1.5 bg-[#57D7BA] text-[#0d1117] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#57D7BA]/90 transition-all"
              >
                Create profile — free
              </a>
            </div>
          )}

          {/* Loading profile check */}
          {hasProfile === null && (
            <div className="py-8 text-center text-xs text-[#484f58]">Checking your profile…</div>
          )}

          {/* Success */}
          {success && (
            <div className="py-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#3fb950]/15 flex items-center justify-center mx-auto">
                <Target className="w-5 h-5 text-[#3fb950]" />
              </div>
              <p className="text-sm font-semibold text-[#f0f6fc]">Prediction logged!</p>
            </div>
          )}

          {/* Form */}
          {user && hasProfile === true && !success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Outcome */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
                  My prediction
                </label>
                <div className="flex gap-2">
                  {(["YES", "NO"] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOutcome(o)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border ${
                        outcome === o
                          ? o === "YES"
                            ? "bg-[#3fb950]/15 border-[#3fb950]/40 text-[#3fb950]"
                            : "bg-[#f85149]/15 border-[#f85149]/40 text-[#f85149]"
                          : "bg-[#0d1117] border-[#21262d] text-[#484f58] hover:border-[#484f58]"
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              {/* Probability slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
                    My probability
                  </label>
                  <span className="text-sm font-bold font-mono text-[#57D7BA]">{prob}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={99}
                  value={prob}
                  onChange={(e) => setProb(Number(e.target.value))}
                  className="w-full accent-[#57D7BA] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#484f58]">
                  <span>1% (very unlikely)</span>
                  <span>99% (near-certain)</span>
                </div>
              </div>

              {/* Conviction */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
                  Conviction
                </label>
                <div className="space-y-1">
                  {CONVICTION_OPTS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setConviction(opt.value as typeof conviction)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all border ${
                        conviction === opt.value
                          ? "border-opacity-40 bg-opacity-10"
                          : "border-[#21262d] bg-[#0d1117] text-[#484f58] hover:border-[#484f58]"
                      }`}
                      style={
                        conviction === opt.value
                          ? {
                              borderColor: `${opt.color}40`,
                              backgroundColor: `${opt.color}10`,
                              color: opt.color,
                            }
                          : {}
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reasoning */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
                  Reasoning <span className="text-[#484f58] font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder="What's your thesis? What data or logic drives this call?"
                  rows={3}
                  maxLength={1000}
                  className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2.5 text-xs text-[#f0f6fc] placeholder:text-[#484f58] focus:outline-none focus:border-[#57D7BA]/50 transition-colors resize-none"
                />
                <p className="text-[10px] text-[#484f58] text-right">{reasoning.length}/1000</p>
              </div>

              {error && (
                <p className="text-xs text-[#f85149] bg-[#f85149]/10 border border-[#f85149]/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#57D7BA] text-[#0d1117] text-sm font-bold py-2.5 rounded-lg hover:bg-[#57D7BA]/90 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {submitting ? "Logging…" : "Log prediction"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
