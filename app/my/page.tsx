"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Activity,
  Layers,
  Award,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Portfolio {
  id: number;
  polymarket_address: string;
  polymarket_username: string | null;
  connected_at: string | null;
  last_synced_at: string | null;
  sync_status: string;
  sync_error: string | null;
  total_value_usd: number;
  total_pnl_usd: number;
  total_pnl_pct: number;
  position_count: number;
}

interface Position {
  id: number;
  market_id: string;
  market_question: string;
  market_slug: string | null;
  outcome: string;
  side: string;
  size: number;
  avg_entry_price: number;
  current_price: number;
  cost_basis_usd: number;
  current_value_usd: number;
  realized_pnl_usd: number;
  unrealized_pnl_usd: number;
  status: string;
  resolves_at: string | null;
}

interface Snapshot {
  snapshot_at: string;
  total_value_usd: number;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2) {
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function pnlColor(n: number) {
  return n >= 0 ? "#3fb950" : "#f85149";
}

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color = "#f0f6fc",
  sub,
}: {
  label: string;
  value: string;
  icon: any;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#8d96a0]">
          {label}
        </span>
      </div>
      <div className="text-xl font-bold font-mono" style={{ color }}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-[#484f58] mt-0.5">{sub}</div>}
    </div>
  );
}

