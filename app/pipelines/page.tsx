"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type RunStatus = "running" | "completed" | "completed_with_errors" | "failed";
type EventStatus = "received" | "processed" | "failed" | "skipped";

interface IngestionRun {
  id: number;
  started_at: string;
  completed_at: string | null;
  status: RunStatus;
  markets_fetched: number | null;
  markets_upserted: number | null;
  disagreements_upserted: number | null;
  whales_processed: number | null;
  duration_seconds: number | null;
  errors: unknown | null;
  source: string;
}

interface BriefSend {
  id: number;
  sent_at: string;
  subscriber_count: number;
  success_count: number;
  failure_count: number;
  subject: string;
}

interface StripeEvent {
  id: string;
  type: string;
  received_at: string;
  processed_at: string | null;
  status: EventStatus;
  error: string | null;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed" || status === "processed" || status === "ok")
    return <CheckCircle className="w-3 h-3 shrink-0 text-[#3fb950]" />;
  if (status === "completed_with_errors" || status === "warning" || status === "received")
    return <AlertTriangle className="w-3 h-3 shrink-0 text-[#d29922]" />;
  if (status === "failed" || status === "error")
    return <XCircle className="w-3 h-3 shrink-0 text-[#f85149]" />;
  return <Activity className="w-3 h-3 shrink-0 text-[#57D7BA] animate-pulse" />;
}

function statusColor(status: string): string {
  if (status === "completed" || status === "processed") return "text-[#3fb950]";
  if (status === "completed_with_errors" || status === "received") return "text-[#d29922]";
  if (status === "failed") return "text-[#f85149]";
  return "text-[#57D7BA]";
}

