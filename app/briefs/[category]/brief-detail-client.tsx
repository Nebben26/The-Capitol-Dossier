"use client";

import { useState } from "react";
import { Copy, Check, Rss, Code } from "lucide-react";

interface Brief {
  slug: string;
  category: string;
  title: string;
  generated_at: string;
  source_market_count: number | null;
  word_count: number | null;
  brief_markdown: string;
  brief_html: string;
  brief_json: any;
}

type Format = "markdown" | "html" | "json";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#21262d]/80 text-[#8d96a0] hover:text-[#f0f6fc] transition-all"
    >
      {copied ? <Check className="size-3 text-[#3fb950]" /> : <Copy className="size-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

const FORMAT_LABELS: Record<Format, string> = {
  markdown: "Markdown",
  html: "HTML",
  json: "JSON",
};

export function BriefDetailClient({ brief }: { brief: Brief }) {
  const [format, setFormat] = useState<Format>("markdown");

  const content =
    format === "markdown"
      ? brief.brief_markdown
      : format === "html"
      ? brief.brief_html
      : JSON.stringify(brief.brief_json, null, 2);

  const categoryLower = brief.category.toLowerCase();
  const apiUrl = `https://quivermarkets.com/api/briefs/${categoryLower}`;
  const rssUrl = `https://quivermarkets.com/api/briefs/${categoryLower}/rss`;

  return (
    <div className="space-y-6">
      {/* Format toggle + actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg overflow-hidden border border-[#21262d]">
          {(["markdown", "html", "json"] as Format[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                format === f
                  ? "bg-[#57D7BA] text-[#0d1117]"
                  : "bg-[#161b27] text-[#8d96a0] hover:text-[#f0f6fc] hover:bg-[#1c2333]"
              }`}
            >
              {FORMAT_LABELS[f]}
            </button>
          ))}
        </div>

        <CopyButton text={content} />

        <a
          href={`${apiUrl}?format=${format}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#21262d]/80 text-[#8d96a0] hover:text-[#f0f6fc] transition-all"
        >
          <Code className="size-3" />
          Raw API
        </a>

        <a
          href={rssUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[#f59e0b] hover:bg-[#f59e0b]/20 transition-all"
        >
          <Rss className="size-3" />
          RSS Feed
        </a>
      </div>

      {/* Content area */}
      {format === "markdown" && (
        <div className="rounded-xl bg-[#0d1117] border border-[#21262d] p-6">
          <pre className="text-sm text-[#f0f6fc] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {brief.brief_markdown}
          </pre>
        </div>
      )}

      {format === "html" && (
        <div className="rounded-xl border border-[#21262d] overflow-hidden">
          <div className="bg-[#161b27] px-4 py-2 border-b border-[#21262d]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">
              Email-safe HTML preview
            </span>
          </div>
          <div
            className="p-4 bg-[#0d1117]"
            dangerouslySetInnerHTML={{ __html: brief.brief_html }}
          />
        </div>
      )}

      {format === "json" && (
        <div className="rounded-xl bg-[#0d1117] border border-[#21262d] p-6">
          <pre className="text-xs text-[#f0f6fc] font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {JSON.stringify(brief.brief_json, null, 2)}
          </pre>
        </div>
      )}

      {/* Embed snippet */}
      <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Embed this brief</p>
        <pre className="text-xs text-[#f0f6fc] font-mono bg-[#0d1117] border border-[#21262d] rounded-lg p-3 whitespace-pre overflow-x-auto">{`<div data-quiver-widget="brief" data-id="${categoryLower}" data-theme="dark"></div>
<script src="https://quivermarkets.com/embed.js" async></script>`}</pre>
        <div className="flex gap-2">
          <CopyButton text={`<div data-quiver-widget="brief" data-id="${categoryLower}" data-theme="dark"></div>\n<script src="https://quivermarkets.com/embed.js" async></script>`} />
        </div>
      </div>
    </div>
  );
}
