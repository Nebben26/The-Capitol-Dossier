import Link from "next/link";
import { ExternalLink, GitMerge, Users, BarChart3, ArrowRight } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { NewsletterForm } from "@/components/ui/newsletter-form";

export const revalidate = 60;

// ─── Data fetching ────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url.includes("supabase.co") || url.includes("your-project")) return null;
  return createClient(url, key);
}

interface IndexRow {
  slug: string;
  name: string;
  description: string;
  category: string;
  current_value: number;
  change_24h: number | null;
  methodology: string | null;
}

interface DisagreementRow {
  id: string;
  question: string;
  poly_price: number;
  kalshi_price: number;
  spread: number;
  category: string;
}

interface WhaleRow {
  address: string;
  display_name: string | null;
  total_pnl: number;
  win_rate: number;
  positions_count: number;
}

async function fetchIndices(): Promise<IndexRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("quiver_indices")
      .select("slug, name, description, category, current_value, change_24h, methodology")
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

async function fetchTopDisagreements(): Promise<DisagreementRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("disagreements")
      .select("id, question, poly_price, kalshi_price, spread, category")
      .order("spread", { ascending: false })
      .limit(3);
    if (error || !data) return [];
    return data.map((r: any) => ({
      ...r,
      poly_price: Math.round(Number(r.poly_price)),
      kalshi_price: Math.round(Number(r.kalshi_price)),
      spread: Math.round(Number(r.spread)),
    }));
  } catch {
    return [];
  }
}

