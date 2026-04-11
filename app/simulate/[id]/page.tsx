import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ExecutionSimulator } from "@/components/arb/execution-simulator";
import { ArrowLeft } from "lucide-react";

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getDisagreement(id: string) {
  const { data } = await supabaseAnon
    .from("disagreements")
    .select("id, question, spread, poly_price, kalshi_price, category, score, poly_volume, kalshi_volume, poly_url, kalshi_url, end_date")
    .eq("id", id)
    .maybeSingle();
  return data;
}

async function getRelatedArbs(id: string, category: string) {
  const { data } = await supabaseAnon
    .from("disagreements")
    .select("id, question, spread, poly_price, kalshi_price, category")
    .eq("category", category)
    .neq("id", id)
    .order("spread", { ascending: false })
    .limit(4);
  return data ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const d = await getDisagreement(id);
  if (!d) return { title: "Simulation not found — Quiver Markets" };

  const title = `Simulate: ${d.question} — ${Number(d.spread)}pt arb spread`;
  const description = `Step-by-step execution plan for this ${Number(d.spread)}pt cross-platform arbitrage: Polymarket ${Math.round(Number(d.poly_price))}¢ vs Kalshi ${Math.round(Number(d.kalshi_price))}¢. Risk assessment, fee-adjusted P&L, and historical spread data.`;

  return {
    title: `${title} — Quiver Markets`,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function SimulatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getDisagreement(id);
  if (!d) notFound();

  const related = await getRelatedArbs(id, d.category ?? "");

  // Infer direction from prices
  const direction: "poly-higher" | "kalshi-higher" =
    Number(d.poly_price) > Number(d.kalshi_price) ? "poly-higher" : "kalshi-higher";

  // Rough days-left from end_date
  let daysLeft = 0;
  if (d.end_date) {
    const diff = new Date(d.end_date).getTime() - Date.now();
    daysLeft = Math.max(0, Math.ceil(diff / 86_400_000));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Back nav */}
      <div className="flex items-center gap-2">
        <Link
          href="/simulate"
          className="inline-flex items-center gap-1.5 text-xs text-[#8d96a0] hover:text-[#f0f6fc] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All simulators
        </Link>
        <span className="text-[#484f58] text-xs">·</span>
        <Link
          href="/disagrees"
          className="text-xs text-[#8d96a0] hover:text-[#f0f6fc] transition-colors"
        >
          Disagrees
        </Link>
      </div>

      {/* Page title */}
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#388bfd]/10 text-[#388bfd] border border-[#388bfd]/20">
            Execution Simulator
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#57D7BA]/10 text-[#57D7BA] border border-[#57D7BA]/20">
            {d.category}
          </span>
        </div>
        <h1 className="text-xl font-bold text-[#f0f6fc] leading-snug">{d.question}</h1>
      </div>

      {/* Simulator */}
      <ExecutionSimulator
        disagreement={{
          id: d.id,
          question: d.question,
          category: d.category ?? "Other",
          polyPrice: Number(d.poly_price),
          kalshiPrice: Number(d.kalshi_price),
          spread: Number(d.spread),
          daysLeft,
          direction,
        }}
      />

      {/* Related arbs */}
      {related.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-[#f0f6fc]">Other {d.category} arbs</h2>
          <div className="space-y-2">
            {related.map((r) => {
              const spreadColor = Number(r.spread) >= 20 ? "#f85149" : Number(r.spread) >= 10 ? "#d29922" : "#57D7BA";
              return (
                <Link
                  key={r.id}
                  href={`/simulate/${r.id}`}
                  className="flex items-center gap-3 rounded-xl bg-[#161b27] border border-[#21262d] hover:border-[#388bfd]/30 p-3 transition-all group"
                >
                  <p className="flex-1 text-xs text-[#f0f6fc] group-hover:text-[#388bfd] transition-colors line-clamp-1">
                    {r.question}
                  </p>
                  <span
                    className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg border shrink-0"
                    style={{ color: spreadColor, borderColor: `${spreadColor}30`, backgroundColor: `${spreadColor}10` }}
                  >
                    {Number(r.spread)}pt
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
