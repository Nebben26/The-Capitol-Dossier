"use client";

import { useState } from "react";
import { X, Mail, Loader2, CheckCircle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./AuthContext";

export function LoginModal() {
  const { showLogin, setShowLogin, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!showLogin) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    const { error } = await signIn(email);
    if (error) {
      setStatus("error");
      setErrorMsg(error);
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogin(false)} />
      <div className="relative w-full max-w-sm rounded-xl bg-[#222638] border border-[#2f374f] shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2f374f]">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-lg bg-[#57D7BA] flex items-center justify-center">
              <Activity className="size-3 text-[#0f1119]" />
            </div>
            <span className="text-sm font-semibold">Sign in to Quiver Markets</span>
          </div>
          <button onClick={() => setShowLogin(false)} className="text-[#8892b0] hover:text-[#e2e8f0] transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5">
          {status === "sent" ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle className="size-10 text-[#22c55e] mx-auto" />
              <h3 className="text-lg font-semibold">You&apos;re signed in!</h3>
              <p className="text-sm text-[#8892b0]">
                Your predictions and watchlist will now be saved.
              </p>
              <Button onClick={() => setShowLogin(false)} className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 w-full h-10">
                Continue
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-sm text-[#8892b0] mb-4">
                  Save your calibration data, watchlists, and preferences across devices.
                </p>
                <label className="block text-[10px] text-[#8892b0] uppercase tracking-wider mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8892b0]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#1a1e2e] border border-[#2f374f] text-sm text-[#e2e8f0] placeholder:text-[#8892b0]/50 focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 transition-all"
                    autoFocus
                  />
                </div>
              </div>
              {status === "error" && (
                <p className="text-xs text-[#ef4444]">{errorMsg}</p>
              )}
              <Button type="submit" disabled={!email || status === "loading"} className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 w-full h-10 font-semibold">
                {status === "loading" ? (
                  <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" />Signing in...</span>
                ) : "Sign In with Magic Link"}
              </Button>
              <p className="text-[10px] text-[#8892b0] text-center">
                No password needed — we&apos;ll send you a magic link.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