function PositionCard({ position }: { position: Position }) {
  const totalPnl = position.unrealized_pnl_usd + position.realized_pnl_usd;
  const isProfit = totalPnl >= 0;
  const pnlPct =
    position.cost_basis_usd > 0 ? (totalPnl / position.cost_basis_usd) * 100 : 0;
  const isOpen = position.status === "open";

  return (
    <Link
      href={`/markets/${position.market_id}`}
      className="block rounded-xl bg-[#161b27] border border-[#21262d] hover:border-[#57D7BA]/30 transition-all duration-150 p-4 group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-1.5 mb-2">
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
                position.side === "yes"
                  ? "bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/20"
                  : "bg-[#f85149]/15 text-[#f85149] border border-[#f85149]/20"
              }`}
            >
              {position.side.toUpperCase()}
            </span>
            {!isOpen && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide bg-[#8d96a0]/10 text-[#8d96a0] border border-[#484f58]/30">
                Closed
              </span>
            )}
            {position.outcome && (
              <span className="text-[9px] text-[#484f58] font-mono">{position.outcome}</span>
            )}
          </div>

          {/* Market question */}
          <div className="text-sm font-semibold text-[#f0f6fc] line-clamp-2 leading-snug mb-2 group-hover:text-[#57D7BA] transition-colors">
            {position.market_question}
          </div>

          {/* Position stats row */}
          <div className="flex items-center gap-3 text-[11px] text-[#8d96a0] font-mono flex-wrap">
            <span>
              <span className="text-[#484f58]">Size </span>
              {position.size.toFixed(1)}
            </span>
            <span>
              <span className="text-[#484f58]">Entry </span>
              {(position.avg_entry_price * 100).toFixed(0)}¢
            </span>
            <span>
              <span className="text-[#484f58]">Now </span>
              {(position.current_price * 100).toFixed(0)}¢
            </span>
            {position.resolves_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {new Date(position.resolves_at) < new Date()
                  ? "Resolved"
                  : new Date(position.resolves_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {/* P&L column */}
        <div className="text-right shrink-0">
          <div className="text-base font-bold font-mono text-[#f0f6fc]">
            ${fmt(position.current_value_usd)}
          </div>
          <div
            className="text-xs font-semibold font-mono flex items-center gap-0.5 justify-end"
            style={{ color: pnlColor(totalPnl) }}
          >
            {isProfit ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isProfit ? "+" : ""}${fmt(totalPnl)}
          </div>
          <div
            className="text-[10px] font-mono"
            style={{ color: pnlColor(totalPnl) }}
          >
            {isProfit ? "+" : ""}
            {pnlPct.toFixed(1)}%
          </div>
        </div>
      </div>
    </Link>
  );
}

function PortfolioSparkline({ snapshots }: { snapshots: Snapshot[] }) {
  if (snapshots.length < 2) return null;

  const data = snapshots.map((s) => ({
    t: new Date(s.snapshot_at).getTime(),
    v: s.total_value_usd,
  }));

  const first = data[0].v;
  const last = data[data.length - 1].v;
  const isUp = last >= first;
  const color = isUp ? "#3fb950" : "#f85149";

  return (
    <div className="mt-4">
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#484f58] mb-2">
        Portfolio History
      </div>
      <div className="h-16">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
            <Tooltip
              contentStyle={{
                background: "#0d1117",
                border: "1px solid #21262d",
                borderRadius: 8,
                fontSize: 11,
              }}
              labelFormatter={() => ""}
              formatter={(val) => [`$${fmt(Number(val ?? 0))}`, "Value"]}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── WALLET CONNECT FORM ─────────────────────────────────────────────────────

function WalletConnectForm({
  onConnected,
}: {
  onConnected: () => void;
}) {
  const [walletInput, setWalletInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    const addr = walletInput.trim();
    if (!addr) return;

    setConnecting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Not signed in.");
        return;
      }

      const res = await fetch("/api/portfolio/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ walletAddress: addr }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Connection failed.");
        return;
      }

      onConnected();
    } catch (err: any) {
      setError(err.message || "Unexpected error.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#57D7BA]/10 flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5 text-[#57D7BA]" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#f0f6fc]">Connect your Polymarket wallet</h2>
          <p className="text-xs text-[#8d96a0] mt-1 leading-relaxed">
            Paste your Polymarket proxy wallet address (starts with{" "}
            <code className="text-[#57D7BA] bg-[#0d1117] px-1 rounded">0x</code>, 42 characters) and
            we'll fetch your positions, compute P&amp;L, and link each market to Quiver's intelligence
            layer. We never request signatures or private keys — read-only.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-[#f85149]/10 border border-[#f85149]/30 p-3 text-sm text-[#f85149] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="space-y-3">
        <input
          type="text"
          value={walletInput}
          onChange={(e) => setWalletInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          placeholder="0x0000000000000000000000000000000000000000"
          className="w-full bg-[#0d1117] border border-[#21262d] text-[#f0f6fc] text-sm font-mono px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#57D7BA]/50 placeholder-[#484f58] transition-colors"
        />
        <button
          onClick={handleConnect}
          disabled={connecting || !walletInput.trim()}
          className="w-full bg-[#57D7BA] hover:bg-[#57D7BA]/80 disabled:opacity-50 text-[#0d1117] font-bold text-sm py-3 rounded-lg transition-colors"
        >
          {connecting ? "Verifying wallet…" : "Connect wallet →"}
        </button>
      </div>

      <div className="space-y-1.5 text-[10px] text-[#484f58] leading-relaxed">
        <p>
          <strong className="text-[#8d96a0]">Where to find your address:</strong> Go to
          polymarket.com → click your profile icon (top right) → copy the proxy wallet address shown.
        </p>
        <p>
          This is your Polymarket <em>proxy</em> wallet, not your MetaMask/Coinbase address.
          It's a unique address Polymarket creates for each account.
        </p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function MyQuiverPage() {
  const [user, setUser] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  const loadPortfolio = useCallback(async (userId: string) => {
    const { data: portData } = await supabase
      .from("user_portfolios")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (portData) {
      setPortfolio(portData);

      const [posRes, snapRes] = await Promise.all([
        supabase
          .from("user_positions")
          .select("*")
          .eq("portfolio_id", portData.id)
          .order("current_value_usd", { ascending: false }),
        supabase
          .from("portfolio_snapshots")
          .select("snapshot_at, total_value_usd")
          .eq("portfolio_id", portData.id)
          .order("snapshot_at", { ascending: true })
          .limit(90),
      ]);

      setPositions(posRes.data || []);
      setSnapshots(snapRes.data || []);
    } else {
      setPortfolio(null);
      setPositions([]);
      setSnapshots([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      if (u) await loadPortfolio(u.id);
      setLoading(false);
    };
    init();
  }, [loadPortfolio]);

  const handleConnected = async () => {
    if (!user) return;
    await loadPortfolio(user.id);
    // Auto-sync after connecting
    await syncNow();
  };

  const syncNow = async () => {
    if (!user) return;
    setSyncing(true);
    setSyncError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/portfolio/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setSyncError(data.error || "Sync failed.");
        return;
      }

      await loadPortfolio(user.id);
    } catch (err: any) {
      setSyncError(err.message || "Unexpected error.");
    } finally {
      setSyncing(false);
    }
  };

  const disconnectWallet = async () => {
    if (
      !confirm(
        "Disconnect your wallet? Your synced position history will be deleted from Quiver. Your Polymarket account is unaffected."
      )
    )
      return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch("/api/portfolio/disconnect", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    setPortfolio(null);
    setPositions([]);
    setSnapshots([]);
  };

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
        <div className="h-8 w-48 rounded-lg bg-[#161b27] animate-pulse" />
        <div className="h-40 rounded-xl bg-[#161b27] animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-[#161b27] animate-pulse" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-[#161b27] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Not signed in ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#57D7BA]/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-[#57D7BA]" />
          </div>
          <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">My Quiver</h1>
        </div>
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-8 text-center space-y-4">
          <Wallet className="w-12 h-12 text-[#484f58] mx-auto" />
          <div>
            <h2 className="text-lg font-bold text-[#f0f6fc] mb-1">
              Sign in to track your portfolio
            </h2>
            <p className="text-sm text-[#8d96a0]">
              Connect your Polymarket wallet to see your positions, P&amp;L, and apply
              Quiver's intelligence to your own trades.
            </p>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 bg-[#57D7BA] text-[#0d1117] text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-[#57D7BA]/90 transition-colors"
          >
            Sign in / Sign up
          </Link>
        </div>
      </div>
    );
  }

  // ── Connected state (with or without positions) ────────────────────────────
  const openPositions = positions.filter((p) => p.status === "open");
  const closedPositions = positions.filter((p) => p.status === "closed");
  const redeemable = positions.filter(
    (p) => p.unrealized_pnl_usd > 0 && p.status === "closed"
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#57D7BA]/10 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-[#57D7BA]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#f0f6fc] tracking-tight">My Quiver</h1>
          <p className="text-xs text-[#8d96a0]">
            Your Polymarket portfolio with Quiver intelligence layered on top.
          </p>
        </div>
      </div>

      {/* ── Sync error ──────────────────────────────────────────────────── */}
      {syncError && (
        <div className="rounded-xl bg-[#f85149]/10 border border-[#f85149]/30 p-4 text-sm text-[#f85149] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {syncError}
        </div>
      )}

      {/* ── Not connected ────────────────────────────────────────────────── */}
      {!portfolio ? (
        <WalletConnectForm onConnected={handleConnected} />
      ) : (
        <>
          {/* ── Portfolio header card ──────────────────────────────────── */}
          <div className="rounded-xl bg-gradient-to-br from-[#57D7BA]/8 via-[#161b27] to-[#161b27] border border-[#57D7BA]/20 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#8d96a0] mb-1">
                  Total Portfolio Value
                </div>
                <div className="text-4xl font-bold font-mono text-[#f0f6fc] tabular-nums">
                  ${fmt(portfolio.total_value_usd)}
                </div>
                <div
                  className="text-sm font-semibold mt-1.5 flex items-center gap-1"
                  style={{ color: pnlColor(portfolio.total_pnl_usd) }}
                >
                  {portfolio.total_pnl_usd >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {portfolio.total_pnl_usd >= 0 ? "+" : ""}${fmt(
                    Math.abs(portfolio.total_pnl_usd)
                  )}{" "}
                  ({portfolio.total_pnl_pct >= 0 ? "+" : ""}
                  {portfolio.total_pnl_pct.toFixed(2)}%) all time
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#484f58]">
                  <Wallet className="w-3 h-3" />
                  <a
                    href={`https://polymarket.com/profile/${portfolio.polymarket_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#57D7BA] transition-colors"
                  >
                    {truncateAddress(portfolio.polymarket_address)}
                  </a>
                </div>

                <button
                  onClick={syncNow}
                  disabled={syncing}
                  className="flex items-center gap-1.5 bg-[#0d1117] border border-[#21262d] hover:border-[#57D7BA]/40 text-xs font-semibold text-[#f0f6fc] px-3 py-2 rounded-lg transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing…" : "Sync now"}
                </button>

                {portfolio.last_synced_at && (
                  <div className="text-[10px] text-[#484f58] flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo(portfolio.last_synced_at)}
                  </div>
                )}
              </div>
            </div>

            {/* Sparkline */}
            <PortfolioSparkline snapshots={snapshots} />
          </div>

          {/* ── Stat grid ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Total Positions"
              value={portfolio.position_count.toString()}
              icon={Layers}
            />
            <StatCard
              label="Open"
              value={openPositions.length.toString()}
              icon={Activity}
              color="#57D7BA"
              sub={`$${fmt(openPositions.reduce((s, p) => s + p.current_value_usd, 0))} at risk`}
            />
            <StatCard
              label="Closed"
              value={closedPositions.length.toString()}
              icon={CheckCircle}
              color="#8d96a0"
            />
            <StatCard
              label="Redeemable"
              value={redeemable.length.toString()}
              icon={Award}
              color="#d29922"
              sub={redeemable.length > 0 ? "Claim on Polymarket" : undefined}
            />
          </div>

          {/* ── Positions: open ───────────────────────────────────────── */}
          {openPositions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#8d96a0]">
                  Open Positions
                </h2>
                <span className="text-[10px] text-[#484f58]">{openPositions.length} markets</span>
              </div>
              <div className="space-y-2">
                {openPositions.map((pos) => (
                  <PositionCard key={pos.id} position={pos} />
                ))}
              </div>
            </div>
          )}

          {/* ── Positions: closed (collapsible) ──────────────────────── */}
          {closedPositions.length > 0 && (
            <div>
              <button
                onClick={() => setShowClosed((v) => !v)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8d96a0] hover:text-[#f0f6fc] transition-colors mb-3 w-full"
              >
                {showClosed ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                Closed Positions
                <span className="text-[#484f58] font-normal normal-case tracking-normal">
                  ({closedPositions.length})
                </span>
              </button>
              {showClosed && (
                <div className="space-y-2">
                  {closedPositions.map((pos) => (
                    <PositionCard key={pos.id} position={pos} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Empty state ───────────────────────────────────────────── */}
          {positions.length === 0 && (
            <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-8 text-center space-y-3">
              <Activity className="w-10 h-10 text-[#484f58] mx-auto" />
              <div>
                <p className="text-sm font-semibold text-[#f0f6fc]">No positions found</p>
                <p className="text-xs text-[#8d96a0] mt-1">
                  Sync your wallet to load positions from Polymarket, or verify you entered
                  the correct proxy wallet address.
                </p>
              </div>
              <button
                onClick={syncNow}
                disabled={syncing}
                className="inline-flex items-center gap-2 bg-[#57D7BA] hover:bg-[#57D7BA]/80 disabled:opacity-50 text-[#0d1117] font-bold text-xs px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing…" : "Sync positions"}
              </button>
            </div>
          )}

          {/* ── Intelligence cross-link ───────────────────────────────── */}
          {positions.length > 0 && (
            <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#f0f6fc] mb-0.5">
                  Cross-reference with whale activity
                </p>
                <p className="text-[11px] text-[#8d96a0]">
                  See if tracked whale wallets are on the same side as your positions.
                </p>
              </div>
              <Link
                href="/whales"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#57D7BA] hover:text-[#57D7BA]/80 transition-colors shrink-0"
              >
                Whale tracker
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* ── Disconnect ────────────────────────────────────────────── */}
          <div className="text-center pt-2 pb-4">
            <button
              onClick={disconnectWallet}
              className="text-xs text-[#484f58] hover:text-[#f85149] transition-colors"
            >
              Disconnect wallet
            </button>
          </div>
        </>
      )}
    </div>
  );
}
