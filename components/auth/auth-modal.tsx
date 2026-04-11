"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Mail, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { trackEvent, identifyUser, AnalyticsEvents } from "@/lib/analytics";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful sign-in/sign-up */
  onSuccess?: () => void;
  /** Pre-fill mode: "signin" | "signup" */
  defaultMode?: "signin" | "signup";
  /** Optional headline override */
  title?: string;
  /** Optional subtext override */
  subtitle?: string;
}

export function AuthModal({
  open,
  onClose,
  onSuccess,
  defaultMode = "signin",
  title,
  subtitle,
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (signUpError) throw signUpError;
        trackEvent(AnalyticsEvents.SIGN_UP, { source: "auth_modal" });
        setSuccess(true);
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        trackEvent(AnalyticsEvents.SIGN_IN);
        if (signInData.user) {
          identifyUser(signInData.user.id, { email: signInData.user.email });
        }
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(
        err.message?.includes("Invalid login")
          ? "Incorrect email or password."
          : err.message?.includes("already registered")
          ? "An account with this email already exists. Sign in instead."
          : err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-[#161b27] border border-[#21262d] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#f0f6fc]">
              {title ?? (mode === "signin" ? "Sign in" : "Create account")}
            </h2>
            <p className="text-xs text-[#8d96a0] mt-0.5">
              {subtitle ??
                (mode === "signin"
                  ? "Welcome back to Quiver Markets"
                  : "Join thousands of prediction market traders")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-lg bg-[#21262d] flex items-center justify-center text-[#8d96a0] hover:text-[#f0f6fc] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-6">
          {success ? (
            <div className="flex flex-col items-center text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#3fb950]/10 border border-[#3fb950]/30 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#3fb950]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#f0f6fc]">Check your email</p>
                <p className="text-xs text-[#8d96a0] mt-1 leading-relaxed">
                  We sent a confirmation link to <strong className="text-[#f0f6fc]">{email}</strong>.
                  Click it to activate your account.
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-xs text-[#57D7BA] hover:underline mt-2"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-[11px] font-semibold text-[#8d96a0] uppercase tracking-wide mb-1.5 block">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#484f58]" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-10 pl-9 pr-4 rounded-lg bg-[#0d1117] border border-[#21262d] text-sm text-[#f0f6fc] placeholder:text-[#484f58] focus:outline-none focus:border-[#57D7BA]/50 focus:ring-1 focus:ring-[#57D7BA]/30 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-[11px] font-semibold text-[#8d96a0] uppercase tracking-wide mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#484f58]" />
                  <input
                    type="password"
                    required
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                    className="w-full h-10 pl-9 pr-4 rounded-lg bg-[#0d1117] border border-[#21262d] text-sm text-[#f0f6fc] placeholder:text-[#484f58] focus:outline-none focus:border-[#57D7BA]/50 focus:ring-1 focus:ring-[#57D7BA]/30 transition-all"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-[#f85149] bg-[#f85149]/10 border border-[#f85149]/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-[#57D7BA] text-[#0d1117] text-sm font-bold hover:bg-[#57D7BA]/90 transition-all active:scale-[0.97] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>

              {/* Mode switch */}
              <p className="text-xs text-center text-[#8d96a0]">
                {mode === "signin" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("signup"); setError(null); }}
                      className="text-[#57D7BA] hover:underline font-medium"
                    >
                      Sign up free
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("signin"); setError(null); }}
                      className="text-[#57D7BA] hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