function fmtTime(ts: string) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PipelinesPage() {
  const [ingestionRuns, setIngestionRuns] = useState<IngestionRun[]>([]);
  const [briefSends, setBriefSends] = useState<BriefSend[]>([]);
  const [stripeEvents, setStripeEvents] = useState<StripeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [runs, briefs, events] = await Promise.all([
      supabase
        .from("ingestion_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20),
      supabase
        .from("morning_brief_sends")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(10),
      supabase
        .from("stripe_events")
        .select("id, type, received_at, processed_at, status, error")
        .order("received_at", { ascending: false })
        .limit(20),
    ]);
    setIngestionRuns((runs.data as IngestionRun[]) || []);
    setBriefSends((briefs.data as BriefSend[]) || []);
    setStripeEvents((events.data as StripeEvent[]) || []);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const lastRun = ingestionRuns[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#57D7BA]" />
            Pipeline Status
          </h1>
          <p className="text-sm text-[#8d96a0] mt-1">
            Background jobs, scheduled tasks, and webhook processing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[10px] text-[#484f58] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-1.5 bg-[#161b27] border border-[#21262d] hover:border-[#57D7BA]/40 text-xs font-semibold text-[#f0f6fc] px-3 py-2 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Last run summary banner */}
      {lastRun && (
        <div
          className="rounded-xl border p-4 flex items-center gap-4"
          style={{
            background:
              lastRun.status === "completed"
                ? "#3fb95010"
                : lastRun.status === "running"
                ? "#57D7BA10"
                : lastRun.status === "completed_with_errors"
                ? "#d2992210"
                : "#f8514910",
            borderColor:
              lastRun.status === "completed"
                ? "#3fb95030"
                : lastRun.status === "running"
                ? "#57D7BA30"
                : lastRun.status === "completed_with_errors"
                ? "#d2992230"
                : "#f8514930",
          }}
        >
          <StatusIcon status={lastRun.status} />
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-bold ${statusColor(lastRun.status)}`}>
              Last ingestion:{" "}
              {lastRun.status === "running" ? "In progress" : lastRun.status.replace(/_/g, " ")}
            </div>
            <div className="text-[11px] text-[#8d96a0] mt-0.5">
              {fmtTime(lastRun.started_at)}
              {lastRun.duration_seconds ? ` · ${lastRun.duration_seconds}s` : ""}
              {lastRun.markets_upserted != null
                ? ` · ${lastRun.markets_upserted.toLocaleString()} markets`
                : ""}
              {lastRun.disagreements_upserted != null
                ? ` · ${lastRun.disagreements_upserted} disagreements`
                : ""}
            </div>
          </div>
          <div className="text-[10px] text-[#484f58] font-mono shrink-0">
            #{lastRun.id} · {lastRun.source}
          </div>
        </div>
      )}

      {/* Ingestion Runs */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#8d96a0] mb-3">
          Ingestion Runs (last 20)
        </h2>
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[#0d1117] text-[#484f58] uppercase tracking-wider text-[9px]">
              <tr>
                <th className="px-3 py-2 text-left">Started</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Markets</th>
                <th className="px-3 py-2 text-right">Disagreements</th>
                <th className="px-3 py-2 text-right">Duration</th>
                <th className="px-3 py-2 text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {ingestionRuns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[#484f58]">
                    No runs recorded yet — run{" "}
                    <code className="bg-[#0d1117] px-1 rounded">session15-ingestion-runs.sql</code>{" "}
                    first
                  </td>
                </tr>
              ) : (
                ingestionRuns.map((run) => (
                  <tr key={run.id} className="border-t border-[#21262d] hover:bg-[#1c2333]/50">
                    <td className="px-3 py-2 text-[#f0f6fc] font-mono">
                      {fmtTime(run.started_at)}
                    </td>
                    <td className="px-3 py-2">
                      <div className={`flex items-center gap-1.5 ${statusColor(run.status)}`}>
                        <StatusIcon status={run.status} />
                        {run.status.replace(/_/g, " ")}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[#f0f6fc]">
                      {run.markets_upserted?.toLocaleString() ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[#f0f6fc]">
                      {run.disagreements_upserted ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[#8d96a0]">
                      {run.duration_seconds ? `${run.duration_seconds}s` : "—"}
                    </td>
                    <td className="px-3 py-2 text-[#484f58] font-mono">{run.source}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Morning Brief Sends */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#8d96a0] mb-3">
          Morning Brief Sends (last 10)
        </h2>
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[#0d1117] text-[#484f58] uppercase tracking-wider text-[9px]">
              <tr>
                <th className="px-3 py-2 text-left">Sent</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Success</th>
                <th className="px-3 py-2 text-right">Failed</th>
                <th className="px-3 py-2 text-left">Subject</th>
              </tr>
            </thead>
            <tbody>
              {briefSends.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-[#484f58]">
                    No briefs sent yet
                  </td>
                </tr>
              ) : (
                briefSends.map((send) => (
                  <tr key={send.id} className="border-t border-[#21262d] hover:bg-[#1c2333]/50">
                    <td className="px-3 py-2 text-[#f0f6fc] font-mono">
                      {fmtTime(send.sent_at)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[#f0f6fc]">
                      {send.subscriber_count}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[#3fb950]">
                      {send.success_count}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[#f85149]">
                      {send.failure_count}
                    </td>
                    <td className="px-3 py-2 text-[#8d96a0] truncate max-w-[240px]">
                      {send.subject}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Stripe Events */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#8d96a0] mb-3">
          Stripe Events (last 20)
        </h2>
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[#0d1117] text-[#484f58] uppercase tracking-wider text-[9px]">
              <tr>
                <th className="px-3 py-2 text-left">Received</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Error</th>
              </tr>
            </thead>
            <tbody>
              {stripeEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-[#484f58]">
                    No Stripe events yet — run{" "}
                    <code className="bg-[#0d1117] px-1 rounded">session15-stripe-events.sql</code>{" "}
                    to enable logging
                  </td>
                </tr>
              ) : (
                stripeEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="border-t border-[#21262d] hover:bg-[#1c2333]/50"
                  >
                    <td className="px-3 py-2 text-[#f0f6fc] font-mono">
                      {fmtTime(event.received_at)}
                    </td>
                    <td className="px-3 py-2 text-[#f0f6fc] font-mono">{event.type}</td>
                    <td className="px-3 py-2">
                      <div className={`flex items-center gap-1.5 ${statusColor(event.status)}`}>
                        <StatusIcon status={event.status} />
                        {event.status}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[#f85149] truncate max-w-[200px]">
                      {event.error ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-[10px] text-[#484f58] pt-2">
        Internal monitoring tool. Refreshes automatically every 30s.{" "}
        <a href="/health" className="text-[#57D7BA]/60 hover:text-[#57D7BA]">
          → System health
        </a>
      </p>
    </div>
  );
}
