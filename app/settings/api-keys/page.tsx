"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Key,
  Copy,
  Check,
  Trash2,
  Plus,
  AlertTriangle,
  Eye,
  EyeOff,
  ExternalLink,
  Activity,
  Clock,
  Code,
} from "lucide-react";

interface ApiKey {
  id: number;
  key_prefix: string;
  name: string;
  tier: string;
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  requests_today: number;
  requests_total: number;
  last_used_at: string | null;
  created_at: string;
  active: boolean;
}

function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`inline-flex items-center gap-1 text-[10px] font-semibold transition-colors ${className}`}
    >
      {copied ? <Check className="size-3 text-[#3fb950]" /> : <Copy className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function MaskKey({ prefix }: { prefix: string }) {
  return (
    <span className="font-mono text-xs">
      {prefix}<span className="text-[#484f58]">{"•".repeat(16)}</span>
    </span>
  );
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Modal state
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Revoke confirm
  const [revoking, setRevoking] = useState<number | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        setUser(session.user);
        fetchKeys(session.access_token);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchKeys = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/keys", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const json = await res.json();
      setKeys(json.keys ?? []);
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!token) return;
    setSubmitting(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "Default Key" }),
      });
      const json = await res.json();
      if (!res.ok) { setCreateError(json.error ?? "Failed to create key"); return; }
      setNewKeyResult(json.key);
      fetchKeys(token);
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!token) return;
    setRevokeError(null);
    try {
      const res = await fetch(`/api/v1/keys?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setRevokeError("Failed to revoke key"); return; }
      setRevoking(null);
      fetchKeys(token);
    } catch (err: any) {
      setRevokeError(err.message);
    }
  };

  if (!loading && !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <Key className="size-8 text-[#484f58] mx-auto" />
        <p className="text-sm text-[#8d96a0]">Sign in to manage API keys.</p>
        <Link href="/pricing" className="inline-flex items-center gap-2 bg-[#57D7BA] text-[#0d1117] text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#57D7BA]/90 transition-all">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/settings" className="text-[10px] text-[#484f58] hover:text-[#8d96a0] transition-colors">← Settings</Link>
          </div>
          <h1 className="text-xl font-bold text-[#f0f6fc]">API Keys</h1>
          <p className="text-xs text-[#8d96a0] mt-0.5">
            Create keys for the{" "}
            <Link href="/api" className="text-[#57D7BA] hover:underline">Quiver Markets API v1</Link>.
            Free tier: 1,000 req/day · 30 req/min.
          </p>
        </div>
        <button
          onClick={() => { setCreating(true); setNewKeyResult(null); setNewKeyName(""); setCreateError(null); }}
          disabled={keys.filter(k => k.active).length >= 5}
          className="shrink-0 inline-flex items-center gap-1.5 bg-[#57D7BA] text-[#0d1117] text-xs font-bold px-3 py-2 rounded-lg hover:bg-[#57D7BA]/90 disabled:opacity-40 transition-all"
        >
          <Plus className="size-3.5" />
          New key
        </button>
      </div>

      {/* Create key modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-[#161b27] border border-[#21262d] rounded-2xl p-6 space-y-5 shadow-2xl">
            {!newKeyResult ? (
              <>
                <div>
                  <h2 className="text-base font-bold text-[#f0f6fc]">Create API key</h2>
                  <p className="text-xs text-[#8d96a0] mt-1">Give your key a descriptive name so you can identify it later.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Key name</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Production, My Script, Notebook"
                    className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] placeholder-[#484f58] focus:outline-none focus:border-[#57D7BA]/50"
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                </div>
                {createError && <p className="text-xs text-[#f85149]">{createError}</p>}
                <div className="flex gap-3">
                  <button onClick={handleCreate} disabled={submitting}
                    className="flex-1 bg-[#57D7BA] text-[#0d1117] text-xs font-bold py-2 rounded-lg hover:bg-[#57D7BA]/90 disabled:opacity-50 transition-all">
                    {submitting ? "Creating…" : "Create key"}
                  </button>
                  <button onClick={() => setCreating(false)}
                    className="flex-1 bg-[#0d1117] border border-[#21262d] text-[#8d96a0] text-xs font-semibold py-2 rounded-lg hover:border-[#484f58] transition-all">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="flex items-center gap-2 text-[#3fb950] mb-2">
                    <Check className="size-4" />
                    <h2 className="text-base font-bold text-[#f0f6fc]">Key created!</h2>
                  </div>
                  <div className="rounded-xl bg-[#d29922]/5 border border-[#d29922]/30 p-3 flex gap-2 mb-3">
                    <AlertTriangle className="size-3.5 text-[#d29922] shrink-0 mt-0.5" />
                    <p className="text-[10px] text-[#d29922] leading-relaxed font-semibold">
                      This is the only time you&apos;ll see this key. Copy it now and store it securely. It cannot be retrieved after you close this dialog.
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-[#0d1117] border border-[#21262d] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#484f58]">Your API Key</span>
                    <CopyButton text={newKeyResult} className="text-[#57D7BA] hover:text-[#57D7BA]/80" />
                  </div>
                  <code className="text-xs font-mono text-[#57D7BA] break-all">{newKeyResult}</code>
                </div>
                <button onClick={() => { setCreating(false); setNewKeyResult(null); }}
                  className="w-full bg-[#57D7BA] text-[#0d1117] text-xs font-bold py-2 rounded-lg hover:bg-[#57D7BA]/90 transition-all">
                  I&apos;ve saved my key
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Key list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-[#161b27] border border-[#21262d] animate-pulse" />
          ))}
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] py-16 text-center space-y-3">
          <Key className="size-8 text-[#484f58] mx-auto" />
          <p className="text-sm font-semibold text-[#f0f6fc]">No API keys yet</p>
          <p className="text-xs text-[#484f58]">Create your first key to start using the Quiver Markets API.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k.id} className={`rounded-xl bg-[#161b27] border p-4 space-y-3 transition-colors ${k.active ? "border-[#21262d]" : "border-[#21262d]/40 opacity-60"}`}>
              {/* Key header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#f0f6fc]">{k.name}</span>
                    <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${
                      k.tier === "premium" ? "text-[#a371f7] border-[#a371f7]/30 bg-[#a371f7]/10" :
                      k.tier === "pro" ? "text-[#388bfd] border-[#388bfd]/30 bg-[#388bfd]/10" :
                      "text-[#3fb950] border-[#3fb950]/30 bg-[#3fb950]/10"
                    }`}>{k.tier}</span>
                    {!k.active && <span className="text-[8px] text-[#f85149] border border-[#f85149]/30 bg-[#f85149]/10 px-1.5 py-0.5 rounded-full font-bold uppercase">Revoked</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <MaskKey prefix={k.key_prefix} />
                  </div>
                </div>
                {k.active && (
                  <button
                    onClick={() => setRevoking(revoking === k.id ? null : k.id)}
                    className="shrink-0 text-[#484f58] hover:text-[#f85149] transition-colors p-1"
                    title="Revoke key"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-[#0d1117] border border-[#21262d] px-2.5 py-2">
                  <div className="text-[9px] uppercase tracking-widest text-[#484f58] mb-0.5">Requests today</div>
                  <div className="font-mono text-xs font-bold text-[#f0f6fc]">
                    {(k.requests_today ?? 0).toLocaleString()} <span className="text-[#484f58]">/ {k.rate_limit_per_day.toLocaleString()}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-[#0d1117] border border-[#21262d] px-2.5 py-2">
                  <div className="text-[9px] uppercase tracking-widest text-[#484f58] mb-0.5">Total requests</div>
                  <div className="font-mono text-xs font-bold text-[#f0f6fc]">{(k.requests_total ?? 0).toLocaleString()}</div>
                </div>
                <div className="rounded-lg bg-[#0d1117] border border-[#21262d] px-2.5 py-2">
                  <div className="text-[9px] uppercase tracking-widest text-[#484f58] mb-0.5">Last used</div>
                  <div className="text-xs font-medium text-[#8d96a0]">
                    {k.last_used_at
                      ? new Date(k.last_used_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "Never"}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {k.active && (k.requests_today ?? 0) > 0 && (
                <div className="space-y-1">
                  <div className="h-1 rounded-full bg-[#21262d] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#57D7BA] transition-all"
                      style={{ width: `${Math.min(100, ((k.requests_today ?? 0) / k.rate_limit_per_day) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-[#484f58]">
                    {Math.round(((k.requests_today ?? 0) / k.rate_limit_per_day) * 100)}% of daily limit used · Resets midnight UTC
                  </p>
                </div>
              )}

              {/* Revoke confirm */}
              {revoking === k.id && (
                <div className="rounded-xl bg-[#f85149]/5 border border-[#f85149]/20 p-3 space-y-2">
                  <p className="text-xs text-[#f0f6fc] font-semibold">Revoke &quot;{k.name}&quot;?</p>
                  <p className="text-[10px] text-[#8d96a0]">Any scripts using this key will stop working immediately. This cannot be undone.</p>
                  {revokeError && <p className="text-[10px] text-[#f85149]">{revokeError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => handleRevoke(k.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#f85149]/10 text-[#f85149] border border-[#f85149]/20 hover:bg-[#f85149]/20 transition-all">
                      Yes, revoke key
                    </button>
                    <button onClick={() => setRevoking(null)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-[#484f58] hover:text-[#8d96a0] transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick start */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Code className="size-4 text-[#484f58]" />
          <span className="text-xs font-semibold text-[#f0f6fc]">Quick start</span>
        </div>
        <pre className="text-[10px] font-mono text-[#8d96a0] bg-[#0d1117] rounded-lg p-3 overflow-x-auto leading-relaxed">{`curl -H "Authorization: Bearer YOUR_KEY" \\
  https://quivermarkets.com/api/v1/markets?limit=10`}</pre>
        <Link href="/api" className="inline-flex items-center gap-1 text-xs text-[#57D7BA] hover:underline">
          Full API documentation <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );
}
