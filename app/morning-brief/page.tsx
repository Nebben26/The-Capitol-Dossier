"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getLastIngestTimestamp } from "@/lib/api";
import { DataFreshness } from "@/components/ui/data-freshness";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sun,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  GitCompareArrows,
  Zap,
  Users,
  ArrowRight,
  Mail,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface BriefMarket {
  id: string;
  question: string;
  price: number;
  change: number;
  category: string;
  platform: string;
}

interface BriefArb {
  id: string;
  question: string;
  spread: number;
  poly_price: number;
  kalshi_price: number;
}

interface BriefSignal {
  signal_id: string;
  headline: string;
  confidence: number;
  type: string;
}

function UnsubscribeBanner() {
  const params = useSearchParams();
  const status = params.get("unsubscribed");

  if (!status) return null;

  if (status === "true") {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-[#3fb950]/30 bg-[#3fb950]/10 px-4 py-3 text-sm text-[#3fb950]">
        <CheckCircle className="size-4 shrink-0" />
        You've been unsubscribed. You won't receive future Morning Briefs.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[#f85149]/30 bg-[#f85149]/10 px-4 py-3 text-sm text-[#f85149]">
      <XCircle className="size-4 shrink-0" />
      That unsubscribe link is invalid or has already been used.
    </div>
  );
}

function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("morning_brief_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("active", true)
      .then(({ count: n }) => {
        if (n != null) setCount(n);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      const resp = await fetch("/api/morning-brief/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "morning-brief-page" }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setResult({ ok: true, message: data.message || "Subscribed!" });
        setEmail("");
        setCount((c) => (c != null ? c + 1 : c));
      } else {
        setResult({ ok: false, message: data.error || "Something went wrong." });
      }
    } catch {
      setResult({ ok: false, message: "Network error — please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#57D7BA]/20 bg-gradient-to-br from-[#57D7BA]/10 via-[#388bfd]/5 to-transparent p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-xl bg-[#57D7BA]/15 flex items-center justify-center shrink-0 mt-0.5">
          <Mail className="size-4 text-[#57D7BA]" />
        </div>
        <div>
          <div className="text-sm font-bold text-[#f0f6fc]">Get the Morning Brief in your inbox</div>
          <div className="text-[11px] text-[#8d96a0] mt-0.5">
            Top arbs, biggest movers, and market stats — delivered at 7am ET.
            {count != null && count > 0 && (
              <span className="ml-1 text-[#57D7BA]">{count.toLocaleString()} subscribers.</span>
            )}
          </div>
        </div>
      </div>

      {result ? (
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
            result.ok
              ? "bg-[#3fb950]/10 border border-[#3fb950]/30 text-[#3fb950]"
              : "bg-[#f85149]/10 border border-[#f85149]/30 text-[#f85149]"
          }`}
        >
          {result.ok ? <CheckCircle className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
          {result.message}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 min-w-0 rounded-lg bg-[#0d1117] border border-[#21262d] text-[#f0f6fc] placeholder-[#484f58] px-3 py-2 text-sm focus:outline-none focus:border-[#57D7BA]/50 transition-colors"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-[#57D7BA] text-[#0d1117] text-sm font-bold hover:bg-[#57D7BA]/80 transition-colors disabled:opacity-60 shrink-0"
          >
            {submitting ? "Subscribing…" : "Subscribe"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function MorningBriefPage() {
  const [date] = useState(() =>
    new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  );
  const [freshnessTs, setFreshnessTs] = useState<string | null>(null);
  const [movers, setMovers] = useState<BriefMarket[]>([]);
  const [arbs, setArbs] = useState<BriefArb[]>([]);
  const [signals, setSignals] = useState<BriefSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLastIngestTimestamp().then(setFreshnessTs);

    Promise.all([
      supabase
        .from("markets")
        .select("id, question, price, change_24h, category, platform")
        .eq("resolved", false)
        .not("change_24h", "is", null)
        .order("change_24h", { ascending: false })
        .limit(10),
      supabase
        .from("disagreements")
        .select("id, question, spread, poly_price, kalshi_price")
        .order("spread", { ascending: false })
        .limit(5),
      supabase
        .from("signals")
        .select("signal_id, headline, confidence, type")
        .order("detected_at", { ascending: false })
        .limit(6),
    ])
      .then(([mktsRes, arbsRes, sigsRes]) => {
        const raw = (mktsRes.data || []) as any[];
        const mkts: BriefMarket[] = raw.map((r) => ({
          id: r.id,
          question: r.question,
          price: Number(r.price) || 0,
          change: Number(r.change_24h) || 0,
          category: r.category,
          platform: r.platform,
        }));
        const sorted = [...mkts].sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 6);
        setMovers(sorted);
        setArbs((arbsRes.data || []) as BriefArb[]);
        setSignals((sigsRes.data || []) as BriefSignal[]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const upMovers = movers.filter((m) => m.change > 0).slice(0, 3);
  const downMovers = movers.filter((m) => m.change < 0).slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="size-8 rounded-lg bg-[#d29922]/15 flex items-center justify-center">
              <Sun className="size-4 text-[#d29922]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Morning Brief</h1>
          </div>
          <p className="text-sm text-[#8d96a0]">{date} · Your prediction market intelligence digest</p>
        </div>
        <DataFreshness timestamp={freshnessTs} />
      </div>

      {/* Unsubscribe banner (wrapped in Suspense for useSearchParams) */}
      <Suspense fallback={null}>
        <UnsubscribeBanner />
      </Suspense>

      {/* Email subscription */}
      <SubscribeForm />

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-[#161b27] animate-pulse border border-[#21262d]" />
          ))}
        </div>
      ) : (
        <>
          {/* ─── Price Movers ─── */}
          <section className="space-y-3">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#484f58] flex items-center gap-2">
              <TrendingUp className="size-3.5 text-[#3fb950]" /> Overnight Movers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {upMovers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold text-[#3fb950] flex items-center gap-1.5">
                    <TrendingUp className="size-3" /> Rising
                  </div>
                  {upMovers.map((m) => (
                    <Link key={m.id} href={`/markets/${m.id}`}>
                      <Card className="bg-[#161b27] border-[#21262d] hover:border-[#3fb950]/30 transition-all cursor-pointer">
                        <CardContent className="p-3 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#f0f6fc] line-clamp-1">{m.question}</p>
                            <p className="text-[10px] text-[#8d96a0] mt-0.5">{m.category} · {m.platform}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold font-mono text-[#f0f6fc]">{m.price}¢</div>
                            <div className="text-[10px] font-semibold text-[#3fb950]">+{m.change.toFixed(1)}pt</div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
              {downMovers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold text-[#f85149] flex items-center gap-1.5">
                    <TrendingDown className="size-3" /> Falling
                  </div>
                  {downMovers.map((m) => (
                    <Link key={m.id} href={`/markets/${m.id}`}>
                      <Card className="bg-[#161b27] border-[#21262d] hover:border-[#f85149]/30 transition-all cursor-pointer">
                        <CardContent className="p-3 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#f0f6fc] line-clamp-1">{m.question}</p>
                            <p className="text-[10px] text-[#8d96a0] mt-0.5">{m.category} · {m.platform}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold font-mono text-[#f0f6fc]">{m.price}¢</div>
                            <div className="text-[10px] font-semibold text-[#f85149]">{m.change.toFixed(1)}pt</div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
              {movers.length === 0 && (
                <div className="col-span-full text-center py-6 text-sm text-[#8d96a0]">
                  No mover data yet — check back after the next ingestion.
                </div>
              )}
            </div>
          </section>

          {/* ─── Top Arbs ─── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#484f58] flex items-center gap-2">
                <GitCompareArrows className="size-3.5 text-[#f59e0b]" /> Top Arbitrage Today
              </h2>
              <Link href="/disagrees" className="text-[10px] text-[#57D7BA] hover:text-[#57D7BA]/80 flex items-center gap-0.5">
                All arbs <ArrowRight className="size-3" />
              </Link>
            </div>
            {arbs.length === 0 ? (
              <div className="text-center py-6 text-sm text-[#8d96a0]">No arb opportunities right now.</div>
            ) : (
              <div className="space-y-2">
                {arbs.map((arb) => (
                  <Link key={arb.id} href="/disagrees">
                    <Card className="bg-[#161b27] border-[#21262d] hover:border-[#f59e0b]/30 transition-all cursor-pointer">
                      <CardContent className="p-3 flex items-center gap-3">
                        <AlertTriangle className="size-4 text-[#f59e0b] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#f0f6fc] line-clamp-1">{arb.question || arb.id}</p>
                          <p className="text-[10px] text-[#8d96a0] mt-0.5">
                            Poly {arb.poly_price}¢ · Kalshi {arb.kalshi_price}¢
                          </p>
                        </div>
                        <span className="text-sm font-bold font-mono text-[#f59e0b] shrink-0">{arb.spread}pt</span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ─── Whale Signals ─── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#484f58] flex items-center gap-2">
                <Zap className="size-3.5 text-[#8b5cf6]" /> Smart Money Signals
              </h2>
              <Link href="/alerts" className="text-[10px] text-[#57D7BA] hover:text-[#57D7BA]/80 flex items-center gap-0.5">
                All signals <ArrowRight className="size-3" />
              </Link>
            </div>
            {signals.length === 0 ? (
              <div className="text-center py-6 text-sm text-[#8d96a0]">No signals detected yet today.</div>
            ) : (
              <div className="space-y-2">
                {signals.map((sig) => (
                  <Link key={sig.signal_id} href="/alerts">
                    <Card className="bg-[#161b27] border-[#21262d] hover:border-[#8b5cf6]/30 transition-all cursor-pointer">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-[#8b5cf6]/15 flex items-center justify-center shrink-0">
                          <Users className="size-4 text-[#8b5cf6]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#f0f6fc] line-clamp-1">{sig.headline}</p>
                          <p className="text-[10px] text-[#8d96a0] mt-0.5 capitalize">{sig.type?.replace(/_/g, " ")}</p>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-[#8b5cf6] shrink-0">{sig.confidence}/10</span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
