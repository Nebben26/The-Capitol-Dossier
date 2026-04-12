"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users, TrendingUp, Minus, ChevronRight, Check, X, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Consensus {
  consensus_prob: number;
  raw_mean: number;
  vote_count: number;
  avg_confidence: number;
}

interface OwnPrediction {
  id: string;
  predicted_prob: number;
  confidence: number;
  updated_at: string;
}

interface SourceBar {
  label: string;
  prob: number | null;
  color: string;
  sublabel?: string;
}

function ProbBar({ label, prob, color, sublabel }: SourceBar) {
  if (prob == null) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#8d96a0]">{label}</span>
        <span className="font-mono text-xs font-bold tabular-nums" style={{ color }}>
          {prob.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#21262d] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${prob}%`, backgroundColor: color }}
        />
      </div>
      {sublabel && <p className="text-[9px] text-[#484f58]">{sublabel}</p>}
    </div>
  );
}

const CONFIDENCE_LABELS: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High" };
const CONFIDENCE_COLORS: Record<number, string> = { 1: "#8d96a0", 2: "#d29922", 3: "#57D7BA" };

interface Props {
  marketId: string;
  marketQuestion: string;
  polyPrice?: number | null;
  kalshiPrice?: number | null;
  whaleConsensus?: number | null;
}

