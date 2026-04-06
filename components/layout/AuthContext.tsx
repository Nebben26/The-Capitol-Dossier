"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
  isPro: boolean;
  trialDaysLeft: number | null;
  signIn: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  startTrial: () => void;
  showLogin: boolean;
  setShowLogin: (v: boolean) => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  isPro: false,
  trialDaysLeft: null,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  startTrial: () => {},
  showLogin: false,
  setShowLogin: () => {},
});

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setShowLogin(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check Pro status from localStorage
  useEffect(() => {
    const trialStart = getLocal<string | null>("quiver_trial_start", null);
    if (trialStart) {
      const start = new Date(trialStart).getTime();
      const daysElapsed = Math.floor((Date.now() - start) / 86400000);
      const remaining = Math.max(0, 14 - daysElapsed);
      setTrialDaysLeft(remaining);
      setIsPro(remaining > 0);
    } else {
      const proStatus = getLocal<boolean>("quiver_is_pro", false);
      setIsPro(proStatus);
    }
  }, []);

  const startTrial = useCallback(() => {
    if (!user) { setShowLogin(true); return; }
    localStorage.setItem("quiver_trial_start", new Date().toISOString());
    setTrialDaysLeft(14);
    setIsPro(true);
  }, [user]);

  const signIn = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
    if (error) {
      if (error.message.includes("fetch") || error.message.includes("Invalid") || error.message.includes("your-project")) {
        const mockUser = {
          id: `local-${Date.now()}`, email,
          user_metadata: { email, name: email.split("@")[0] },
          app_metadata: {}, aud: "authenticated",
          created_at: new Date().toISOString(),
        } as unknown as User;
        setUser(mockUser);
        setShowLogin(false);
        return { error: null };
      }
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isPro, trialDaysLeft, signIn, signOut, startTrial, showLogin, setShowLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
