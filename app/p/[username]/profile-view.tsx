"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Target,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Globe,
  Share2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Users,
  BarChart3,
  Zap,
} from "lucide-react";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  twitter_handle: string | null;
  website_url: string | null;
  created_at: string;
}

interface Prediction {
  id: string;
  market_id: string;
  market_question: string;
  outcome: string;
  predicted_prob: number;
  conviction: "low" | "medium" | "high";
  reasoning: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolution: "correct" | "incorrect" | null;
  brier_score: number | null;
  created_at: string;
}

const CONVICTION_COLOR: Record<string, string> = {
  high: "#57D7BA",
  medium: "#f59e0b",
  low: "#8d96a0",
};

const CONVICTION_LABEL: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function brierToAccuracy(brier: number) {
  return Math.round((1 - brier) * 100);
}

function PredictionRow({ p }: { p: Prediction }) {
  const [expanded, setExpanded] = useState(false);
  const isResolved = p.is_resolved;

  return (
    <div className="rounded-xl bg-[#161b27] border border-[#21262d] overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        {/* Outcome icon */}
        <div className="mt-0.5 shrink-0">
          {isResolved ? (
            p.resolution === "correct" ? (
              <CheckCircle className="w-4 h-4 text-[#3fb950]" />
            ) : (
              <XCircle className="w-4 h-4 text-[#f85149]" />
            )
          ) : (
            <Clock className="w-4 h-4 text-[#8d96a0]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border"
              style={{
                color: CONVICTION_COLOR[p.conviction],
                borderColor: `${CONVICTION_COLOR[p.conviction]}40`,
                backgroundColor: `${CONVICTION_COLOR[p.conviction]}10`,
              }}
            >
              {CONVICTION_LABEL[p.conviction]} conviction
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${
                p.outcome === "YES"
                  ? "text-[#3fb950] border-[#3fb950]/30 bg-[#3fb950]/10"
                  : p.outcome === "NO"
                  ? "text-[#f85149] border-[#f85149]/30 bg-[#f85149]/10"
                  : "text-[#8d96a0] border-[#21262d] bg-[#0d1117]"
              }`}
            >
              {p.outcome}
            </span>
            <span className="text-xs font-mono font-bold text-[#f0f6fc]">{p.predicted_prob}%</span>
          </div>

          <Link
            href={`/markets/${p.market_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-[#f0f6fc] hover:text-[#57D7BA] transition-colors line-clamp-2 font-medium"
          >
            {p.market_question}
          </Link>

          <div className="text-[10px] text-[#484f58] mt-1">
            {isResolved && p.resolved_at
              ? `Resolved ${new Date(p.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : `Called ${new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          </div>
        </div>

        <div className="shrink-0 text-[#484f58] mt-1">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {expanded && p.reasoning && (
        <div className="px-4 pb-4 pt-0 ml-7 border-t border-[#21262d]">
          <p className="text-xs text-[#8d96a0] leading-relaxed pt-3">{p.reasoning}</p>
        </div>
      )}
    </div>
  );
}

export function ProfileView({
  profile,
  predictions,
  followerCount,
  communityPredictionCount = 0,
}: {
  profile: Profile;
  predictions: Prediction[];
  followerCount: number;
  communityPredictionCount?: number;
}) {
  const [showClosedAll, setShowClosedAll] = useState(false);
  const [copied, setCopied] = useState(false);

  const open = predictions.filter((p) => !p.is_resolved);
  const resolved = predictions.filter((p) => p.is_resolved);
  const correct = resolved.filter((p) => p.resolution === "correct");
  const accuracy = resolved.length > 0 ? Math.round((correct.length / resolved.length) * 100) : null;
  const avgBrier =
    resolved.filter((p) => p.brier_score != null).length > 0
      ? resolved
          .filter((p) => p.brier_score != null)
          .reduce((sum, p) => sum + Number(p.brier_score), 0) /
        resolved.filter((p) => p.brier_score != null).length
      : null;

  const closedDisplay = showClosedAll ? resolved : resolved.slice(0, 5);

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayName = profile.display_name ?? `@${profile.username}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Profile header */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Avatar placeholder (initials) */}
            <div className="w-14 h-14 rounded-full bg-[#57D7BA]/15 border-2 border-[#57D7BA]/30 flex items-center justify-center mb-3">
              <span className="text-xl font-bold text-[#57D7BA]">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#f0f6fc] tracking-tight">{displayName}</h1>
            <p className="text-sm text-[#484f58]">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm text-[#8d96a0] leading-relaxed mt-2">{profile.bio}</p>
            )}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {profile.twitter_handle && (
                <a
                  href={`https://twitter.com/${profile.twitter_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#8d96a0] hover:text-[#57D7BA] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />@{profile.twitter_handle}
                </a>
              )}
              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#8d96a0] hover:text-[#57D7BA] transition-colors"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Website
                </a>
              )}
              <span className="inline-flex items-center gap-1 text-xs text-[#8d96a0]">
                <Users className="w-3.5 h-3.5" />
                {followerCount} follower{followerCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="shrink-0 inline-flex items-center gap-1.5 bg-[#0d1117] border border-[#21262d] text-xs font-semibold text-[#8d96a0] hover:text-[#f0f6fc] hover:border-[#57D7BA]/30 px-3 py-1.5 rounded-lg transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: Target,
            label: "Total Calls",
            value: predictions.length,
            color: "#57D7BA",
          },
          {
            icon: CheckCircle,
            label: "Resolved",
            value: resolved.length,
            color: "#3fb950",
          },
          {
            icon: BarChart3,
            label: "Accuracy",
            value: accuracy != null ? `${accuracy}%` : "—",
            color: accuracy != null && accuracy >= 60 ? "#3fb950" : accuracy != null ? "#f85149" : "#8d96a0",
          },
          {
            icon: Zap,
            label: "Brier Score",
            value: avgBrier != null ? avgBrier.toFixed(3) : "—",
            color: avgBrier != null && avgBrier < 0.2 ? "#3fb950" : avgBrier != null ? "#f85149" : "#8d96a0",
          },
          ...(communityPredictionCount > 0
            ? [{
                icon: Users,
                label: "Community",
                value: communityPredictionCount,
                color: "#f59e0b",
              }]
            : []),
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-[#161b27] border border-[#21262d] p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
                {s.label}
              </span>
            </div>
            <div className="text-xl font-bold font-mono" style={{ color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Open predictions */}
      <div>
        <h2 className="text-sm font-bold text-[#f0f6fc] mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#8d96a0]" />
          Open Predictions
          <span className="text-[10px] font-bold text-[#484f58] bg-[#0d1117] border border-[#21262d] px-1.5 py-0.5 rounded-full">
            {open.length}
          </span>
        </h2>
        {open.length === 0 ? (
          <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-6 text-center">
            <Clock className="w-6 h-6 text-[#484f58] mx-auto mb-2" />
            <p className="text-sm text-[#484f58]">No open predictions yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {open.map((p) => (
              <PredictionRow key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>

      {/* Resolved predictions */}
      {resolved.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#f0f6fc] mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#3fb950]" />
            Resolved Predictions
            <span className="text-[10px] font-bold text-[#484f58] bg-[#0d1117] border border-[#21262d] px-1.5 py-0.5 rounded-full">
              {resolved.length}
            </span>
          </h2>
          <div className="space-y-2">
            {closedDisplay.map((p) => (
              <PredictionRow key={p.id} p={p} />
            ))}
          </div>
          {resolved.length > 5 && (
            <button
              onClick={() => setShowClosedAll((v) => !v)}
              className="mt-3 w-full text-center text-xs text-[#484f58] hover:text-[#8d96a0] transition-colors py-2"
            >
              {showClosedAll ? "Show less" : `Show all ${resolved.length} resolved predictions`}
            </button>
          )}
        </div>
      )}

      {/* CTA for visitors without a profile */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 text-center space-y-3">
        <TrendingUp className="w-6 h-6 text-[#57D7BA] mx-auto" />
        <p className="text-sm font-semibold text-[#f0f6fc]">Track your own predictions</p>
        <p className="text-xs text-[#8d96a0]">
          Create a free public profile, log your market calls, and build a verifiable track record.
        </p>
        <Link
          href="/profile/claim"
          className="inline-flex items-center gap-1.5 bg-[#57D7BA] text-[#0d1117] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#57D7BA]/90 transition-all"
        >
          Create your profile
        </Link>
      </div>
    </div>
  );
}