export function CommunityPredictionWidget({
  marketId,
  marketQuestion,
  polyPrice,
  kalshiPrice,
  whaleConsensus,
}: Props) {
  const [consensus, setConsensus] = useState<Consensus | null>(null);
  const [own, setOwn] = useState<OwnPrediction | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Slider / submission state
  const [editing, setEditing] = useState(false);
  const [sliderVal, setSliderVal] = useState(50);
  const [confidence, setConfidence] = useState(2);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchData = useCallback(async (token?: string) => {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const res = await fetch(
        `/api/community-predictions?market_id=${encodeURIComponent(marketId)}`,
        { headers }
      );
      if (!res.ok) return;
      const json = await res.json();
      setConsensus(json.consensus ?? null);
      setOwn(json.own ?? null);
      if (json.own) {
        setSliderVal(json.own.predicted_prob);
        setConfidence(json.own.confidence);
      }
    } catch {
      // non-fatal
    } finally {
      setLoaded(true);
    }
  }, [marketId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s ? { access_token: s.access_token } : null);
      fetchData(s?.access_token);
    });
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!session) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/community-predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          market_id: marketId,
          market_question: marketQuestion,
          predicted_prob: sliderVal,
          confidence,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setSaveError(json.error ?? "Save failed"); return; }
      setOwn(json.prediction);
      setEditing(false);
      fetchData(session.access_token);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!session) return;
    setSaving(true);
    try {
      await fetch(`/api/community-predictions?market_id=${encodeURIComponent(marketId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setOwn(null);
      setSliderVal(50);
      setConfidence(2);
      setEditing(false);
      fetchData(session.access_token);
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return null;

  const sources: SourceBar[] = [
    { label: "Polymarket", prob: polyPrice ?? null, color: "#57D7BA" },
    { label: "Kalshi", prob: kalshiPrice ?? null, color: "#388bfd" },
    { label: "Whale Consensus", prob: whaleConsensus ?? null, color: "#a371f7", sublabel: "Smart money avg" },
    {
      label: `Community (${consensus?.vote_count ?? 0} votes)`,
      prob: consensus ? consensus.consensus_prob : null,
      color: "#f59e0b",
      sublabel: consensus ? `Confidence-weighted mean` : undefined,
    },
  ].filter((s) => s.prob != null);

  const showSources = sources.length > 0 || consensus != null;

  return (
    <div className="mt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-[#f59e0b]" />
          <span className="text-sm font-bold text-[#f0f6fc]">Community Consensus</span>
          {consensus && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">
              {consensus.vote_count} {consensus.vote_count === 1 ? "vote" : "votes"}
            </span>
          )}
        </div>
        <Link
          href="/accuracy"
          className="text-[10px] text-[#484f58] hover:text-[#f59e0b] transition-colors"
        >
          Source accuracy →
        </Link>
      </div>

      {/* 4-source comparison bars */}
      {showSources && (
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-4 space-y-3">
          {sources.map((s) => (
            <ProbBar key={s.label} {...s} />
          ))}
          {sources.length === 0 && (
            <p className="text-xs text-[#484f58]">No consensus data yet. Be the first to submit.</p>
          )}
        </div>
      )}

      {/* Submit / edit panel */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] overflow-hidden">
        {!session ? (
          /* Unauthenticated CTA */
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <TrendingUp className="size-4 text-[#f59e0b] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#f0f6fc]">Submit your prediction</p>
                <p className="text-[10px] text-[#484f58] mt-0.5">
                  Free — adds your estimate to the community consensus
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 hover:bg-[#f59e0b]/20 transition-colors"
            >
              Sign in <ChevronRight className="size-3" />
            </Link>
          </div>
        ) : own && !editing ? (
          /* Showing own prediction */
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="size-3.5 text-[#3fb950]" />
                <span className="text-xs font-semibold text-[#f0f6fc]">Your prediction</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="text-[10px] text-[#484f58] hover:text-[#57D7BA] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="text-[10px] text-[#484f58] hover:text-[#f85149] transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-black tabular-nums text-[#f59e0b]">{own.predicted_prob}%</div>
                <div className="text-[9px] text-[#484f58] uppercase tracking-widest">YES</div>
              </div>
              <div>
                <div
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{
                    color: CONFIDENCE_COLORS[own.confidence],
                    borderColor: `${CONFIDENCE_COLORS[own.confidence]}40`,
                    backgroundColor: `${CONFIDENCE_COLORS[own.confidence]}10`,
                  }}
                >
                  {CONFIDENCE_LABELS[own.confidence]} confidence
                </div>
                <p className="text-[9px] text-[#484f58] mt-1">
                  Updated {new Date(own.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Submission / edit form */
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#f0f6fc]">
                {own ? "Edit your prediction" : "What do you think?"}
              </span>
              {own && (
                <button
                  onClick={() => { setEditing(false); setSliderVal(own.predicted_prob); setConfidence(own.confidence); }}
                  className="text-[10px] text-[#484f58] hover:text-[#f0f6fc] transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Probability slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8d96a0]">Probability of YES</span>
                <span className="font-mono text-sm font-black tabular-nums text-[#f59e0b]">{sliderVal}%</span>
              </div>
              <input
                type="range"
                min={1}
                max={99}
                value={sliderVal}
                onChange={(e) => setSliderVal(Number(e.target.value))}
                className="w-full accent-[#f59e0b]"
              />
              <div className="flex justify-between text-[9px] text-[#484f58]">
                <span>1% (Unlikely)</span>
                <span>50% (Toss-up)</span>
                <span>99% (Likely)</span>
              </div>
            </div>

            {/* Confidence selector */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-[#8d96a0]">Confidence level</span>
              <div className="flex gap-2">
                {([1, 2, 3] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setConfidence(c)}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-all"
                    style={
                      confidence === c
                        ? {
                            color: CONFIDENCE_COLORS[c],
                            borderColor: `${CONFIDENCE_COLORS[c]}60`,
                            backgroundColor: `${CONFIDENCE_COLORS[c]}15`,
                          }
                        : { color: "#484f58", borderColor: "#21262d", backgroundColor: "transparent" }
                    }
                  >
                    {CONFIDENCE_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            {saveError && (
              <p className="text-[10px] text-[#f85149]">{saveError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full py-2 rounded-lg text-xs font-semibold bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20 hover:bg-[#f59e0b]/20 disabled:opacity-50 transition-all"
            >
              {saving ? "Saving…" : own ? "Update prediction" : "Submit prediction"}
            </button>

            <div className="flex items-start gap-1.5">
              <Info className="size-3 text-[#484f58] shrink-0 mt-0.5" />
              <p className="text-[9px] text-[#484f58] leading-relaxed">
                Your estimate is confidence-weighted into the community consensus. Not financial advice.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
