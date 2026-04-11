"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Code,
  Copy,
  Check,
  GitCompareArrows,
  Users,
  BarChart3,
  Layers,
  Sun,
  Moon,
  ExternalLink,
  Zap,
  Globe,
  TrendingUp,
} from "lucide-react";

const WIDGET_TYPES = [
  {
    value: "market",
    label: "Market Price",
    icon: BarChart3,
    desc: "Show live price, 24h change, and volume for any prediction market.",
    idLabel: "Market ID",
    idPlaceholder: "e.g. trump-wins-2024",
  },
  {
    value: "arb",
    label: "Arb Spread",
    icon: GitCompareArrows,
    desc: "Display cross-platform arbitrage data between Polymarket and Kalshi.",
    idLabel: "Disagreement ID",
    idPlaceholder: "e.g. abc123",
  },
  {
    value: "whale",
    label: "Whale Tracker",
    icon: Users,
    desc: "Show a whale wallet's P&L, open positions, and accuracy.",
    idLabel: "Wallet Address",
    idPlaceholder: "e.g. 0x1234…abcd",
  },
  {
    value: "category",
    label: "Category Feed",
    icon: Layers,
    desc: "Top 5 markets by volume in a given category.",
    idLabel: "Category Name",
    idPlaceholder: "e.g. Politics",
  },
];

const POPULAR_MARKETS = [
  { label: "2024 US Presidential Election", id: "will-donald-trump-win-the-2024-us-presidential-election" },
  { label: "Federal Reserve Rate Decision", id: "will-the-fed-cut-rates-in-2025" },
  { label: "Bitcoin price target", id: "will-bitcoin-reach-100k-in-2025" },
  { label: "Gaza ceasefire", id: "will-there-be-a-ceasefire-in-gaza-in-2025" },
];

const FEATURES = [
  {
    icon: Globe,
    title: "Works anywhere",
    desc: "Paste one script tag and one div. Works on WordPress, Substack, Ghost, raw HTML — anywhere.",
  },
  {
    icon: Zap,
    title: "Live data, no maintenance",
    desc: "Widgets refresh every 60 seconds automatically. You paste once, data stays current forever.",
  },
  {
    icon: TrendingUp,
    title: "Dark & light themes",
    desc: "Two themes out of the box. Matches your site whether you run light or dark mode.",
  },
];

