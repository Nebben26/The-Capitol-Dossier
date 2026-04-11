"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Tier } from "@/lib/tiers";
import { identifyUser } from "@/lib/analytics";

interface UserTierState {
  tier: Tier;
  loading: boolean;
  userId: string | null;
}

/**
 * Reads the current user's tier from the `user_tiers` Supabase table.
 * Falls back to "free" if the user is not logged in or has no row.
 * Re-fetches whenever the Supabase auth session changes.
 */
export function useUserTier(): UserTierState {
  const [state, setState] = useState<UserTierState>({
    tier: "free",
    loading: true,
    userId: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchTier(userId: string | null) {
      if (!userId) {
        if (!cancelled) setState({ tier: "free", loading: false, userId: null });
        return;
      }

      try {
        const { data } = await supabase
          .from("user_tiers")
          .select("tier, expires_at")
          .eq("user_id", userId)
          .maybeSingle();

        if (cancelled) return;

        let tier: Tier = "free";
        if (data?.tier) {
          // Respect expiry: if expired, treat as free
          if (data.expires_at && new Date(data.expires_at) < new Date()) {
            tier = "free";
          } else {
            tier = data.tier as Tier;
          }
        }

        setState({ tier, loading: false, userId });
        // Identify user in analytics with their tier
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !cancelled) {
          identifyUser(user.id, { email: user.email, tier });
        }
      } catch {
        if (!cancelled) setState({ tier: "free", loading: false, userId });
      }
    }

    // Initial load
    supabase.auth.getUser().then(({ data }) => {
      fetchTier(data.user?.id ?? null);
    });

    // Re-fetch on auth state change (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      fetchTier(session?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
