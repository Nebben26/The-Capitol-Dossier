"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSavedPredictions } from "@/hooks/usePersistence";
import { useAuth } from "@/components/layout/AuthContext";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Crosshair,
  Plus,
  Wallet,
  Target,
  Brain,
  TrendingUp,
  TrendingDown,
  Trophy,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  ChevronDown,
  Trash2,
  Users,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { whales } from "@/lib/mockData";
import { LastUpdated } from "@/components/layout/LastUpdated";
import { TrialBanner, ProBadge } from "@/components/ui/pro-gate";

// ─── TYPES ────────────────────────────────────────────────────────────
interface Prediction {
  id: string;
  question: string;
  probability: number;
  outcome: "YES" | "NO" | null;
  category: string;
  date: string;
}

// ─── SAMPLE CONNECTED WALLET DATA ─────────────────────────────────────
const samplePredictions: Prediction[] = [
  { id: "sp1", question: "US recession by Dec 2024?", probability: 35, outcome: "NO", category: "Economics", date: "Nov 2024" },
  { id: "sp2", question: "Biden wins 2024 election?", probability: 45, outcome: "NO", category: "Elections", date: "Nov 2024" },
  { id: "sp3", question: "BTC above $100K by Dec 2024?", probability: 60, outcome: "YES", category: "Crypto", date: "Dec 2024" },
  { id: "sp4", question: "Fed hikes rates in 2024?", probability: 15, outcome: "NO", category: "Economics", date: "Dec 2024" },
  { id: "sp5", question: "Democrats win House 2024?", probability: 52, outcome: "NO", category: "Elections", date: "Nov 2024" },
  { id: "sp6", question: "S&P 500 above 5500 by mid-2025?", probability: 55, outcome: "YES", category: "Economics", date: "Jun 2025" },
  { id: "sp7", question: "Russia-Ukraine ceasefire by mid-2025?", probability: 30, outcome: "NO", category: "Geopolitics", date: "Jun 2025" },
  { id: "sp8", question: "OpenAI IPO by end 2025?", probability: 25, outcome: "NO", category: "Tech", date: "Dec 2025" },
  { id: "sp9", question: "NVIDIA highest market cap 2025?", probability: 70, outcome: "YES", category: "Economics", date: "Mar 2025" },
  { id: "sp10", question: "X/Twitter IPO by 2025?", probability: 20, outcome: "NO", category: "Tech", date: "Dec 2025" },
  { id: "sp11", question: "Inflation below 3% by mid-2025?", probability: 65, outcome: "YES", category: "Economics", date: "Jun 2025" },
  { id: "sp12", question: "Starship achieves orbit Q1 2026?", probability: 72, outcome: "YES", category: "Tech", date: "Mar 2026" },
  { id: "sp13", question: "UK snap election before April 2026?", probability: 18, outcome: "NO", category: "Elections", date: "Mar 2026" },
  { id: "sp14", question: "TikTok banned in US by March 2026?", probability: 40, outcome: "YES", category: "Tech", date: "Mar 2026" },
  { id: "sp15", question: "Fed raises rates Q1 2026?", probability: 12, outcome: "NO", category: "Economics", date: "Mar 2026" },
];

const CATEGORIES = ["Economics", "Elections", "Crypto", "Tech", "Geopolitics"];

// ─── BRIER SCORE CALC ─────────────────────────────────────────────────
function brierScore(predictions: Prediction[]): number {
  const resolved = predictions.filter((p) => p.outcome !== null);
  if (resolved.length === 0) return 0;
  const sum = resolved.reduce((acc, p) => {
    const prob = p.probability / 100;
    const actual = p.outcome === "YES" ? 1 : 0;
    return acc + Math.pow(prob - actual, 2);
  }, 0);
  return sum / resolved.length;
}

function accuracy(predictions: Prediction[]): number {
  const resolved = predictions.filter((p) => p.outcome !== null);
  if (resolved.length === 0) return 0;
  const correct = resolved.filter((p) => {
    if (p.outcome === "YES") return p.probability >= 50;
    return p.probability < 50;
  }).length;
  return Math.round((correct / resolved.length) * 100);
}

