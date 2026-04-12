import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Rss, Code, FileText, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Market Briefs — Daily Prediction Market Intelligence",
  description:
    "Daily AI-generated prediction market briefs for Elections, Crypto, Economics, Geopolitics, and Sports. Pull via RSS, JSON API, or embeddable widget.",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Elections: "🗳️",
  Crypto: "₿",
  Economics: "📈",
  Geopolitics: "🌍",
  Sports: "🏆",
};

const CATEGORY_COLORS: Record<string, string> = {
  Elections: "#388bfd",
  Crypto: "#f59e0b",
  Economics: "#3fb950",
  Geopolitics: "#a371f7",
  Sports: "#f85149",
};

function CodeSnippet({ children }: { children: string }) {
  return (
    <code className="block bg-[#0d1117] border border-[#21262d] rounded-lg p-3 text-xs text-[#f0f6fc] font-mono whitespace-pre overflow-x-auto">
      {children}
    </code>
  );
}

export default async function BriefsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch latest brief per category
  const { data: allBriefs } = await supabase
    .from("market_briefs")
    .select("id, slug, category, title, generated_at, source_market_count, word_count, brief_json")
    .order("generated_at", { ascending: false })
    .limit(25);

  // Deduplicate: keep only the latest per category
  type BriefRow = NonNullable<typeof allBriefs>[number];
  const latestByCategory = new Map<string, BriefRow>();
  for (const brief of allBriefs ?? []) {
    if (!latestByCategory.has(brief.category)) {
      latestByCategory.set(brief.category, brief);
    }
  }

  const CATEGORIES = ["Elections", "Crypto", "Economics", "Geopolitics", "Sports"];
  const briefs = CATEGORIES.map((cat) => latestByCategory.get(cat) ?? null);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 bg-[#57D7BA]/10 border border-[#57D7BA]/20 rounded-full px-3 py-1 text-[11px] font-bold text-[#57D7BA] uppercase tracking-widest mb-2">
          <Globe className="size-3" />
          White-Label Content Feed
        </div>
        <h1 className="text-3xl font-bold text-[#f0f6fc] tracking-tight">Market Briefs</h1>
        <p className="text-sm text-[#8d96a0] max-w-2xl leading-relaxed">
          Daily prediction market intelligence, auto-generated from live data. Pull via RSS, JSON API,
          or embed directly in your newsletter, podcast notes, or website — with or without custom branding.
        </p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((category, i) => {
          const brief = briefs[i];
          const color = CATEGORY_COLORS[category];
          const emoji = CATEGORY_EMOJIS[category];
          const json = brief?.brief_json as any;
          const topMover = json?.movers?.[0];
          const indexVal = json?.index?.value;

          return (
            <Link
              key={category}
              href={`/briefs/${category.toLowerCase()}`}
              className="group block rounded-xl bg-[#161b27] border border-[#21262d] hover:border-[#21262d]/60 overflow-hidden transition-all duration-200 hover:shadow-lg"
            >
              {/* Color bar */}
              <div className="h-1 w-full" style={{ backgroundColor: color }} />

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xl leading-none">{emoji}</span>
                    <h2 className="text-sm font-bold text-[#f0f6fc] mt-1">{category}</h2>
                  </div>
                  {brief ? (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border"
                      style={{ color, borderColor: `${color}30`, backgroundColor: `${color}15` }}>
                      Live
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border border-[#484f58]/30 text-[#484f58] bg-[#484f58]/10">
                      Pending
                    </span>
                  )}
                </div>

                {brief ? (
                  <>
                    <p className="text-[10px] text-[#8d96a0]">
                      {new Date(brief.generated_at).toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric",
                      })} · {brief.source_market_count} markets · {brief.word_count} words
                    </p>

                    {/* Preview stats */}
                    <div className="space-y-1.5 pt-1">
                      {indexVal != null && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#484f58]">Index</span>
                          <span className="font-mono font-bold text-[#f0f6fc]">{Number(indexVal).toFixed(1)}/100</span>
                        </div>
                      )}
                      {topMover && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#484f58] truncate mr-2 max-w-[120px]">{topMover.question}</span>
                          <span className={`font-mono font-bold shrink-0 ${Number(topMover.change_24h) >= 0 ? "text-[#3fb950]" : "text-[#f85149]"}`}>
                            {Number(topMover.change_24h) >= 0 ? "▲" : "▼"} {Math.abs(Number(topMover.change_24h)).toFixed(1)}pp
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-semibold" style={{ color }}>
                        View brief →
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-[#484f58]">
                    No brief generated yet. Runs after next ingest cycle.
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* API & RSS reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* JSON API */}
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#57D7BA]/10 flex items-center justify-center">
              <Code className="size-3.5 text-[#57D7BA]" />
            </div>
            <h3 className="text-sm font-bold text-[#f0f6fc]">JSON API</h3>
          </div>
          <p className="text-xs text-[#8d96a0]">
            Pull any brief as JSON, Markdown, or HTML. No API key required for public read.
          </p>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Endpoints</p>
            <CodeSnippet>{`# List all briefs
GET /api/briefs

# Latest brief for a category
GET /api/briefs/elections?format=json
GET /api/briefs/elections?format=markdown
GET /api/briefs/elections?format=html

# Available categories:
# elections · crypto · economics
# geopolitics · sports`}</CodeSnippet>
          </div>
        </div>

        {/* RSS Feeds */}
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
              <Rss className="size-3.5 text-[#f59e0b]" />
            </div>
            <h3 className="text-sm font-bold text-[#f0f6fc]">RSS Feeds</h3>
          </div>
          <p className="text-xs text-[#8d96a0]">
            Subscribe in any RSS reader or newsletter tool. A new entry is added each day after the
            ingest cycle completes.
          </p>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Feed URLs</p>
            <CodeSnippet>{`/api/briefs/elections/rss
/api/briefs/crypto/rss
/api/briefs/economics/rss
/api/briefs/geopolitics/rss
/api/briefs/sports/rss`}</CodeSnippet>
          </div>
        </div>

        {/* Embed widget */}
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#388bfd]/10 flex items-center justify-center">
              <FileText className="size-3.5 text-[#388bfd]" />
            </div>
            <h3 className="text-sm font-bold text-[#f0f6fc]">Embeddable Widget</h3>
          </div>
          <p className="text-xs text-[#8d96a0]">
            Add a live market brief card anywhere with one line of HTML. Refreshes automatically.
          </p>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Embed code</p>
            <CodeSnippet>{`<div data-quiver-widget="brief"
     data-id="elections"
     data-theme="dark"></div>
<script src="https://quivermarkets.com/embed.js"
        async></script>`}</CodeSnippet>
          </div>
        </div>

        {/* Custom branding */}
        <div className="rounded-xl bg-[#161b27] border border-[#21262d] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#a371f7]/10 flex items-center justify-center">
              <Globe className="size-3.5 text-[#a371f7]" />
            </div>
            <h3 className="text-sm font-bold text-[#f0f6fc]">Custom Branding</h3>
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#57D7BA] bg-[#57D7BA]/10 border border-[#57D7BA]/20 px-1.5 py-0.5 rounded-full">Pro+</span>
          </div>
          <p className="text-xs text-[#8d96a0]">
            Add your newsletter or podcast name to every brief. Custom branding appears in the footer
            of markdown, HTML, and JSON outputs.
          </p>
          <Link
            href="/settings/briefs"
            className="inline-flex items-center gap-2 bg-[#57D7BA]/10 border border-[#57D7BA]/30 text-[#57D7BA] hover:bg-[#57D7BA]/20 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
          >
            Configure custom branding →
          </Link>
        </div>
      </div>
    </div>
  );
}
