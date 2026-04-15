import { createClient } from "@supabase/supabase-js";
import IndicesClient from "./indices-client";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export const revalidate = 60;

async function fetchInitialIndices() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url.includes("supabase.co") || url.includes("your-project")) return [];
  try {
    const sb = createClient(url, key);
    const { data, error } = await sb
      .from("quiver_indices")
      .select("slug, name, description, category, current_value, change_24h, component_count, updated_at")
      .order("slug");
    if (error || !data) return [];
    return data.map((r: any) => ({
      ...r,
      current_value: Number(r.current_value),
      change_24h: r.change_24h != null ? Number(r.change_24h) : null,
    }));
  } catch {
    return [];
  }
}

export default async function IndicesPage() {
  const initialIndices = await fetchInitialIndices();
  return (
    <>
      <IndicesClient initialIndices={initialIndices} />
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <p className="text-xs text-[#8d96a0]">
          These signals also power{" "}
          <a
            href="https://thecapitoldossier.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-[#f0f6fc] transition-colors"
          >
            The Capitol Dossier <ExternalLink className="size-3" />
          </a>{" "}
          — exact options setups delivered to Telegram.
        </p>
      </div>
    </>
  );
}