// ─── MAIN ─────────────────────────────────────────────────────────────
export default function CalibrationPage() {
  const { predictions, loaded, addPrediction: savePrediction, removePrediction: deletePrediction, importPredictions } = useSavedPredictions();
  const { user, setShowLogin } = useAuth();
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formQ, setFormQ] = useState("");
  const [formProb, setFormProb] = useState("50");
  const [formOutcome, setFormOutcome] = useState<"YES" | "NO" | "">("");
  const [formCat, setFormCat] = useState("Economics");
  const [formDate, setFormDate] = useState("");

  const connectWallet = () => {
    if (!user) { setShowLogin(true); return; }
    importPredictions(samplePredictions);
  };

  const addPrediction = () => {
    if (!formQ || !formOutcome) return;
    savePrediction({
      question: formQ,
      probability: parseInt(formProb) || 50,
      outcome: formOutcome as "YES" | "NO",
      category: formCat,
      date: formDate || new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    });
    setFormQ(""); setFormProb("50"); setFormOutcome(""); setFormDate("");
    setShowForm(false);
  };

  const removePrediction = (id: string) => {
    deletePrediction(id);
  };

  const resolved = predictions.filter((p) => p.outcome !== null);
  const myBrier = brierScore(predictions);
  const myAccuracy = accuracy(predictions);

  // Calibration scatter data: bucket predictions into 10% bins
  const calibrationData = useMemo(() => {
    if (resolved.length === 0) return [];
    const bins: Record<number, { total: number; yesCount: number }> = {};
    for (let b = 5; b <= 95; b += 10) bins[b] = { total: 0, yesCount: 0 };
    resolved.forEach((p) => {
      const bin = Math.round(p.probability / 10) * 10;
      const key = Math.max(5, Math.min(95, bin === 0 ? 5 : bin === 100 ? 95 : bin));
      if (!bins[key]) bins[key] = { total: 0, yesCount: 0 };
      bins[key].total++;
      if (p.outcome === "YES") bins[key].yesCount++;
    });
    return Object.entries(bins)
      .filter(([, v]) => v.total > 0)
      .map(([k, v]) => ({
        predicted: parseInt(k),
        actual: Math.round((v.yesCount / v.total) * 100),
        count: v.total,
      }));
  }, [resolved]);

  // Category performance
  const catPerf = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const catPreds = resolved.filter((p) => p.category === cat);
      if (catPreds.length === 0) return null;
      const correct = catPreds.filter((p) => (p.outcome === "YES" ? p.probability >= 50 : p.probability < 50)).length;
      return { category: cat, winRate: Math.round((correct / catPreds.length) * 100), trades: catPreds.length, brier: Math.round(brierScore(catPreds) * 100) / 100 };
    }).filter(Boolean) as { category: string; winRate: number; trades: number; brier: number }[];
  }, [resolved]);

  // Over/under confidence
  const confidence = useMemo(() => {
    if (resolved.length === 0) return { over: 0, under: 0, label: "N/A" };
    const highConf = resolved.filter((p) => p.probability >= 70 || p.probability <= 30);
    const highCorrect = highConf.filter((p) => (p.outcome === "YES" ? p.probability >= 50 : p.probability < 50)).length;
    const highRate = highConf.length > 0 ? highCorrect / highConf.length : 0;
    const overconfident = highRate < 0.6;
    return { over: overconfident ? Math.round((1 - highRate) * 100) : 0, under: !overconfident ? Math.round(highRate * 100) : 0, label: overconfident ? "Overconfident" : "Well Calibrated" };
  }, [resolved]);

  // Whale comparison
  const topWhales = whales.slice(0, 5);

  // P&L simulation over time
  const pnlCurve = useMemo(() => {
    let cumPnl = 0;
    return resolved.map((p, i) => {
      const correct = p.outcome === "YES" ? p.probability >= 50 : p.probability < 50;
      cumPnl += correct ? 100 : -80;
      return { idx: i + 1, pnl: cumPnl };
    });
  }, [resolved]);

  const catColors: Record<string, string> = { Economics: "#57D7BA", Elections: "#6366f1", Crypto: "#f59e0b", Tech: "#ec4899", Geopolitics: "#8b5cf6" };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-5 space-y-5">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Crosshair className="size-7 text-[#6366f1]" />
            Personal Calibration Audit
          </h1>
          <p className="text-sm text-[#8892b0] mt-1 flex items-center gap-1.5">
            Track your prediction accuracy,{" "}
            <Tooltip>
              <TooltipTrigger><span className="underline decoration-dotted cursor-help">Brier score</span></TooltipTrigger>
              <TooltipContent className="max-w-[220px] text-[11px]">A measure of how accurate a probability prediction is. Lower is better. A perfect score is 0, worst is 2.</TooltipContent>
            </Tooltip>
            , and{" "}
            <Tooltip>
              <TooltipTrigger><span className="underline decoration-dotted cursor-help">calibration</span></TooltipTrigger>
              <TooltipContent className="max-w-[220px] text-[11px]">Whether your 70% predictions actually happen 70% of the time. Good calibration means your confidence matches reality.</TooltipContent>
            </Tooltip>
            {" "}vs top whales
          </p>
        </div>
        <LastUpdated />
      </div>

      <TrialBanner />

      {/* ─── CONNECT OR ADD ──────────────────────────────── */}
      {loaded && predictions.length === 0 && (
        <Card className="bg-[#161b27] border-[#21262d]">
          <CardContent className="py-12 text-center space-y-5">
            <Crosshair className="size-14 text-[#21262d] mx-auto" />
            <h2 className="text-xl font-bold">How good are your predictions?</h2>
            <p className="text-sm text-[#8892b0] max-w-md mx-auto">
              Connect your Polymarket wallet to auto-import your trading history, or manually add your past predictions to get a full calibration analysis.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button onClick={connectWallet} className="bg-[#6366f1] text-white hover:bg-[#6366f1]/80 h-11 px-6 font-semibold gap-2">
                <Wallet className="size-4" /> Connect Polymarket Wallet
              </Button>
              <Button onClick={() => { setShowForm(true); }} variant="outline" className="border-[#21262d] text-[#8892b0] hover:text-[#57D7BA] hover:border-[#57D7BA]/30 h-11 px-6 gap-2">
                <Plus className="size-4" /> Add Predictions Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── ADD PREDICTION FORM ──────────────────────────── */}
      {(showForm || predictions.length > 0) && (
        <Card className="bg-[#161b27] border-[#21262d]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Plus className="size-4 text-[#57D7BA]" /> Add a Prediction
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-2">
                <label className="block text-[10px] text-[#8892b0] uppercase tracking-wider mb-1">Question</label>
                <input type="text" value={formQ} onChange={(e) => setFormQ(e.target.value)} placeholder="Will X happen by Y?"
                  className="w-full h-9 px-3 rounded-lg bg-[#0d1117] border border-[#21262d] text-sm text-[#e2e8f0] focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] text-[#8892b0] uppercase tracking-wider mb-1">Your Probability</label>
                <div className="relative">
                  <input type="number" min="1" max="99" value={formProb} onChange={(e) => setFormProb(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-[#0d1117] border border-[#21262d] text-sm text-[#e2e8f0] font-mono focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 transition-all" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8892b0]">%</span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[#8892b0] uppercase tracking-wider mb-1">Outcome</label>
                <div className="flex gap-1.5">
                  <button onClick={() => setFormOutcome("YES")} className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${formOutcome === "YES" ? "bg-[#22c55e] text-white" : "bg-[#0d1117] border border-[#21262d] text-[#8892b0]"}`}>YES</button>
                  <button onClick={() => setFormOutcome("NO")} className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${formOutcome === "NO" ? "bg-[#ef4444] text-white" : "bg-[#0d1117] border border-[#21262d] text-[#8892b0]"}`}>NO</button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-[#8892b0] uppercase tracking-wider mb-1">Category</label>
                <div className="relative">
                  <select value={formCat} onChange={(e) => setFormCat(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-[#0d1117] border border-[#21262d] text-sm text-[#e2e8f0] appearance-none focus:outline-none focus:ring-1 focus:ring-[#57D7BA]/50 transition-all">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-[#8892b0] pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Button onClick={addPrediction} disabled={!formQ || !formOutcome} className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 font-semibold gap-1.5">
                <Plus className="size-4" /> Add
              </Button>
              {predictions.length === 0 && (
                <Button onClick={connectWallet} variant="outline" className="border-[#21262d] text-[#8892b0] hover:text-[#6366f1] gap-1.5">
                  <Wallet className="size-4" /> Or connect wallet
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── DASHBOARD (shown when we have data) ──────────── */}
      {predictions.length > 0 && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Brier Score", val: myBrier.toFixed(3), color: myBrier <= 0.15 ? "#22c55e" : myBrier <= 0.25 ? "#f59e0b" : "#ef4444", desc: myBrier <= 0.15 ? "Excellent" : myBrier <= 0.25 ? "Good" : "Needs work" },
              { label: "Accuracy", val: `${myAccuracy}%`, color: myAccuracy >= 70 ? "#22c55e" : myAccuracy >= 55 ? "#f59e0b" : "#ef4444", desc: `${resolved.length} resolved` },
              { label: "Total Predictions", val: String(predictions.length), color: "#57D7BA", desc: `${resolved.length} resolved` },
              { label: "Confidence", val: confidence.label, color: confidence.label === "Overconfident" ? "#f59e0b" : "#22c55e", desc: confidence.over > 0 ? `${confidence.over}% miss rate` : "Well tuned" },
              { label: "Whale Rank", val: myBrier <= 0.15 ? "Top 10%" : myBrier <= 0.25 ? "Top 30%" : "Top 60%", color: "#6366f1", desc: "vs 2,847 tracked" },
            ].map((s) => (
              <Card key={s.label} className="bg-[#161b27] border-[#21262d]">
                <CardContent className="p-3 text-center">
                  <div className="text-xl font-bold font-mono tabular-nums" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-[10px] text-[#8892b0] uppercase tracking-wider">{s.label}</div>
                  <div className="text-[9px] text-[#8892b0]/60 mt-0.5">{s.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Calibration Scatter */}
            <Card className="bg-[#161b27] border-[#21262d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Crosshair className="size-4 text-[#6366f1]" /> Calibration Chart</CardTitle>
                <CardDescription className="text-[10px] text-[#8892b0]">Dots on the 45° line = perfectly calibrated</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                      <XAxis type="number" dataKey="predicted" domain={[0, 100]} tick={{ fill: "#8892b0", fontSize: 10 }} axisLine={{ stroke: "#21262d" }} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="number" dataKey="actual" domain={[0, 100]} tick={{ fill: "#8892b0", fontSize: 10 }} axisLine={{ stroke: "#21262d" }} tickFormatter={(v) => `${v}%`} />
                      <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} stroke="#8892b0" strokeDasharray="6 4" strokeOpacity={0.4} />
                      <Scatter data={calibrationData} fillOpacity={0.8}>
                        {calibrationData.map((entry, i) => {
                          const diff = Math.abs(entry.predicted - entry.actual);
                          return <Cell key={i} fill={diff <= 10 ? "#57D7BA" : diff <= 20 ? "#f59e0b" : "#ef4444"} r={Math.min(entry.count * 3 + 4, 12)} />;
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 mt-2 text-[9px] text-[#8892b0]">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#57D7BA]" />±10% (great)</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#f59e0b]" />±20% (ok)</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#ef4444]" />&gt;20% (off)</span>
                  <span className="flex items-center gap-1"><span className="w-4 border-t border-dashed border-[#8892b0]" />Perfect</span>
                </div>
              </CardContent>
            </Card>

            {/* P&L Curve */}
            <Card className="bg-[#161b27] border-[#21262d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="size-4 text-[#22c55e]" /> Simulated P&L</CardTitle>
                <CardDescription className="text-[10px] text-[#8892b0]">$100 per correct bet, -$80 per incorrect</CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={pnlCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="calPnl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                      <XAxis dataKey="idx" tick={{ fill: "#8892b0", fontSize: 10 }} axisLine={{ stroke: "#21262d" }} />
                      <YAxis tick={{ fill: "#8892b0", fontSize: 10 }} axisLine={{ stroke: "#21262d" }} tickFormatter={(v) => `$${v}`} />
                      <ReferenceLine y={0} stroke="#8892b0" strokeDasharray="3 3" />
                      <Area type="monotone" dataKey="pnl" stroke="#22c55e" strokeWidth={2} fill="url(#calPnl)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category + Whale Comparison row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Win Rate */}
            <Card className="bg-[#161b27] border-[#21262d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="size-4 text-[#57D7BA]" /> Win Rate by Category</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                {catPerf.length > 0 ? (
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={catPerf} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fill: "#8892b0", fontSize: 10 }} axisLine={{ stroke: "#21262d" }} tickFormatter={(v) => `${v}%`} />
                        <YAxis type="category" dataKey="category" tick={{ fill: "#e2e8f0", fontSize: 11 }} axisLine={{ stroke: "#21262d" }} width={75} />
                        <ReferenceLine x={50} stroke="#8892b0" strokeDasharray="4 4" strokeOpacity={0.4} />
                        <Bar dataKey="winRate" radius={[0, 4, 4, 0]} barSize={16}>
                          {catPerf.map((c, i) => <Cell key={i} fill={catColors[c.category] || "#57D7BA"} fillOpacity={0.8} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-[#8892b0] text-center py-8">Add more predictions to see category breakdown</p>
                )}
              </CardContent>
            </Card>

            {/* Whale Comparison */}
            <Card className="bg-[#161b27] border-[#21262d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Users className="size-4 text-[#8b5cf6]" /> You vs Top Whales</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-2 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#21262d] hover:bg-transparent">
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">TRADER</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">BRIER</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium">ACC%</TableHead>
                      <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4">TRADES</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-[#6366f1]/30 bg-[#6366f1]/5">
                      <TableCell className="pl-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-[#6366f1] flex items-center justify-center"><span className="text-[8px] font-bold text-white">You</span></div>
                          <span className="text-xs font-semibold text-[#6366f1]">Your Score</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2"><span className="font-mono text-xs font-bold tabular-nums text-[#6366f1]">{myBrier.toFixed(3)}</span></TableCell>
                      <TableCell className="py-2"><span className="font-mono text-xs font-bold tabular-nums text-[#6366f1]">{myAccuracy}%</span></TableCell>
                      <TableCell className="pr-4 py-2"><span className="font-mono text-xs text-[#6366f1] tabular-nums">{resolved.length}</span></TableCell>
                    </TableRow>
                    {topWhales.map((w) => (
                      <TableRow key={w.id} className="border-[#21262d]/50 hover:bg-[#57D7BA]/5 transition-colors">
                        <TableCell className="pl-4 py-2">
                          <Link href={`/whales/${w.id}`} className="flex items-center gap-2 hover:text-[#57D7BA] transition-colors">
                            <div className="size-6 rounded-full bg-gradient-to-br from-[#57D7BA] to-[#8b5cf6] flex items-center justify-center"><span className="text-[7px] font-bold text-[#0f1119]">#{w.rank}</span></div>
                            <span className="text-xs font-medium text-[#e2e8f0]">{w.name}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="py-2"><span className={`font-mono text-xs font-semibold tabular-nums ${w.brier <= myBrier ? "text-[#22c55e]" : "text-[#8892b0]"}`}>{w.brier.toFixed(3)}</span></TableCell>
                        <TableCell className="py-2"><span className="font-mono text-xs font-semibold tabular-nums text-[#e2e8f0]">{w.accuracy}%</span></TableCell>
                        <TableCell className="pr-4 py-2"><span className="font-mono text-xs text-[#8892b0] tabular-nums">{w.totalTrades}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Prediction History */}
          <Card className="bg-[#161b27] border-[#21262d]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Target className="size-4 text-[#57D7BA]" /> Prediction History</CardTitle>
                <Button onClick={() => setShowForm(true)} size="xs" className="bg-[#57D7BA] text-[#0f1119] hover:bg-[#57D7BA]/80 gap-1"><Plus className="size-3" />Add</Button>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-2 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#21262d] hover:bg-transparent">
                    <TableHead className="text-[10px] text-[#8892b0] font-medium pl-4">QUESTION</TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium">YOUR PROB</TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium">OUTCOME</TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium">RESULT</TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium">CAT</TableHead>
                    <TableHead className="text-[10px] text-[#8892b0] font-medium pr-4"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.map((p) => {
                    const correct = p.outcome !== null && (p.outcome === "YES" ? p.probability >= 50 : p.probability < 50);
                    return (
                      <TableRow key={p.id} className="border-[#21262d]/50 hover:bg-[#57D7BA]/5 transition-colors">
                        <TableCell className="pl-4 py-2 max-w-[200px]"><span className="text-xs text-[#e2e8f0] line-clamp-1">{p.question}</span></TableCell>
                        <TableCell className="py-2"><span className="font-mono text-xs font-semibold tabular-nums text-[#e2e8f0]">{p.probability}%</span></TableCell>
                        <TableCell className="py-2">
                          {p.outcome ? (
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${p.outcome === "YES" ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
                              {p.outcome}
                            </span>
                          ) : <span className="text-[10px] text-[#8892b0]">Pending</span>}
                        </TableCell>
                        <TableCell className="py-2">
                          {p.outcome ? (correct ? <CheckCircle className="size-4 text-[#22c55e]" /> : <XCircle className="size-4 text-[#ef4444]" />) : <span className="text-[10px] text-[#8892b0]">—</span>}
                        </TableCell>
                        <TableCell className="py-2"><span className="px-1.5 py-0.5 rounded text-[8px] font-semibold" style={{ backgroundColor: `${catColors[p.category] || "#57D7BA"}15`, color: catColors[p.category] || "#57D7BA" }}>{p.category}</span></TableCell>
                        <TableCell className="pr-4 py-2">
                          <button onClick={() => removePrediction(p.id)} className="text-[#8892b0] hover:text-[#ef4444] transition-colors"><Trash2 className="size-3" /></button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <footer className="flex items-center justify-between py-4 border-t border-[#21262d] text-[10px] text-[#8892b0]">
        <span>© 2026 Quiver Markets. Not financial advice. Data from Polymarket &amp; Kalshi.</span>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="hover:text-[#57D7BA] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#57D7BA] transition-colors">Privacy</Link>
          
        </div>
      </footer>
    </div>
  );
}
