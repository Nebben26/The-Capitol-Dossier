"use client";

import { ExternalLink, ShieldCheck, ShieldAlert } from "lucide-react";
import type { ResolutionDiffResult } from "@/lib/resolution-diff";

export interface ResolutionCriteriaDiffProps {
  result: ResolutionDiffResult;
  polymarketUrl?: string | null;
  kalshiUrl?: string | null;
}

function highlightDiffs(text: string, keyDifferences: string[]): React.ReactNode {
  if (keyDifferences.length === 0) return text;

  // Extract individual words that appear in keyDifferences strings
  const highlightWords = new Set<string>();
  for (const diff of keyDifferences) {
    const matches = diff.match(/"([^"]+)"/g);
    if (matches) {
      for (const m of matches) {
        highlightWords.add(m.replace(/"/g, "").toLowerCase());
      }
    }
    // Also flag scope keywords
    for (const kw of ["any", "designated", "specific", "officially", "minimum", "maximum", "exactly"]) {
      if (diff.toLowerCase().includes(kw)) highlightWords.add(kw);
    }
  }

  if (highlightWords.size === 0) return text;

  const parts: React.ReactNode[] = [];
  const regex = new RegExp(`\\b(${[...highlightWords].map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi");
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <mark
        key={match.index}
        className="rounded px-0.5"
        style={{ backgroundColor: "#f59e0b33", color: "#f59e0b" }}
      >
        {match[0]}
      </mark>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function SimilarityBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.8 ? "#22c55e" : score >= 0.5 ? "#fbbf24" : "#ef4444";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[9px] text-[#8892b0]">
        <span>Similarity</span>
        <span className="font-mono font-bold" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#2f374f] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function ResolutionCriteriaDiff({
  result,
  polymarketUrl,
  kalshiUrl,
}: ResolutionCriteriaDiffProps) {
  const isUnavailable =
    result.polymarketCriteria === "Not available" ||
    result.kalshiCriteria === "Not available";

  // ─── Not available case ────────────────────────────────────────────────
  if (isUnavailable) {
    return (
      <div className="rounded-xl bg-[#222638] border border-[#2f374f] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-[#8892b0]" />
          <span className="text-xs font-semibold text-[#e2e8f0]">Resolution Criteria Verification</span>
        </div>
        <p className="text-[11px] text-[#8892b0] leading-relaxed">
          Resolution criteria not available for automated comparison. Verify manually on both platforms before trading.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {polymarketUrl && (
            <a
              href={polymarketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1a1e2e] border border-[#2f374f] text-[10px] text-[#8892b0] hover:text-[#6366f1] hover:border-[#6366f1]/30 transition-all"
            >
              <ExternalLink className="size-3" /> Open on Polymarket
            </a>
          )}
          {kalshiUrl && (
            <a
              href={kalshiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1a1e2e] border border-[#2f374f] text-[10px] text-[#8892b0] hover:text-[#22c55e] hover:border-[#22c55e]/30 transition-all"
            >
              <ExternalLink className="size-3" /> Open on Kalshi
            </a>
          )}
        </div>
      </div>
    );
  }

  // ─── Full diff view ────────────────────────────────────────────────────
  return (
    <div className="rounded-xl bg-[#222638] border border-[#2f374f] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        {result.differencesFound ? (
          <ShieldAlert className="size-4 text-[#f59e0b]" />
        ) : (
          <ShieldCheck className="size-4 text-[#22c55e]" />
        )}
        <span className="text-xs font-semibold text-[#e2e8f0]">Resolution Criteria Verification</span>
      </div>

      {/* Warning banner */}
      {result.warning && (
        <div
          className="px-3 py-2 rounded-lg text-[10px] leading-relaxed"
          style={{
            backgroundColor:
              result.differenceType === "scope"
                ? "#ef444420"
                : "#f59e0b18",
            borderLeft: `3px solid ${result.differenceType === "scope" ? "#ef4444" : "#f59e0b"}`,
            color: result.differenceType === "scope" ? "#fca5a5" : "#fde68a",
          }}
        >
          {result.warning}
        </div>
      )}

      {/* Side-by-side criteria texts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Polymarket */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#6366f1] font-semibold uppercase tracking-wide">Polymarket</span>
            {polymarketUrl && (
              <a
                href={polymarketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[8px] text-[#8892b0] hover:text-[#6366f1] transition-colors"
              >
                View source <ExternalLink className="size-2.5" />
              </a>
            )}
          </div>
          <div className="p-2 rounded-lg bg-[#1a1e2e] border border-[#2f374f] font-mono text-[10px] text-[#e2e8f0] leading-relaxed min-h-[60px]">
            {highlightDiffs(result.polymarketCriteria, result.keyDifferences)}
          </div>
        </div>
        {/* Kalshi */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#22c55e] font-semibold uppercase tracking-wide">Kalshi</span>
            {kalshiUrl && (
              <a
                href={kalshiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-[8px] text-[#8892b0] hover:text-[#22c55e] transition-colors"
              >
                View source <ExternalLink className="size-2.5" />
              </a>
            )}
          </div>
          <div className="p-2 rounded-lg bg-[#1a1e2e] border border-[#2f374f] font-mono text-[10px] text-[#e2e8f0] leading-relaxed min-h-[60px]">
            {highlightDiffs(result.kalshiCriteria, result.keyDifferences)}
          </div>
        </div>
      </div>

      {/* Similarity bar */}
      <SimilarityBar score={result.similarityScore} />

      {/* Key differences */}
      {result.keyDifferences.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[9px] text-[#8892b0] font-semibold uppercase tracking-wide">
            Key differences detected:
          </div>
          <ul className="space-y-1">
            {result.keyDifferences.map((diff, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[10px] text-[#e2e8f0]">
                <span className="text-[#f59e0b] mt-0.5 shrink-0">•</span>
                <span className="leading-relaxed">{diff}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
