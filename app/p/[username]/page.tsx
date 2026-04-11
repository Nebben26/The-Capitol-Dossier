import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { ProfileView } from "./profile-view";

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getProfile(username: string) {
  const { data: profile } = await supabaseAnon
    .from("user_profiles")
    .select("*")
    .eq("username", username)
    .eq("is_public", true)
    .maybeSingle();

  if (!profile) return null;

  const { data: predictions } = await supabaseAnon
    .from("user_predictions")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const { count: followerCount } = await supabaseAnon
    .from("profile_followers")
    .select("*", { count: "exact", head: true })
    .eq("followed_profile_id", profile.id);

  return { profile, predictions: predictions ?? [], followerCount: followerCount ?? 0 };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const result = await getProfile(username);
  if (!result) {
    return { title: "Profile not found — Quiver Markets" };
  }
  const { profile, predictions } = result;
  const resolved = predictions.filter((p) => p.is_resolved);
  const correct = resolved.filter((p) => p.resolution === "correct");
  const accuracy = resolved.length > 0 ? Math.round((correct.length / resolved.length) * 100) : null;
  const displayName = profile.display_name ?? `@${profile.username}`;
  const description = accuracy != null
    ? `${displayName} on Quiver Markets — ${accuracy}% accuracy over ${resolved.length} resolved predictions. ${predictions.length} total calls.`
    : `${displayName} on Quiver Markets — ${predictions.length} open predictions.`;

  return {
    title: `${displayName} (@${profile.username}) — Quiver Markets`,
    description,
    openGraph: {
      title: `${displayName} — Quiver Markets Prediction Profile`,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: `${displayName} — Quiver Markets`,
      description,
    },
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const result = await getProfile(username);
  if (!result) notFound();

  return (
    <ProfileView
      profile={result.profile}
      predictions={result.predictions}
      followerCount={result.followerCount}
    />
  );
}