async function fetchTopWhales(): Promise<WhaleRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb
      .from("whales")
      .select("address, display_name, total_pnl, win_rate, positions_count")
      .order("total_pnl", { ascending: false })
      .limit(3);
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtUsd(n: number): string {
  const abs = Math.abs(n);
  const sign = n >= 0 ? "+" : "-";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function indexZone(v: number): { color: string; bg: string } {
  if (v >= 70) return { color: "#3fb950", bg: "#3fb95015" };
  if (v >= 31) return { color: "#d29922", bg: "#d2992215" };
  return { color: "#f85149", bg: "#f8514915" };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [indices, disagreements, whales] = await Promise.all([
    fetchIndices(),
    fetchTopDisagreements(),
    fetchTopWhales(),
  ]);

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="px-4 pt-14 pb-12 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#f0f6fc] leading-tight tracking-tight">
          Real-time prediction market intelligence
        </h1>
        <p className="mt-4 text-base text-[#8d96a0] max-w-xl mx-auto">
          Track arbitrage between Polymarket and Kalshi, follow the largest traders, and cite the only proprietary prediction market indices.
        </p>
      </section>

      {/* ── Indices strip ────────────────────────────────────────────────── */}
      {indices.length > 0 && (
        <section className="px-4 pb-10 max-w-3xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {indices.map((idx) => {
              const { color, bg } = indexZone(idx.current_value);
              return (
                <Link
                  key={idx.slug}
                  href={`/indices/${idx.slug}`}
                  className="rounded-xl border border-[#21262d] bg-[#161b27] hover:border-[#2f374f] transition-colors p-3 flex flex-col gap-1"
                >
                  <span className="text-[11px] text-[#8d96a0] font-medium truncate">{idx.name}</span>
                  <span
                    className="text-2xl font-bold font-mono tabular-nums"
                    style={{ color }}
                  >
                    {idx.current_value.toFixed(1)}
                  </span>
                  {idx.change_24h != null && (
                    <span
                      className="text-[11px] font-mono tabular-nums"
                      style={{ color: idx.change_24h >= 0 ? "#3fb950" : "#f85149" }}
                    >
                      {idx.change_24h >= 0 ? "+" : ""}{idx.change_24h.toFixed(1)} today
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Feature blocks ───────────────────────────────────────────────── */}
      <section className="px-4 pb-10 max-w-3xl mx-auto space-y-4">

        {/* Block A — Disagrees */}
        <div className="rounded-2xl border border-[#21262d] bg-[#161b27] overflow-hidden">
          <div className="p-5 border-b border-[#21262d]">
            <div className="flex items-center gap-2 mb-1">
              <GitMerge className="size-4 text-[#57D7BA]" />
              <h2 className="text-base font-bold text-[#f0f6fc]">Live Arbitrage Spreads</h2>
            </div>
            <p className="text-sm text-[#8d96a0]">
              Every disagreement between Polymarket and Kalshi, ranked by spread size.
            </p>
          </div>
          <div className="divide-y divide-[#21262d]">
            {disagreements.length > 0 ? (
              disagreements.map((d) => (
                <div key={d.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                  <span className="flex-1 text-[#f0f6fc] text-xs line-clamp-1">{d.question}</span>
                  <span className="font-mono tabular-nums text-[11px] text-[#8d96a0] shrink-0">
                    PM <span className="text-[#f0f6fc]">{d.poly_price}¢</span>
                  </span>
                  <span className="font-mono tabular-nums text-[11px] text-[#8d96a0] shrink-0">
                    KX <span className="text-[#f0f6fc]">{d.kalshi_price}¢</span>
                  </span>
                  <span
                    className="font-mono tabular-nums text-[11px] font-bold shrink-0 px-1.5 py-0.5 rounded"
                    style={{ color: "#57D7BA", background: "#57D7BA18" }}
                  >
                    {d.spread}¢
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-4 text-xs text-[#484f58]">Live data loading…</div>
            )}
          </div>
          <div className="px-5 py-3 border-t border-[#21262d]">
            <Link
              href="/disagrees"
              className="inline-flex items-center gap-1.5 text-sm text-[#57D7BA] hover:text-[#57D7BA]/80 font-medium transition-colors"
            >
              See all live spreads <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Block B — Whales */}
        <div className="rounded-2xl border border-[#21262d] bg-[#161b27] overflow-hidden">
          <div className="p-5 border-b border-[#21262d]">
            <div className="flex items-center gap-2 mb-1">
              <Users className="size-4 text-[#57D7BA]" />
              <h2 className="text-base font-bold text-[#f0f6fc]">Smart Money Tracker</h2>
            </div>
            <p className="text-sm text-[#8d96a0]">
              411 of the largest prediction market traders, scored on accuracy and tracked in real time.
            </p>
          </div>
          <div className="divide-y divide-[#21262d]">
            {whales.length > 0 ? (
              whales.map((w, i) => {
                const name = w.display_name || `${w.address.slice(0, 6)}…${w.address.slice(-4)}`;
                const pnl = fmtUsd(w.total_pnl || 0);
                const winRate = w.win_rate > 0 ? `${Math.round(w.win_rate * 100)}% acc.` : "—";
                return (
                  <Link
                    key={w.address}
                    href={`/whales/${w.address}`}
                    className="px-5 py-3 flex items-center gap-3 text-sm hover:bg-[#1c2333] transition-colors"
                  >
                    <span className="text-[11px] text-[#484f58] font-mono w-4 shrink-0">#{i + 1}</span>
                    <span className="flex-1 text-[#f0f6fc] text-xs truncate">{name}</span>
                    <span
                      className="font-mono tabular-nums text-[11px] font-bold shrink-0"
                      style={{ color: (w.total_pnl || 0) >= 0 ? "#3fb950" : "#f85149" }}
                    >
                      {pnl}
                    </span>
                    <span className="text-[11px] text-[#8d96a0] font-mono shrink-0">{winRate}</span>
                  </Link>
                );
              })
            ) : (
              <div className="px-5 py-4 text-xs text-[#484f58]">Live data loading…</div>
            )}
          </div>
          <div className="px-5 py-3 border-t border-[#21262d]">
            <Link
              href="/whales"
              className="inline-flex items-center gap-1.5 text-sm text-[#57D7BA] hover:text-[#57D7BA]/80 font-medium transition-colors"
            >
              See the leaderboard <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Block C — Indices */}
        <div className="rounded-2xl border border-[#21262d] bg-[#161b27] overflow-hidden">
          <div className="p-5 border-b border-[#21262d]">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="size-4 text-[#57D7BA]" />
              <h2 className="text-base font-bold text-[#f0f6fc]">Citeable Market Intelligence</h2>
            </div>
            <p className="text-sm text-[#8d96a0]">
              Four proprietary indices that summarize what prediction markets are saying about elections, crypto, geopolitics, and the economy.
            </p>
          </div>
          <div className="divide-y divide-[#21262d]">
            {indices.length > 0 ? (
              indices.map((idx) => {
                const { color } = indexZone(idx.current_value);
                return (
                  <Link
                    key={idx.slug}
                    href={`/indices/${idx.slug}`}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-[#1c2333] transition-colors"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs text-[#f0f6fc] font-medium">{idx.name}</span>
                      {idx.methodology && (
                        <span className="block text-[11px] text-[#484f58] truncate">{idx.methodology}</span>
                      )}
                    </span>
                    <span className="font-mono tabular-nums text-sm font-bold shrink-0" style={{ color }}>
                      {idx.current_value.toFixed(1)}
                    </span>
                  </Link>
                );
              })
            ) : (
              <div className="px-5 py-4 text-xs text-[#484f58]">Live data loading…</div>
            )}
          </div>
          <div className="px-5 py-3 border-t border-[#21262d]">
            <Link
              href="/indices"
              className="inline-flex items-center gap-1.5 text-sm text-[#57D7BA] hover:text-[#57D7BA]/80 font-medium transition-colors"
            >
              View all indices <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Email capture ─────────────────────────────────────────────────── */}
      <section className="px-4 pb-12">
        <div className="max-w-3xl mx-auto rounded-2xl border border-[#21262d] bg-[#161b27] px-6 py-8 text-center">
          <p className="text-base font-semibold text-[#f0f6fc] mb-1">
            Get the daily prediction market briefing
          </p>
          <p className="text-sm text-[#8d96a0] mb-5">
            Three minutes, twice a week, free.
          </p>
          <NewsletterForm />
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#21262d] px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#f0f6fc]">Quiver Markets</p>
              <p className="text-xs text-[#484f58] mt-0.5">Powered by Polymarket and Kalshi data</p>
            </div>
            <nav className="flex flex-wrap gap-x-4 gap-y-1">
              {[
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
                { label: "Terms", href: "/terms" },
                { label: "Privacy", href: "/privacy" },
                { label: "Methodology", href: "/methodology" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="text-xs text-[#484f58] hover:text-[#8d96a0] transition-colors">
                  {l.label}
                </Link>
              ))}
              <a
                href="https://thecapitoldossier.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#484f58] hover:text-[#8d96a0] transition-colors"
              >
                The Capitol Dossier <ExternalLink className="size-3" />
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
