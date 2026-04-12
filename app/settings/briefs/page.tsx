"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useUserTier } from "@/hooks/useUserTier";
import { canAccess } from "@/lib/tiers";
import Link from "next/link";
import { Globe, Rss, Save, Check, Lock } from "lucide-react";

const CATEGORIES = ["Elections", "Crypto", "Economics", "Geopolitics", "Sports"] as const;
type Category = (typeof CATEGORIES)[number];

interface Subscription {
  id?: number;
  category: Category;
  delivery_method: string;
  custom_branding: string;
  active: boolean;
}

export default function BriefSettingsPage() {
  const { tier, loading: tierLoading } = useUserTier();
  const [user, setUser] = useState<any>(null);
  const [subs, setSubs] = useState<Record<Category, Subscription>>(() =>
    Object.fromEntries(
      CATEGORIES.map((cat) => [
        cat,
        { category: cat, delivery_method: "rss", custom_branding: "", active: false },
      ])
    ) as Record<Category, Subscription>
  );
  const [saving, setSaving] = useState<Category | null>(null);
  const [saved, setSaved] = useState<Category | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("brief_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!data) return;
        const map = { ...subs };
        for (const row of data) {
          if (CATEGORIES.includes(row.category as Category)) {
            map[row.category as Category] = {
              id: row.id,
              category: row.category,
              delivery_method: row.delivery_method,
              custom_branding: row.custom_branding ?? "",
              active: row.active,
            };
          }
        }
        setSubs(map);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSave = async (category: Category) => {
    if (!user || tier === "free") return;
    setSaving(category);
    const sub = subs[category];
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) { setSaving(null); return; }

    const payload = {
      user_id: user.id,
      category,
      delivery_method: sub.delivery_method,
      custom_branding: sub.custom_branding.trim() || null,
      active: sub.active,
    };

    const res = await fetch("/api/settings/briefs", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    setSaving(null);
    if (res.ok) {
      setSaved(category);
      setTimeout(() => setSaved(null), 2000);
    }
  };

  const update = (cat: Category, field: keyof Subscription, value: string | boolean) => {
    setSubs((prev) => ({ ...prev, [cat]: { ...prev[cat], [field]: value } }));
  };

  if (authLoading || tierLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-[#161b27] border border-[#21262d] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
        <h1 className="text-2xl font-bold text-[#f0f6fc]">Brief Settings</h1>
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-6 text-center space-y-3">
          <Lock className="size-8 text-[#484f58] mx-auto" />
          <p className="text-sm text-[#8d96a0]">Sign in to manage your brief subscriptions.</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-[#57D7BA] text-[#0d1117] text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#57D7BA]/90 transition-all"
          >
            Sign in / Sign up
          </Link>
        </div>
      </div>
    );
  }

  const isPro = canAccess(tier, "pro");

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#57D7BA]/10 flex items-center justify-center">
          <Globe className="w-5 h-5 text-[#57D7BA]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">Market Briefs</h1>
          <p className="text-xs text-[#8d96a0]">Configure custom branding for your white-label brief feed.</p>
        </div>
      </div>

      {!isPro && (
        <div className="rounded-xl bg-[#57D7BA]/5 border border-[#57D7BA]/20 p-5 flex items-start gap-4">
          <Lock className="size-4 text-[#57D7BA] shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#f0f6fc]">Custom branding requires Pro</p>
            <p className="text-xs text-[#8d96a0] leading-relaxed">
              Add your newsletter or podcast name to every brief. Briefs are always freely readable at{" "}
              <Link href="/briefs" className="text-[#57D7BA] hover:underline">/briefs</Link> — custom branding
              is a Pro+ white-label feature.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-[#57D7BA] text-[#0d1117] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#57D7BA]/90 transition-all"
            >
              Upgrade to Pro →
            </Link>
          </div>
        </div>
      )}

      {/* Category subscriptions */}
      {CATEGORIES.map((cat) => {
        const sub = subs[cat];
        const rssUrl = `https://quivermarkets.com/api/briefs/${cat.toLowerCase()}/rss`;

        return (
          <div key={cat} className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#f0f6fc]">{cat}</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => isPro && update(cat, "active", !sub.active)}
                  className={`w-9 h-5 rounded-full transition-all relative ${
                    sub.active ? "bg-[#57D7BA]" : "bg-[#21262d]"
                  } ${!isPro ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                    sub.active ? "left-[18px]" : "left-0.5"
                  }`} />
                </div>
                <span className="text-xs text-[#8d96a0]">Active</span>
              </label>
            </div>

            {/* RSS endpoint */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">RSS Feed</p>
              <div className="flex items-center gap-2">
                <Rss className="size-3 text-[#f59e0b] shrink-0" />
                <code className="text-xs text-[#8d96a0] font-mono truncate">{rssUrl}</code>
              </div>
            </div>

            {/* Custom branding */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Custom branding</p>
              <input
                type="text"
                value={sub.custom_branding}
                onChange={(e) => update(cat, "custom_branding", e.target.value)}
                disabled={!isPro}
                placeholder={isPro ? "e.g. Brought to you by The Capitol Dossier" : "Pro required"}
                className={`w-full text-xs bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-[#f0f6fc] placeholder:text-[#484f58] focus:outline-none focus:border-[#57D7BA]/50 transition-colors ${
                  !isPro ? "opacity-50 cursor-not-allowed" : ""
                }`}
              />
              <p className="text-[10px] text-[#484f58]">
                Appears in the footer of every brief output (markdown, HTML, JSON).
              </p>
            </div>

            {isPro && (
              <button
                onClick={() => handleSave(cat)}
                disabled={saving === cat}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#57D7BA]/10 border border-[#57D7BA]/30 text-[#57D7BA] hover:bg-[#57D7BA]/20 transition-all disabled:opacity-60"
              >
                {saved === cat ? (
                  <><Check className="size-3" /> Saved</>
                ) : saving === cat ? (
                  "Saving..."
                ) : (
                  <><Save className="size-3" /> Save</>
                )}
              </button>
            )}
          </div>
        );
      })}

      <div className="text-xs text-[#484f58] text-center pt-2">
        <Link href="/briefs" className="text-[#57D7BA] hover:underline">
          View all briefs →
        </Link>
      </div>
    </div>
  );
}
