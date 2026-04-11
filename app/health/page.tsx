"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Activity,
} from "lucide-react";

interface HealthCheck {
  service: string;
  status: "ok" | "warning" | "error";
  message: string;
}

interface HealthResponse {
  status: "ok" | "warning" | "error";
  timestamp: string;
  elapsedMs: number;
  checks: HealthCheck[];
  summary: {
    total: number;
    ok: number;
    warnings: number;
    errors: number;
  };
}

function statusColor(status: string) {
  if (status === "ok") return "#3fb950";
  if (status === "warning") return "#d29922";
  return "#f85149";
}

function StatusIcon({ status }: { status: string }) {
  if (status === "ok")
    return <CheckCircle className="w-4 h-4 shrink-0" style={{ color: "#3fb950" }} />;
  if (status === "warning")
    return <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#d29922" }} />;
  return <XCircle className="w-4 h-4 shrink-0" style={{ color: "#f85149" }} />;
}

function overallLabel(status: string) {
  if (status === "ok") return "All systems operational";
  if (status === "warning") return "Degraded service";
  return "Critical issues detected";
}

export default function HealthPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/health");
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#57D7BA]" />
            System Health
          </h1>
          <p className="text-sm text-[#8d96a0] mt-1">
            Real-time status of all production services.
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-1.5 bg-[#161b27] border border-[#21262d] hover:border-[#57D7BA]/40 text-xs font-semibold text-[#f0f6fc] px-3 py-2 rounded-lg transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {fetchError && (
        <div className="rounded-xl bg-[#f85149]/10 border border-[#f85149]/30 p-4 text-sm text-[#f85149]">
          Failed to fetch health: {fetchError}
        </div>
      )}

      {loading && !data && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-[#161b27] border border-[#21262d] p-4 h-14 animate-pulse"
            />
          ))}
        </div>
      )}

      {data && (
        <>
          <div
            className="rounded-xl border p-5"
            style={{
              background: `${statusColor(data.status)}10`,
              borderColor: `${statusColor(data.status)}40`,
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <StatusIcon status={data.status} />
                <div>
                  <div
                    className="text-base font-bold uppercase tracking-wider"
                    style={{ color: statusColor(data.status) }}
                  >
                    {overallLabel(data.status)}
                  </div>
                  <div className="text-[11px] text-[#8d96a0] mt-0.5">
                    {data.summary.ok} ok · {data.summary.warnings} warnings ·{" "}
                    {data.summary.errors} errors · {data.elapsedMs}ms
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-[#484f58] font-mono shrink-0">
                {new Date(data.timestamp).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {data.checks.map((check, i) => (
              <div
                key={i}
                className="rounded-lg bg-[#161b27] border border-[#21262d] p-4 flex items-start gap-3"
              >
                <StatusIcon status={check.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#f0f6fc]">
                    {check.service}
                  </div>
                  <div className="text-xs text-[#8d96a0] mt-0.5 break-words">
                    {check.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="text-[10px] text-[#484f58] pt-4">
        Internal monitoring tool. Hit{" "}
        <code className="bg-[#161b27] px-1 py-0.5 rounded">/api/health</code> for
        the raw JSON.
      </div>
    </div>
  );
}
