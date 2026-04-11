"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CONDITION_LABELS, CONDITION_UNITS, type AlertCondition } from "@/lib/alert-evaluator";

interface Props {
  open: boolean;
  onClose: () => void;
  prefilledMarketId?: string;
  prefilledQuestion?: string;
  onCreated?: () => void;
}

const CONDITIONS: AlertCondition[] = [
  "price_above",
  "price_below",
  "spread_above",
  "volume_above",
  "whale_entry",
];

export function CustomAlertModal({ open, onClose, prefilledMarketId = "", prefilledQuestion = "", onCreated }: Props) {
  const [marketId, setMarketId] = useState(prefilledMarketId);
  const [question, setQuestion] = useState(prefilledQuestion);
  const [condition, setCondition] = useState<AlertCondition>("price_above");
  const [threshold, setThreshold] = useState("60");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const unit = CONDITION_UNITS[condition];
  const needsThreshold = condition !== "whale_entry";

  const handleSave = async () => {
    if (!marketId.trim()) {
      setError("Market ID is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { error: dbErr } = await supabase.from("user_alerts").insert({
        market_id: marketId.trim(),
        market_question: question.trim() || marketId.trim(),
        condition,
        threshold: needsThreshold ? parseFloat(threshold) : 0,
        enabled: true,
      });
      if (dbErr) throw dbErr;
      setSaved(true);
      onCreated?.();
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save alert.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md bg-[#161b27] border border-[#21262d] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#21262d]">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-[#57D7BA]/15 flex items-center justify-center">
              <Bell className="size-4 text-[#57D7BA]" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#f0f6fc]">Create Custom Alert</div>
              <div className="text-[10px] text-[#8d96a0]">Get notified when a market hits your threshold</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-lg bg-[#21262d] flex items-center justify-center text-[#8d96a0] hover:text-[#f0f6fc] transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Market ID */}
          <div>
            <label className="text-[11px] font-semibold text-[#8d96a0] uppercase tracking-wide mb-1.5 block">
              Market ID
            </label>
            <input
              type="text"
              value={marketId}
              onChange={(e) => setMarketId(e.target.value)}
              placeholder="e.g. polymarket-xyz or kalshi-abc"
              className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-sm font-mono text-[#f0f6fc] placeholder:text-[#484f58] focus:outline-none focus:border-[#57D7BA]/50"
            />
          </div>

          {/* Question label */}
          <div>
            <label className="text-[11px] font-semibold text-[#8d96a0] uppercase tracking-wide mb-1.5 block">
              Label <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Will X happen by Y?"
              className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] placeholder:text-[#484f58] focus:outline-none focus:border-[#57D7BA]/50"
            />
          </div>

          {/* Condition selector */}
          <div>
            <label className="text-[11px] font-semibold text-[#8d96a0] uppercase tracking-wide mb-1.5 block">
              Condition
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={`px-3 py-2 rounded-lg text-[11px] font-semibold text-left transition-all border ${
                    condition === c
                      ? "bg-[#57D7BA]/15 border-[#57D7BA]/40 text-[#57D7BA]"
                      : "bg-[#0d1117] border-[#21262d] text-[#8d96a0] hover:text-[#f0f6fc]"
                  }`}
                >
                  {CONDITION_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Threshold input */}
          {needsThreshold && (
            <div>
              <label className="text-[11px] font-semibold text-[#8d96a0] uppercase tracking-wide mb-1.5 block">
                Threshold {unit && <span className="normal-case font-normal">({unit})</span>}
              </label>
              <div className="flex items-center gap-2">
                {unit === "$" && <span className="text-sm text-[#8d96a0]">$</span>}
                <input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="flex-1 bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-sm font-mono text-[#f0f6fc] focus:outline-none focus:border-[#57D7BA]/50"
                  min="0"
                  step={unit === "¢" ? "1" : "100"}
                />
                {unit !== "$" && <span className="text-sm text-[#8d96a0]">{unit}</span>}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-[#f85149]">{error}</p>
          )}

          <Button
            className="w-full font-semibold"
            style={{ backgroundColor: saved ? "#3fb950" : "#57D7BA", color: "#0d1117" }}
            onClick={handleSave}
            disabled={saving || saved}
          >
            {saved ? (
              <><Check className="size-4 mr-1.5" /> Alert saved!</>
            ) : saving ? (
              "Saving…"
            ) : (
              <><Bell className="size-4 mr-1.5" /> Create Alert</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