export default function EmbedBuilderPage() {
  const [type, setType] = useState("market");
  const [id, setId] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const scriptInjectedRef = useRef(false);

  const selectedType = WIDGET_TYPES.find((t) => t.value === type)!;

  const embedCode = id.trim()
    ? `<div data-quiver-widget="${type}" data-id="${id.trim()}" data-theme="${theme}"></div>\n<script src="https://quivermarkets.com/embed.js" async><\/script>`
    : "";

  // Inject / re-render the live preview
  useEffect(() => {
    if (!previewRef.current) return;
    const el = previewRef.current;
    el.innerHTML = "";

    if (!id.trim()) return;

    // Create the widget div
    const widget = document.createElement("div");
    widget.setAttribute("data-quiver-widget", type);
    widget.setAttribute("data-id", id.trim());
    widget.setAttribute("data-theme", theme);
    el.appendChild(widget);

    // Only inject the script once
    if (!scriptInjectedRef.current) {
      const existing = document.getElementById("qm-embed-script");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "qm-embed-script";
        script.src = "/embed.js";
        document.body.appendChild(script);
        scriptInjectedRef.current = true;
      } else {
        scriptInjectedRef.current = true;
      }
    }

    // If script already loaded, manually trigger render for this element
    if (scriptInjectedRef.current && (window as any).__qmRenderWidget) {
      (window as any).__qmRenderWidget(widget);
    } else {
      // Poll until embed.js initialises the widget
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if ((window as any).__qmRenderWidget) {
          (window as any).__qmRenderWidget(widget);
          clearInterval(poll);
        } else if (tries > 30) {
          clearInterval(poll);
          // embed.js auto-inits on DOMContentLoaded/load; re-fire for newly added element
          const ev = new Event("qm-reinit");
          document.dispatchEvent(ev);
        }
      }, 200);
    }
  }, [type, id, theme]);

  const handleCopy = () => {
    if (!embedCode) return;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
      {/* Hero */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#388bfd]/10 border border-[#388bfd]/20 text-[#388bfd] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-2">
          <Code className="w-3.5 h-3.5" />
          Embed Builder
        </div>
        <h1 className="text-3xl font-bold text-[#f0f6fc] tracking-tight">
          Put live prediction market data anywhere
        </h1>
        <p className="text-sm text-[#8d96a0] leading-relaxed">
          Drop one snippet into your blog, newsletter, or news site. Quiver widgets show live prices,
          arb spreads, and whale activity — automatically refreshed every 60 seconds. Free forever.
        </p>
      </div>

      {/* Features row */}
      <div className="grid sm:grid-cols-3 gap-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl bg-[#161b27] border border-[#21262d] p-4 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#388bfd]/10 flex items-center justify-center">
              <f.icon className="w-4 h-4 text-[#388bfd]" />
            </div>
            <h3 className="text-sm font-semibold text-[#f0f6fc]">{f.title}</h3>
            <p className="text-xs text-[#8d96a0] leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Builder + Preview */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left — Builder form */}
        <div className="space-y-5">
          <h2 className="text-base font-bold text-[#f0f6fc]">Configure your widget</h2>

          {/* Widget type */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
              Widget type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {WIDGET_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setType(t.value); setId(""); }}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    type === t.value
                      ? "border-[#388bfd]/50 bg-[#388bfd]/8 text-[#f0f6fc]"
                      : "border-[#21262d] bg-[#161b27] text-[#8d96a0] hover:border-[#484f58]"
                  }`}
                >
                  <t.icon className={`w-4 h-4 mt-0.5 shrink-0 ${type === t.value ? "text-[#388bfd]" : ""}`} />
                  <div>
                    <div className="text-xs font-semibold">{t.label}</div>
                    <div className="text-[10px] text-[#484f58] leading-relaxed mt-0.5">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ID input */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
              {selectedType.idLabel}
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder={selectedType.idPlaceholder}
              className="w-full bg-[#0d1117] border border-[#21262d] rounded-lg px-3 py-2.5 text-sm text-[#f0f6fc] placeholder:text-[#484f58] focus:outline-none focus:border-[#388bfd]/50 transition-colors"
            />
            {type === "market" && (
              <div className="space-y-1">
                <p className="text-[10px] text-[#484f58]">Popular markets:</p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_MARKETS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setId(m.id)}
                      className="text-[10px] bg-[#0d1117] border border-[#21262d] text-[#8d96a0] hover:text-[#57D7BA] hover:border-[#57D7BA]/30 px-2 py-1 rounded-md transition-all"
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
              Theme
            </label>
            <div className="flex gap-2">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    theme === t
                      ? "border-[#388bfd]/50 bg-[#388bfd]/8 text-[#f0f6fc]"
                      : "border-[#21262d] bg-[#161b27] text-[#8d96a0] hover:border-[#484f58]"
                  }`}
                >
                  {t === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  {t === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </div>

          {/* Generated code */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
              Embed code
            </label>
            {embedCode ? (
              <>
                <div
                  className="bg-[#0d1117] border border-[#21262d] rounded-lg p-3 font-mono text-[11px] text-[#57D7BA] whitespace-pre-wrap break-all leading-relaxed cursor-text select-all"
                  onClick={(e) => {
                    const sel = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(e.currentTarget);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                  }}
                >
                  {embedCode}
                </div>
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 bg-[#388bfd] text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-[#388bfd]/90 transition-all active:scale-[0.98]"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied to clipboard!" : "Copy embed code"}
                </button>
              </>
            ) : (
              <div className="bg-[#0d1117] border border-[#21262d] rounded-lg p-4 text-center text-[11px] text-[#484f58]">
                Enter an ID above to generate embed code
              </div>
            )}
          </div>
        </div>

        {/* Right — Live preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#f0f6fc]">Live preview</h2>
            {id && (
              <span className="text-[10px] text-[#3fb950] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse inline-block" />
                Fetching live data
              </span>
            )}
          </div>
          <div
            className={`rounded-xl border border-[#21262d] p-4 min-h-[140px] ${
              theme === "light" ? "bg-white" : "bg-[#0d1117]"
            }`}
          >
            {id ? (
              <div ref={previewRef} />
            ) : (
              <div className="flex items-center justify-center h-32 text-xs text-[#484f58]">
                Widget preview appears here
              </div>
            )}
          </div>
          <p className="text-[10px] text-[#484f58]">
            This preview fetches the same live data your embed will show. What you see here is what
            your readers will see.
          </p>
        </div>
      </div>

      {/* How to use */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#f0f6fc]">How to embed</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              step: "1",
              title: "Configure above",
              desc: "Choose your widget type, enter the market or whale ID, pick a theme.",
            },
            {
              step: "2",
              title: "Copy the code",
              desc: 'Click "Copy embed code" to copy the two-line snippet to your clipboard.',
            },
            {
              step: "3",
              title: "Paste anywhere",
              desc: "Paste into your blog post HTML, newsletter template, or news article. Done.",
            },
          ].map((s) => (
            <div key={s.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#388bfd]/15 border border-[#388bfd]/30 flex items-center justify-center shrink-0 text-[#388bfd] text-xs font-bold">
                {s.step}
              </div>
              <div>
                <div className="text-xs font-semibold text-[#f0f6fc] mb-0.5">{s.title}</div>
                <div className="text-[11px] text-[#8d96a0] leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Works with */}
      <div className="text-center space-y-3">
        <p className="text-xs text-[#484f58] uppercase tracking-widest font-bold">Works with</p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[#8d96a0]">
          {["WordPress", "Substack", "Ghost", "Webflow", "Squarespace", "Raw HTML", "Notion embed"].map(
            (platform) => (
              <span key={platform} className="px-3 py-1.5 rounded-full bg-[#161b27] border border-[#21262d]">
                {platform}
              </span>
            )
          )}
        </div>
      </div>

      {/* CTA to browse markets */}
      <div className="text-center space-y-3">
        <p className="text-sm text-[#8d96a0]">
          Not sure which market to embed? Browse all markets to find the right ID.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/screener"
            className="inline-flex items-center gap-1.5 bg-[#388bfd]/10 border border-[#388bfd]/20 text-[#388bfd] text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#388bfd]/20 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Browse markets
          </Link>
          <Link
            href="/disagrees"
            className="inline-flex items-center gap-1.5 bg-[#161b27] border border-[#21262d] text-[#8d96a0] text-xs font-semibold px-4 py-2 rounded-lg hover:border-[#484f58] transition-all"
          >
            Browse arb spreads
          </Link>
        </div>
      </div>
    </div>
  );
}
