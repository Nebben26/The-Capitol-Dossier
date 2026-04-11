"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle, Loader2, User, AtSign } from "lucide-react";

type Availability = "idle" | "checking" | "available" | "taken" | "invalid";

export default function ClaimProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [existingProfile, setExistingProfile] = useState<any>(null);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");

  const [availability, setAvailability] = useState<Availability>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null);
      if (data.user) {
        // Load existing profile to pre-fill
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (profile) {
          setExistingProfile(profile);
          setUsername(profile.username ?? "");
          setDisplayName(profile.display_name ?? "");
          setBio(profile.bio ?? "");
          setTwitter(profile.twitter_handle ?? "");
          setWebsite(profile.website_url ?? "");
          setAvailability("available"); // pre-filled = already claimed
        }
      }
      setLoadingUser(false);
    });
  }, []);

  // Debounced availability check
  useEffect(() => {
    if (existingProfile && username === existingProfile.username) {
      setAvailability("available");
      return;
    }
    if (!username) { setAvailability("idle"); return; }
    if (username.length < 3) { setAvailability("invalid"); return; }

    setAvailability("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/profile/claim?username=${encodeURIComponent(username)}`);
      const json = await res.json();
      if (json.error) setAvailability("invalid");
      else setAvailability(json.available ? "available" : "taken");
    }, 400);
  }, [username, existingProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (availability !== "available") return;
    setSubmitting(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Not signed in."); setSubmitting(false); return; }

    const res = await fetch("/api/profile/claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        username,
        display_name: displayName,
        bio,
        twitter_handle: twitter,
        website_url: website,
      }),
    });

    const json = await res.json();
    if (!res.ok) { setError(json.error ?? "Something went wrong."); setSubmitting(false); return; }
    router.push(`/p/${json.profile.username}`);
  };

  if (loadingUser) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#57D7BA] mx-auto" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 space-y-4">
        <h1 className="text-2xl font-bold text-[#f0f6fc]">Create Your Profile</h1>
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-6 text-center space-y-3">
          <p className="text-sm text-[#8d96a0]">Sign in to claim your public prediction profile.</p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 bg-[#57D7BA] text-[#0d1117] text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#57D7BA]/90 transition-all"
          >
            Sign in / Sign up
          </a>
        </div>
      </div>
    );
  }

  const availabilityIcon = {
    idle: null,
    checking: <Loader2 className="w-4 h-4 animate-spin text-[#8d96a0]" />,
    available: <CheckCircle className="w-4 h-4 text-[#3fb950]" />,
    taken: <XCircle className="w-4 h-4 text-[#f85149]" />,
    invalid: <XCircle className="w-4 h-4 text-[#f85149]" />,
  }[availability];

  const availabilityText = {
    idle: "",
    checking: "Checking…",
    available: "Available!",
    taken: "Already taken.",
    invalid: "3-20 chars, lowercase letters, numbers, underscores only.",
  }[availability];

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#57D7BA]/10 flex items-center justify-center">
          <User className="w-5 h-5 text-[#57D7BA]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">
            {existingProfile ? "Edit Profile" : "Claim Your Profile"}
          </h1>
          <p className="text-xs text-[#8d96a0]">Build a verifiable prediction track record.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl bg-[#161b27] border border-[#21262d] p-6 space-y-5">
        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
            Username <span className="text-[#f85149]">*</span>
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-[#484f58]">
              <AtSign className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="yourhandle"
              maxLength={20}
              required
              className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg pl-8 pr-10 py-2.5 text-sm text-[#f0f6fc] placeholder:text-[#484f58] focus:outline-none focus:border-[#57D7BA]/50 transition-colors"
            />
            {availabilityIcon && (
              <span className="absolute right-3">{availabilityIcon}</span>
            )}
          </div>
          {availabilityText && (
            <p className={`text-[11px] ${availability === "available" ? "text-[#3fb950]" : "text-[#f85149]"}`}>
              {availabilityText}
            </p>
          )}
          <p className="text-[11px] text-[#484f58]">
            Your profile will be at quivermarkets.com/p/{username || "yourhandle"}
          </p>
        </div>

        {/* Display name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your Name"
            maxLength={60}
            className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2.5 text-sm text-[#f0f6fc] placeholder:text-[#484f58] focus:outline-none focus:border-[#57D7BA]/50 transition-colors"
          />
        </div>

        {/* Bio */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Prediction market trader, analyst, researcher…"
            maxLength={280}
            rows={2}
            className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2.5 text-sm text-[#f0f6fc] placeholder:text-[#484f58] focus:outline-none focus:border-[#57D7BA]/50 transition-colors resize-none"
          />
          <p className="text-[11px] text-[#484f58] text-right">{bio.length}/280</p>
        </div>

        {/* Twitter */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
            Twitter / X Handle
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-[#484f58] text-sm">@</span>
            <input
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value.replace(/^@/, ""))}
              placeholder="handle"
              maxLength={50}
              className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg pl-7 pr-3 py-2.5 text-sm text-[#f0f6fc] placeholder:text-[#484f58] focus:outline-none focus:border-[#57D7BA]/50 transition-colors"
            />
          </div>
        </div>

        {/* Website */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
            Website
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://…"
            maxLength={200}
            className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2.5 text-sm text-[#f0f6fc] placeholder:text-[#484f58] focus:outline-none focus:border-[#57D7BA]/50 transition-colors"
          />
        </div>

        {error && (
          <p className="text-xs text-[#f85149] bg-[#f85149]/10 border border-[#f85149]/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || availability !== "available"}
          className="w-full bg-[#57D7BA] text-[#0d1117] text-sm font-bold py-2.5 rounded-lg hover:bg-[#57D7BA]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {submitting ? "Saving…" : existingProfile ? "Save Changes" : "Claim Profile"}
        </button>
      </form>
    </div>
  );
}
