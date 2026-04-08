"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Clock, Database, Activity, RefreshCw } from "lucide-react";
import { getSystemStats } from "@/lib/api";

function fmtAge(iso: string | null): string {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ageColor(iso: string | null): string {
  if (!iso) return "#4a5168";
  const mins = (Date.now() - new Date(iso).getTime()) / 60_000;
  if (mins < 60) return "#22c55e";
  if (mins < 120) return "#f59e0b";
  return "#ef4444";
}

interface StatRowProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

function StatRow({ label, value, sub, color }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#2f374f]/60 last:border-0">
      <span className="text-[13px] text-[#8892b0]">{label}</span>
      <div className="text-right">
        <span className="text-sm font-mono font-semibold tabular-nums" style={{ color: color || "#e2e8f0" }}>
          {value}
        </span>
        {sub && <p className="text-[10px] text-[#4a5168]">{sub}</p>}
      </div>
    </div>
  );
}

export default function StatusPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getSystemStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const load = async () => {
    setLoading(true);
    const s = await getSystemStats();
    setStats(s);
    setLastChecked(new Date());
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  const ingestOk = stats?.latestIngestAt
    ? (Date.now() - new Date(stats.latestIngestAt).getTime()) < 2 * 3_600_000 // < 2h
    : null;

  const signalOk = stats?.latestSignalAt
    ? (Date.now() - new Date(stats.latestSignalAt).getTime()) < 4 * 3_600_000 // < 4h
    : null;

  const overallOk = ingestOk !== false && signalOk !== false;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">System Status</h1>
          {!loading && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{
                backgroundColor: overallOk ? "#22c55e18" : "#ef444418",
                color: overallOk ? "#22c55e" : "#ef4444",
              }}
            >
              {overallOk ? <CheckCircle2 className="size-3.5" /> : <AlertCircle className="size-3.5" />}
              {overallOk ? "All systems operational" : "Degraded"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[#8892b0] text-sm">
            Auto-refreshes every 30 seconds.
          </p>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1 text-[11px] text-[#57D7BA] hover:text-[#57D7BA]/80 transition-colors"
          >
            <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
            Refresh now
          </button>
        </div>
        <p className="text-[10px] text-[#4a5168]">
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      </div>

      {/* Data pipeline health */}
      <Card className="bg-[#222638] border-[#2f374f]">
        <CardContent className="p-5 space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="size-4 text-[#57D7BA]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Data Pipeline</h2>
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-[#2f374f]/60">
            <span className="text-[13px] text-[#8892b0]">Market ingest</span>
            <div className="flex items-center gap-2">
              {ingestOk !== null && (
                <span className="size-1.5 rounded-full" style={{ backgroundColor: ingestOk ? "#22c55e" : "#ef4444" }} />
              )}
              <span className="text-sm font-mono font-semibold tabular-nums" style={{ color: ageColor(stats?.latestIngestAt ?? null) }}>
                {loading ? "—" : fmtAge(stats?.latestIngestAt ?? null)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-2.5">
            <span className="text-[13px] text-[#8892b0]">Signal computation</span>
            <div className="flex items-center gap-2">
              {signalOk !== null && (
                <span className="size-1.5 rounded-full" style={{ backgroundColor: signalOk ? "#22c55e" : "#ef4444" }} />
              )}
              <span className="text-sm font-mono font-semibold tabular-nums" style={{ color: ageColor(stats?.latestSignalAt ?? null) }}>
                {loading ? "—" : fmtAge(stats?.latestSignalAt ?? null)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database counts */}
      <Card className="bg-[#222638] border-[#2f374f]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="size-4 text-[#57D7BA]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Database</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-[#2f374f] rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <StatRow label="Markets indexed" value={stats?.marketsCount?.toLocaleString() ?? "—"} />
              <StatRow label="Whale wallets tracked" value={stats?.whalesCount?.toLocaleString() ?? "—"} />
              <StatRow label="Active disagreements" value={stats?.disagreementsCount?.toLocaleString() ?? "—"} />
              <StatRow label="Smart signals" value={stats?.signalsCount?.toLocaleString() ?? "—"} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Uptime */}
      <Card className="bg-[#222638] border-[#2f374f]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="size-4 text-[#57D7BA]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Uptime</h2>
          </div>
          <p className="text-[13px] text-[#8892b0] leading-relaxed">
            Uptime tracking via UptimeRobot — public dashboard coming soon.
          </p>
        </CardContent>
      </Card>

      <p className="text-[11px] text-[#4a5168] text-center">
        Issues?{" "}
        <a href="mailto:hello@quivermarkets.com" className="text-[#57D7BA] hover:underline">
          Email us
        </a>
      </p>
    </div>
  );
}
